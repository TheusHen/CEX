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
export const revalidate = 0;

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
export const revalidate = 0;

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

export default function RankingsPage() {
  const [mounted, setMounted] = useState(false);
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'light';
  const themeClasses = getThemeClasses(theme);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
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

  const exportData = () => {
    let dataToExport: Airport[] = [];
    let filename = "";

    if (activeTab === "global") {
      dataToExport = globalRankings;
      filename = "global_rankings";
    } else if (activeTab === "category" && categoryRankings) {
      dataToExport = categoryRankings.rankings;
      filename = `${selectedCategory}_rankings`;
    } else if (activeTab === "region" && regionRankings) {
      dataToExport = regionRankings.rankings;
      filename = `region_${selectedRegion}_rankings`;
    }

    if (dataToExport.length === 0) return;

    const csvContent = [
      ["Rank", "IATA", "Airport", "CEX Score", "Comfort", "Efficiency", "Aesthetics", "Date"],
      ...dataToExport.map(airport => [
        airport.rank || "",
        airport.iata,
        airport.airport,
        airport.cex,
        airport.comfort,
        airport.efficiency,
        airport.aesthetics,
        airport.created_at
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-slate-50 to-indigo-50'
    } ${inter.className}`}>
      {/* Header */}
      <div className={`shadow-sm border-b transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className={`transition-colors ${
                theme === 'dark' 
                  ? 'text-indigo-400 hover:text-indigo-300' 
                  : 'text-indigo-600 hover:text-indigo-700'
              }`}>
                <LuHouse className="w-6 h-6" />
              </Link>
              <h1 className={`${russoOne.className} text-3xl font-bold ${themeClasses.text}`}>
                CEX Rankings
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <ExportButton
                data={getCurrentData()}
                filename={`CEX_Rankings_${activeTab}`}
                sheetName="Rankings"
                elementRef={exportRef}
                showFormats={['csv', 'excel', 'pdf']}
              />
              <button
                onClick={() => {
                  if (activeTab === "global") fetchGlobalRankings();
                  else if (activeTab === "category") fetchCategoryRankings();
                  else if (activeTab === "region") fetchRegionRankings();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <LuRefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className={`rounded-lg shadow-sm p-6 mb-8 transition-colors duration-200 ${themeClasses.cardBg}`}>
          <div className={`flex space-x-1 p-1 rounded-lg transition-colors duration-200 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setActiveTab("global")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "global"
                  ? `shadow-sm ${theme === 'dark' 
                      ? 'bg-gray-600 text-indigo-400' 
                      : 'bg-white text-indigo-600'
                    }`
                  : `${theme === 'dark' 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`
              }`}
            >
              Global Rankings
            </button>
            <button
              onClick={() => setActiveTab("category")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "category"
                  ? `shadow-sm ${theme === 'dark' 
                      ? 'bg-gray-600 text-indigo-400' 
                      : 'bg-white text-indigo-600'
                    }`
                  : `${theme === 'dark' 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setActiveTab("region")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "region"
                  ? `shadow-sm ${theme === 'dark' 
                      ? 'bg-gray-600 text-indigo-400' 
                      : 'bg-white text-indigo-600'
                    }`
                  : `${theme === 'dark' 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`
              }`}
            >
              By Region
            </button>
          </div>

          {/* Filters */}
          {activeTab === "category" && (
            <div className="mt-4 flex items-center space-x-4">
              <LuFilter className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className={`px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="comfort">Comfort</option>
                <option value="efficiency">Efficiency</option>
                <option value="aesthetics">Aesthetics</option>
              </select>
            </div>
          )}

          {activeTab === "region" && (
            <div className="mt-4 flex items-center space-x-4">
              <LuFilter className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className={`px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="S">South America (S)</option>
                <option value="G">North America (G)</option>
                <option value="E">Europe (E)</option>
                <option value="L">Asia (L)</option>
                <option value="F">Africa (F)</option>
                <option value="Y">Australia/Oceania (Y)</option>
              </select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <LuRefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-gray-600">Loading rankings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Rankings Display */}
        {!loading && !error && (
          <div ref={exportRef} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === "global" && "Global Airport Rankings"}
                {activeTab === "category" && `Best ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Airports`}
                {activeTab === "region" && `Top Airports in Region ${selectedRegion}`}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Airport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CEX Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comfort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aesthetics
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeTab === "global" && globalRankings.map((airport) => (
                    <tr key={airport.iata} className={`${getRankBgColor(airport.rank || 0)} border-l-4`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(airport.rank || 0)}
                          <span className="text-sm font-medium text-gray-900">#{airport.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{airport.iata}</div>
                          <div className="text-sm text-gray-500">{airport.airport}</div>
                        </div>
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

                  {activeTab === "category" && categoryRankings?.rankings.map((airport) => (
                    <tr key={airport.iata} className={`${getRankBgColor(airport.rank || 0)} border-l-4`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(airport.rank || 0)}
                          <span className="text-sm font-medium text-gray-900">#{airport.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{airport.iata}</div>
                          <div className="text-sm text-gray-500">{airport.airport}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {airport.cex}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${selectedCategory === 'comfort' ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {airport.comfort}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${selectedCategory === 'efficiency' ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {airport.efficiency}
                        </span>
                      </td>
              </div>
            )}
          </div>
        )}
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
                  {activeTab === "region" && regionRankings?.rankings.map((airport) => (
                    <tr key={airport.iata} className={`${getRankBgColor(airport.rank || 0)} border-l-4`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(airport.rank || 0)}
                          <span className="text-sm font-medium text-gray-900">#{airport.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{airport.iata}</div>
                          <div className="text-sm text-gray-500">{airport.airport}</div>
                        </div>
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
            </div>

            {/* Empty State */}
            {((activeTab === "global" && globalRankings.length === 0) ||
              (activeTab === "category" && (!categoryRankings || categoryRankings.rankings.length === 0)) ||
              (activeTab === "region" && (!regionRankings || regionRankings.rankings.length === 0))) && (
              <div className="px-6 py-12 text-center">
                <LuTrophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rankings available for this selection.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}