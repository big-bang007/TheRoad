/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, PlusSquare, LogOut, Shield, Video, MessageCircle, ClipboardList } from 'lucide-react';
import AdminProfilesTab from './AdminProfilesTab';
import AdminLessonsTab from './AdminLessonsTab';
import AdminExistingLessonsTab from './AdminExistingLessonsTab';
import CommunityFeedTab from './CommunityFeedTab';
import SocialFeedTab from './SocialFeedTab';
import HyggeLogo from './HyggeLogo';

export default function AdminDashboardPortal({ onLogout }) {
  const [activeTab, setActiveTab] = useState('existing');

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'profiles':
        return <AdminProfilesTab />;
      case 'existing':
        return <AdminExistingLessonsTab onEditRequest={(lesson) => setActiveTab('lessons')} />;
      case 'lessons':
        return <AdminLessonsTab />;
      case 'chat':
        return <CommunityFeedTab user={{ name: 'Admin Leader' }} isAdmin={true} />;
      case 'feed':
        return <SocialFeedTab user={{ name: 'Admin Leader' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#88aba8] text-white select-none relative pb-28 justify-between" id="admin-dashboard-portal-frame">
      {/* Top Brand Header */}
      <header className="sticky top-0 z-30 w-full bg-[#37494a]/90 backdrop-blur-md border-b border-white/10 py-1.5 px-4 flex items-center justify-between" id="admin-dashboard-header-bar">
        {/* Logo left side */}
        <div className="flex items-center gap-1">
          <HyggeLogo className="scale-[0.6] origin-left" light={true} />
        </div>
        {/* Admin Badge right side */}
        <div className="flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 shadow-sm">
          <Shield className="w-3 h-3 text-rose-400" />
          <span className="text-[9px] font-bold text-rose-100 font-mono tracking-wider">ADMIN PORTAL</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto px-5 py-6 flex-grow flex flex-col" id="admin-dashboard-active-content-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`w-full h-full ${activeTab === 'chat' || activeTab === 'feed' ? 'flex flex-col' : ''}`}
          >
            {renderActiveTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#2f3e40]/90 backdrop-blur-md border-t border-white/10 py-3.5 px-6 shadow-xl" id="admin-bottom-navigation-container">
        <div className="max-w-lg mx-auto flex items-center justify-around relative">
          
          {/* Tab 1: Profiles */}
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'profiles' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Profiles</span>
          </button>

          {/* Tab 2: Existing Lessons */}
          <button
            onClick={() => setActiveTab('existing')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'existing' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Video className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Lessons</span>
          </button>

          {/* Tab 3: Add Lesson */}
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'lessons' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <PlusSquare className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Add</span>
          </button>

          {/* Tab 4: Community Chat */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'chat' ? 'text-hygge-teal' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Chat</span>
          </button>

          {/* Tab 5: Social Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'feed' ? 'text-hygge-teal' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Feed</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer text-white/40 hover:text-rose-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Exit</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
