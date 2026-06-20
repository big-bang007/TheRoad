/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Use 'motion/react' if you are on the newer Framer Motion version
import { User, ArrowRight, Loader2 } from 'lucide-react';

export default function NameInputView({ onSubmit }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(''); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🟢 STRICT VALIDATION CHECK
    // .trim() removes invisible spaces to ensure they didn't just hit the spacebar
    const cleanName = name.trim();
    
    if (!cleanName) {
      setError("Please enter your name to continue.");
      return;
    }
    
    if (cleanName.length < 2) {
      setError("Your name must be at least 2 characters long.");
      return;
    }

    setError(''); // Clear any previous errors
    setIsSubmitting(true);
    
    try {
      // Pass the securely trimmed name to your parent component/API
      await onSubmit(cleanName);
    } catch (err) {
      console.error("Failed to save name", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">What should we call you?</h2>
        <p className="text-white/50 text-sm">Let's make this journey personal.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(''); // Instantly clear the red error text as soon as they start typing
              }}
              placeholder="Your full name"
              className={`w-full bg-white/5 border ${
                error ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-hygge-teal'
              } rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none transition-colors`}
              autoFocus
            />
          </div>
          
          {/* 🟢 ERROR MESSAGE DISPLAY */}
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-rose-500 text-xs mt-2 ml-2 font-medium"
            >
              {error}
            </motion.p>
          )}
        </div>

        <button
          type="submit"
          // 🟢 HARD DISABLE: Prevents clicking if empty or during API call
          disabled={!name.trim() || isSubmitting}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-hygge-teal hover:bg-hygge-teal/90"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continue <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}