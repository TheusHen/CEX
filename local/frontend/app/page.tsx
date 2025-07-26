"use client";

import React, { useState, useEffect, useRef } from "react";
import { Russo_One } from "next/font/google";
import AirportsMap from "./components/AirportsMap";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const API_OPTIONS = [
  {
    label: "ChatGPT (gpt-3.5-turbo)",
    id: "openai",
    placeholder: "sk-...",
    tutorial: `1. Go to https://platform.openai.com/api-keys\n2. Click "Create new secret key"\n3. Copy and paste it here.`,
    apiKeyLabel: "OpenAI API Key",
    logo: (
      <svg className="w-7 h-7 mr-3" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#10A37F" />
        <path d="M18 21H14V11H18V21Z" fill="white" />
        <path d="M11 14H21V18H11V14Z" fill="white" />
      </svg>
    ),
    accent: "from-green-400 to-emerald-600",
  },
  {
    label: "Google Gemini (gemini-pro)",
    id: "gemini",
    placeholder: "AIza...",
    tutorial: `1. Go to https://makersuite.google.com/app/apikey\n2. Click "Create API key"\n3. Copy and paste it here.`,
    apiKeyLabel: "Gemini API Key",
    logo: (
      <svg className="w-7 h-7 mr-3" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#8B5CF6" />
        <path d="M16 10L22 22H10L16 10Z" fill="white" />
      </svg>
    ),
    accent: "from-indigo-400 to-violet-600",
  },
];

function getSavedAPIConfig() {
  try {
    const saved = localStorage.getItem("cex_api_config");
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveAPIConfig(apiType: string, apiKey: string) {
  localStorage.setItem(
    "cex_api_config",
    JSON.stringify({ apiType, apiKey })
  );
}

export default function CEXLoader() {
  const [progress, setProgress] = useState(0);
  const [showMap, setShowMap] = useState(false);

  // API selection state
  const [apiType, setApiType] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyTouched, setApiKeyTouched] = useState(false);
  const [apiKeySubmitted, setApiKeySubmitted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const apiInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = getSavedAPIConfig();
    if (saved && saved.apiType && saved.apiKey) {
      setApiType(saved.apiType);
      setApiKey(saved.apiKey);
      setApiKeySubmitted(true);
    }
  }, []);

  // Save only when submitted
  useEffect(() => {
    if (apiType && apiKey && apiKeySubmitted) {
      saveAPIConfig(apiType, apiKey);
    }
  }, [apiType, apiKey, apiKeySubmitted]);

  // Prevent loading map until API config is set
  const apiConfigReady = !!(apiType && apiKey && apiKeySubmitted);

  function handleLoaded() {
    setShowMap(true);
  }

  function handleProgressUpdate(p: number) {
    setProgress(p);
    if (p >= 100) setShowMap(true);
  }

  // Find selected API option
  const selectedApiOption = API_OPTIONS.find((o) => o.id === apiType);

  function handleAPIKeySubmit() {
    if (apiKey) {
      setApiKeySubmitted(true);
    } else {
      setApiKeyTouched(true);
    }
  }

  function handleAPIKeyInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAPIKeySubmit();
    }
  }

  // Refocus input when user changes model or clears submission
  useEffect(() => {
    if (apiInputRef.current && apiType && !apiConfigReady) {
      apiInputRef.current.focus();
    }
  }, [apiType, apiConfigReady]);

  // UI
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-black to-indigo-950 flex flex-col items-center justify-center overflow-x-hidden">
      {/* Overlay for API selection if not configured */}
      {!apiConfigReady && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 px-2 sm:px-4 transition-all duration-300">
          <div
            className={`flex flex-col items-center gap-7 p-5 sm:p-8 rounded-3xl shadow-2xl
              bg-white/10 backdrop-blur-lg border border-indigo-900 max-w-full sm:max-w-md w-full
              animate-fade-in`}
            style={{ boxShadow: "0 8px 48px 0 rgba(99,102,241,0.12)" }}
          >
            <h1
              className={`${russoOne.className} text-white text-5xl sm:text-6xl mb-1 select-none drop-shadow-lg tracking-tight animate-fade-in-down`}
              style={{ textShadow: "0 2px 48px #6366f1, 0 1px 8px #000" }}
            >
              CEX
            </h1>
            <h2 className="text-indigo-200 text-lg font-semibold text-center animate-fade-in-up">
              Choose your AI model and enter your API Key to continue
            </h2>

            {/* Model Selection */}
            <div className="flex flex-col gap-4 w-full">
              {API_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`
                    group w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-1 transition-all duration-200 ring-1 ring-inset ring-indigo-800
                    bg-gradient-to-r ${option.accent}
                    ${apiType === option.id
                      ? "scale-105 shadow-xl text-white ring-4 ring-indigo-400/60"
                      : "opacity-80 hover:scale-105 hover:shadow-indigo-500/20 hover:shadow-lg text-indigo-50"
                    }
                  `}
                  onClick={() => {
                    setApiType(option.id);
                    setApiKey("");
                    setApiKeyTouched(false);
                    setApiKeySubmitted(false);
                  }}
                  type="button"
                >
                  {option.logo}
                  {option.label}
                  {apiType === option.id && (
                    <span className="ml-2 text-indigo-100 text-xs bg-indigo-700/60 px-2 py-0.5 rounded-lg animate-fade-in-up">Selected</span>
                  )}
                </button>
              ))}
            </div>

            {/* API Key Input */}
            {apiType && (
              <form
                className="w-full flex flex-col gap-2 animate-fade-in-up"
                autoComplete="off"
                onSubmit={e => {
                  e.preventDefault();
                  handleAPIKeySubmit();
                }}
              >
                <label className="text-indigo-100 text-sm font-medium" htmlFor="api-key-input">
                  {selectedApiOption?.apiKeyLabel}
                </label>
                <input
                  id="api-key-input"
                  ref={apiInputRef}
                  type="text"
                  className={`
                    w-full py-2 px-4 rounded-lg bg-gray-900/80 text-white border shadow-inner text-lg font-mono tracking-tight transition-all duration-200
                    ${apiKeyTouched && !apiKey ? "border-red-500" : "border-indigo-700/40"}
                    focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-400
                  `}
                  placeholder={selectedApiOption?.placeholder || ""}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiKeyTouched(true);
                  }}
                  onKeyDown={handleAPIKeyInputKeyDown}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="API Key"
                />
                {!apiKey && apiKeyTouched && (
                  <span className="text-red-400 text-xs mt-1">
                    Please enter your API Key to continue.
                  </span>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    className="text-indigo-300 underline text-xs text-left hover:text-indigo-200 transition"
                    onClick={() => setShowTutorial(true)}
                  >
                    How to get your API Key?
                  </button>
                  <span className="flex-1"></span>
                  {/* Only show submit if not submitted */}
                  {!apiKeySubmitted && (
                    <button
                      type="submit"
                      className="text-indigo-100 bg-indigo-700 hover:bg-indigo-800 transition px-4 py-1 rounded-lg text-xs font-semibold shadow ml-auto"
                      disabled={!apiKey}
                    >
                      Send
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Mini Tutorial Modal */}
          {showTutorial && selectedApiOption && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in px-2">
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 sm:p-8 max-w-full w-[95vw] sm:max-w-sm flex flex-col items-center shadow-2xl border border-indigo-700 relative animate-fade-in-up"
                style={{
                  boxShadow: "0 8px 48px 0 rgba(99,102,241,0.16)",
                  border: "1px solid rgba(99,102,241,0.25)"
                }}
              >
                <h3 className="text-indigo-100 text-lg font-semibold mb-2 flex items-center gap-2 text-center">
                  {selectedApiOption.logo}
                  How to get your API Key ({selectedApiOption.label})
                </h3>
                <pre className="text-indigo-200 text-sm whitespace-pre-wrap bg-black/60 rounded-lg px-3 py-3 w-full mb-4 border border-indigo-800 overflow-x-auto break-words text-left"
                  style={{ wordBreak: 'break-word' }}
                >
                  {selectedApiOption.tutorial}
                </pre>
                <button
                  className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-bold shadow hover:from-indigo-700 hover:to-violet-800 transition"
                  onClick={() => setShowTutorial(false)}
                >
                  Close
                </button>
                <button
                  className="absolute top-2 right-3 text-indigo-400 text-2xl font-bold hover:text-violet-300 transition"
                  onClick={() => setShowTutorial(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loader overlay */}
      {apiConfigReady && !showMap && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 transition-all duration-300">
          <h1 className={`${russoOne.className} text-white text-[10vw] mb-10 select-none drop-shadow-xl animate-fade-in-down`}>
            CEX
          </h1>
          <div className="w-[70vw] max-w-2xl min-w-[220px] h-4 bg-gradient-to-r from-gray-800 to-indigo-900 rounded-full overflow-hidden shadow-2xl">
            <div
              className="h-full bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 animate-gradient-x transition-all duration-200"
              style={{
                width: `${progress}%`,
                borderRadius: "999px",
              }}
            />
          </div>
          <p className="text-white mt-6 text-2xl font-mono tracking-wider animate-fade-in-up">{Math.round(progress)}%</p>
          <p className="text-indigo-200 mt-3 select-none text-lg animate-fade-in-up">
            Loading map and airports data...
          </p>
        </div>
      )}

      {/* Airports Map always mounted, but invisible if not ready */}
      <div className={showMap ? "w-full h-screen" : "invisible w-full h-screen"}>
        {apiConfigReady && (
          <AirportsMap
            onProgressUpdate={handleProgressUpdate}
            onLoaded={handleLoaded}
          />
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .animate-fade-in { animation: fade-in 0.7s both }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-down { animation: fade-in-down 0.7s both }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s both }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 2s linear infinite alternate;
        }
      `}</style>
    </div>
  );
}