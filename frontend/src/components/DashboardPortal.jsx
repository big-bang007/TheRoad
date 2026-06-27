/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ClipboardList, CheckSquare, User, MessageCircle, Sparkles, Video, Send, Users } from 'lucide-react';
import HomeTab from './HomeTab';
import UserLessonsTab from './UserLessonsTab';
import TaskTab from './TaskTab';
import ProfileTab from './ProfileTab';
import CommunityFeedTab from './CommunityFeedTab';
import SocialFeedTab from './SocialFeedTab';
import HyggeLogo from './HyggeLogo';

export default function DashboardPortal({ initialPhoneNumber, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [notificationDot, setNotificationDot] = useState(true);

  const [userProfile, setUserProfile] = useState({
    name: 'Jane Doe',
    phone: initialPhoneNumber || '+1 (555) 555-0199',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    streak: 5,
    cozyScore: 78,
    avatarUrl: '',
    hyggeLevel: 'Cozy Connoisseur'
  });

  const handleUpdateProfile = (updated) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleCompleteTaskPoint = () => {
    setUserProfile((prev) => {
      const randomGain = Math.floor(Math.random() * 2) + 1;
      const nextScore = Math.min(prev.cozyScore + randomGain, 100);
      
      let nextLevel = prev.hyggeLevel;
      if (nextScore >= 85) nextLevel = "Blanket Philosopher";
      else if (nextScore >= 65) nextLevel = "Cozy Connoisseur";

      return {
        ...prev,
        streak: prev.streak + 1,
        cozyScore: nextScore,
        hyggeLevel: nextLevel
      };
    });
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab 
            user={userProfile} 
            onNavigateToQuiz={() => setActiveTab('lessons')}
            onNavigateToTask={() => setActiveTab('task')}
          />
        );
      case 'lessons':
        return <UserLessonsTab />;
      case 'chat':
        return <CommunityFeedTab user={userProfile} isAdmin={false} />;
      case 'feed':
        return <SocialFeedTab user={userProfile} />;
      case 'task':
        return <TaskTab onCompleteTaskPoint={handleCompleteTaskPoint} />;
      case 'profile':
        return <ProfileTab user={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  const handleChatOpen = () => {
    setActiveTab('chat');
    setNotificationDot(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#88aba8] text-white select-none relative pb-28 justify-between" id="dashboard-portal-frame">
      <header className="sticky top-0 z-30 w-full bg-[#37494a]/90 backdrop-blur-md border-b border-white/10 py-1.5 px-4 flex items-center justify-between" id="dashboard-header-bar">
        <div className="flex items-center gap-1">
          <HyggeLogo className="scale-[0.6] origin-left" light={true} />
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400/20" />
          <span className="text-[9px] font-bold text-white/90 font-mono tracking-wider">{userProfile.streak}D STREAK</span>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto px-5 py-6 flex-grow flex flex-col" id="dashboard-active-content-body">
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#2f3e40]/90 backdrop-blur-md border-t border-white/10 py-3.5 px-4 shadow-xl" id="bottom-navigation-container">
        <div className="max-w-lg mx-auto flex items-center justify-between relative gap-1">
          
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'home' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'lessons' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Video className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Lessons</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'feed' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Feed</span>
          </button>

          <div className="flex-1 flex justify-center -mt-8 relative z-40 select-none">
            <button
              onClick={handleChatOpen}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#2f3e40] focus:outline-none transition-transform duration-300 transform active:scale-95 cursor-pointer shadow-lg ${
                activeTab === 'chat' 
                  ? 'bg-hygge-teal text-white' 
                  : 'bg-hygge-forest text-white hover:bg-hygge-teal'
              }`}
              id="central-chat-floater"
              aria-label="Open Community Chat"
            >
               <Users className="w-6 h-6" />
              
              {notificationDot && activeTab !== 'chat' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#52796F] animate-ping" />
              )}
              {notificationDot && activeTab !== 'chat' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#52796F]" />
              )}
            </button>
          </div>

          <button
            onClick={() => setActiveTab('task')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'task' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Task</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${
              activeTab === 'profile' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-medium tracking-wide">Profile</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
