import React from 'react';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
          <stop offset="100%" stopColor="#9333ea" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Background Shape (Brain/Cloud) */}
      <path d="M368 112c-15.6 0-30.2 4.4-42.6 11.8C312.2 87.2 276.4 64 236 64c-68.8 0-127.3 43.8-151.7 104.9C35.9 181.2 0 224.7 0 276c0 72.9 59.1 132 132 132h244c75.1 0 136-60.9 136-136s-60.9-136-136-136-8-2.5-8-2.5z" fill="url(#grad1)" opacity="0.1"/>
      
      {/* Circuit Connections */}
      <circle cx="132" cy="276" r="25" fill="url(#grad1)" />
      <circle cx="236" cy="180" r="25" fill="url(#grad1)" />
      <circle cx="360" cy="240" r="25" fill="url(#grad1)" />
      <circle cx="280" cy="340" r="25" fill="url(#grad1)" />
      
      <path d="M132 276 L236 180 M236 180 L360 240 M360 240 L280 340 M280 340 L132 276" stroke="url(#grad1)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Checkmark/Spark */}
      <path d="M430 80 L450 120 L490 130 L460 160 L470 200 L430 180 L390 200 L400 160 L370 130 L410 120 Z" fill="#eab308" />
    </svg>
  );
};