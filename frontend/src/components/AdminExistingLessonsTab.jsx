/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, PlayCircle, Edit3, Trash2, Clock, Users, ChevronLeft, Play, AlignLeft, Loader2 } from 'lucide-react';
import { lessonService } from '../services/api';

export default function AdminExistingLessonsTab({ onEditRequest }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLesson, setPreviewLesson] = useState(null);
  
  // RESTORED: Real Database Wires
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await lessonService.getAllLessons();
        setLessons(response.data); 
      } catch (error) {
        console.error("Failed to fetch lessons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const handleDelete = async (lessonId, lessonTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${lessonTitle}"?`)) return;
    try {
      await lessonService.deleteLesson(lessonId);
      setLessons(prevLessons => prevLessons.filter(l => l.id !== lessonId));
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      alert("Failed to delete lesson. Check console.");
    }
  };

  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const filteredLessons = safeLessons.filter(lesson => 
    (lesson?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-hygge-teal" />
        <p>Loading lessons from database...</p>
      </div>
    );
  }

  // --- PREVIEW MODE UI ---
  if (previewLesson) {
    return (
      <div className="flex flex-col h-full inset-0 z-50 fixed bg-[#415354] overflow-y-auto w-full md:w-[--max-w-lg] mx-auto overflow-x-hidden md:relative md:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-[#415354]/90 backdrop-blur-md border-b border-white/10 text-white">
          <button onClick={() => setPreviewLesson(null)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition cursor-pointer">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg truncate flex-grow">
            Preview: {previewLesson.title}
          </div>
          <button 
            onClick={() => onEditRequest && onEditRequest(previewLesson)} 
            className="flex items-center gap-2 px-3 py-1.5 bg-hygge-teal hover:bg-hygge-teal/80 rounded-lg text-sm text-white font-medium transition shadow-sm cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Edit Course
          </button>
        </div>

        <div className="p-4 md:p-6 pb-32 flex flex-col gap-4 max-w-2xl w-full">
           <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-1">
               <Play className="w-5 h-5 text-amber-400" />
               <h4 className="font-bold text-white text-base">Video Material</h4>
             </div>
             <div className="w-full aspect-video bg-[#1e2729] border border-white/5 rounded-2xl flex items-center justify-center text-white/30 text-sm font-medium">
               {previewLesson.title} - Video Placeholder
             </div>
           </div>

           <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-2">
             <div className="flex items-center gap-2 mb-1">
               <AlignLeft className="w-5 h-5 text-amber-400" />
               <h4 className="font-bold text-white text-base">Description</h4>
             </div>
             <p className="text-sm text-white/70 font-light">{previewLesson.description || 'No description provided.'}</p>
           </div>
        </div>
      </div>
    );
  }

  // --- STANDARD LIST UI ---
  return (
    <div className="flex flex-col gap-6" id="admin-existing-lessons-tab">
      <div className="flex items-center justify-between px-1">
        <h4 className="font-bold text-lg text-white tracking-tight">Existing Lessons</h4>
        <span className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full font-medium">{safeLessons.length} Modules</span>
      </div>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"><Search className="w-5 h-5" /></span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lessons..."
          className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:border-white/30 focus:bg-white/10 focus:outline-none transition duration-200"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredLessons.map((lesson) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2f3e40]/60 hover:bg-[#2f3e40] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition cursor-pointer group"
          >
            <div className="flex justify-between items-start cursor-pointer" onClick={() => setPreviewLesson(lesson)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-hygge-teal/20 text-hygge-cream shadow-inner shrink-0">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-white group-hover:text-hygge-cream transition leading-snug">{lesson.title}</h5>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration || '15m'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {lesson.students || 0} learners</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
              <div className="text-[10px] text-white/40 uppercase tracking-widest">
                Published {lesson.published || 'Recently'}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewLesson(lesson)} className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/70 text-xs transition border-none shadow-none cursor-pointer">
                  <Play className="w-3 h-3" /> Preview
                </button>
                <button onClick={() => onEditRequest && onEditRequest(lesson)} className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/70 text-xs transition border-none shadow-none cursor-pointer">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id, lesson.title); }} className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 rounded text-rose-300 text-xs transition border-none shadow-none cursor-pointer">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredLessons.length === 0 && (
          <div className="text-center py-10 text-white/50 text-sm font-light">No lessons found matching your search.</div>
        )}
      </div>
    </div>
  );
}