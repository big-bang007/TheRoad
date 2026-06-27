import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image as ImageIcon, Camera, X, Loader2 } from 'lucide-react';
import api, { feedService } from '../services/api';
import UserProfileModal from './UserProfileModal';

export default function SocialFeedTab({ user }) {
  const [posts, setPosts] = useState([]);
  const wsRef = useRef(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);
  
  const [selectedUser, setSelectedUser] = useState(null);

  // 1. Fetch Global History on Load
  useEffect(() => {
    const fetchFeedHistory = async () => {
      try {
        const response = await feedService.getAllPosts();
        const mappedPosts = response.data.map(p => ({
          id: p.id,
          sender_name: p.user_name || p.username || p.sender_name || p.name || (p.user_id ? `User #${p.user_id}` : 'Cozy Learner'), 
          sender_avatar: `https://i.pravatar.cc/150?u=${p.user_id || 'anon'}`,
          content: p.content || p.teaching_segment || "", 
          // 🛡️ MEDIA FIX: Read images from the standard API domain, not the WS domain!
          file_url: p.file_url ? `https://hyggee.ir${p.file_url}` : null,
          likes: p.likes_count || 0,
          comments: [], 
          hasLiked: false, 
          timestamp: p.created_at
        }));
        setPosts(mappedPosts);
      } catch (error) {
        console.error("Error pulling history:", error);
      }
    };
    fetchFeedHistory();
  }, []);

  // 2. Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let wsBaseUrl = import.meta.env.PROD || window.location.hostname !== 'localhost' 
      ? 'wss://ws.road.hyggee.ir' 
      : 'ws://127.0.0.1:8000';

    const wsUrl = `${wsBaseUrl}/api/v1/ws/chat/feed?token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 🟢 LISTEN: Live Like Update
          if (data.type === 'LIKE') {
            setPosts(prev => prev.map(p => p.id === data.postId ? { ...p, likes: data.likes } : p));
            return;
          }

          // 🟢 LISTEN: Live Comment Update
          if (data.type === 'COMMENT') {
            setPosts(prev => prev.map(p => {
               if (p.id === data.postId && !p.comments.some(c => c.id === data.comment.id)) {
                   return { ...p, comments: [...p.comments, data.comment] };
               }
               return p;
            }));
            return;
          }

          // 🟢 LISTEN: New Post Update
          if (data.content) {
             // 🛡️ ONLY accept posts that have a real database ID
             if (!data.id) return; 

             const newPost = {
               id: data.id, // Use the server's ID, never Math.random()
               sender_name: data.sender_name || 'Anonymous',
               sender_avatar: data.sender_avatar || `https://i.pravatar.cc/150?u=${data.sender_name || 'anon'}`,
               content: data.content,
               file_url: data.file_url ? `https://hyggee.ir${data.file_url}` : null,
               likes: data.likes || 0,
               comments: data.comments || [],
               hasLiked: false,
               timestamp: data.timestamp || new Date().toISOString()
             };
             
             setPosts(prev => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
             });
          }
        } catch(e) {
          console.error("Failed parsing message", e);
        }
      };
    } catch (e) {
      console.warn("WebSocket not available.");
    }

    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  // 3. Create Post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostMedia) return; 
    setIsPosting(true);
    try {
      const formData = new FormData();
      if (newPostContent) formData.append('content', newPostContent);
      if (newPostMedia) formData.append('file', newPostMedia);
      
      const response = await feedService.createPost(formData);

      if (response.status === 200 || response.status === 201) {
         setNewPostContent('');
         setNewPostMedia(null); 
         
         const newPostData = response.data;
         const formattedPost = {
           id: newPostData.id,
           sender_name: user?.name || newPostData.user_name || newPostData.username || newPostData.sender_name || (newPostData.user_id ? `User #${newPostData.user_id}` : 'Cozy Learner'),
           sender_avatar: user?.avatarUrl || `https://i.pravatar.cc/150?u=${newPostData.user_id || 'anon'}`,
           content: newPostData.content,
           // 🛡️ MEDIA FIX: Read images from the standard API domain!
           file_url: newPostData.file_url ? `hyggee.ir${newPostData.file_url}` : null,
           likes: newPostData.likes_count || 0,
           comments: [],
           hasLiked: false,
           timestamp: newPostData.created_at
         };

         setPosts(prevPosts => [formattedPost, ...prevPosts]);

         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
             wsRef.current.send(JSON.stringify(formattedPost));
         }
      }
    } catch(err) {
      console.error("Failed to make post", err);
    } finally {
      setIsPosting(false);
    }
  };

  // 4. Handle Live Likes 
  const handleLike = async (postId) => {
    try {
      let isLikedNow = false;
      let newLikesCount = 0;

      // Optimistic UI Update for the person clicking
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          isLikedNow = !p.hasLiked;
          newLikesCount = isLikedNow ? p.likes + 1 : Math.max(0, p.likes - 1);
          return { ...p, likes: newLikesCount, hasLiked: isLikedNow };
        }
        return p;
      }));

      // Send to DB
      await feedService.toggleLike(postId);

      // Broadcast to all other users live!
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'LIKE', postId: postId, likes: newLikesCount }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Handle Live Comments
  const handleAddComment = async (postId) => {
    if (!commentInput.trim()) return;
    try {
      // Send to DB
      const response = await feedService.addComment(postId, commentInput);
      const newCommentData = response.data;
      
      const formattedComment = {
          id: newCommentData.id || Math.random().toString(),
          sender_name: user?.name || newCommentData.user_name || newCommentData.username || newCommentData.sender_name || (newCommentData.user_id ? `User #${newCommentData.user_id}` : 'Cozy Learner'),
          content: newCommentData.content
      };

      // Show locally
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, formattedComment] };
        }
        return p;
      }));

      setCommentInput('');
      setActiveCommentPostId(null);

      // Broadcast to all other users live!
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'COMMENT', postId: postId, comment: formattedComment }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    let timeDate = new Date(isoString);
    if(isNaN(timeDate.getTime())) timeDate = new Date();
    const diff = Math.max(0, Date.now() - timeDate.getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="flex flex-col h-full bg-[#37494a] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
      <div className="py-4 px-5 bg-black/20 border-b border-white/5 shrink-0 flex justify-between items-center z-10 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Social Feed</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide bg-[#37494a] pb-24">
        {/* Create Post Section */}
        <div className="bg-black/10 border-b border-white/5 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <img src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.name?.replace(/ /g,'') || 'user'}`} alt="You" className="w-10 h-10 rounded-full border border-white/10 mt-1 object-cover" />
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share what's on your mind..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 text-sm resize-none outline-none focus:border-white/20 transition min-h-[80px]"
            />
          </div>
          
          {newPostMedia && (
            <div className="ml-13 relative rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/20 w-fit">
              {newPostMedia.type.startsWith('image/') ? (
                   <img src={URL.createObjectURL(newPostMedia)} alt="preview" className="h-32 object-cover" />
                ) : (
                   <div className="h-20 px-4 flex items-center justify-center text-xs text-white/60 gap-2"><ImageIcon className="w-5 h-5"/> {newPostMedia.name}</div>
                )}
               <button onClick={() => setNewPostMedia(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white/70 hover:text-white backdrop-blur-sm">
                 <X className="w-4 h-4" />
               </button>
            </div>
          )}

          <div className="flex items-center justify-between ml-13">
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition">
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*,video/*" onChange={(e) => { if(e.target.files[0]) setNewPostMedia(e.target.files[0]); }} />
            </div>
            <button 
              onClick={handleCreatePost} 
              disabled={(!newPostContent.trim() && !newPostMedia) || isPosting}
              className={`px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 transition ${(!newPostContent.trim() && !newPostMedia) || isPosting ? 'bg-hygge-teal/30 text-white/30 cursor-not-allowed' : 'bg-hygge-teal text-white hover:opacity-90'}`}
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#37494a] border-b border-white/10 pb-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <button 
                      className="flex items-center gap-3 cursor-pointer text-left focus:outline-none" 
                      onClick={() => setSelectedUser({
                        name: post.sender_name,
                        avatarUrl: post.sender_avatar,
                        role: post.sender_name.includes('Admin') ? 'Community Admin' : 'Community Member',
                        level: Math.floor(Math.random() * 5) + 1,
                        streak: Math.floor(Math.random() * 10) + 1,
                        cozyScore: Math.floor(Math.random() * 100)
                      })}
                    >
                      <img src={post.sender_avatar} alt={post.sender_name} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                      <div className="flex flex-col">
                        <span className="font-bold text-white hover:text-hygge-teal transition text-sm tracking-wide">{post.sender_name}</span>
                        <span className="text-[10px] text-white/40">{formatTime(post.timestamp)}</span>
                      </div>
                    </button>
                  </div>
                  <button className="text-white/40 hover:text-white p-1">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-2 text-sm text-white/90 leading-relaxed font-light whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Media Attachment View */}
                {post.file_url && (
                   <div className="mx-4 my-2 h-48 bg-black/30 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                      
                      {post.file_url.match(/\.(mp3|wav|ogg|m4a|aac)/i) ? (
                        <div className="flex flex-col items-center gap-2 text-white w-full px-4">
                          <audio controls src={post.file_url} className="w-full max-w-xs mx-auto" />
                        </div>
                      ) : post.file_url.match(/\.(jpeg|jpg|gif|png|webp|bmp|heic)/i) ? (
                        <img src={post.file_url} className="w-full h-full object-cover" alt="attachment" />
                      ) : post.file_url.match(/\.(mp4|mov|webm|mkv|avi|m4v|3gp)/i) ? (
                        <video controls src={post.file_url} className="w-full h-full object-cover" />
                      ) : (
                        <a 
                          href={post.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          download
                          className="text-xs text-white/50 flex flex-col items-center gap-2 hover:text-hygge-teal transition cursor-pointer"
                        >
                           <ImageIcon className="w-8 h-8 opacity-40" />
                           <span className="font-bold underline tracking-wide">Open Media Attachment</span>
                        </a>
                      )}
                      
                   </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 px-4 py-2 mt-1">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 transition ${post.hasLiked ? 'text-rose-400' : 'text-white/60 hover:text-white'}`}>
                    <Heart className={`w-6 h-6 ${post.hasLiked ? 'fill-rose-400' : ''}`} />
                  </button>
                  <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className="flex items-center gap-1.5 text-white/60 hover:text-white transition">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Likes count */}
                {(post.likes > 0) && (
                  <div className="px-5 text-xs font-bold text-white mb-1">
                    {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                  </div>
                )}

                {/* Comments List */}
                {post.comments && post.comments.length > 0 && (
                  <div className="px-5 flex flex-col gap-1 mt-1 mb-2">
                    {post.comments.map(c => (
                      <div key={c.id} className="text-xs leading-normal bg-black/10 p-2 rounded-lg">
                        <button 
                          className="font-bold text-white/90 hover:text-hygge-teal transition mr-1.5 focus:outline-none"
                          onClick={() => setSelectedUser({
                            name: c.sender_name,
                            role: c.sender_name.includes('Admin') ? 'Community Admin' : 'Community Member',
                            level: Math.floor(Math.random() * 5) + 1,
                            streak: Math.floor(Math.random() * 10) + 1,
                            cozyScore: Math.floor(Math.random() * 100)
                          })}
                        >
                          {c.sender_name}:
                        </button>
                        <span className="text-white/70 font-light">{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input Box */}
                {activeCommentPostId === post.id && (
                  <div className="px-4 mt-3 mb-1 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <img src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.name?.replace(/ /g,'') || 'user'}`} alt="You" className="w-7 h-7 rounded-full opacity-80" />
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                      autoFocus
                    />
                    {commentInput.trim() && (
                      <button onClick={() => handleAddComment(post.id)} className="text-hygge-teal text-sm font-bold tracking-wide">
                        Post
                      </button>
                    )}
                  </div>
                )}

              </motion.div>
            ))}
          </AnimatePresence>
          
          {posts.length === 0 && (
             <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 mt-10">
               <ImageIcon className="w-12 h-12 mb-4 opacity-40 text-white" />
               <p className="text-sm text-white leading-relaxed font-light">No posts yet. Be the first to share your learning segment.</p>
             </div>
          )}
        </div>
      </div>
      
      <UserProfileModal 
        isOpen={selectedUser !== null} 
        onClose={() => setSelectedUser(null)} 
        profileUser={selectedUser} 
        userPosts={selectedUser ? posts.filter(p => p.sender_name === selectedUser.name) : []} 
      />
    </div>
  );
}