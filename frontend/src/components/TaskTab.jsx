/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Heart, RefreshCw } from 'lucide-react';

export default function TaskTab({ onCompleteTaskPoint }) {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Brew a warm herbal tea, spiced cider, or pour-over coffee.", category: "Wellness", duration: "10 min", completed: false },
    { id: 2, text: "Light an amber candle or key on dim copper wire fairy lights.", category: "Environment", duration: "2 min", completed: false },
    { id: 3, text: "Sit by a window for 5 minutes with no mobile phone presence.", category: "Activity", duration: "5 min", completed: false },
    { id: 4, text: "Draft a comforting greeting note to a family member or close friend.", category: "Social", duration: "5 min", completed: false },
    { id: 5, text: "Pencil down 3 simple micro-joys of your afternoon in a physical pad.", category: "Wellness", duration: "4 min", completed: false },
  ]);

  const [toastMessage, setToastMessage] = useState(null);

  const toggleTask = (id) => {
    let completedState = false;
    const updated = tasks.map((task) => {
      if (task.id === id) {
        completedState = !task.completed;
        return { ...task, completed: completedState };
      }
      return task;
    });

    setTasks(updated);

    if (completedState) {
      // Award points
      onCompleteTaskPoint();
      
      // Select random comforting notification toast
      const quotes = [
        "Cozy milestone unlocked! Breathe in clean wellness.",
        "Your sanctuary grows warmer. Wonderful job!",
        "Parasympathetic system activated. Relax and enjoy.",
        "Beautiful connection made with your quiet core.",
        "Light sparkles inside your micro-comforts path!"
      ];
      setToastMessage(quotes[Math.floor(Math.random() * quotes.length)]);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const getSlogan = (count) => {
    if (count === 5) return "Absolute Sanctuary! All micro-rituals achieved today. 🎉";
    if (count >= 3) return "Deep coziness unlocked. Keep nurturing yourself!";
    if (count >= 1) return "A lovely starting step. Find gentle comfort in slow tempos.";
    return "No rushes. Tap on the checkboxes as you complete each task.";
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Wellness': return 'bg-emerald-500/10 text-emerald-700';
      case 'Environment': return 'bg-amber-500/10 text-amber-700';
      case 'Social': return 'bg-rose-500/10 text-rose-700';
      default: return 'bg-indigo-500/10 text-indigo-700';
    }
  };

  const resetDailyTasks = () => {
    setTasks(tasks.map(t => ({ ...t, completed: false })));
    setToastMessage("Daily check-ins reset. Breathe fresh!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex flex-col gap-5" id="task-tab-container">
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-[#2F3E46] text-white border border-white/10 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium max-w-[90vw]"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex items-center justify-between px-1">
        <h4 className="font-bold text-base text-white tracking-tight">
          Cozy Rituals Checklist
        </h4>
        <button 
          onClick={resetDailyTasks}
          className="text-xs text-hygge-cream hover:text-white transition flex items-center gap-1 cursor-pointer font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset checklist</span>
        </button>
      </div>

      {/* Dynamic progress panel */}
      <div className="bg-gradient-to-r from-hygge-forest to-hygge-teal rounded-3xl p-5 text-white shadow-sm flex items-center justify-between">
        <div className="flex-grow pr-4">
          <div className="text-xs text-white/70 font-semibold font-mono uppercase mb-1">Cozy Rituals Progress</div>
          <h3 className="text-xl font-bold mb-2 font-display">{completedCount} of 5 Daily Checked</h3>
          <p className="text-xs text-white/80 font-light leading-relaxed">
            {getSlogan(completedCount)}
          </p>
        </div>
        
        {/* Progress chart ring */}
        <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-white/15"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-300"
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="flex flex-col gap-3" id="task-list">
        {tasks.map((task) => {
          const isDone = task.completed;
          return (
            <motion.div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                isDone 
                  ? 'bg-white/5 border-hygge-teal/40 opacity-75' 
                  : 'bg-[#2f3e40]/60 hover:bg-[#2f3e40] border-white/10 shadow-sm'
              }`}
              whileTap={{ scale: 0.99 }}
              id={`task-item-${task.id}`}
            >
              <button
                type="button"
                className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 border shrink-0 transition-colors ${
                  isDone 
                    ? 'border-hygge-teal bg-hygge-teal text-white' 
                    : 'border-white/20 hover:border-hygge-cream bg-transparent'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3px]" /> : null}
              </button>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                  <span className="text-[9px] text-white/30 font-medium font-mono">{task.duration}</span>
                </div>
                <p className={`text-sm leading-relaxed transition-all duration-300 ${
                  isDone ? 'line-through text-white/40 italic' : 'text-white/90 font-medium'
                }`}>
                  {task.text}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Visual reward box */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-white/80">
        <div className="w-8 h-8 rounded-full bg-hygge-teal/20 text-hygge-cream flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white">Physiological Wellness Tip:</span>
          <p className="mt-0.5 font-light">Completing micro-tasks stimulates dopamine receptors gently, strengthening neuro-resilience without the stress from traditional frantic schedules.</p>
        </div>
      </div>
    </div>
  );
}
