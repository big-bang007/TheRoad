import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Loader2, ArrowRight } from 'lucide-react';
import { userService } from '../services/api';

export default function SetupProfileView({ user, onComplete }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call your backend to save the name
      await userService.updateProfile(name);
      
      // Tell the parent component we are done, and pass the new name!
      onComplete({ ...user, name: name });
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 max-w-md mx-auto"
    >
      <div className="w-16 h-16 bg-hygge-teal/20 text-hygge-teal rounded-full flex items-center justify-center mb-6">
        <User className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome to The Road!</h2>
      <p className="text-white/60 text-center mb-8 text-sm">
        Your phone is verified. What should we call you?
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Your Full Name"
            className="w-full py-4 px-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-hygge-teal/50 transition text-center text-lg"
            autoFocus
          />
        </div>

        {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full py-4 bg-hygge-teal hover:bg-hygge-teal/90 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Continue <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </form>
    </motion.div>
  );
}