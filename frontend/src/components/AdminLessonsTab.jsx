/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Video, Trash2, Check, FileVideo, Save, PlusCircle, HelpCircle, FileText, AlignLeft, ListChecks, Type, Play, Edit3 } from 'lucide-react';
import api, { lessonService } from '../services/api';

const QuestionBuilder = ({ title, icon: Icon, questions, setQuestions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [qType, setQType] = useState('MULTIPLE_CHOICE');
  const [currentText, setCurrentText] = useState('');
  const [currentOptions, setCurrentOptions] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [dragSentence, setDragSentence] = useState('');
  const [extraDragWords, setExtraDragWords] = useState('');
  const [connectPairs, setConnectPairs] = useState([{ left: '', right: '' }]);
  const [sentenceFactory, setSentenceFactory] = useState([]);
  const [explanation, setExplanation] = useState('');

  const handleAddOption = () => setCurrentOptions([...currentOptions, { text: '', isCorrect: false }]);
  const handleRemoveOption = (idx) => setCurrentOptions(currentOptions.filter((_, i) => i !== idx));
  const handleOptionChange = (idx, val) => {
    const updated = [...currentOptions];
    updated[idx].text = val;
    setCurrentOptions(updated);
  };
  const handleSetCorrect = (idx) => {
    setCurrentOptions(currentOptions.map((opt, i) => ({ ...opt, isCorrect: i === idx })));
  };

  const handleAddPair = () => setConnectPairs([...connectPairs, { left: '', right: '' }]);
  const handlePairChange = (idx, side, val) => {
    const updated = [...connectPairs];
    updated[idx][side] = val;
    setConnectPairs(updated);
  };
  const handleRemovePair = (idx) => setConnectPairs(connectPairs.filter((_, i) => i !== idx));

  const handleSave = () => {
    let newQ = { type: qType, question: currentText };
    if (qType === 'MULTIPLE_CHOICE') {
      if (!currentText.trim()) return console.warn("Question text required.");
      const hasCorrect = currentOptions.some(opt => opt.isCorrect);
      if (!hasCorrect) return console.warn("Please mark at least one option as correct.");
      newQ.options = currentOptions;
    } else if (qType === 'SHORT_ANSWER') {
      if (!currentText.trim()) return console.warn("Question text required.");
      if (!shortAnswerText.trim()) return console.warn("Provide a valid short answer.");
      newQ.answer = shortAnswerText;
    } else if (qType === 'DRAGGING_WORDS') {
      if (!dragSentence.includes('[')) return console.warn("Sentence must contain at least one [word] blank.");
      newQ.question = dragSentence; 
      newQ.distractors = extraDragWords.split(',').map(s=>s.trim()).filter(Boolean);
    } else if (qType === 'CONNECTING_WORDS') {
      if (connectPairs.some(p => !p.left || !p.right)) return console.warn("Fill all connection pairs.");
      newQ.question = currentText || "Connect the matching words";
      newQ.pairs = connectPairs;
    } else if (qType === 'TRUE_FALSE') {
    if (!currentText.trim()) return console.warn("Question text required.");
    if (!shortAnswerText) return console.warn("Select True or False.");
    newQ.answer = shortAnswerText;
}
    
    if (explanation.trim()) {
       newQ.explanation = explanation;
    }
    
    setQuestions([...questions, newQ]);
    setIsAdding(false);
    setCurrentText('');
    setQType('MULTIPLE_CHOICE');
    setCurrentOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
    setShortAnswerText('');
    setDragSentence('');
    setExtraDragWords('');
    setConnectPairs([{ left: '', right: '' }]);
    setExplanation('');
  };

  const handleRemove = (idx) => setQuestions(questions.filter((_, i) => i !== idx));

  return (
    <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-amber-400" />
          <h5 className="font-bold text-white text-sm">{title}</h5>
        </div>
        <span className="text-xs text-white/40 font-mono">{questions.length} Items</span>
      </div>

      {questions.map((q, idx) => (
        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-3 relative group">
          <button onClick={() => handleRemove(idx)} className="absolute top-3 right-3 text-white/20 hover:text-rose-400 transition opacity-0 group-hover:opacity-100 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
          <span className="text-[10px] uppercase font-bold text-hygge-teal/80 tracking-wider mb-[-8px]">{q.type?.replace('_', ' ') || 'MULTIPLE CHOICE'}</span>
          <h6 className="font-bold text-sm text-white pr-6">{q.question}</h6>
        </div>
      ))}

      {isAdding ? (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-4 border border-hygge-teal/30 bg-hygge-teal/5 p-4 rounded-2xl">
          <select value={qType} onChange={e=>setQType(e.target.value)} className="w-full py-2.5 px-3 bg-[#2f3e40] border border-white/10 rounded-xl text-white text-sm focus:outline-none mb-2">
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="DRAGGING_WORDS">Dragging Words</option>
            <option value="CONNECTING_WORDS">Connecting Words</option>
          </select>

          {qType !== 'DRAGGING_WORDS' && (
            <input type="text" value={currentText} onChange={(e) => setCurrentText(e.target.value)} placeholder="Question text..." className="w-full py-2.5 px-3 bg-[#2f3e40] border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none" />
          )}

          {qType === 'MULTIPLE_CHOICE' && (
            <div className="flex flex-col gap-2">
              {currentOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button onClick={() => handleSetCorrect(idx)} className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition ${opt.isCorrect ? 'bg-hygge-teal border-hygge-teal' : 'bg-transparent border-white/20'}`}>
                    {opt.isCorrect && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <input type="text" value={opt.text} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="w-full py-2 px-3 bg-[#2f3e40]/80 border border-white/10 rounded-lg text-white text-xs outline-none" />
                </div>
              ))}
              <button onClick={handleAddOption} className="text-xs text-white/50 font-medium flex items-center gap-1 mt-1 font-sans">+ Add Option</button>
            </div>
          )}

          {qType === 'SHORT_ANSWER' && (
            <input type="text" value={shortAnswerText} onChange={(e) => setShortAnswerText(e.target.value)} placeholder="Correct Answer..." className="w-full py-2.5 px-3 bg-[#2f3e40]/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none" />
          )}

          {qType === 'DRAGGING_WORDS' && (
            <div className="flex flex-col gap-3">
              <textarea value={dragSentence} onChange={e=>setDragSentence(e.target.value)} rows={3} placeholder="Sentence with blanks e.g., I want to [drink] some [coffee]." className="w-full py-2.5 px-3 bg-[#2f3e40] border border-white/10 rounded-xl text-white text-sm focus:outline-none" />
              <input type="text" value={extraDragWords} onChange={e=>setExtraDragWords(e.target.value)} placeholder="Extra distractor words (comma separated)" className="w-full py-2.5 px-3 bg-[#2f3e40]/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none" />
            </div>
          )}

          {qType === 'TRUE_FALSE' && (
            <div className="flex gap-4">
               <button 
                onClick={() => setShortAnswerText('TRUE')} 
                className={`flex-1 py-2 rounded-lg font-bold ${shortAnswerText === 'TRUE' ? 'bg-emerald-500 text-white' : 'bg-[#2f3e40] text-white/50'}`}
                >True</button>
                 <button 
                  onClick={() => setShortAnswerText('FALSE')} 
                  className={`flex-1 py-2 rounded-lg font-bold ${shortAnswerText === 'FALSE' ? 'bg-rose-500 text-white' : 'bg-[#2f3e40] text-white/50'}`}
                >False</button>
               </div>
        )}

          {/* 🌟 PERFECTED CONNECTING WORDS UI FOR ADMIN 🌟 */}
          {qType === 'CONNECTING_WORDS' && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="text-xs font-bold text-white/50 uppercase">Matching Pairs</div>
              {connectPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={pair.left} onChange={(e) => handlePairChange(idx, 'left', e.target.value)} placeholder="Left side (e.g. Hot)" className="w-full py-2 px-3 bg-[#2f3e40]/80 border border-white/10 rounded-lg text-white text-xs outline-none" />
                  <span className="text-white/50 text-xs font-bold">→</span>
                  <input type="text" value={pair.right} onChange={(e) => handlePairChange(idx, 'right', e.target.value)} placeholder="Right side (e.g. Cold)" className="w-full py-2 px-3 bg-[#2f3e40]/80 border border-white/10 rounded-lg text-white text-xs outline-none" />
                  <button onClick={() => handleRemovePair(idx)} className="text-rose-400 hover:text-rose-300 ml-1 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={handleAddPair} className="text-xs text-hygge-teal font-bold flex items-center gap-1 mt-1 cursor-pointer w-max">+ Add Another Pair</button>
            </div>
          )}

          <div className="mt-2">
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} placeholder="Explanation for the correct answer (optional)" className="w-full py-2.5 px-3 bg-[#2f3e40]/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none placeholder-white/30" />
          </div>

          <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/10">
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs font-medium">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-hygge-teal text-white text-xs font-medium shadow-md">Save Question</button>
            </div>
          </div>
        </motion.div>
      ) : (
        <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-white/10 hover:border-white/30 text-white/60 rounded-2xl transition flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      )}
    </div>
  );
};

export default function AdminLessonsTab({ lessonToEdit, onComplete }) {
  const [lessonTitle, setLessonTitle] = useState('');
  const [orderNumber, setOrderNumber] = useState('1'); 
  const [prepTasks, setPrepTasks] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [description, setDescription] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [sentenceFactory, setSentenceFactory] = useState([]);
  const [isAddingField, setIsAddingField] = useState(false);
  const [currentFieldLabel, setCurrentFieldLabel] = useState('');
  const [currentFieldType, setCurrentFieldType] = useState('text');
  const [extraDragWords, setExtraDragWords] = useState('');
  const [tests, setTests] = useState([]);
  const [teachingSegment, setTeachingSegment] = useState('');
  const [toast, setToast] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const customAlert = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    if (lessonToEdit) {
      setLessonTitle(lessonToEdit.title || '');
      setOrderNumber(String(lessonToEdit.order_number || '1'));
      setDescription(lessonToEdit.description || '');
      setTranscript(lessonToEdit.transcript || '');

      const safelyParse = (data) => {
        if (!data) return [];
        if (typeof data === 'string') {
          try { return JSON.parse(data); } catch (e) { return []; }
        }
        return data;
      };

      setPrepTasks(safelyParse(lessonToEdit.preparation_task || lessonToEdit.prepTasks));
      setQuizzes(safelyParse(lessonToEdit.lesson_quiz_data || lessonToEdit.quizzes));
      setFormFields(safelyParse(lessonToEdit.formFields));
      setSentenceFactory(safelyParse(lessonToEdit.sentence_factory_data || lessonToEdit.sentences));
      setTests(safelyParse(lessonToEdit.final_test_data || lessonToEdit.tests));
      setTeachingSegment(lessonToEdit.teaching_segment || lessonToEdit.teachingSegment || '');
    }
  }, [lessonToEdit]);

  const handleAddFormField = () => {
    if (currentFieldLabel.trim() && currentFieldType.trim()) {
      const distractors = extraDragWords.split(',').map(s => s.trim()).filter(Boolean);
      setSentenceFactory([...sentenceFactory, { 
         hint: currentFieldLabel, 
         correct_sentence: currentFieldType,
         distractors
      }]);
      setCurrentFieldLabel('');
      setCurrentFieldType('');
      setExtraDragWords('');
      setIsAddingField(false);
    } else {
      customAlert("Please provide both Hint and Target Sentence.");
    }
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    
    // 1. Create FormData
    const formData = new FormData();
    formData.append("file", file);

    try {
        // 2. Perform the POST request
        const response = await api.post("/api/v1/import-excel", formData, {
            headers: {
                'Content-Type': undefined 
            }
        });
        
        const data = response.data;
        console.log("Backend response data:", data);

        // 3. Update the State (The missing link!)
        // This maps the specific keys from your Excel to your React state setters
        if (data.preparation_task) setPrepTasks(data.preparation_task);
        if (data.lesson_quiz_data) setQuizzes(data.lesson_quiz_data);
        if (data.final_test_data) setTests(data.final_test_data);
        if (data.sentence_factory_data) setSentenceFactory(data.sentence_factory_data);
      
        
        customAlert("✅ Excel imported successfully! Questions are now populated.");
    } catch (error) {
        console.error("Excel Import Error:", error);
        customAlert(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
        setIsImporting(false);
        event.target.value = null; 
    }
  };

  const handlePublishLesson = async (e) => {
    if (e && e.preventDefault) e.preventDefault(); 

    try {
      const formData = new FormData();
      
      formData.append("title", lessonTitle || "Untitled Lesson"); 
      formData.append("order_number", orderNumber || 1);
      formData.append("description", description || "");
      formData.append("transcript", transcript || "");

      if (videoFile) {
        formData.append("video", videoFile); 
      }

      formData.append("prepTasks", JSON.stringify(prepTasks || []));
      formData.append("quizzes", JSON.stringify(quizzes || []));
      formData.append("sentence_factory_data", JSON.stringify(sentenceFactory || []));
      formData.append("sentences", JSON.stringify(sentenceFactory || []));
      formData.append("tests", JSON.stringify(tests || []));

      
      setUploadProgress(0);
      const config = {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      };

      let response;
      if (lessonToEdit && lessonToEdit.id) {
        response = await lessonService.updateLesson(lessonToEdit.id, formData, config);
      } else {
        response = await lessonService.createLesson(formData, config);
      }

      customAlert("Lesson published successfully!");
      
      setLessonTitle('');
      setOrderNumber('1');
      setDescription('');
      setTranscript('');
      setVideoFile(null);
      setPrepTasks([]);
      setQuizzes([]);
      setFormFields([]);
      setTests([]);
      
      if (typeof onComplete === 'function') {
         onComplete();
      } else {
         window.location.reload(); 
      }

    } catch (error) {
      setUploadProgress(null);
      console.error("Publish failed:", error);
      if (error.response && error.response.data) {
        customAlert("Backend rejected the data: " + JSON.stringify(error.response.data));
      } else {
        customAlert("Failed to publish lesson. Check the console.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6" id="admin-lessons-tab">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-medium shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex-grow flex flex-col gap-1.5">
          <label className="text-xs font-bold text-white/50 uppercase">Lesson Title</label>
          <input type="text" value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder="e.g. Introduction to Hygge Life" className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none" />
        </div>
      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mb-6 mt-4">
    <div className="flex-grow">
        <h3 className="text-white font-bold text-sm">Bulk Import Content</h3>
        <p className="text-white/50 text-xs">Upload your Excel template to automatically fill all questions below.</p>
    </div>
    
    <input 
        type="file" 
        id="excel-upload" 
        accept=".xlsx, .xls" 
        className="hidden" 
        onChange={handleExcelImport} 
        disabled={isImporting}
    />
    <label 
        htmlFor="excel-upload" 
        className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all ${isImporting ? 'bg-gray-600 text-white/50 cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
    >
        {isImporting ? "⏳ Parsing..." : "📁 Upload Excel"}
    </label>
</div>
        <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 w-32 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-white/50 uppercase">Order #</label>
          <input type="number" value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} min="1" className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none text-center font-mono" />
        </div>
      </div>

      <QuestionBuilder title="1. Preparation Task" icon={ListChecks} questions={prepTasks} setQuestions={setPrepTasks} />

      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
        <label className="text-xs font-bold text-white/50 uppercase flex items-center gap-2"><Video className="w-4 h-4"/> 2. Video File</label>
        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="text-white text-xs" />
        <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Enter video transcript..." rows={3} className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none" />
      </div>

      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-1.5">
        <label className="text-xs font-bold text-white/50 uppercase">3. Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Brief what learners will explore..." rows={3} className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none" />
      </div>

      <QuestionBuilder title="4. Lesson Quiz" icon={HelpCircle} questions={quizzes} setQuestions={setQuizzes} />

      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Type className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-white text-base">5. Sentence Factory</h4>
          <span className="ml-auto text-xs font-bold bg-hygge-teal/20 text-hygge-teal px-2 py-0.5 rounded uppercase">Drag & Drop</span>
        </div>

        {sentenceFactory.map((item, idx) => (
          <div key={idx} className="bg-white/5 p-4 rounded-xl flex flex-col gap-3 relative group border border-white/10">
            <button 
              onClick={() => setSentenceFactory(sentenceFactory.filter((_, i) => i !== idx))} 
              className="absolute top-3 right-3 text-white/20 hover:text-rose-400 transition opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <Trash2 className="w-4 h-4"/>
            </button>
            <div className="flex flex-col gap-1 pr-6">
              <span className="text-white text-sm font-bold">{item.hint || 'No hint provided'}</span>
              <span className="text-emerald-400 text-xs font-mono">{item.correct_sentence}</span>
            </div>
            {item.distractors && item.distractors.length > 0 && (
              <div className="text-xs text-white/50">
                Distractors: {item.distractors.join(', ')}
              </div>
            )}
          </div>
        ))}

        {isAddingField ? (
          <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
             <input 
               type="text" 
               value={currentFieldLabel} 
               onChange={e => setCurrentFieldLabel(e.target.value)} 
               placeholder="Hint / Prompt (e.g., Translate 'I want coffee')" 
               className="w-full bg-[#2f3e40] py-2.5 px-3 rounded-xl text-white text-sm outline-none border border-white/10" 
             />
             <input 
               type="text" 
               value={currentFieldType} 
               onChange={e => setCurrentFieldType(e.target.value)} 
               placeholder="Target Sentence (e.g., I want coffee)" 
               className="w-full bg-[#2f3e40] py-2.5 px-3 rounded-xl text-white text-sm outline-none border border-white/10" 
             />
             <input 
               type="text" 
               value={extraDragWords} 
               onChange={e => setExtraDragWords(e.target.value)} 
               placeholder="Distractors (comma separated, e.g. tea, eat)" 
               className="w-full bg-[#2f3e40] py-2.5 px-3 rounded-xl text-white text-sm outline-none border border-white/10" 
             />
             <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsAddingField(false)} className="px-3 py-1.5 text-xs text-white/50 font-medium">Cancel</button>
                <button onClick={handleAddFormField} className="px-4 py-1.5 bg-hygge-teal text-white rounded-lg text-xs font-bold cursor-pointer">Add Sentence</button>
             </div>
          </div>
        ) : (
          <button onClick={() => {
            setIsAddingField(true);
            setCurrentFieldLabel('');
            setCurrentFieldType('');
            setExtraDragWords('');
          }} className="py-3 border-2 border-dashed border-white/10 text-white/40 text-sm font-medium rounded-xl cursor-pointer hover:border-white/30 transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Constructor Sentence
          </button>
        )}
      </div>

      <QuestionBuilder title="6. Final Test" icon={FileText} questions={tests} setQuestions={setTests} />

      <button onClick={handlePublishLesson} disabled={uploadProgress !== null} className="w-full py-4 bg-hygge-teal text-white font-bold rounded-xl shadow-md cursor-pointer transition transform active:scale-95 disabled:opacity-80 disabled:scale-100 disabled:cursor-not-allowed relative overflow-hidden">
        {uploadProgress !== null && (
          <div className="absolute top-0 left-0 h-full bg-emerald-400/40 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
        )}
        <span className="relative z-10">{uploadProgress !== null ? `Uploading... ${uploadProgress}%` : "Publish Complete Lesson Build"}</span>
      </button>
    </div>
  );
}