/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, CheckSquare, User, Sparkles, Video, Users } from 'lucide-react';
import HomeTab from './HomeTab';
import UserLessonsTab from './UserLessonsTab';
import TaskTab from './TaskTab';
import ProfileTab from './ProfileTab';
import CommunityFeedTab from './CommunityFeedTab'; // Updated Import
import HyggeLogo from './HyggeLogo';
import { userService } from '../services/api';

export default function DashboardPortal({ initialPhoneNumber, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [notificationDot, setNotificationDot] = useState(true);
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await userService.getProfile();
        console.log("✅ Profile loaded from backend:", response.data);
        setUserProfile(response.data);
      } catch (error) {
        console.error("❌ Failed to load user profile. Using fallbacks.", error);
        // THE FAILSAFE: If the backend fails, use these default values 
        // so the dashboard doesn't go blank!
        setUserProfile({
          name: "Cozy Learner",
          streak: 0,
          cozyScore: 0,
          hyggeLevel: "Newcomer"
        });
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);
  const handleUpdateProfile = (updated) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleCompleteTaskPoint = () => {
    setUserProfile((prev) => {
      if (!prev) return prev;
      const randomGain = Math.floor(Math.random() * 2) + 1;
      const nextScore = Math.min((prev.cozyScore || 0) + randomGain, 100);
      
      let nextLevel = prev.hyggeLevel || "Cozy Connoisseur";
      if (nextScore >= 85) nextLevel = "Blanket Philosopher";
      else if (nextScore >= 65) nextLevel = "Cozy Connoisseur";

      return {
        ...prev,
        streak: (prev.streak || 0) + 1,
        cozyScore: nextScore,
        hyggeLevel: nextLevel
      };
    });
  };

  const renderActiveTabContent = () => {
    if (!userProfile) return null;

    switch (activeTab) {
      case 'home':
        return <HomeTab user={userProfile} onNavigateToQuiz={() => setActiveTab('lessons')} onNavigateToTask={() => setActiveTab('task')} />;
      case 'lessons':
        return <UserLessonsTab />;
      case 'feed': // Renamed from 'chat' to 'feed'
        return <CommunityFeedTab user={userProfile} isAdmin={false} />;
      case 'task':
        return <TaskTab onCompleteTaskPoint={handleCompleteTaskPoint} />;
      case 'profile':
        return <ProfileTab user={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  const handleFeedOpen = () => {
    setActiveTab('feed');
    setNotificationDot(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-b from-[#415354] via-[#546E6D] to-[#718E8C]">Loading your journey...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#415354] via-[#546E6D] to-[#718E8C] text-white select-none relative pb-28 justify-between" id="dashboard-portal-frame">
      <header className="sticky top-0 z-30 w-full bg-[#415354]/80 backdrop-blur-md border-b border-white/10 py-4 px-6 flex items-center justify-between" id="dashboard-header-bar">
        <div className="flex items-center gap-1">
          <HyggeLogo className="scale-80 origin-left" light={true} />
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          <span className="text-[10px] font-bold text-white/90 font-mono tracking-wider">
            {userProfile?.streak || 0}D STREAK
          </span>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto px-5 py-6 flex-grow flex flex-col" id="dashboard-active-content-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`w-full h-full ${activeTab === 'feed' ? 'flex flex-col' : ''}`}
          >
            {renderActiveTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#2f3e40]/90 backdrop-blur-md border-t border-white/10 py-3.5 px-6 shadow-xl" id="bottom-navigation-container">
        <div className="max-w-lg mx-auto flex items-center justify-between relative">
          
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'home' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Home</span>
          </button>

          <button onClick={() => setActiveTab('lessons')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'lessons' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'}`}>
            <Video className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Lessons</span>
          </button>

          <div className="flex-1 flex justify-center -mt-8 relative z-40 select-none">
            <button onClick={handleFeedOpen} className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#2f3e40] focus:outline-none transition-transform duration-300 transform active:scale-95 cursor-pointer shadow-lg ${activeTab === 'feed' ? 'bg-hygge-teal text-white' : 'bg-hygge-forest text-white hover:bg-hygge-teal'}`}>
               <Users className="w-7 h-7" />
              {notificationDot && activeTab !== 'feed' && <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#52796F]" />}
            </button>
          </div>

          <button onClick={() => setActiveTab('task')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'task' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'}`}>
            <CheckSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Task</span>
          </button>

          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition duration-150 cursor-pointer ${activeTab === 'profile' ? 'text-hygge-cream' : 'text-white/40 hover:text-white/60'}`}>
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}