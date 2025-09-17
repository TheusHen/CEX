"use client";

import React, { useState, useEffect, useRef } from "react";
import { Russo_One, Inter } from "next/font/google";
import Link from "next/link";
import { 
  LuHouse, 
  LuRefreshCw, 
  LuTrendingUp, 
  LuChartBar, 
  LuChartPie,
  LuActivity,
  LuGlobe,
  LuAward
} from "react-icons/lu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ThemeToggle from '../components/ThemeToggle';
import ExportButton from '../components/ExportButton';

// Disable static generation for this page since it uses client-side hooks
export const dynamic = 'force-dynamic';

const russoOne = Russo_One({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

type AnalyticsData = {
  total_airports: number;
  average_cex: number;
  max_cex: number;
  min_cex: number;
  average_comfort: number;
  average_efficiency: number;
  average_aesthetics: number;
  score_distribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
};

type TrendsData = {
  trends: Array<{
    month: string;
    average_cex: number;
    airports_evaluated: number;
    airports: string[];
  }>;
};

type ComparisonData = {
  airports: Array<{
    iata: string;
    airport: string;
    comfort: number;
    efficiency: number;
    aesthetics: number;
    cex: number;
  }>;
  best_comfort: any;
  best_efficiency: any;
  best_aesthetics: any;
  best_overall: any;
  average_scores: {
    comfort: number;
    efficiency: number;
    aesthetics: number;
    cex: number;
  };
};

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [compareAirports, setCompareAirports] = useState("ZRH,BOS,CNF");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dashboardRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://api.cex.theushen.me/api'
    : 'http://localhost:3000/api';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAnalytics(),
        fetchTrends(),
        fetchComparison()
      ]);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const response = await fetch(`${API_BASE}/analytics/overview`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    const data = await response.json();
    setAnalyticsData(data);
  };

  const fetchTrends = async () => {
    const response = await fetch(`${API_BASE}/analytics/trends`);
    if (!response.ok) throw new Error('Failed to fetch trends');
    const data = await response.json();
    setTrendsData(data);
  };

  const fetchComparison = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/compare?airports=${compareAirports}`);
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.suggestion) {
          setError(`Airport comparison failed: ${errorData.error}. ${errorData.suggestion}`);
        } else {
          throw new Error(errorData.error || 'Failed to fetch comparison');
        }
        return;
      }
      const data = await response.json();
      setComparisonData(data);
      setError(""); // Clear any previous errors
    } catch (err: any) {
      console.error("Comparison error:", err);
      setError(`Comparison failed: ${err.message}`);
    }
  };

  const handleComparisonUpdate = async () => {
    if (compareAirports.trim()) {
      try {
        await fetchComparison();
      } catch (err) {
        console.error("Failed to update comparison:", err);
      }
    }
  };

  const getAnalyticsData = () => {
    const data = [];
    
    if (analyticsData) {
      data.push({
        metric: 'Total Airports',
        value: analyticsData.total_airports,
        category: 'Overview'
      });
      data.push({
        metric: 'Average CEX Score',
        value: analyticsData.average_cex.toFixed(2),
        category: 'Overview'
      });
      data.push({
        metric: 'Min CEX Score',
        value: analyticsData.min_cex.toFixed(2),
        category: 'Overview'
      });
      data.push({
        metric: 'Max CEX Score',
        value: analyticsData.max_cex.toFixed(2),
        category: 'Overview'
      });
    }

    if (trendsData && trendsData.trends) {
      trendsData.trends.forEach(trend => {
        data.push({
          metric: 'CEX Score',
          value: trend.average_cex?.toFixed(2) || 'N/A',
          category: `Trend ${trend.month}`,
          month: trend.month,
          airports_evaluated: trend.airports_evaluated
        });
      });
    }

    if (comparisonData && comparisonData.airports) {
      comparisonData.airports.forEach(airport => {
        data.push({
          metric: 'Airport Comparison',
          airport: airport.iata,
          cex_score: airport.cex?.toFixed(2) || 'N/A',
          comfort: airport.comfort?.toFixed(2) || 'N/A',
          efficiency: airport.efficiency?.toFixed(2) || 'N/A',
          aesthetics: airport.aesthetics?.toFixed(2) || 'N/A',
          category: 'Comparison'
        });
      });
    }

    return data;
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('cex-analytics-dashboard.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 ${inter.className} flex items-center justify-center`}>
        <div className="text-center">
          <LuActivity className="w-12 h-12 animate-pulse mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 ${inter.className} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const distributionData = analyticsData ? [
    { name: 'Excellent (8+)', value: analyticsData.score_distribution.excellent, color: '#10B981' },
    { name: 'Good (6-8)', value: analyticsData.score_distribution.good, color: '#06B6D4' },
    { name: 'Average (4-6)', value: analyticsData.score_distribution.average, color: '#F59E0B' },
    { name: 'Poor (<4)', value: analyticsData.score_distribution.poor, color: '#EF4444' }
  ] : [];

  const categoryData = analyticsData ? [
    { category: 'Comfort', score: analyticsData.average_comfort },
    { category: 'Efficiency', score: analyticsData.average_efficiency },
    { category: 'Aesthetics', score: analyticsData.average_aesthetics }
  ] : [];

  const radarData = comparisonData ? comparisonData.airports.map(airport => ({
    airport: airport.iata,
    comfort: airport.comfort,
    efficiency: airport.efficiency,
    aesthetics: airport.aesthetics,
    cex: airport.cex
  })) : [];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 ${inter.className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                <LuHouse className="w-6 h-6" />
              </Link>
              <h1 className={`${russoOne.className} text-3xl font-bold text-gray-900`}>
                CEX Analytics
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <ExportButton
                data={getAnalyticsData()}
                filename="CEX_Analytics"
                sheetName="Analytics"
                elementRef={dashboardRef}
                showFormats={['csv', 'excel', 'pdf']}
              />
              <button
                onClick={fetchAllData}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <LuRefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={dashboardRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <LuGlobe className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Airports</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.total_airports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <LuTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average CEX</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.average_cex}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <LuAward className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.max_cex}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <LuChartBar className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lowest Score</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.min_cex}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Averages Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LuChartBar className="w-5 h-5 mr-2 text-indigo-600" />
              Category Averages
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LuChartPie className="w-5 h-5 mr-2 text-indigo-600" />
              Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trends Chart */}
        {trendsData && trendsData.trends.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LuTrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              CEX Trends Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="average_cex" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Airport Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LuActivity className="w-5 h-5 mr-2 text-indigo-600" />
            Airport Comparison
          </h3>
          
          <div className="mb-4 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Compare Airports (IATA codes, comma-separated):
            </label>
            <input
              type="text"
              value={compareAirports}
              onChange={(e) => setCompareAirports(e.target.value)}
              placeholder="ZRH,BOS,CNF"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleComparisonUpdate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Compare
            </button>
          </div>

          {comparisonData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Performance Radar</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    {
                      metric: 'Comfort',
                      ...Object.fromEntries(comparisonData.airports.map(a => [a.iata, a.comfort]))
                    },
                    {
                      metric: 'Efficiency',
                      ...Object.fromEntries(comparisonData.airports.map(a => [a.iata, a.efficiency]))
                    },
                    {
                      metric: 'Aesthetics',
                      ...Object.fromEntries(comparisonData.airports.map(a => [a.iata, a.aesthetics]))
                    },
                    {
                      metric: 'CEX',
                      ...Object.fromEntries(comparisonData.airports.map(a => [a.iata, a.cex]))
                    }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 10]} />
                    {comparisonData.airports.map((airport, index) => (
                      <Radar
                        key={airport.iata}
                        name={airport.iata}
                        dataKey={airport.iata}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Table */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Detailed Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Airport</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CEX</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comfort</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aesthetics</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {comparisonData.airports.map((airport) => (
                        <tr key={airport.iata}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{airport.iata}</div>
                            <div className="text-sm text-gray-500">{airport.airport}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {airport.cex}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{airport.comfort}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{airport.efficiency}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{airport.aesthetics}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}