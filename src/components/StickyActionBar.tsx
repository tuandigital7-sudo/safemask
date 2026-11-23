import React from 'react';

interface StickyActionBarProps {
  children: React.ReactNode;
}

/**
 * Mobile-first fixed bottom action dock.
 * Ensures Save / Share / Export / Fix buttons are ALWAYS visible above the home indicator
 * without requiring the user to scroll down.
 */
export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children }) => (
  <div className="fixed bottom-0 inset-x-0 z-40 bg-obsidian/95 backdrop-blur-xl border-t border-borderdark/90 px-4 pt-3 safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.65)]">
    <div className="max-w-lg mx-auto">{children}</div>
  </div>
);
