/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import HyggeLogo from './HyggeLogo';

export default function OnboardingLayout({ children, id, onBack }) {
  return (
    <div 
      className="relative flex flex-col justify-between w-full min-h-screen p-6 md:p-8 bg-gradient-to-b from-[#415354] via-[#546E6D] to-[#718E8C] text-white"
      id={id || "onboarding-layout"}
    >
      {/* Soft light radial background accent for premium feel */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-80 h-80 bg-[#aed3cc]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Area with Logo */}
      <header className="z-10 flex flex-col items-center mt-6" id="onboarding-header">
        <HyggeLogo />
      </header>

      {/* Main Form/Content Area */}
      <main className="z-10 flex-grow flex flex-col justify-center w-full max-w-sm mx-auto my-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer copyright or small decorative element */}
      <footer className="z-10 text-center text-xs text-hygge-cream/60 py-4 font-light tracking-wide">
        &copy; {new Date().getFullYear()} Hygge Institution. All rights reserved.
      </footer>
    </div>
  );
}
