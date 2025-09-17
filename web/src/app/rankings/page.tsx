"use client";

import React, { useState, useEffect, useRef } from "react";
import { Russo_One, Inter } from "next/font/google";
import Link from "next/link";
import { 
  LuTrophy, 
  LuMedal, 
  LuAward, 
  LuStar, 
  LuHouse, 
  LuRefreshCw,
  LuFilter
} from "react-icons/lu";
import { useTheme, getThemeClasses } from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';
import ExportButton from '../components/ExportButton';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

type Airport = {
  iata: string;
  airport: string;
  comfort: number;
  efficiency: number;
  aesthetics: number;
  cex: number;
  created_at: string;
  rank?: number;
  category_score?: number;
};

type RankingData = {
  category?: string;
  region?: string;
  rankings: Airport[];
};

function RankingsContent() {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<"global" | "category" | "region">("global");
  const [selectedCategory, setSelectedCategory] = useState<"comfort" | "efficiency" | "aesthetics">("comfort");
  const [selectedRegion, setSelectedRegion] = useState("S"); // Default to South America
  const [globalRankings, setGlobalRankings] = useState<Airport[]>([]);
  const [categoryRankings, setCategoryRankings] = useState<RankingData | null>(null);
  const [regionRankings, setRegionRankings] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://api.cex.theushen.me/api'
    : 'http://localhost:3000/api';

  useEffect(() => {
    fetchGlobalRankings();
  }, []);

  useEffect(() => {
    if (activeTab === "category") {
      fetchCategoryRankings();
    } else if (activeTab === "region") {
      fetchRegionRankings();
    }
  }, [activeTab, selectedCategory, selectedRegion]);

  const fetchGlobalRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rankings/global?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setGlobalRankings(data);
    } catch (err) {
      setError("Failed to load global rankings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rankings/category?category=${selectedCategory}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setCategoryRankings(data);
    } catch (err) {
      setError("Failed to load category rankings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rankings/region?region=${selectedRegion}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setRegionRankings(data);
    } catch (err) {
      setError("Failed to load region rankings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <LuTrophy className="text-yellow-500" />;
    if (rank === 2) return <LuMedal className="text-gray-400" />;
    if (rank === 3) return <LuAward className="text-amber-600" />;
    return <LuStar className="text-blue-500" />;
  };

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300";
    if (rank === 2) return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300";
    if (rank === 3) return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300";
    return "bg-white border-gray-200";
  };

  const getCurrentData = (): Airport[] => {
    if (activeTab === "global") {
      return globalRankings;
    } else if (activeTab === "category" && categoryRankings) {
      return categoryRankings.rankings;
    } else if (activeTab === "region" && regionRankings) {
      return regionRankings.rankings;
    }
    return [];
  };

  const refreshData = () => {
    if (activeTab === "global") {
      fetchGlobalRankings();
    } else if (activeTab === "category") {
      fetchCategoryRankings();
    } else if (activeTab === "region") {
      fetchRegionRankings();
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/home"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${themeClasses.hover} transition-colors duration-200`}
              >
                <LuHouse className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>
              <div className="flex items-center space-x-2">
                <h1 className={`text-4xl font-bold ${russoOne.className}`}>CEX Rankings</h1>
                <LuTrophy className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${themeClasses.hover} transition-colors duration-200`}
                disabled={loading}
              >
                <LuRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <ExportButton 
                data={getCurrentData()} 
                filename={`cex-rankings-${activeTab}`}
                elementRef={exportRef}
              />
              <ThemeToggle />
            </div>
          </div>
          
          <p className={`text-lg ${themeClasses.textSecondary} ${inter.className}`}>
            Explore the top-rated airports worldwide based on comfort, efficiency, and aesthetics.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {([
            { key: "global", label: "Global Rankings", icon: LuTrophy },
            { key: "category", label: "By Category", icon: LuFilter },
            { key: "region", label: "By Region", icon: LuStar },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-indigo-600 text-white shadow-lg"
                  : `${themeClasses.hover} ${themeClasses.text}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Category/Region Filters */}
        {activeTab === "category" && (
          <div className="mb-6">
            <div className="flex space-x-2">
              {(["comfort", "efficiency", "aesthetics"] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                    selectedCategory === category
                      ? "bg-indigo-600 text-white"
                      : `${themeClasses.hover} ${themeClasses.text}`
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "region" && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "N", label: "North America" },
                { key: "S", label: "South America" },
                { key: "E", label: "Europe" },
                { key: "A", label: "Asia" },
                { key: "F", label: "Africa" },
                { key: "O", label: "Oceania" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedRegion(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedRegion === key
                      ? "bg-indigo-600 text-white"
                      : `${themeClasses.hover} ${themeClasses.text}`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div ref={exportRef} className={`${themeClasses.cardBg} rounded-lg shadow-lg overflow-hidden ${themeClasses.border} border`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className={`mt-2 ${themeClasses.textSecondary}`}>Loading rankings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={refreshData}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>Rank</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>Airport</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>IATA</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>CEX Score</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>Comfort</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>Efficiency</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>Aesthetics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getCurrentData().map((airport, index) => (
                    <tr key={airport.iata} className={`${themeClasses.hover} transition-colors duration-150 ${getRankBgColor(index + 1)}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(index + 1)}
                          <span className={`font-bold text-lg ${themeClasses.text}`}>#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{airport.airport}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {airport.iata}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {airport.cex}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{airport.comfort}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{airport.efficiency}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{airport.aesthetics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Empty State */}
              {(
                (activeTab === "global" && globalRankings.length === 0) ||
                (activeTab === "category" && (!categoryRankings || categoryRankings.rankings.length === 0)) ||
                (activeTab === "region" && (!regionRankings || regionRankings.rankings.length === 0))
              ) && (
                <div className="px-6 py-12 text-center">
                  <LuTrophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No rankings available for this selection.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RankingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return <RankingsContent />;
}