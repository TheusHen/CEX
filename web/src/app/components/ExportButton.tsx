"use client";

import React, { useState } from 'react';
import { LuDownload, LuFileText, LuTable, LuImage } from 'react-icons/lu';
import { useDataExport } from '../hooks/useDataExport';
import { useTheme } from './ThemeProvider';

interface ExportButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
  elementRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
  className?: string;
  showFormats?: ('csv' | 'excel' | 'pdf')[];
}

export default function ExportButton({ 
  data, 
  filename, 
  sheetName = 'Sheet1',
  elementRef,
  className = '',
  showFormats = ['csv', 'excel', 'pdf']
}: ExportButtonProps) {
  const { theme } = useTheme();
  const { exportData, isExporting } = useDataExport();
  const [showDropdown, setShowDropdown] = useState(false);

  const formats = [
    { 
      key: 'csv' as const, 
      label: 'CSV', 
      icon: LuFileText, 
      description: 'Comma-separated values' 
    },
    { 
      key: 'excel' as const, 
      label: 'Excel', 
      icon: LuTable, 
      description: 'Excel spreadsheet' 
    },
    { 
      key: 'pdf' as const, 
      label: 'PDF', 
      icon: LuImage, 
      description: 'Portable document' 
    },
  ].filter(format => showFormats.includes(format.key));

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setShowDropdown(false);
    
    try {
      await exportData(format, { data, filename, sheetName }, elementRef);
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
    }
  };

  if (formats.length === 1) {
    // Single format - show simple button
    const format = formats[0];
    const Icon = format.icon;
    
    return (
      <button
        onClick={() => handleExport(format.key)}
        disabled={isExporting || (format.key === 'pdf' && !elementRef)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
          ${isExporting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
          }
          text-white
          ${className}
        `}
      >
        <Icon className="w-4 h-4" />
        <span>{isExporting ? 'Exporting...' : `Export ${format.label}`}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
          ${isExporting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
          }
          text-white
          ${className}
        `}
      >
        <LuDownload className="w-4 h-4" />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className={`
            absolute right-0 mt-2 w-48 rounded-md shadow-lg z-20 border
            ${theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
            }
          `}>
            <div className="py-1">
              {formats.map((format) => {
                const Icon = format.icon;
                const isDisabled = format.key === 'pdf' && !elementRef;
                
                return (
                  <button
                    key={format.key}
                    onClick={() => !isDisabled && handleExport(format.key)}
                    disabled={isDisabled}
                    className={`
                      w-full text-left px-4 py-2 text-sm flex items-center space-x-3
                      transition-colors
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : theme === 'dark'
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-50 text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {format.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}