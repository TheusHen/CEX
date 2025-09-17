"use client";

import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportData {
  data: any[];
  filename: string;
  sheetName?: string;
}

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any[], filename: string, sheetName = 'Sheet1') => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      ) + 2
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportToPDF = async (elementRef: React.RefObject<HTMLElement | HTMLDivElement | null>, filename: string) => {
    if (!elementRef.current) {
      throw new Error('Element reference is required for PDF export');
    }

    try {
      const canvas = await html2canvas(elementRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If image is taller than page, we might need multiple pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 210; // A4 height

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 210;
      }
      
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  };

  const exportData = async (
    format: ExportFormat,
    exportData: ExportData,
    elementRef?: React.RefObject<HTMLElement | HTMLDivElement | null>
  ) => {
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'csv':
          exportToCSV(exportData.data, exportData.filename);
          break;
        case 'excel':
          exportToExcel(exportData.data, exportData.filename, exportData.sheetName);
          break;
        case 'pdf':
          if (!elementRef) {
            throw new Error('Element reference is required for PDF export');
          }
          await exportToPDF(elementRef, exportData.filename);
          break;
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
    exportToCSV,
    exportToExcel,
    exportToPDF
  };
}