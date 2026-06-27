/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Shield, Activity, MoreVertical, Flame, ChevronLeft, Mic, Play, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminProfilesTab() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUser, setViewingUser] = useState(null);

  // ==========================================
  // 📥 FETCH REAL PROFILES ON LOAD (STRICTLY FROM DATABASE)
  // ==========================================
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('token'); 
        
        // 👇 Dynamic Environment URL applied
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://hyggee.ir/api/v1';
        
        const response = await fetch(`${backendUrl}/admin/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error("Failed to fetch profiles. Status:", response.status);
          alert(`Failed to load user profiles from database. Status: ${response.status}`);
        }
      } catch (err) {
        console.error('Network Error - Could not connect to fetch profiles:', err);
        alert("Network Error: Could not reach the backend to fetch profiles.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/50">
        <Loader2 className="w-8 h-8 animate-spin text-hygge-teal" />
        <p className="text-sm font-medium">Loading user profiles from database...</p>
      </div>
    );
  }

  if (viewingUser) {
    const hostUrl = import.meta.env.VITE_BACKEND_URL 
      ? import.meta.env.VITE_BACKEND_URL.replace('/api/v1', '') 
      : 'http://127.0.0.1:8000';

    return (
      <div className="flex flex-col h-full inset-0 z-50 fixed bg-[#88aba8] overflow-y-auto w-full md:w-[--max-w-lg] mx-auto overflow-x-hidden md:relative md:rounded-3xl">
          <div className="sticky top-0 z-10 flex items-center justify-between py-3 px-4 bg-[#37494a]/90 backdrop-blur-md border-b border-white/10 text-white">
           <div className="flex items-center gap-3">
             <button onClick={() => setViewingUser(null)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition cursor-pointer">
               <ChevronLeft className="w-6 h-6" />
             </button>
             <h4 className="font-bold text-lg">{viewingUser.name}</h4>
           </div>
           {viewingUser.role?.includes('Admin') && <Shield className="w-5 h-5 text-amber-400" />}
        </div>
        
        <div className="p-4 md:p-6 pb-32 flex flex-col gap-6 max-w-2xl w-full">
           {/* Stats Summary */}
           <div className="flex items-center justify-between bg-[#2f3e40]/60 p-5 rounded-3xl border border-white/10">
              <div className="flex flex-col">
                 <span className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Member Since</span>
                 <span className="text-white font-medium mt-1">{viewingUser.joinDate || 'Recently'}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Current Streak</span>
                 <div className="flex items-center gap-1 mt-1 text-amber-400 font-bold">
                   <Flame className="w-4 h-4" /> {viewingUser.streak || 0} Days
                 </div>
              </div>
           </div>

           {/* Learning Progress & Uploads */}
           <div className="flex flex-col gap-3">
              <h5 className="font-bold text-white text-sm">Learning Progress</h5>
              {viewingUser.completedLessons && viewingUser.completedLessons.length > 0 ? (
                 viewingUser.completedLessons.map((lesson, idx) => (
                    <div key={lesson.id || idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                       <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                             <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                             <div>
                               <div className="text-sm font-bold text-white leading-tight">{lesson.title}</div>
                               <div className="text-[10px] text-white/50 mt-0.5">{lesson.completedAt}</div>
                             </div>
                          </div>
                          <div className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg shrink-0 ml-2">
                            Score: {lesson.score}%
                          </div>
                       </div>
                       
                       {/* Real Media Player Submission Lists */}
                       {lesson.voiceMemos && lesson.voiceMemos.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-3">
                            <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Media Uploads</span>
                            {lesson.voiceMemos.map((memo, mIdx) => {
                               const mediaUrl = memo.url ? (memo.url.startsWith('http') ? memo.url : `${hostUrl}${memo.url}`) : null;
                               const isVideo = mediaUrl && mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);
                               
                               return (
                                 <div key={memo.id || mIdx} className="flex flex-col gap-2 bg-[#2f3e40] p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                       <Mic className="w-4 h-4 text-hygge-teal" />
                                       <span className="text-xs text-white/80 font-medium">{memo.title || 'Submitted Media'}</span>
                                    </div>
                                    
                                    {mediaUrl ? (
                                      isVideo ? (
                                        <video controls className="w-full rounded-lg bg-black border border-white/10" src={mediaUrl}></video>
                                      ) : (
                                        <audio controls className="w-full h-8" src={mediaUrl}></audio>
                                      )
                                    ) : (
                                      <span className="text-xs text-rose-400 italic">Media file missing</span>
                                    )}
                                 </div>
                               );
                            })}
                          </div>
                       )}
                    </div>
                 ))
              ) : (
                 <div className="text-center py-6 text-white/40 text-sm bg-white/5 rounded-2xl border border-white/5 tracking-wider font-light">
                   No completed lessons yet.
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" id="admin-profiles-tab">
      <div className="flex items-center justify-between px-1">
        <h4 className="font-bold text-lg text-white tracking-tight">
          User Profiles
        </h4>
        <span className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full font-medium">{users.length} Users</span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or role..."
          className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:border-white/30 focus:bg-white/10 focus:outline-none transition duration-200"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#2f3e40]/60 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Activity className="w-6 h-6 text-emerald-400 mb-2" />
          <span className="text-2xl font-bold text-white font-display">
            {users.filter(u => u.streak > 0).length}
          </span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Active Streaks</span>
        </div>
        <div className="bg-[#2f3e40]/60 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Shield className="w-6 h-6 text-amber-400 mb-2" />
          <span className="text-2xl font-bold text-white font-display">
            {users.filter(u => (u.role || '').includes('Admin')).length}
          </span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Admins</span>
        </div>
      </div>

      {/* Profiles List */}
      <div className="flex flex-col gap-3">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setViewingUser(user)}
            className="bg-[#2f3e40]/60 hover:bg-[#2f3e40] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition cursor-pointer group shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold font-display shadow-inner shrink-0 ${
                  (user.role || '').includes('Admin') ? 'bg-amber-500/20 text-amber-300' : 'bg-hygge-teal/30 text-hygge-cream'
                }`}>
                  {(user.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <h5 className="font-bold text-white group-hover:text-hygge-cream transition truncate">{user.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(user.role || '').includes('Admin') && <Shield className="w-3 h-3 text-amber-400" />}
                    <span className="text-xs text-white/50 truncate">{user.role}</span>
                  </div>
                </div>
              </div>
              <button className="text-white/30 hover:text-white/80 transition p-1 shrink-0">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                  <Flame className="w-3.5 h-3.5 text-amber-500/80" />
                  <span>{user.streak || 0}d streak</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                  <Activity className="w-3.5 h-3.5 text-hygge-teal/80" />
                  <span>{user.score || 0}% avg</span>
                </div>
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest shrink-0">
                Joined {user.joinDate || 'Recently'}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-10 text-white/50 text-sm font-light">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}