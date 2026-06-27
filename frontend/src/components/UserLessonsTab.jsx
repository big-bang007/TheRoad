/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Mic, CheckCircle, ChevronLeft, HelpCircle, FileAudio, AlignLeft, ListChecks, Type, FileText, Send, Loader2, Lock } from 'lucide-react';
import api, { lessonService } from '../services/api';

const DropBlankUI = ({ question, value, onChange }) => {
  if (!question || !question.question) return null;
  const parts = question.question.split(/\[([^\]]+)\]/g);
  const wordsInSentence = question.question.match(/\[([^\]]+)\]/g)?.map(s => s.replace(/[\\[\\]]/g, '')) || [];
  const allChoices = [...wordsInSentence, ...(question.distractors || [])].sort();
  
  const handleRemove = (bIdx) => {
    const next = {...value};
    delete next[bIdx];
    onChange(next);
  };
  
  const handleAdd = (word) => {
    let firstEmpty = -1;
    for(let i=0; i<wordsInSentence.length; i++) {
       if(!value || !value[i]) { firstEmpty = i; break; }
    }
    if (firstEmpty !== -1) {
       onChange({...value, [firstEmpty]: word});
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm leading-8 text-white/90">
        {parts.map((part, i) => {
           if (i % 2 === 0) return <span key={i}>{part}</span>;
           const bIdx = Math.floor(i / 2);
           const filled = value?.[bIdx];
           return (
             <span 
               key={i} 
               onClick={() => filled && handleRemove(bIdx)}
               className={`min-w-[60px] h-8 px-3 inline-flex items-center justify-center rounded-lg border-b-2 font-bold cursor-pointer transition ${filled ? 'bg-hygge-teal/20 border-hygge-teal text-white' : 'bg-white/10 border-white/30 text-transparent'}`}
             >
               {filled || '____'}
             </span>
           );
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
         {allChoices.map((w, i) => (
           <button key={i} onClick={() => handleAdd(w)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm text-white/80 transition active:scale-95 cursor-pointer">
             {w}
           </button>
         ))}
      </div>
    </div>
  );
};

const ConnectingWordsUI = ({ question, value, onChange }) => {
   const [selectedLeft, setSelectedLeft] = useState(null);
   const currentArr = Array.isArray(value) ? value : [];

   const handleSelectLeft = (text) => {
     if(selectedLeft === text) setSelectedLeft(null);
     else setSelectedLeft(text);
   };
   
   const handleSelectRight = (text) => {
     if (selectedLeft) {
       const others = currentArr.filter(v => v.left !== selectedLeft && v.right !== text);
       onChange([...others, { left: selectedLeft, right: text }]);
       setSelectedLeft(null);
     }
   };
   
   const handleRemoveLink = (leftText) => {
      onChange(currentArr.filter(v => v.left !== leftText));
   };

   if (!question || !question.pairs) return null;
   const leftItems = question.pairs.map(p=>p.left);
   const rightItems = question.pairs.map(p=>p.right).slice().reverse();

   return (
      <div className="grid grid-cols-2 gap-4">
         <div className="flex flex-col gap-2">
            {leftItems.map((item, i) => {
               const isConnected = currentArr.find(v => v.left === item);
               const isSelected = selectedLeft === item;
               return (
                 <button key={'l'+i} onClick={() => isConnected ? handleRemoveLink(item) : handleSelectLeft(item)}
                    className={`p-3 rounded-xl border text-sm text-left transition cursor-pointer ${isConnected ? 'bg-hygge-teal/20 border-hygge-teal text-white' : isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-white/70'}`}
                 >
                    {item} {isConnected && <span className="font-bold text-xs ml-1 opacity-70">&rarr; {isConnected.right}</span>}
                 </button>
               )
            })}
         </div>
         <div className="flex flex-col gap-2">
            {rightItems.map((item, i) => {
               const isConnected = currentArr.find(v => v.right === item);
               return (
                 <button key={'r'+i} onClick={() => !isConnected && handleSelectRight(item)}
                    className={`p-3 rounded-xl border text-sm text-left transition cursor-pointer ${isConnected ? 'bg-white/5 border-white/10 text-white/30 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                 >
                    {item}
                 </button>
               )
            })}
         </div>
      </div>
   );
};

export default function UserLessonsTab() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  
  const [prepAnswers, setPrepAnswers] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [testAnswers, setTestAnswers] = useState({});
  const [sentenceInputs, setSentenceInputs] = useState({});
  
  const [score, setScore] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachingMedia, setTeachingMedia] = useState(null);
  const [teachingSegment, setTeachingSegment] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);
  const [prepSubmitted, setPrepSubmitted] = useState(false);
  const [prepPassed, setPrepPassed] = useState(false);
  const [showExamHints, setShowExamHints] = useState(false);
  const [examPassed, setExamPassed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  
  const [lessonScores, setLessonScores] = useState(() => {
    try { 
       const parsed = JSON.parse(localStorage.getItem('lessonScores'));
       return parsed && typeof parsed === 'object' ? parsed : {};
    } 
    catch { return {}; }
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { steps, lastAssessmentStepId } = React.useMemo(() => {
    if (!activeLesson) return { steps: [], lastAssessmentStepId: null };
    const s = [];
    const prepTasks = activeLesson.prep_tasks || activeLesson.prepTasks;
    const formFields = activeLesson.form_fields || activeLesson.formFields;
    const quizzes = activeLesson.quizzes;
    const tests = activeLesson.final_test_data || activeLesson.tests || [];
    
    if (prepTasks?.length > 0) s.push({ id: 'prep', title: 'Preparation Task' });
    s.push({ id: 'video', title: 'Video Material' });
    if (quizzes?.length > 0 || formFields?.length > 0 || activeLesson.sentences?.length > 0) {
      s.push({ id: 'quiz', title: 'Lesson Quiz' });
    }
    if (tests?.length > 0) s.push({ id: 'test', title: 'Final Test' });
    
    let lastId = null;
    if (tests?.length > 0) lastId = 'test';
    else if (quizzes?.length > 0 || formFields?.length > 0 || activeLesson.sentences?.length > 0) lastId = 'quiz';
    else if (prepTasks?.length > 0) lastId = 'prep';

    s.push({ id: 'media', title: 'Media Teaching' });
    
    return { steps: s, lastAssessmentStepId: lastId };
  }, [activeLesson]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await lessonService.getAllLessons();
        let fetchedLessons = Array.isArray(response?.data) ? response.data : [];
        fetchedLessons.sort((a, b) => (a.order_number || parseInt(a.id) || 0) - (b.order_number || parseInt(b.id) || 0));
        setLessons(fetchedLessons);
      } catch (err) {
        console.error('Could not connect to fetch lessons:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, []); 

  const openLesson = (lesson) => {
    setActiveLesson(lesson);
    setCurrentStepIndex(0);
    setPrepAnswers({});
    setQuizAnswers({});
    setTestAnswers({});
    setSentenceInputs({});
    setScore(null);
    setTeachingMedia(null);
    setTeachingSegment('');
    setPostSuccess(false);
    setPrepSubmitted(false);
    setPrepPassed(false);
    setShowExamHints(false);
    setExamPassed(false);
  };

  const closeLesson = () => setActiveLesson(null);

  const handleSelect = (setAnswersFn, qIdx, optIdx) => {
    setAnswersFn(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  // Defensive type-checking rules
  const checkType = (q, ans) => {
    if (ans === undefined || ans === null) return false;
    if (q.type === 'MULTIPLE_CHOICE' || !q.type) {
       if (q.options && q.options[ans]) {
          const targetOpt = q.options[ans];
          return targetOpt.isCorrect === true || targetOpt.isCorrect === 'true';
       }
       return false;
    }
    if (q.type === 'SHORT_ANSWER') {
       return typeof ans === 'string' && ans.toLowerCase().trim() === (q.answer || '').toLowerCase().trim();
    }
    if (q.type === 'TRUE_FALSE') {
       return typeof ans === 'string' && ans.toUpperCase() === (q.answer || '').toUpperCase();
    }
    if (q.type === 'DRAGGING_WORDS') {
       const wordsInSentence = q.question.match(/\[([^\]]+)\]/g)?.map(s => s.replace(/[\[\]]/g, '')) || [];
       if (Object.keys(ans).length !== wordsInSentence.length) return false;
       let ok = true;
       for (let i = 0; i < wordsInSentence.length; i++) {
         if (ans[i] !== wordsInSentence[i]) ok = false;
       }
       return ok;
    }
    if (q.type === 'CONNECTING_WORDS') {
       if (!Array.isArray(ans) || ans.length !== (q.pairs || []).length) return false;
       let ok = true;
       for (let p of (q.pairs || [])) {
          const match = ans.find(a => a.left === p.left);
          if (!match || match.right !== p.right) ok = false;
       }
       return ok;
    }
    return false;
  };

  const submitPrepTask = () => {
    if (!activeLesson) return;
    const prepTasks = activeLesson.prep_tasks || activeLesson.prepTasks || [];
    let correctCount = 0;
    prepTasks.forEach((q, idx) => { if (checkType(q, prepAnswers[idx])) correctCount++; });
    setPrepSubmitted(true);
    setPrepPassed(correctCount === prepTasks.length);
  };

  // ==========================================
  // 🏆 DEFENSIVE GRADING ENGINE & BACKEND PERSISTENCE
  // ==========================================
  const calculateAndSubmitScore = async () => {
    if (!activeLesson) return;
    setIsSubmitting(true);

    let correctCount = 0;
    const prepTasks = activeLesson.prep_tasks || activeLesson.prepTasks || [];
    const quizzes = activeLesson.quizzes || [];
    const tests = activeLesson.final_test_data || activeLesson.tests || [];
    const allQuestions = [...quizzes, ...tests];
    
    // We already checked prep task separately, only score quiz and test here
    quizzes.forEach((q, idx) => { if (checkType(q, quizAnswers[idx])) correctCount++; });
    tests.forEach((q, idx) => { if (checkType(q, testAnswers[idx])) correctCount++; });
    
    const finalScore = allQuestions.length === 0 ? 100 : Math.round((correctCount / allQuestions.length) * 100);
    setScore(finalScore);
    setExamPassed(finalScore === 100); // Need to get everything right to pass, or maybe some threshold? Prompt says: "they will get graded based on their actual answerts and they must redo the exam to pass" Let's assume 100% or 80%. Let's say 100% to pass? Or maybe finalScore >= 80 ?
    setShowExamHints(true);
    
    // Update local lessonScores with highest score
    const targetKey = String(activeLesson.id);
    const newScores = { ...lessonScores, [targetKey]: Math.max(lessonScores[targetKey] || lessonScores[activeLesson.id] || 0, finalScore) };
    setLessonScores(newScores);
    localStorage.setItem('lessonScores', JSON.stringify(newScores));

    // 📡 TRANSMIT ACTION TO POSTGRESQL FOR ADMIN VIEWS
    try {
      await lessonService.submitLesson(activeLesson.id, {
        score: finalScore,
        lesson_title: activeLesson.title
      });
    } catch (err) {
       console.error("Failed to sync score to DB context:", err);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handlePostToCommunity = async () => {
    if (!teachingSegment.trim() && !teachingMedia) return;

    try {
      const token = localStorage.getItem('token');
      let senderName = "Cozy Learner";
      let senderId = "anonymous";
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          senderName = payload.name || senderName;
          senderId = payload.sub || senderId;
        } catch (e) {
          console.error("Failed to decode token", e);
        }
      }

      const formData = new FormData();
      formData.append('sender_id', String(senderId));
      formData.append('sender_name', senderName);
      formData.append('content', teachingSegment || "");
      formData.append('type', 'segment');
      if (teachingMedia) {
        formData.append('file', teachingMedia);
      }

      setUploadProgress(0);
      const response = await api.post('/api/v1/ws/chat/feed/broadcast', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      if (response.status === 200 || response.status === 201) {
         setPostSuccess(true);
         setTeachingSegment('');
         setTeachingMedia(null);
         setTimeout(() => {
           setPostSuccess(false);
           setUploadProgress(null);
         }, 3000);
      }
    } catch(err) {
       setUploadProgress(null);
       console.error("Failed to post segment:", err);
    }
  };

  const getCorrectAnswerText = (q) => {
    if (q.type === 'MULTIPLE_CHOICE' || !q.type) {
      const correctOpt = q.options?.find(o => o.isCorrect === true || o.isCorrect === 'true');
      return correctOpt ? (typeof correctOpt === 'object' ? correctOpt.text : correctOpt) : '';
    }
    if (q.type === 'SHORT_ANSWER' || q.type === 'TRUE_FALSE') {
      return q.answer || '';
    }
    if (q.type === 'DRAGGING_WORDS') {
      const wordsInSentence = q.question.match(/\[([^\]]+)\]/g)?.map(s => s.replace(/[\[\]]/g, '')) || [];
      return wordsInSentence.join(', ');
    }
    if (q.type === 'CONNECTING_WORDS') {
      return (q.pairs || []).map(p => `${p.left} → ${p.right}`).join(', ');
    }
    return '';
  };

  const renderQuestionBlock = (title, icon, questions, answers, setAnswers, showHints = false) => {
    if (!questions || questions.length === 0) return null;
    const Icon = icon;
    return (
      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-white text-base">{title}</h4>
        </div>
        {questions.map((q, qIdx) => {
          const type = q.type || 'MULTIPLE_CHOICE';
          const qText = q.question || q.q; 
          const isCorrect = showHints ? checkType(q, answers[qIdx]) : null;
          const correctAnswerText = showHints && !isCorrect ? getCorrectAnswerText(q) : '';
          
          return (
            <div key={qIdx} className="flex flex-col gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0 relative">
              {type !== 'DRAGGING_WORDS' && (
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm text-white/90">{qIdx + 1}. {qText}</p>
                  {showHints && (
                    <span className="ml-2">
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <span className="text-rose-400 font-bold text-xs">X</span>}
                    </span>
                  )}
                </div>
              )}
              
              {type === 'MULTIPLE_CHOICE' && (
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[qIdx] === oIdx;
                    const text = typeof opt === 'object' ? opt.text : opt;
                    const optIsCorrect = opt.isCorrect === true || opt.isCorrect === 'true';
                    
                    let bgClass = isSelected 
                        ? 'bg-hygge-teal/20 border-hygge-teal text-white shadow-sm' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10';
                        
                    if (showHints) {
                       if (optIsCorrect) bgClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                       else if (isSelected && !optIsCorrect) bgClass = 'bg-rose-500/20 border-rose-500 text-rose-400';
                    }
                    
                    return (
                      <button
                        key={oIdx}
                        onClick={() => !showHints && handleSelect(setAnswers, qIdx, oIdx)}
                        disabled={showHints}
                        className={`text-left p-3 rounded-xl border text-sm transition-all focus:outline-none ${!showHints ? 'cursor-pointer' : 'cursor-default'} ${bgClass}`}
                      >
                        {text}
                      </button>
                    )
                  })}
                </div>
              )}

              {type === 'SHORT_ANSWER' && (
                <input 
                  type="text" 
                  value={answers[qIdx] || ''}
                  onChange={(e) => setAnswers(prev => ({...prev, [qIdx]: e.target.value}))}
                  disabled={showHints}
                  placeholder="Type your answer..."
                  className={`w-full py-2.5 px-4 bg-white/5 border rounded-xl text-white placeholder-white/40 text-sm focus:outline-none ${
                    showHints ? (isCorrect ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400') : 'border-white/10 focus:border-hygge-teal/50'
                  }`}
                />
              )}

              {type === 'TRUE_FALSE' && (
                <div className="flex gap-4">
                  <button
                    onClick={() => !showHints && setAnswers(prev => ({...prev, [qIdx]: 'TRUE'}))}
                    disabled={showHints}
                    className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all focus:outline-none ${!showHints ? 'cursor-pointer' : 'cursor-default'} ${
                      answers[qIdx] === 'TRUE' 
                        ? (showHints ? (isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400') : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm')
                        : (showHints && q.answer?.toUpperCase() === 'TRUE' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10')
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => !showHints && setAnswers(prev => ({...prev, [qIdx]: 'FALSE'}))}
                    disabled={showHints}
                    className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all focus:outline-none ${!showHints ? 'cursor-pointer' : 'cursor-default'} ${
                      answers[qIdx] === 'FALSE' 
                        ? (showHints ? (isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400') : 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm')
                        : (showHints && q.answer?.toUpperCase() === 'FALSE' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10')
                    }`}
                  >
                    False
                  </button>
                </div>
              )}

              {type === 'DRAGGING_WORDS' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm text-white/90">{qIdx + 1}. Fill in the blanks:</p>
                    {showHints && (
                      <span className="ml-2">
                        {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <span className="text-rose-400 font-bold text-xs">X</span>}
                      </span>
                    )}
                  </div>
                  <DropBlankUI 
                     question={q} 
                     value={answers[qIdx] || {}} 
                     onChange={(v) => !showHints && setAnswers(prev => ({...prev, [qIdx]: v}))} 
                  />
                </div>
              )}

              {type === 'CONNECTING_WORDS' && (
                <div className="flex flex-col gap-3 mt-1 relative">
                  {showHints && (
                    <div className="absolute top-0 right-0 z-10">
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <span className="text-rose-400 font-bold text-xs">X</span>}
                    </div>
                  )}
                  <ConnectingWordsUI 
                     question={q} 
                     value={answers[qIdx] || []} 
                     onChange={(v) => !showHints && setAnswers(prev => ({...prev, [qIdx]: v}))} 
                  />
                </div>
              )}
              
              {showHints && !isCorrect && correctAnswerText && (
                <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-white/90">
                  <span className="font-bold text-rose-400">Correct Answer:</span> {correctAnswerText}
                </div>
              )}
              {showHints && q.explanation && (
                <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 leading-relaxed italic">
                  <span className="font-bold text-hygge-teal not-italic">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>
    );
  };

   if (activeLesson) {
    const videoUrl = activeLesson.video_url || activeLesson.videoUrl;
    const prepTasks = activeLesson.prep_tasks || activeLesson.prepTasks;
    const formFields = activeLesson.form_fields || activeLesson.formFields;
    
    const hostUrl = 'https://upload.hyggee.ir';
    
    const fullVideoUrl = videoUrl 
      ? (videoUrl.startsWith('http') ? videoUrl : `${hostUrl}${videoUrl}`)
      : null;

    const currentStepId = steps[currentStepIndex]?.id;
    const progressPercent = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

    return (
      <motion.div 
        className="flex flex-col h-full inset-0 z-50 fixed bg-[#88aba8] overflow-y-auto"
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 py-3 px-4 bg-[#37494a]/90 backdrop-blur-md border-b border-white/10 text-white">
          <button onClick={closeLesson} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition cursor-pointer">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg truncate flex-grow">
            {activeLesson.title}
          </div>
        </div>

        <div className="w-full bg-white/10 h-1.5 overflow-hidden">
           <motion.div 
             className="h-full bg-hygge-teal"
             initial={{ width: 0 }}
             animate={{ width: `${progressPercent}%` }}
             transition={{ duration: 0.3 }}
           />
        </div>

        <div className="p-4 md:p-6 pb-32 flex flex-col gap-4 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {currentStepId === 'prep' && (
                <>
                  {renderQuestionBlock("Preparation Task", ListChecks, prepTasks, prepAnswers, setPrepAnswers, prepSubmitted)}
                  
                  {!prepSubmitted ? (
                    <button
                      onClick={submitPrepTask}
                      className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                    >
                      Submit Preparation Task
                    </button>
                  ) : (
                    <>
                      {prepPassed ? (
                        <div className="w-full mt-4 p-4 rounded-xl border flex items-center justify-between font-bold text-sm bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                          <span>Preparation Task Passed!</span>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-sm text-center">
                            You must answer all preparation questions correctly to proceed. Review the hints above, then try again.
                          </div>
                          <button
                            onClick={() => setPrepSubmitted(false)}
                            className="w-full mt-2 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {currentStepId === 'video' && (
                <>
                  <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-white text-base">Video Material</h4>
                    </div>
                    {fullVideoUrl ? (
                      <video controls className="w-full aspect-video bg-black border border-white/5 rounded-2xl overflow-hidden shadow-inner mt-2 object-contain" src={fullVideoUrl}></video>
                    ) : (
                      <div className="w-full aspect-video bg-[#1e2729] border border-white/5 rounded-2xl flex items-center justify-center text-white/30 text-sm mt-2">No video available.</div>
                    )}
                  </div>

                  <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-2 mt-2">
                     <div className="flex items-center gap-2 mb-1">
                      <AlignLeft className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-white text-base">Description</h4>
                    </div>
                    <p className="text-sm text-white/70 font-light leading-relaxed">{activeLesson.description}</p>
                  </div>
                </>
              )}

              {currentStepId === 'quiz' && (
                <>
                  {renderQuestionBlock("Lesson Quiz", HelpCircle, activeLesson.quizzes, quizAnswers, setQuizAnswers, showExamHints)}

                  {/* Sentence Factory */}
                  {(formFields || activeLesson.sentences) && ((formFields?.length > 0) || (activeLesson.sentences?.length > 0)) && (
                    <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Type className="w-5 h-5 text-amber-400" />
                        <h4 className="font-bold text-white text-base">Sentence Factory</h4>
                      </div>
                      {formFields && formFields.length > 0 ? (
                        formFields.map((field, sIdx) => (
                          <div key={`field-${sIdx}`} className="flex flex-col gap-2">
                            <label className="text-sm text-white/90 font-medium">{field.label}</label>
                            {field.type === 'textarea' ? (
                              <textarea value={sentenceInputs[sIdx] || ''} onChange={(e) => setSentenceInputs({...sentenceInputs, [sIdx]: e.target.value})} placeholder="Type here..." rows={3} className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm outline-none resize-none" />
                            ) : (
                              <input type="text" value={sentenceInputs[sIdx] || ''} onChange={(e) => setSentenceInputs({...sentenceInputs, [sIdx]: e.target.value})} placeholder="Type here..." className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none" />
                            )}
                          </div>
                        ))
                      ) : (
                        activeLesson.sentences?.map((sentence, sIdx) => (
                          <div key={`sent-${sIdx}`} className="flex flex-col gap-2">
                            <span className="text-sm text-white/80">{sentence}</span>
                            <input type="text" value={sentenceInputs[sIdx] || ''} onChange={(e) => setSentenceInputs({...sentenceInputs, [sIdx]: e.target.value})} placeholder="Fill in the blank..." className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none" />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {currentStepId === 'test' && (
                <>
                  {renderQuestionBlock("Final Test", FileText, activeLesson.final_test_data || activeLesson.tests, testAnswers, setTestAnswers, showExamHints)}
                </>
              )}

              {currentStepId === lastAssessmentStepId && (
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-4">
                  {score === null ? (
                    <button
                      onClick={calculateAndSubmitScore}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-hygge-teal hover:bg-hygge-teal/90 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Syncing Answers..." : "Submit All Answers"}
                    </button>
                  ) : (
                    <>
                      <div className={`p-5 rounded-3xl border flex items-center justify-between font-bold text-lg ${
                        examPassed ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      }`}>
                        <span>Overall Score: {score}%</span>
                        {examPassed && <CheckCircle className="w-6 h-6" />}
                      </div>
                      
                      {!examPassed && (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-center">
                            You must score 100% to pass the lesson exam. Review the hints provided for incorrect answers above, then try again.
                          </p>
                          <button
                            onClick={() => {
                               setScore(null);
                               setExamPassed(false);
                               setShowExamHints(false);
                               setQuizAnswers({});
                               setTestAnswers({});
                               setSentenceInputs({});
                            }}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {currentStepId === 'media' && (
                <>
                  {/* Media Teaching Segment */}
                  <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <FileAudio className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-white text-base">Media Teaching Segment</h4>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-light">Record a video or audio memo sharing what you learned today. It will be posted directly to the live Community Feed!</p>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-hygge-teal/50 hover:border-hygge-teal bg-hygge-teal/5 hover:bg-hygge-teal/10 rounded-2xl cursor-pointer transition">
                      <div className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition">
                        <Mic className="w-8 h-8" />
                        <span className="text-sm font-bold">{teachingMedia ? teachingMedia.name : "Tap to Upload Audio or Video"}</span>
                      </div>
                      <input type="file" accept="audio/*,video/*" capture="environment" className="hidden" onChange={(e) => setTeachingMedia(e.target.files[0])} />
                    </label>
                    <textarea value={teachingSegment} onChange={(e) => setTeachingSegment(e.target.value)} placeholder="Add an optional text description..." rows={2} className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm outline-none resize-none" />
                    {postSuccess ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium"><CheckCircle className="w-4 h-4" />Posted to Community!</div>
                    ) : (
                      <button 
                        onClick={handlePostToCommunity} 
                        disabled={(!teachingSegment.trim() && !teachingMedia) || uploadProgress !== null} 
                        className="self-end px-6 py-2.5 bg-hygge-teal hover:bg-hygge-teal/90 disabled:opacity-80 disabled:cursor-not-allowed border border-white/10 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 relative overflow-hidden"
                      >
                        {uploadProgress !== null && (
                          <div className="absolute top-0 left-0 h-full bg-emerald-400/40 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        )}
                        <span className="relative z-10 font-bold">{uploadProgress !== null ? `Uploading... ${uploadProgress}%` : "Post to Feed"}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
              {lastAssessmentStepId === null && currentStepIndex === steps.length - 1 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  {score === null ? (
                    <button
                      onClick={calculateAndSubmitScore}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-hygge-teal hover:bg-hygge-teal/90 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Finishing..." : "Mark Module Complete"}
                    </button>
                  ) : (
                    <div className="p-5 rounded-3xl border flex items-center justify-between font-bold text-lg bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                      <span>Module Built</span>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
             <button 
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="px-6 py-2.5 rounded-xl text-white font-medium bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition"
             >
                Previous
             </button>
             
             <button 
                onClick={() => {
                   if (currentStepIndex < steps.length - 1) {
                       setCurrentStepIndex(currentStepIndex + 1);
                   } else {
                       closeLesson();
                   }
                }}
                disabled={(currentStepId === 'prep' && !prepPassed) || (currentStepId === lastAssessmentStepId && !examPassed)}
                className="px-6 py-2.5 rounded-xl text-white font-bold bg-hygge-teal hover:bg-hygge-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
             >
                {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
             </button>
          </div>

        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/50">
        <Loader2 className="w-8 h-8 animate-spin text-hygge-teal" />
        <p className="text-sm font-medium">Loading your path...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" id="user-lessons-tab">
      <div className="flex items-center justify-between px-1">
        <h4 className="font-bold text-lg text-white tracking-tight">Learning Path</h4>
        <span className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full font-medium">{lessons.length} Modules</span>
      </div>
      {lessons.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10 text-white/50">No lessons published yet. Check back soon!</div>
      ) : (
        <div className="flex flex-col gap-4">
          {(Array.isArray(lessons) ? lessons : []).map((lesson, idx, arr) => {
            if (!lesson) return null;
            const lessonIdStr = String(lesson.id);
            const currentScore = (lessonScores || {})[lessonIdStr] || (lessonScores || {})[lesson.id] || 0;
            const isCompleted = lesson.completed === true || currentScore >= 80;
            
            let isUnlocked = false;
            if (idx === 0) {
              isUnlocked = true;
            } else {
              const prevLesson = arr[idx - 1];
              if (prevLesson) {
                 const prevLessonIdStr = String(prevLesson.id);
                 const prevScore = (lessonScores || {})[prevLessonIdStr] || (lessonScores || {})[prevLesson.id] || 0;
                 if (prevLesson.completed === true || prevScore >= 80) isUnlocked = true;
              }
            }

            return (
            <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={isUnlocked ? { scale: 0.98 } : {}} onClick={() => isUnlocked && openLesson(lesson)} className={`border border-white/10 rounded-3xl p-4 flex flex-col gap-3 transition group shadow-sm flex-grow ${isUnlocked ? 'bg-[#2f3e40]/60 hover:bg-[#2f3e40] cursor-pointer' : 'bg-black/20 opacity-60 cursor-not-allowed'}`}>
              <div className="flex gap-4 items-center">
                <div className={`w-16 h-16 rounded-2xl border border-white/5 flex items-center justify-center shrink-0 relative overflow-hidden transition shadow-inner ${isUnlocked ? 'bg-[#546E6D]/50 group-hover:bg-[#546E6D]' : 'bg-black/20'}`}>
                  {isCompleted && (
                    <div className="absolute top-1 right-1"><CheckCircle className="w-3.5 h-3.5 text-hygge-teal fill-hygge-teal/20" /></div>
                  )}
                  {!isUnlocked ? (
                    <Lock className="w-6 h-6 text-white/40" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1 opacity-80 group-hover:opacity-100 transition" />
                  )}
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                  <span className="text-[10px] text-hygge-cream font-bold uppercase tracking-widest mb-1 font-mono">{lesson.duration || "10m"}</span>
                  <h5 className="font-bold text-white text-base leading-snug transition truncate group-hover:text-hygge-cream">{lesson.title}</h5>
                  <p className="text-xs text-white/50 font-light mt-1 line-clamp-1">{lesson.description}</p>
                </div>
                {isUnlocked && currentScore > 0 && (
                   <span className="text-xs font-bold text-white/80 bg-white/10 py-1 px-2 rounded-lg">{currentScore}%</span>
                )}
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                 <div className={`h-full rounded-full ${isCompleted ? 'bg-hygge-teal w-full' : (currentScore > 0 ? 'bg-hygge-teal/60' : 'bg-hygge-teal/40 w-0')}`} style={{ width: isCompleted ? '100%' : `${currentScore}%` }} />
              </div>
            </motion.div>
          )})}
        </div>
      )}
    </div>
  );
}