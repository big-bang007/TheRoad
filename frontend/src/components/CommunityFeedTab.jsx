/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Shield, BookOpen, Sparkles, Paperclip, X, Trash2 } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

export default function CommunityFeedTab({ user, isAdmin = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSegmentMode, setIsSegmentMode] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const getSafeName = (name) => {
    if (!name) return 'Cozy Learner';
    if (name.replace(/[^0-9]/g, '').length >= 7) return 'Cozy Learner';
    return name;
  };

  const getSafeSystemMessage = (text) => {
    if (!text) return '';
    return text.replace(/\+?\d{7,15}/g, 'Cozy Learner');
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    let safeString = isoString;
    if (!safeString.endsWith('Z') && !safeString.includes('+')) safeString += 'Z'; 
    const d = new Date(safeString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ==========================================
  // 🌐 WEBSOCKET CONNECTION
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `wss://ws.road.hyggee.ir/api/v1/ws/chat/general?token=${token}`;
    
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => setConnected(true);
    wsRef.current.onclose = () => setConnected(false);
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 🟢 HANDLE DELETION EVENTS
        if (data.type === 'clear_history') {
          setMessages([]);
          return;
        }
        if (data.type === 'delete_message') {
          setMessages((prev) => prev.filter((m) => m.timestamp !== data.timestamp));
          return;
        }

        if (data.system) {
          data.content = getSafeSystemMessage(data.content);
        } else {
          data.sender_name = getSafeName(data.sender_name);
        }
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/ws/chat/general/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const history = await res.json();
          const cleanHistory = history.map(msg => ({
            ...msg,
            sender_name: getSafeName(msg.sender_name)
          }));
          setMessages(cleanHistory.reverse());
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    fetchHistory();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ==========================================
  // 📤 SEND MESSAGE & FILES
  // ==========================================
  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isSegmentMode && !selectedFile) {
      wsRef.current.send(JSON.stringify({
        content: input,
        type: 'chat',
        timestamp: new Date().toISOString()
      }));
      setInput('');
      return;
    }

    if (isSegmentMode || selectedFile) {
      setIsUploading(true);
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        formData.append("sender_id", user?.id || "1");
        formData.append("sender_name", user?.name || "Admin");
        formData.append("content", input);
        formData.append("type", isSegmentMode ? "segment" : "chat");
        
        if (selectedFile) formData.append("file", selectedFile);

        
        const directUploadUrl = 'https://ws.road.hyggee.ir/api/v1/ws/chat/general/broadcast';

        const response = await fetch(directUploadUrl, {
          method: "POST",
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

        setInput('');
        setSelectedFile(null);
        if (isSegmentMode) setIsSegmentMode(false);
      } catch (error) {
        console.error("Broadcast failed:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // ==========================================
  // 🗑️ DELETION HANDLERS
  // ==========================================
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all chat history?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/ws/chat/general/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) alert("Failed to clear history.");
    } catch (err) {
      console.error("Clear history error:", err);
    }
  };

  const handleDeleteMessage = async (timestamp) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/ws/chat/general/message?timestamp=${encodeURIComponent(timestamp)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) console.error("Failed to delete message");
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full bg-[#88aba8] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
      
      {/* HEADER */}
      <div className="shrink-0 p-4 bg-[#253334] flex justify-between items-center border-b border-white/10 shadow-sm relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hygge-teal/20 flex items-center justify-center text-hygge-teal">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide">Community Chat</h3>
            <div className="text-xs text-white/50 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-hygge-teal' : 'bg-rose-500'}`}></span>
              {connected ? 'Connected' : 'Reconnecting...'}
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-hygge-teal/20 text-hygge-teal text-xs font-bold rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hygge-teal animate-pulse"></span>
          Live & Cozy
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 h-full">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.system) {
              return (
                <div key={idx} className="flex justify-center my-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono bg-white/5 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender_id === String(user?.id);
            const isSegment = msg.type === 'segment';
            
            let cleanContent = msg.content || "";
            let mediaUrl = "";
            const mediaMatch = cleanContent.match(/\[MEDIA:(.*?)\]/);
            if (mediaMatch) {
              mediaUrl = mediaMatch[1];
              cleanContent = cleanContent.replace(mediaMatch[0], "").trim();
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
              >
                {!isMe && (
                  <button 
                    onClick={() => setSelectedUser({
                      name: msg.sender_name,
                      role: msg.sender_name === 'Admin' ? 'Community Admin' : 'Community Member',
                      level: Math.floor(Math.random() * 5) + 1,
                      streak: Math.floor(Math.random() * 10) + 1,
                      cozyScore: Math.floor(Math.random() * 100)
                    })}
                    className="text-xs text-white/50 mb-1 ml-1 flex items-center gap-1 font-medium hover:text-hygge-teal transition cursor-pointer text-left focus:outline-none"
                  >
                    {msg.sender_name === 'Admin' && <Shield className="w-3 h-3 text-hygge-teal" />}
                    {msg.sender_name}
                  </button>
                )}
                
                <div className={`p-3.5 rounded-2xl relative group ${
                  isSegment 
                    ? 'bg-gradient-to-br from-[#546E6D] to-[#2f3e40] border border-hygge-teal/30 text-white rounded-tl-sm w-full shadow-lg' 
                    : isMe 
                      ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' 
                      : 'bg-[#253334] text-white/90 rounded-tl-sm border border-white/5'
                }`}>
                  {isSegment && (
                    <div className="flex items-center gap-2 text-hygge-cream text-xs font-bold uppercase tracking-wider mb-2 border-b border-white/10 pb-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      Teaching Segment
                    </div>
                  )}
                  
                  {cleanContent && <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanContent}</p>}
                  
                  {mediaUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                      {mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video controls className="w-full max-w-sm rounded-xl">
                          <source src={mediaUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <img src={mediaUrl} alt="Attached Media" className="w-full max-w-sm rounded-xl object-cover" />
                      )}
                    </div>
                  )}
                  
                  {/* BOTTOM ROW: Timestamp + Delete Icon */}
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <span className={`text-[9px] block font-mono ${isSegment ? 'text-hygge-cream/70' : 'text-white/40'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                    
                    {/* Delete button (Visible to Admins or the owner of the message) */}
                    {(isAdmin || isMe) && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.timestamp)}
                        className="opacity-0 group-hover:opacity-100 transition text-rose-400 hover:text-rose-300 p-0.5 rounded focus:outline-none"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-[#253334] border-t border-white/10 mt-auto z-20 relative shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        
        {/* ADMIN TOOLS & CLEAR HISTORY BUTTON */}
        {isAdmin && (
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-xs text-white/50 font-medium">Admin Controls</span>
            <div className="flex gap-2">
              <button 
                onClick={handleClearHistory}
                className="text-xs px-3 py-1 rounded-full transition font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white"
              >
                Clear History
              </button>
              <button 
                onClick={() => setIsSegmentMode(!isSegmentMode)}
                className={`text-xs px-3 py-1 rounded-full transition font-bold border ${isSegmentMode ? 'bg-hygge-teal/20 text-hygge-teal border-hygge-teal/30' : 'bg-white/5 text-white/50 border-white/5 hover:text-white'}`}
              >
                {isSegmentMode ? 'Teaching Segment ON' : 'Standard Chat'}
              </button>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="mb-3 p-2 bg-white/5 rounded-lg flex items-center justify-between border border-hygge-teal/30">
            <span className="text-xs text-hygge-cream truncate max-w-[200px] flex items-center gap-2">
              <Paperclip className="w-3 h-3" />
              {selectedFile.name}
            </span>
            <button onClick={() => setSelectedFile(null)} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,video/*"
          />
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-white/50 hover:text-white transition bg-white/5 rounded-xl border border-white/5 h-[44px]">
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isSegmentMode ? "Draft your teaching segment here..." : "Type a message..."}
            className={`flex-grow p-3 bg-white/5 border rounded-xl text-sm text-white placeholder-white/40 focus:outline-none transition resize-none ${isSegmentMode ? 'min-h-[80px] border-hygge-cream/30 focus:border-hygge-cream focus:bg-white/10' : 'min-h-[44px] h-[44px] border-white/10 focus:border-white/30 focus:bg-white/10'}`}
          />
          <button 
            onClick={handleSend} 
            disabled={(!input.trim() && !selectedFile) || isUploading} 
            className={`w-11 h-11 shrink-0 rounded-xl text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isSegmentMode || selectedFile ? 'bg-hygge-teal hover:bg-hygge-teal/90 shadow-md' : 'bg-hygge-dark hover:bg-hygge-dark/80 border border-white/10'}`}
          >
            {isUploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <UserProfileModal 
        isOpen={selectedUser !== null} 
        onClose={() => setSelectedUser(null)} 
        profileUser={selectedUser} 
        userPosts={selectedUser ? messages.filter(m => m.sender_name === selectedUser.name) : []} 
      />
    </div>
  );
}