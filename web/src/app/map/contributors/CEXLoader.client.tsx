"use client";

import React, { useState, useEffect, useRef, KeyboardEvent, FormEvent } from "react";
import AirportsMap from "./AirportsMap.client";
import { useRouter } from "next/router";

const API_OPTIONS = [
  {
    label: "ChatGPT (gpt-3.5-turbo)",
    id: "openai",
    placeholder: "sk-...",
    tutorial: `1. Go to https://platform.openai.com/api-keys\n2. Click "Create new secret key"\n3. Copy and paste it here.`,
    apiKeyLabel: "OpenAI API Key",
    logo: (
      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#10A37F" />
        <path d="M18 21H14V11H18V21Z" fill="white" />
        <path d="M11 14H21V18H11V14Z" fill="white" />
      </svg>
    ),
    accent: "from-green-400 to-emerald-600",
    highlight: (
      <span className="ml-1 text-emerald-200 text-[10px] bg-emerald-600/60 px-1 py-0.5 rounded-lg animate-fade-in-up whitespace-nowrap">
        Recommended
      </span>
    ),
    warning: (
      <div className="flex items-center gap-1 mt-1 bg-yellow-900/80 border border-yellow-500/40 text-yellow-200 text-[10px] rounded-lg px-2 py-1 shadow animate-fade-in-up">
        <svg
          className="w-3 h-3 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>
          <b>Attention:</b> For ChatGPT to work, your OpenAI account must have <b>active billing</b>.<br />
          If you don't want to add billing, use <b>Gemini</b> instead.
        </span>
      </div>
    ),
  },
  {
    label: "Google Gemini (gemini-2.5-flash)",
    id: "gemini",
    placeholder: "AIza...",
    tutorial: `1. Go to https://makersuite.google.com/app/apikey\n2. Click "Create API key"\n3. Copy and paste it here.`,
    apiKeyLabel: "Gemini API Key",
    logo: (
      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#8B5CF6" />
        <path d="M16 10L22 22H10L16 10Z" fill="white" />
      </svg>
    ),
    accent: "from-indigo-400 to-violet-600",
    highlight: (
      <span className="ml-1 text-violet-200 text-[10px] bg-violet-700/60 px-1 py-0.5 rounded-lg animate-fade-in-up whitespace-nowrap">
        Ideal for frequent use
      </span>
    ),
    warning: null,
  },
];

function getSavedAPIConfig() {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem("cex_api_config");
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveAPIConfig(apiType: string, apiKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    "cex_api_config",
    JSON.stringify({ apiType, apiKey })
  );
}

export default function CEXLoader() {
  const [progress, setProgress] = useState<number>(0);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [apiType, setApiType] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyTouched, setApiKeyTouched] = useState<boolean>(false);
  const [apiKeySubmitted, setApiKeySubmitted] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const router = useRouter();

  const apiInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Recuperar config apenas client-side
    if (typeof window !== "undefined") {
      const saved = getSavedAPIConfig();
      if (saved && saved.apiType && saved.apiKey) {
        setApiType(saved.apiType);
        setApiKey(saved.apiKey);
        setApiKeySubmitted(true);
      } else {
        // Redirect to setup
        router.push("/map/contributors");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && apiType && apiKey && apiKeySubmitted) {
      saveAPIConfig(apiType, apiKey);
    }
  }, [apiType, apiKey, apiKeySubmitted]);

  const apiConfigReady = !!(apiType && apiKey && apiKeySubmitted);

  function handleLoaded() {
    setShowMap(true);
  }

  function handleProgressUpdate(p: number) {
    setProgress(p);
    if (p >= 100) setShowMap(true);
  }

  const selectedApiOption = API_OPTIONS.find((o) => o.id === apiType);

  function handleAPIKeySubmit() {
    if (apiKey) {
      setApiKeySubmitted(true);
    } else {
      setApiKeyTouched(true);
    }
  }

  function handleAPIKeyInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAPIKeySubmit();
    }
  }

  useEffect(() => {
    if (apiInputRef.current && apiType && !apiConfigReady) {
      apiInputRef.current.focus();
    }
  }, [apiType, apiConfigReady]);

  // Font styling inline for simplicity (Russo One substitute)
  const russoOne = "font-extrabold tracking-tight";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-black to-indigo-950 flex flex-col items-center justify-center overflow-x-hidden">
      {!apiConfigReady && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 px-1 sm:px-2 transition-all duration-300">
          <div
            className={`flex flex-col items-center gap-4 p-2 sm:p-4 rounded-2xl shadow-2xl
              bg-white/10 backdrop-blur-lg border border-indigo-900 max-w-full sm:max-w-xs w-[97vw] sm:w-full
              animate-fade-in text-xs`}
            style={{ boxShadow: "0 8px 48px 0 rgba(99,102,241,0.12)" }}
          >
            <h1
              className={`${russoOne} text-white text-3xl sm:text-4xl mb-1 select-none drop-shadow-lg tracking-tight animate-fade-in-down`}
              style={{ textShadow: "0 2px 48px #6366f1, 0 1px 8px #000" }}
            >
              CEX
            </h1>
            <div className="w-full flex flex-col gap-1">
              <div className="w-full flex justify-center mt-1 mb-1">
                <span className="inline-flex flex-wrap items-center justify-center gap-1 px-2 py-1 text-xs rounded-xl bg-gradient-to-r from-indigo-700/70 to-emerald-700/70 font-semibold text-white shadow text-center w-full sm:w-auto">
                  <span className="font-bold">Note:</span>
                  <span className="flex flex-wrap gap-1 items-center">
                    ChatGPT is <span className="text-green-200">recommended,</span>but Gemini is <span className="text-violet-200">ideal for frequent use.</span>
                  </span>
                </span>
              </div>
            </div>
            <h2 className="text-indigo-200 text-xs font-semibold text-center animate-fade-in-up">
              Choose your AI model and enter the API Key to continue
            </h2>
            <div className="flex flex-col gap-2 w-full">
              {API_OPTIONS.map((option) => {
                const selected = apiType === option.id;
                return (
                  <button
                    key={option.id}
                    className={`
                      group w-full py-2 rounded-xl font-bold text-base flex items-center justify-between gap-2 transition-all duration-200 ring-1 ring-inset ring-indigo-800
                      bg-gradient-to-r ${option.accent}
                      ${selected
                        ? "scale-[1.04] shadow-xl text-white ring-2 ring-indigo-400/60"
                        : "opacity-90 hover:scale-105 hover:shadow-indigo-500/20 hover:shadow-lg text-indigo-50"
                      }
                    `}
                    style={{ fontSize: "0.95rem", minHeight: 0 }}
                    onClick={() => {
                      setApiType(option.id);
                      setApiKey("");
                      setApiKeyTouched(false);
                      setApiKeySubmitted(false);
                    }}
                    type="button"
                  >
                    <div className="flex-1 flex flex-col items-start min-w-0 pl-2">
                      <span className="truncate">{option.label}</span>
                      <div className="flex gap-1 mt-1">
                        {option.highlight}
                        {selected && (
                          <span className="ml-1 text-indigo-100 text-[10px] bg-indigo-700/60 px-1 py-0.5 rounded-lg animate-fade-in-up whitespace-nowrap">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 ml-1 transition-transform duration-200 ${selected ? "translate-x-1" : ""}`}>
                      {option.logo}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedApiOption && selectedApiOption.warning && (
              <div className="w-full">
                {selectedApiOption.warning}
              </div>
            )}
            {apiType && (
              <form
                className="w-full flex flex-col gap-1 animate-fade-in-up"
                autoComplete="off"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  handleAPIKeySubmit();
                }}
              >
                <label className="text-indigo-100 text-xs font-medium" htmlFor="api-key-input">
                  {selectedApiOption?.apiKeyLabel}
                </label>
                <input
                  id="api-key-input"
                  ref={apiInputRef}
                  type="text"
                  className={`
                    w-full py-1 px-2 rounded-lg bg-gray-900/80 text-white border shadow-inner text-sm font-mono tracking-tight transition-all duration-200
                    ${apiKeyTouched && !apiKey ? "border-red-500" : "border-indigo-700/40"}
                    focus:outline-none focus:ring-1 focus:ring-indigo-400/70 focus:border-indigo-400
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
                  maxLength={100}
                  style={{ wordBreak: 'break-all', fontSize: "13px" }}
                />
                {!apiKey && apiKeyTouched && (
                  <span className="text-red-400 text-[10px] mt-1">
                    Please enter your API Key to continue.
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <button
                    type="button"
                    className="text-indigo-300 underline text-[10px] text-left hover:text-indigo-200 transition"
                    onClick={() => setShowTutorial(true)}
                  >
                    How to get the API Key?
                  </button>
                  <span className="flex-1"></span>
                  {!apiKeySubmitted && (
                    <button
                      type="submit"
                      className="text-indigo-100 bg-indigo-700 hover:bg-indigo-800 transition px-3 py-0.5 rounded-lg text-[10px] font-semibold shadow ml-auto"
                      disabled={!apiKey}
                    >
                      Submit
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
          {showTutorial && selectedApiOption && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in px-1">
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 sm:p-4 max-w-full w-[98vw] sm:max-w-xs flex flex-col items-center shadow-2xl border border-indigo-700 relative animate-fade-in-up text-xs"
                style={{
                  boxShadow: "0 8px 48px 0 rgba(99,102,241,0.16)",
                  border: "1px solid rgba(99,102,241,0.25)"
                }}
              >
                <h3 className="text-indigo-100 text-base font-semibold mb-2 flex items-center gap-2 text-center">
                  {selectedApiOption.logo}
                  How to get your API Key ({selectedApiOption.label})
                </h3>
                <pre className="text-indigo-200 text-xs whitespace-pre-wrap bg-black/60 rounded-lg px-2 py-2 w-full mb-2 border border-indigo-800 overflow-x-auto break-words text-left"
                  style={{ wordBreak: 'break-word' }}
                >
                  {selectedApiOption.tutorial}
                </pre>
                <button
                  className="mt-1 px-4 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-bold shadow hover:from-indigo-700 hover:to-violet-800 transition text-xs"
                  onClick={() => setShowTutorial(false)}
                >
                  Close
                </button>
                <button
                  className="absolute top-2 right-3 text-indigo-400 text-lg font-bold hover:text-violet-300 transition"
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
      {apiConfigReady && !showMap && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 transition-all duration-300 text-xs">
          <h1 className={`${russoOne} text-white text-[6vw] mb-6 select-none drop-shadow-xl animate-fade-in-down`}>
            CEX
          </h1>
          <div className="w-[85vw] max-w-lg min-w-[90px] h-2 bg-gradient-to-r from-gray-800 to-indigo-900 rounded-full overflow-hidden shadow-2xl">
            <div
              className="h-full bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 animate-gradient-x transition-all duration-200"
              style={{
                width: `${progress}%`,
                borderRadius: "999px",
              }}
            />
          </div>
          <p className="text-white mt-2 text-lg font-mono tracking-wider animate-fade-in-up">{Math.round(progress)}%</p>
          <p className="text-indigo-200 mt-1 select-none text-xs animate-fade-in-up text-center px-1">
            Loading map and airport data...
          </p>
        </div>
      )}
      <div className={showMap ? "w-full h-screen" : "invisible w-full h-screen"}>
        {apiConfigReady && (
          <AirportsMap
            onProgressUpdate={handleProgressUpdate}
            onLoaded={handleLoaded}
          />
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .animate-fade-in { animation: fade-in 0.7s both }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-down { animation: fade-in-down 0.7s both }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px);}
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