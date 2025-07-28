"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { supabase } from "../../utils/supabase";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fixes for react-leaflet typings
// CircleMarkerProps does not have 'radius', use 'CircleMarker' (it does)
// TooltipProps does not have 'direction' or 'offset', use 'direction' as 'TooltipProps.direction' (string), 'offset' as 'TooltipProps.offset' (PointTuple)
// MapContainerProps does accept 'center', but if using custom types you may need to update your @types/leaflet or @types/react-leaflet
// TileLayerProps uses 'attribution', check that your @types/react-leaflet is up-to-date

type Airport = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  iata_code: string;
};

type APIType = "openai" | "gemini" | "";

const AI_PROMPT = (airport: string, iata: string) => `
You are a specialist airport evaluator. Based on the data, images, descriptions, or reports provided about the airport below, extract and estimate the following 12 objective and subjective criteria. The values should range from 0 to 10, with 10 being the best possible score.

Airport: ${airport} (IATA Code: ${iata})

Evaluate:

**Comfort (C)**
1. Sp — Average personal space per passenger (m²)
2. Ac — Accessibility of seating (relative quantity per m²)
3. Da — Average distance to the boarding gate
4. Zl — Quality of leisure and waiting areas

**Efficiency (E)**
5. To — Average check-in and boarding time
6. Ng — Number of operating counters
7. Rt — On-time flight regularity
8. Pm — Accuracy of monitors and information panels

**Aesthetics (X)**
9. Va — Internal visibility and spatial amplitude
10. Id — Integration with the local urban design
11. Sc — Signage and visual clarity
12. Lu — Use of natural light

Expected response format (only values between 0 and 10, with one decimal place):

\`\`\`json
{
  "Sp": 7.2,
  "Ac": 6.8,
  "Da": 8.0,
  "Zl": 6.5,
  "To": 5.9,
  "Ng": 7.0,
  "Rt": 8.3,
  "Pm": 6.7,
  "Va": 8.0,
  "Id": 6.9,
  "Sc": 7.4,
  "Lu": 7.1
}
\`\`\`

Only estimate the values based on the provided information. Do not generate explanations.
`;

const API_OPTIONS = [
  {
    label: "ChatGPT (gpt-3.5-turbo)",
    id: "openai",
    apiKeyLabel: "OpenAI API Key",
  },
  {
    label: "Google Gemini (gemini-2.0-flash)",
    id: "gemini",
    apiKeyLabel: "Gemini API Key",
  },
];

function getSavedAPIConfig(): { apiType: APIType; apiKey: string } | null {
  // Garantir que só acesse window no client-side
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem("cex_api_config");
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveAPIConfig(apiType: APIType, apiKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    "cex_api_config",
    JSON.stringify({ apiType, apiKey })
  );
}

type SettingsModalProps = {
  isOpen: boolean;
  currentApiType: APIType;
  currentApiKey: string;
  onClose: () => void;
  onSave: (apiType: APIType, apiKey: string) => void;
};

function SettingsModal({
  isOpen,
  currentApiType,
  currentApiKey,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [apiType, setApiType] = useState<APIType>(currentApiType || "");
  const [apiKey, setApiKey] = useState<string>(currentApiKey || "");
  const [apiKeyTouched, setApiKeyTouched] = useState(false);

  useEffect(() => {
    setApiType(currentApiType || "");
    setApiKey(currentApiKey || "");
    setApiKeyTouched(false);
  }, [currentApiType, currentApiKey, isOpen]);

  function handleSave() {
    if (apiType && apiKey) {
      onSave(apiType, apiKey);
      onClose();
    } else {
      setApiKeyTouched(true);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/60 px-2 pt-12 sm:pt-0 animate-fade-in">
      <div className="relative bg-white/20 backdrop-blur-xl border border-indigo-800 shadow-2xl rounded-2xl w-full max-w-xs sm:max-w-sm p-6 flex flex-col gap-5 animate-fade-in-up">
        <button
          className="absolute top-3 right-4 text-indigo-300 text-2xl font-bold hover:text-indigo-100 transition"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-white text-xl font-bold mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 opacity-80" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#818cf8" strokeWidth="2" />
            <path d="M12 16v-4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="8" r="1" fill="#818cf8"/>
          </svg>
          Settings
        </h2>
        <label className="text-indigo-100 text-sm font-medium mb-1">Model</label>
        <select
          value={apiType}
          onChange={e => setApiType(e.target.value as APIType)}
          className="bg-gray-900/80 text-white rounded-lg px-3 py-2 border border-indigo-700/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
        >
          <option value="">Select a model</option>
          {API_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {apiType && (
          <>
            <label className="text-indigo-100 text-sm font-medium mt-1">
              {API_OPTIONS.find(opt => opt.id === apiType)?.apiKeyLabel}
            </label>
            <input
              type="text"
              className={`
                w-full py-2 px-3 rounded-lg bg-gray-900/80 text-white border shadow-inner text-base font-mono tracking-tight transition-all duration-200
                ${apiKeyTouched && !apiKey ? "border-red-500" : "border-indigo-700/40"}
                focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:border-indigo-400
              `}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder="Paste your API Key"
            />
            {apiKeyTouched && !apiKey && (
              <span className="text-red-400 text-xs mt-1">
                Please enter your API Key.
              </span>
            )}
          </>
        )}
        <button
          className="mt-1 bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-4 py-2 rounded-lg shadow transition disabled:opacity-60"
          onClick={handleSave}
          disabled={!apiType || !apiKey}
        >
          Save
        </button>
      </div>
    </div>
  );
}

type AirportsMarkersProps = {
  airports: Airport[];
  bounds: [[number, number], [number, number]] | null;
  zoom: number;
  onFetchCex: (iata: string) => Promise<any[]>;
  onEvaluateAirport: (airport: Airport) => void;
  evaluatingId: string | null;
};

function AirportsMarkers({
  airports,
  bounds,
  zoom,
  onFetchCex,
  onEvaluateAirport,
  evaluatingId,
}: AirportsMarkersProps) {
  const [notesMap, setNotesMap] = useState<{[iata: string]: any[]}>({});

  function handlePopupOpen(iata: string) {
    if (!iata || notesMap[iata]) return;
    onFetchCex(iata).then(notes => {
      setNotesMap(prev => ({ ...prev, [iata]: notes }));
    });
  }

  const visibleAirports = useMemo(() => {
    if (!bounds) return [];
    const [[south, west], [north, east]] = bounds;
    return airports.filter(
      (a) =>
        a.latitude >= south &&
        a.latitude <= north &&
        a.longitude >= west &&
        a.longitude <= east
    );
  }, [airports, bounds]);

  return (
    <>
      {visibleAirports.map((airport) => (
        <CircleMarker
          key={airport.id}
          center={[airport.latitude, airport.longitude]}
          radius={5}
          pathOptions={{
            color: "#0ff",
            fillColor: "#0ff",
            fillOpacity: 0.7,
            weight: 1,
          }}
        >
          <Popup
            eventHandlers={{
              add: () => handlePopupOpen(airport.iata_code)
            }}
          >
            <b>{airport.name}</b>
            <br />
            IATA: <b>{airport.iata_code}</b>
            <br />
            {notesMap[airport.iata_code]?.length ? (
              <div style={{ marginTop: 8 }}>
                <b>Previous scores:</b>
                <ul>
                  {notesMap[airport.iata_code].map(note => (
                    <li key={note.id}>
                      {new Date(note.created_at).toLocaleDateString()} — 
                      comfort: {note.comfort ?? "-"} | efficiency: {note.efficiency ?? "-"} | aesthetics: {note.aesthetics ?? "-"} | CEx: {note.cex ?? "-"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : notesMap[airport.iata_code] ? (
              <span style={{ color: "#888" }}>No scores found.</span>
            ) : (
              <span style={{ color: "#888" }}>Loading scores...</span>
            )}
            <div className="mt-4 flex items-center">
              <button
                className={`px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold shadow hover:bg-indigo-700 transition ${
                  evaluatingId === airport.id ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={() => onEvaluateAirport(airport)}
                disabled={evaluatingId === airport.id}
              >
                {evaluatingId === airport.id ? "Evaluating..." : "Evaluate Airport (AI)"}
              </button>
            </div>
          </Popup>
          {zoom >= 7 && (
            <Tooltip direction="top" offset={[0, -15]} permanent>
              <b>{airport.iata_code}</b> - {airport.name}
            </Tooltip>
          )}
        </CircleMarker>
      ))}
    </>
  );
}

type MapEventsProps = {
  setBounds: (bounds: [[number, number], [number, number]]) => void;
  setZoom: (zoom: number) => void;
  userLocation: [number, number] | null;
  flyToUser: boolean;
};

function MapEvents({
  setBounds,
  setZoom,
  userLocation,
  flyToUser
}: MapEventsProps) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBounds([
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ]);
    },
    zoomend: () => {
      setZoom(map.getZoom());
    },
    load: () => {
      const b = map.getBounds();
      setBounds([
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ]);
      setZoom(map.getZoom());
    },
  });

  const hasFlew = useRef(false);
  useEffect(() => {
    if (userLocation && flyToUser && !hasFlew.current && map && map.flyTo) {
      map.flyTo(userLocation, 10, { duration: 1.5 });
      hasFlew.current = true;
    }
  }, [userLocation, flyToUser, map]);

  return null;
}

async function aiEvaluateAirport(
  airport: Airport,
  apiType: APIType,
  apiKey: string
): Promise<{success: boolean; response?: any; error?: string}> {
  const prompt = AI_PROMPT(airport.name, airport.iata_code);
  let aiResponse: string | null = null;
  let aiError: string | undefined;

  try {
    if (apiType === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
          temperature: 0.0,
          max_tokens: 400,
        }),
      });
      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message?.content) {
        aiResponse = data.choices[0].message.content;
      } else {
        aiError = "No response from OpenAI API";
      }
    } else if (apiType === "gemini") {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
          apiKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );
      const data = await res.json();
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content?.parts &&
        data.candidates[0].content.parts[0]?.text
      ) {
        aiResponse = data.candidates[0].content.parts[0].text;
      } else {
        aiError = "No response from Gemini API";
      }
    } else {
      aiError = "No model selected or invalid key";
    }
  } catch (err) {
    aiError = "Failed to contact API: " + String(err);
  }

  if (aiError) return { success: false, error: aiError };

  const regex = /```json\s*([\s\S]+?)```/i;
  const match = aiResponse!.match(regex);
  let jsonText = match ? match[1] : aiResponse!;
  let json: any = null;
  try {
    json = JSON.parse(jsonText);
  } catch {
    try {
      jsonText = jsonText.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
      json = JSON.parse(jsonText);
    } catch {
      return { success: false, error: "Failed to parse AI response as JSON." };
    }
  }

  try {
    const payload = {
      ...json,
      iata: airport.iata_code,
      airport: airport.name,
    };
    const calcResp = await fetch("http://127.0.0.1:5000/calculate_cex", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!calcResp.ok) {
      const msg = await calcResp.text();
      return { success: false, error: "CEX calculation error: " + msg };
    }
    const calcData = await calcResp.json();

    const finalPayload = {
      ...json,
      ...calcData,
    };
    const cexResp = await fetch("http://127.0.0.1:5000/api/cex", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalPayload),
    });
    if (!cexResp.ok) {
      const msg = await cexResp.text();
      return { success: false, error: "CEX record error: " + msg };
    }
    const cexData = await cexResp.json();

    return {
      success: true,
      response: {
        calculation: calcData,
        saved: cexData,
      },
    };
  } catch (err) {
    return { success: false, error: "Failed to send data to CEX service." };
  }
}

type AirportsMapProps = {
  onProgressUpdate?: (progress: number) => void;
  onLoaded?: () => void;
};

export default function AirportsMap({
  onProgressUpdate,
  onLoaded,
}: AirportsMapProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState<number>(3);
  const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyToUser, setFlyToUser] = useState<boolean>(false);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [currentApiType, setCurrentApiType] = useState<APIType>("");
  const [currentApiKey, setCurrentApiKey] = useState<string>("");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  useEffect(() => {
    setCenter([-15, -50]);
    setZoom(3);
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(c);
          setFlyToUser(true);
          setCenter(c);
          setZoom(10);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    // Recuperar API config apenas no client-side
    if (typeof window !== "undefined") {
      const saved = getSavedAPIConfig();
      if (saved && saved.apiType && saved.apiKey) {
        setCurrentApiType(saved.apiType);
        setCurrentApiKey(saved.apiKey);
      }
    }
  }, []);

  function handleSettingsSave(apiType: APIType, apiKey: string) {
    setCurrentApiType(apiType);
    setCurrentApiKey(apiKey);
    saveAPIConfig(apiType, apiKey);
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchAirports() {
      return new Promise<Airport[]>((resolve, reject) => {
        const airports: Airport[] = [];
        let processedRows = 0;
        Papa.parse("/assets/airports.csv", {
          download: true,
          header: true,
          step: (results: any) => {
            const a = results.data;
            if (
              a.latitude_deg &&
              a.longitude_deg &&
              a.iata_code &&
              typeof a.iata_code === "string" &&
              a.iata_code.length === 3
            ) {
              airports.push({
                id: a.id,
                name: a.name,
                latitude: parseFloat(a.latitude_deg),
                longitude: parseFloat(a.longitude_deg),
                iata_code: a.iata_code,
              });
            }
            processedRows++;
            if (onProgressUpdate && processedRows % 500 === 0) {
              const progress = Math.min((processedRows / 30000) * 100, 100);
              onProgressUpdate(progress);
            }
          },
          complete: () => {
            if (onProgressUpdate) onProgressUpdate(100);
            resolve(airports);
          },
          error: (err: any) => reject(err),
        });
      });
    }
    fetchAirports().then((data) => {
      if (isMounted) {
        setAirports(data);
        setLoaded(true);
        if (onLoaded) onLoaded();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [onProgressUpdate, onLoaded]);

  async function fetchAirportCex(iata_code: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("airports_cex")
      .select("*")
      .eq("iata", iata_code)
      .order("created_at", { ascending: false });
    if (error) {
      return [];
    }
    return data;
  }

  async function handleEvaluateAirport(airport: Airport) {
    setEvaluatingId(airport.id);
    setEvalResult(null);
    setEvalError(null);
    try {
      if (!currentApiType || !currentApiKey) {
        setEvalError("API Key and model are required in settings.");
        setEvaluatingId(null);
        return;
      }
      const result = await aiEvaluateAirport(
        airport,
        currentApiType,
        currentApiKey
      );
      if (result.success) {
        setEvalResult({
          ...result.response,
          airport: airport.name,
          iata: airport.iata_code,
        });
      } else {
        setEvalError(result.error || "Unknown error");
      }
    } catch (err) {
      setEvalError(String(err));
    }
    setEvaluatingId(null);
  }

  function EvaluationModal() {
    if (!evalResult && !evalError) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-2 animate-fade-in">
        <div className="relative bg-white/20 backdrop-blur-xl border border-indigo-800 shadow-2xl rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-fade-in-up">
          <button
            className="absolute top-3 right-4 text-indigo-300 text-2xl font-bold hover:text-indigo-100 transition"
            onClick={() => {
              setEvalResult(null);
              setEvalError(null);
            }}
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-white text-xl font-bold mb-2 flex items-center gap-2">
            Airport Evaluation
          </h2>
          {evalError && (
            <div className="text-red-400 bg-red-950/30 p-3 rounded">
              {evalError}
            </div>
          )}
          {evalResult && (
            <div>
              <div className="mb-2 text-indigo-100 text-sm">
                <b>{String(evalResult.airport)}</b>
                {evalResult.iata && (
                  <> ({String(evalResult.iata)})</>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div>
                  <b>CEX Score:</b>{" "}
                  <span className="text-indigo-200">
                    {String(evalResult.CEX ?? "")}
                  </span>
                </div>
                <div>
                  <b>Comfort (C):</b>{" "}
                  <span className="text-indigo-200">
                    {String(evalResult.C ?? "")}
                  </span>
                </div>
                <div>
                  <b>Efficiency (E):</b>{" "}
                  <span className="text-indigo-200">
                    {String(evalResult.E ?? "")}
                  </span>
                </div>
                <div>
                  <b>Aesthetics (X):</b>{" "}
                  <span className="text-indigo-200">
                    {String(evalResult.X ?? "")}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <b className="text-indigo-300">See full AI input:</b>
                <pre className="bg-black/60 text-indigo-100 rounded p-2 text-xs mt-1 overflow-auto max-h-40">
                  {JSON.stringify(evalResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!center) return null;

  return (
    <div className="w-full h-screen relative">
      <header
        className="w-full flex items-center px-6 py-2 relative z-[1002]"
        style={{
          background: "#000",
          borderBottom: "2px solid #191919",
          minHeight: "40px",
        }}
      >
        <Link
          href="/map"
          className="flex items-center gap-2 text-white text-base group"
          style={{ minWidth: 0, whiteSpace: "nowrap" }}
        >
          <svg
            width={28}
            height={28}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform group-hover:-translate-x-1"
            style={{ display: "inline", verticalAlign: "middle" }}
          >
            <path d="M18 24L8 14L18 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "inherit", fontWeight: 400, verticalAlign: "middle" }}>Go Back</span>
        </Link>
      </header>

      <button
        className="absolute top-16 right-3 z-[1001] bg-white/30 hover:bg-white/40 backdrop-blur-lg p-2 rounded-full border border-indigo-600 shadow transition flex items-center group"
        onClick={() => setShowSettings(true)}
        title="API Key Settings"
        aria-label="API Key Settings"
        style={{ boxShadow: "0 2px 8px 0 rgba(99,102,241,0.10)" }}
      >
        <svg className="w-6 h-6 text-indigo-700 group-hover:text-indigo-900 transition" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <div className="absolute top-16 right-16 z-[1000] flex items-center space-x-2 bg-white/20 backdrop-blur-lg px-3 py-1 rounded-full border border-indigo-300 text-xs text-indigo-900 shadow transition select-none max-w-[60vw]">
        <span className="font-semibold">API:</span>
        <span>
          {currentApiType
            ? API_OPTIONS.find(opt => opt.id === currentApiType)?.label
            : "Not set"}
        </span>
        {currentApiKey && (
          <span className="max-w-[96px] truncate text-gray-800/80">
            ({currentApiKey.slice(0, 6)}...{currentApiKey.slice(-4)})
          </span>
        )}
      </div>
      <SettingsModal
        isOpen={showSettings}
        currentApiType={currentApiType}
        currentApiKey={currentApiKey}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
      <EvaluationModal />
      <div style={{ position: "absolute", inset: "56px 0 0 0", zIndex: 1 }}>
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={2}
          maxZoom={12}
          style={{ width: "100%", height: "calc(100vh - 56px)" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {loaded && (
            <AirportsMarkers
              airports={airports}
              bounds={bounds}
              zoom={zoom}
              onFetchCex={fetchAirportCex}
              onEvaluateAirport={handleEvaluateAirport}
              evaluatingId={evaluatingId}
            />
          )}
          <MapEvents
            setBounds={setBounds}
            setZoom={setZoom}
            userLocation={userLocation}
            flyToUser={flyToUser}
          />
        </MapContainer>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .animate-fade-in { animation: fade-in 0.5s both }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s both }
      `}</style>
    </div>
  );
}