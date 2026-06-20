/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import HyggeLogo from './HyggeLogo';

export default function SplashView({ onStart }) {
  return (
    <div 
      className="relative flex flex-col justify-between w-full min-h-screen p-6 overflow-hidden bg-gradient-to-b from-[#4A6061] to-[#2B3A3B] select-none"
      id="splash-container"
    >
      {/* Visual background road artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 md:opacity-50">
        <svg 
          className="w-full h-full" 
          viewBox="0 0 400 800" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Snaking road path backing */}
          <path 
            d="M 200,-50 C 200,30 50,50 50,170 C 50,290 350,250 350,390 C 350,530 60,510 60,650 C 60,770 320,770 320,850" 
            stroke="#1F2A2B" 
            strokeWidth="38" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Snaking road overlay for contrast */}
          <path 
            d="M 200,-50 C 200,30 50,50 50,170 C 50,290 350,250 350,390 C 350,530 60,510 60,650 C 60,770 320,770 320,850" 
            stroke="#2F3E40" 
            strokeWidth="34" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Snaking dashed lane marking */}
          <motion.path 
            d="M 200,-50 C 200,30 50,50 50,170 C 50,290 350,250 350,390 C 350,530 60,510 60,650 C 60,770 320,770 320,850" 
            stroke="white" 
            strokeWidth="2" 
            strokeDasharray="12 12" 
            strokeLinecap="round"
            initial={{ strokeDashoffset: 500 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Spacing top helper */}
      <div className="h-10" />

      {/* Brand logo at upper center/middle height */}
      <motion.div 
        className="z-10 flex flex-col items-center justify-center flex-grow -mt-20 relative w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        id="splash-logo"
      >
        {/* Cozy radial fade behind the logo to prevent road markings overlay & contrast issues */}
        <div className="absolute w-72 h-32 rounded-full bg-[#3F5455]/85 blur-2xl -z-10 pointer-events-none" />
        <HyggeLogo />
      </motion.div>

      {/* Footer Pill Button redesigned as a Cute Orange Bus */}
      <motion.div 
        className="z-10 w-full max-w-sm mx-auto mb-10 px-4 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="relative">
          {/* Main Bus Body Button */}
          <button
            onClick={onStart}
            className="flex flex-col justify-between w-full h-20 pt-2.5 pb-3 px-5 rounded-2xl bg-[#D96B27] hover:bg-[#C05718] text-white border-2 border-white font-medium text-sm shadow-xl cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative z-10"
            id="splash-start-button"
          >
            {/* Bus Windows row */}
            <div className="flex items-center gap-1.5 w-full">
              {/* Back windows */}
              <div className="w-6 h-3 bg-[#F4F7F6]/30 rounded-xs" />
              <div className="w-6 h-3 bg-[#F4F7F6]/30 rounded-xs" />
              <div className="w-6 h-3 bg-[#F4F7F6]/30 rounded-xs" />
              <div className="w-6 h-3 bg-[#F4F7F6]/30 rounded-xs" />
              {/* Front windscreen (rounded/angled to the right for direction) */}
              <div className="w-8 h-3 bg-[#F4F7F6]/50 rounded-xs rounded-tr-md" />
              {/* Headlight yellow indicator */}
              <div className="ml-auto w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_8px_#fcd34d] animate-pulse" />
            </div>

            {/* Bus side text sign & arrow drive action */}
            <div className="flex items-center justify-between w-full mt-1.5">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm tracking-widest text-white/95">
                  LET'S START!
                </span>
                <span className="text-[9px] font-bold tracking-widest text-yellow-200/90 font-mono bg-white/10 px-1.5 py-0.5 rounded-sm">
                  COZY-BUS
                </span>
              </div>
              <div className="flex items-center justify-center w-8 h-7 bg-white/20 rounded-lg">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </button>

          {/* Left Wheel */}
          <div className="absolute left-10 -bottom-3 w-6 h-6 bg-[#2F3E46] border-2 border-white rounded-full shadow-md z-20 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/50 rounded-full" />
          </div>
          {/* Right Wheel */}
          <div className="absolute right-10 -bottom-3 w-6 h-6 bg-[#2F3E46] border-2 border-white rounded-full shadow-md z-20 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
