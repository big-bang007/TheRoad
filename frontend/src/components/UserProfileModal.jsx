import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Flame, Award, Calendar, BookOpen } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, profileUser, userPosts = [] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#2f3e40] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-br from-hygge-teal/40 to-[#2f3e40] flex items-center justify-center shrink-0">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/30 rounded-full text-white/70 hover:text-white backdrop-blur-md transition z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-10 flex flex-col items-center">
                  <img 
                    src={profileUser?.avatarUrl || `https://i.pravatar.cc/150?u=${profileUser?.name?.replace(/ /g,'') || 'user'}`} 
                    alt={profileUser?.name} 
                    className="w-20 h-20 rounded-full border-4 border-[#2f3e40] object-cover bg-black/20"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-12 pb-6 px-6 flex flex-col items-center border-b border-white/10 shrink-0">
                <h2 className="text-xl font-bold text-white tracking-tight">{profileUser?.name || 'Anonymous User'}</h2>
                <p className="text-sm text-white/60 mb-4">{profileUser?.role || 'Community Member'}</p>
                
                <div className="w-full flex flex-col gap-4">
                  <div className="flex w-full gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <Flame className="w-5 h-5 text-amber-500 mb-1" />
                      <span className="text-lg font-bold text-white">{profileUser?.streak || Math.floor(Math.random() * 10) + 1}</span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Day Streak</span>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <Award className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-lg font-bold text-white">Lvl {profileUser?.level || Math.floor(Math.random() * 5) + 1}</span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Learner</span>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <BookOpen className="w-5 h-5 text-hygge-teal mb-1" />
                      <span className="text-lg font-bold text-white">{userPosts.length}</span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Posts</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/10 text-center flex flex-col justify-center">
                    <div className="flex items-center justify-between text-[11px] text-white/50 font-bold mb-1.5 font-mono">
                      <span>LEVEL {profileUser?.level || 5}</span>
                      <span>{profileUser?.cozyScore || 70}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-hygge-teal rounded-full" style={{ width: `${profileUser?.cozyScore || 70}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white/80 px-2 tracking-wide flex items-center gap-2">
                  <span>Recent Activity</span>
                </h3>
                
                {userPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-white/30 text-center">
                    <BookOpen className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">No activity found for this user.</p>
                  </div>
                ) : (
                  userPosts.map((post, idx) => (
                    <div key={post.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] text-white/40">
                           {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : 'Recently'}
                         </span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                        {post.content || post.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
