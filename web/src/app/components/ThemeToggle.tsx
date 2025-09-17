"use client";

import React, { useState, useEffect } from 'react';
import { LuSun, LuMoon } from 'react-icons/lu';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`p-2 w-10 h-10 ${className}`}>
        {/* Placeholder during SSR */}
      </div>
    );
  }

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        rounded-lg border transition-all duration-200
        ${theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {theme === 'light' ? (
          <LuMoon 
            size={iconSizes[size]} 
            className="transition-transform duration-200 hover:scale-110" 
          />
        ) : (
          <LuSun 
            size={iconSizes[size]} 
            className="transition-transform duration-200 hover:scale-110 hover:rotate-12" 
          />
        )}
      </div>
    </button>
  );
}