import React from 'react';

export default function HyggeLogo({ className = '' }) {
  return (
    <img 
      src="/logo_hygge.svg" 
      alt="Hygge Institution Logo" 
      className={`w-32 h-auto object-contain select-none filter drop-shadow-sm ${className}`} 
      id="hygge-logo-img"
    />
  );
}