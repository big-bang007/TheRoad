/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, PlusSquare, LogOut, Shield, Video, MessageCircle } from 'lucide-react';

import AdminProfilesTab from './AdminProfilesTab';
import AdminLessonsTab from './AdminLessonsTab';
import AdminExistingLessonsTab from './AdminExistingLessonsTab';
import CommunityFeedTab from './CommunityFeedTab';
import HyggeLogo from './HyggeLogo';
import { userService } from '../services/api'; // 👈 Imported the API service

export default function AdminDashboardPortal({ onLogout }) {
  const [activeTab, setActiveTab] = useState('existing');
  const [adminProfile, setAdminProfile] = useState(null); // 👈 State to hold real Admin data

  // 👈 Fetch the Admin's real database profile when they log in
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await userService.getProfile();
        setAdminProfile(response.data);
      } catch (error) {
        console.error("Failed to load admin profile", error);
      }
    };
    fetchAdminData();
  }, []);

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'profiles':
        return <AdminProfilesTab />;
      case 'existing':
        return <AdminExistingLessonsTab onEditRequest={(lesson) => setActiveTab('lessons')} />;
      case 'lessons':
        return <AdminLessonsTab />;
      case 'feed':
        // 👈 Pass the REAL admin profile down to the Feed so it knows who is speaking!
        return <CommunityFeedTab user={adminProfile || { name: 'Admin', id: 'admin' }} isAdmin={true} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#415354] via-[#546E6D] to-[#718E8C] text-white select-none relative pb-28 justify-between" id="admin-dashboard-portal-frame">
      {/* Top Brand Header */}
      <header className="sticky top-0 z-30 w-full bg-[#415354]/80 backdrop-blur-md border-b border-white/10 py-4 px-6 flex items-center justify-between shadow-sm" id="admin-header-bar">
        <div className="flex items-center gap-2">
           <HyggeLogo className="scale-75 origin-left" light={true} />
           <span className="bg-rose-500/20 text-rose-200 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ml-1">ADMIN</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-rose-300" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl mx-auto px-5 py-6 flex-grow flex flex-col" id="admin-active-content-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`w-full h-full ${activeTab === 'feed' ? 'flex flex-col' : ''}`}
          >
            {renderActiveTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#2f3e40]/90 backdrop-blur-md border-t border-white/10 py-3.5 px-6 shadow-xl" id="admin-bottom-nav">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          
          <button onClick={() => setActiveTab('profiles')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'profiles' ? 'text-rose-300' : 'text-white/40 hover:text-white/60'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Users</span>
          </button>

          <button onClick={() => setActiveTab('existing')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'existing' ? 'text-rose-300' : 'text-white/40 hover:text-white/60'}`}>
            <Video className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Lessons</span>
          </button>

          <button onClick={() => setActiveTab('lessons')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'lessons' ? 'text-rose-300' : 'text-white/40 hover:text-white/60'}`}>
            <PlusSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Add</span>
          </button>

          <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'feed' ? 'text-rose-300' : 'text-white/40 hover:text-white/60'}`}>
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Feed</span>
          </button>

          <button onClick={onLogout} className="flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer text-white/40 hover:text-rose-400">
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Exit</span>
          </button>

        </div>
      </nav>
    </div>
  );
}