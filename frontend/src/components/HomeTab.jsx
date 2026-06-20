/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Compass, Coffee, Sparkles, BookOpen, Heart, X, Moon } from 'lucide-react';

export default function HomeTab({ user, onNavigateToQuiz, onNavigateToTask }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  // 🕵️ THE SNITCH: This will print the exact user data to your F12 Console!
  console.log("🕵️ DATA ARRIVING AT HOME TAB:", user);

  const articles = [
    {
      id: 'lighting',
      title: 'Creating Sanctuary: The Art of Soft Amber Lighting',
      category: 'Environment',
      readTime: '3 min read',
      icon: <Moon className="w-5 h-5 text-amber-500" />,
      summary: 'Danish hygge begins with the eyes. Discover how fluorescent light spikes stress and how candles foster safety.',
      content: [
        'In Denmark, lighting is not just a utility—it is a therapy. The glare of direct overhead bulbs stimulates cortisol production, keeping the nervous system in a subtle state of high alert.',
        'To build a hygge workspace or living sanctuary, turn off major ceiling emitters. Instead, introduce scattered amber points of light at varying heights.',
        'Using incandescent wire lights, salt lamps, or soy wax candles immediately lowers heart rate. The soft, living flicker mimics the warmth of a setting sun or a gentle fire, indicating to our ancient brain layers that we are securely sheltered.',
      ],
      imageColor: 'from-amber-500/20 to-orange-600/30',
    },
    {
      id: 'slow-drinks',
      title: 'The Alchemy of Warm Ceramics & Slow Warming Brews',
      category: 'Rituals',
      readTime: '4 min read',
      icon: <Coffee className="w-5 h-5 text-emerald-500" />,
      summary: 'Holding a warm mug is proven to increase physical perceptions of social warmth. Explore cozy hot beverage rituals.',
      content: [
        'Psychologists have verified a fascinating feedback loop in human cognition: holding a warm clay body triggers involuntary feelings of interpersonal generosity and safety.',
        'Do not rush your warm beverages. Turn tea making into a slow micro-ritual. Watch the steam spiral, feel the radiant transfer through the ceramic glaze, and sit in silence while taking the first three sips.',
        'Choose herbal chamomile, spiced rooibos, or fresh mint. The simple absence of highly stimulating caffeine allows the parasympathetic nervous system to fully capture the tranquil, grounding nature of the moment.',
      ],
      imageColor: 'from-emerald-500/20 to-teal-600/30',
    },
    {
      id: 'presence',
      title: 'Micro-Breaks: Uncluttering the Cognitive Slate',
      category: 'Mindfulness',
      readTime: '4 min read',
      icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
      summary: 'Constant notifications hijack our sensory buffers. Here is how to take guilt-free offline micro-breaks.',
      content: [
        'Our minds are flooded with high-frequency telemetry. Every red dot, chime, and scroll bar takes a continuous deposit from our limited neural capacity.',
        'A mindful hygge micro-break consists of exactly five minutes of pure non-doing. No screens, no podcasts, no organizing lists.',
        'Sit by a window. Observe light shadows shifting on a leaf. Notice the texture of wood paneling. Let your thoughts settle naturally, exactly like dirt settling to the bottom of a quiet lake.',
      ],
      imageColor: 'from-violet-500/20 to-indigo-600/30',
    }
  ];

  return (
    <div className="flex flex-col gap-6" id="home-tab-container">
      {/* Dynamic Welcome Hero Card */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hygge-forest to-hygge-teal text-white p-6 shadow-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        id="home-welcome-card"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Compass className="w-36 h-36" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            {/* Added Safe Fallbacks here */}
            <span>Cozy Level: {user?.hyggeLevel || 'Newcomer'}</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-1 font-display">
            {/* Safely accesses the name, defaults to Friend if null */}
            Hej, {user?.name || 'Friend'}!
          </h3>
          <p className="text-sm text-white/80 font-light mb-5 max-w-xs leading-relaxed">
            Welcome to your quiet refuge. Grab a warm brew and find peace today.
          </p>

          {/* Bento grid sub-metrics inside the welcome card */}
          <div className="grid grid-cols-2 gap-3" id="home-metrics-subgrid">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-xs text-white/60 font-medium">Daily Streak</div>
                <div className="text-base font-bold">{user?.streak || 0} Days</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs text-white/60 font-medium">Cozy Score</div>
                <div className="text-base font-bold">{user?.cozyScore || 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Primary Call to Actions */}
      <div className="grid grid-cols-2 gap-4" id="home-cta-grid">
        <button
          onClick={onNavigateToQuiz}
          className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
        >
          <div className="w-9 h-9 bg-hygge-teal/20 group-hover:bg-hygge-teal/30 rounded-xl flex items-center justify-center mb-3 transition">
            <Compass className="w-5 h-5 text-hygge-cream" />
          </div>
          <h4 className="font-semibold text-sm text-white mb-1 group-hover:text-hygge-cream transition">Calculate Cozy Score</h4>
          <p className="text-xs text-white/60 font-light leading-relaxed">Take the custom well-being questionnaire.</p>
        </button>

        <button
          onClick={onNavigateToTask}
          className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
        >
          <div className="w-9 h-9 bg-amber-500/10 group-hover:bg-amber-500/20 rounded-xl flex items-center justify-center mb-3 transition">
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <h4 className="font-semibold text-sm text-white mb-1 group-hover:text-amber-300 transition">Hygge Check-In</h4>
          <p className="text-xs text-white/60 font-light leading-relaxed">Complete soothing daily ritual items.</p>
        </button>
      </div>

      {/* Sanctuary Guide Section */}
      <div className="flex flex-col gap-4 mt-2" id="home-guide-section">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-bold text-base text-white tracking-tight">
            Cozy Sanctuary Guides
          </h4>
          <span className="text-xs font-medium text-hygge-cream">Mindful Reads</span>
        </div>

        {/* Dynamic Interactive Reading Feed */}
        <div className="flex flex-col gap-3" id="home-articles-list">
          {articles.map((article, i) => (
            <motion.div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="flex items-center gap-4 p-4 bg-[#2f3e40]/60 hover:bg-[#2f3e40] border border-white/10 rounded-2xl cursor-pointer transition-all duration-300 group"
              whileHover={{ x: 4 }}
              id={`article-${article.id}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${article.imageColor} flex items-center justify-center border border-white/15 shrink-0`}>
                {article.icon}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-hygge-cream uppercase tracking-widest">{article.category}</span>
                  <span className="text-[10px] text-white/40 font-medium">• {article.readTime}</span>
                </div>
                <h5 className="font-bold text-sm text-white leading-snug group-hover:text-hygge-cream transition truncate">
                  {article.title}
                </h5>
                <p className="text-xs text-white/60 font-light line-clamp-1 mt-0.5 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Soothing Affirmation banner */}
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center text-xs text-white/70 font-light italic leading-relaxed">
        "There is no weather too cold, only clothing too thin—and hearts lacking warm tea." — Old Scandinavian Wisdom
      </div>

      {/* Article Detail Overlay Modal Dialog */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="relative w-full max-w-lg bg-[#3f5354] rounded-3xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
              initial={{ y: 100, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Decorative top image panel */}
              <div className={`p-8 bg-gradient-to-br ${selectedArticle.imageColor} relative flex items-center gap-4`}>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/10 rounded-full flex items-center justify-center cursor-pointer transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                  {selectedArticle.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">{selectedArticle.category}</span>
                  <h4 className="text-lg font-bold text-white mt-1 pr-6 tracking-tight line-clamp-1">{selectedArticle.title}</h4>
                </div>
              </div>

              {/* Scrollable content body */}
              <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-4 text-white/90 text-sm leading-relaxed font-light">
                {selectedArticle.content.map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>

              {/* Action footer */}
              <div className="p-4 border-t border-white/10 flex justify-end bg-[#2f3e40]">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 bg-hygge-teal hover:bg-hygge-teal/90 text-white font-medium text-xs rounded-xl transition cursor-pointer"
                >
                  Mark as Read (+5 Cozy Points)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}