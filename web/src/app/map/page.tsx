"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import * as Papa from "papaparse";
import Link from "next/link";
import { LuMapPin, LuSparkles } from "react-icons/lu";
import { Russo_One, Inter } from "next/font/google";

// Fonts
const russoOne = Russo_One({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});
const inter = Inter({
    weight: ["600"],
    style: ["italic"],
    subsets: ["latin"],
    display: "swap",
});

// SSR/Client detection
const isClient = typeof window !== "undefined";

// --- move leaflet imports inside component to avoid SSR crash ---
let MapContainer: any, TileLayer: any, CircleMarker: any, Popup: any, Tooltip: any, useMapEvents: any;
if (isClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const leaflet = require("react-leaflet");
    MapContainer = leaflet.MapContainer;
    TileLayer = leaflet.TileLayer;
    CircleMarker = leaflet.CircleMarker;
    Popup = leaflet.Popup;
    Tooltip = leaflet.Tooltip;
    useMapEvents = leaflet.useMapEvents;
}

type AirportCex = {
    id: string;
    iata: string;
    airport: string;
    comfort: number | null;
    efficiency: number | null;
    aesthetics: number | null;
    cex: number | null;
    created_at: string;
};

type Airport = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    iata_code: string;
};

type AirportPinCex = {
    iata: string;
    airport: string;
    comfort: number;
    efficiency: number;
    aesthetics: number;
    cex: number;
};

type Feedback = {
    iata: string;
    positive: number;
    negative: number;
};

const ZOOM_LABELS = 7;

// ---------- MapHeader ----------
function MapHeader({ headerRef }: { headerRef: React.RefObject<HTMLDivElement> }) {
    // Button animation logic
    const [hovered, setHovered] = useState(false);

    return (
        <header
            ref={headerRef}
            className="w-full flex flex-col items-center px-0 py-0"
            style={{
                background: "#000",
                borderBottom: "2px solid #191919",
                zIndex: 10,
                position: "relative",
            }}
        >
            <div
                className="w-full flex flex-wrap items-center justify-between px-4 py-2"
                style={{
                    width: "100%",
                    gap: 8,
                    position: "relative",
                }}
            >
                <div className="flex items-center gap-4 sm:gap-8" style={{ flex: 1 }}>
                    <Link
                        href="/"
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
                    {/* Make AI Notes Button - white default, colored/animated on hover, next to Go Back - hidden on mobile */}
                    <Link
                        href="/map/contributors/"
                        className={`make-ai-notes-btn hidden sm:flex items-center gap-2 font-semibold transition-all duration-200`}
                        style={{
                            background: hovered
                                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                : "#fff",
                            color: hovered ? "#fff" : "#222",
                            boxShadow: hovered
                                ? "0 8px 32px #764ba299"
                                : "0 2px 12px rgba(0,0,0,0.08)",
                            transform: hovered ? "scale(1.07) translateY(-2px)" : "scale(1)",
                            borderRadius: "10px", // reduzido de 14px
                            border: "1.5px solid rgba(120,100,255,0.10)",
                            padding: "8px 16px", // reduzido de 12px 24px
                            fontSize: "1rem", // reduzido de 1.14rem
                            textDecoration: "none",
                            cursor: "pointer",
                            minWidth: 0,
                            whiteSpace: "nowrap",
                            willChange: "transform, box-shadow, background, color",
                            marginLeft: 12, // reduzido de 18
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        <LuSparkles size={18} style={{ transition: "transform 0.3s", transform: hovered ? "rotate(-12deg) scale(1.15)" : "none" }} />
                        <span style={{
                            fontFamily: "inherit",
                            fontWeight: 700,
                            letterSpacing: 0.2,
                            fontStyle: "italic",
                            transition: "color 0.2s"
                        }}>Make AI Notes</span>
                    </Link>
                </div>
                {/* Make AI Notes Button for mobile only */}
                <div className="flex items-center sm:hidden" style={{ flex: 1, justifyContent: "flex-end" }}>
                    <Link
                        href="/map/contributors/"
                        className="flex items-center gap-2 text-white text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                            minWidth: 0,
                            whiteSpace: "nowrap",
                            textDecoration: "none",
                            fontSize: "1rem",
                        }}
                    >
                        <LuSparkles size={18} />
                        <span style={{ fontFamily: "inherit", fontWeight: 600 }}>Make AI Notes</span>
                    </Link>
                </div>
                <span
                    className="text-white text-xs text-center w-full"
                    style={{
                        fontFamily: inter.style.fontFamily,
                        fontStyle: "italic",
                        fontWeight: 500,
                        letterSpacing: 0.2,
                        lineHeight: "18px",
                        margin: "0 8px",
                        userSelect: "none",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 24,
                        padding: "4px 0",
                        wordBreak: "break-word",
                        fontSize: "0.95rem",
                    }}
                >
                    The ratings are generated by AI and may not be suitable for important information
                </span>
                <div
                    className="cexmap-logo flex items-center gap-2"
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 16,
                        pointerEvents: "none",
                        userSelect: "none"
                    }}
                >
                    <LuMapPin size={20} color="#fff" style={{ marginRight: 2, marginTop: -2 }} />
                    <span
                        style={{
                            fontFamily: russoOne.style.fontFamily,
                            fontWeight: 400,
                            fontSize: 18,
                            letterSpacing: 1,
                            color: "#fff",
                            marginRight: 1,
                        }}
                    >
                        CEX
                    </span>
                    <span
                        style={{
                            fontFamily: inter.style.fontFamily,
                            fontWeight: 600,
                            fontStyle: "italic",
                            fontSize: 18,
                            color: "#fff",
                        }}
                    >
                        Map
                    </span>
                </div>
                <div className="hidden sm:block" style={{ width: 70, minWidth: 0, visibility: "hidden" }} />
            </div>
            <style jsx>{`
                .make-ai-notes-btn {
                    transition: background 0.28s cubic-bezier(.6,.2,.2,1), color 0.22s, box-shadow 0.26s, transform 0.21s;
                }
            `}</style>
        </header>
    );
}

// ---------- Feedback component ----------
function FeedbackButtons({
                             iata,
                             feedback,
                             onFeedback,
                             loading,
                         }: {
    iata: string;
    feedback: Feedback | null;
    onFeedback: (type: "positive" | "negative") => void;
    loading: boolean;
}) {
    return (
        <div
            style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "flex-start",
            }}
        >
            <button
                onClick={() => onFeedback("positive")}
                disabled={loading}
                style={{
                    color: "#fff",
                    background: "#0f8",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 16px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    opacity: loading ? 0.7 : 1,
                    minWidth: 64,
                    marginBottom: 4,
                }}
                aria-label="Like"
            >
                👍 {feedback?.positive ?? 0}
            </button>
            <button
                onClick={() => onFeedback("negative")}
                disabled={loading}
                style={{
                    color: "#fff",
                    background: "#e43",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 16px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    opacity: loading ? 0.7 : 1,
                    minWidth: 64,
                    marginBottom: 4,
                }}
                aria-label="Dislike"
            >
                👎 {feedback?.negative ?? 0}
            </button>
        </div>
    );
}

// ---------- AirportsMarkers ----------
function AirportsMarkers({
                             airports,
                             bounds,
                             zoom,
                             pinsCex,
                             onAirportClick,
                         }: {
    airports: Airport[];
    bounds: [[number, number], [number, number]] | null;
    zoom: number;
    pinsCex: Record<string, AirportPinCex>;
    onAirportClick: (iata: string) => void;
}) {
    const [notesMap, setNotesMap] = useState<Record<string, AirportCex | null>>({});
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [feedbackMap, setFeedbackMap] = useState<Record<string, Feedback | null>>({});
    const [feedbackLoading, setFeedbackLoading] = useState<Record<string, boolean>>({});

    async function fetchAirportCex(iata_code: string) {
        try {
            const res = await fetch(`https://api.cex.theushen.me/api/airport_cex?iata=${encodeURIComponent(iata_code)}`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }
    async function fetchFeedback(iata_code: string) {
        try {
            const res = await fetch(`https://api.cex.theushen.me/feedback/${encodeURIComponent(iata_code)}`);
            if (!res.ok) return null;
            const result = await res.json();
            if (!result || typeof result !== "object" || result.error) {
                return { iata: iata_code, positive: 0, negative: 0 };
            }
            if (result.positive === undefined || result.negative === undefined)
                return { iata: iata_code, positive: 0, negative: 0 };
            return result;
        } catch {
            return { iata: iata_code, positive: 0, negative: 0 };
        }
    }
    function handlePopupOpen(iata: string) {
        if (!iata || notesMap[iata] || loadingMap[iata]) return;
        setLoadingMap((prev) => ({ ...prev, [iata]: true }));
        fetchAirportCex(iata).then((notes) => {
            setNotesMap((prev) => ({ ...prev, [iata]: notes }));
            setLoadingMap((prev) => ({ ...prev, [iata]: false }));
        });
        fetchFeedback(iata).then((fb) => {
            setFeedbackMap((prev) => ({ ...prev, [iata]: fb }));
        });
        onAirportClick(iata);
    }

    async function postFeedback(iata: string, type: "positive" | "negative") {
        setFeedbackLoading((prev) => ({ ...prev, [iata]: true }));
        try {
            const res = await fetch(`https://api.cex.theushen.me/feedback/${encodeURIComponent(iata)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [type]: true }),
            });
            const data = await res.json();
            setFeedbackMap((prev) => ({ ...prev, [iata]: data }));
        } finally {
            setFeedbackLoading((prev) => ({ ...prev, [iata]: false }));
        }
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
            {visibleAirports.map((airport) => {
                const iata = airport.iata_code;
                const pin = pinsCex[iata];
                const isRated = !!pin;
                const color = isRated ? "#0f8" : "#0af";
                return (
                    <CircleMarker
                        key={airport.id}
                        center={[airport.latitude, airport.longitude]}
                        radius={6}
                        pathOptions={{
                            color,
                            fillColor: color,
                            fillOpacity: 0.79,
                            weight: 1.5,
                        }}
                    >
                        <Popup
                            eventHandlers={{
                                add: () => handlePopupOpen(iata),
                            }}
                            autoPan
                        >
                            <div style={{ minWidth: 220 }}>
                                <b>{airport.name}</b>
                                <br />
                                IATA: <b>{iata}</b>
                                <br />
                                {notesMap[iata]?.cex ? (
                                    <div style={{ marginTop: 8 }}>
                                        <b>AI Ratings:</b>
                                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                                            <li>
                                                Comfort: <b>{notesMap[iata]?.comfort ?? "-"}</b>
                                            </li>
                                            <li>
                                                Efficiency: <b>{notesMap[iata]?.efficiency ?? "-"}</b>
                                            </li>
                                            <li>
                                                Aesthetics: <b>{notesMap[iata]?.aesthetics ?? "-"}</b>
                                            </li>
                                            <li>
                                                <b>CEx:</b>{" "}
                                                <span style={{ color: "#0f8", fontWeight: 600 }}>
                                                    {notesMap[iata]?.cex?.toFixed(2)}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                ) : loadingMap[iata] ? (
                                    <span style={{ color: "#888" }}>Loading ratings...</span>
                                ) : (
                                    <span style={{ color: "#888" }}>This airport has not been rated yet.</span>
                                )}

                                <div>
                                    <FeedbackButtons
                                        iata={iata}
                                        feedback={feedbackMap[iata] || { iata, positive: 0, negative: 0 }}
                                        onFeedback={t => postFeedback(iata, t)}
                                        loading={!!feedbackLoading[iata]}
                                    />
                                </div>
                            </div>
                        </Popup>
                        {zoom >= ZOOM_LABELS && (
                            <Tooltip direction="top" offset={[0, -15]} permanent>
                                <b>{iata}</b> - {airport.name}
                            </Tooltip>
                        )}
                    </CircleMarker>
                );
            })}
        </>
    );
}

// ---------- MapEvents ----------
function MapEvents({
                       setBounds,
                       setZoom,
                       userLocation,
                       flyToUser,
                   }: {
    setBounds: (b: [[number, number], [number, number]]) => void;
    setZoom: (z: number) => void;
    userLocation: [number, number] | null;
    flyToUser: boolean;
}) {
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

    useEffect(() => {
        if (userLocation && flyToUser && map && map.flyTo) {
            map.flyTo(userLocation, 10, { duration: 1.5 });
        }
    }, [userLocation, flyToUser, map]);

    return null;
}

// ---------- Main Page ----------
export default function AirportsMapPage() {
    const [airports, setAirports] = useState<Airport[]>([]);
    const [center, setCenter] = useState<[number, number] | null>(null);
    const [zoom, setZoom] = useState(3);
    const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [flyToUser, setFlyToUser] = useState(false);

    const [pinsCex, setPinsCex] = useState<Record<string, AirportPinCex>>({});
    const [selectedIata, setSelectedIata] = useState<string | null>(null);

    const headerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    useEffect(() => {
        if (isClient) {
            // @ts-ignore
            import("leaflet/dist/leaflet.css");
        }
    }, []);

    // Get header height dynamically for proper map offset
    useEffect(() => {
        function updateHeaderHeight() {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        }
        updateHeaderHeight();
        window.addEventListener("resize", updateHeaderHeight);
        return () => window.removeEventListener("resize", updateHeaderHeight);
    }, []);

    // Load user location, airports, CEX pin info
    useEffect(() => {
        if (!isClient) return;
        setCenter([-15, -50]);
        setZoom(3);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(c);
                    setFlyToUser(true);
                    setCenter(c);
                    setZoom(10);
                },
                () => { }
            );
        }
        let isMounted = true;
        async function fetchAirports() {
            return new Promise<Airport[]>((resolve, reject) => {
                const airports: Airport[] = [];
                Papa.parse("/assets/airports.csv", {
                    download: true,
                    header: true,
                    step: (results) => {
                        const a = results.data as Record<string, unknown>;
                        if (
                            a.latitude_deg &&
                            a.longitude_deg &&
                            a.iata_code &&
                            typeof a.iata_code === "string" &&
                            a.iata_code.length === 3
                        ) {
                            airports.push({
                                id: a.id as string,
                                name: a.name as string,
                                latitude: parseFloat(a.latitude_deg as string),
                                longitude: parseFloat(a.longitude_deg as string),
                                iata_code: a.iata_code as string,
                            });
                        }
                    },
                    complete: () => resolve(airports),
                    error: (err) => reject(err),
                });
            });
        }
        async function fetchPinsCex() {
            try {
                const res = await fetch("https://api.cex.theushen.me/api/airports");
                if (!res.ok) return {};
                const arr: AirportPinCex[] = await res.json();
                const map: Record<string, AirportPinCex> = {};
                arr.forEach((x) => {
                    if (x.iata) map[x.iata] = x;
                });
                return map;
            } catch {
                return {};
            }
        }
        fetchAirports().then((data) => {
            if (isMounted) setAirports(data);
        });
        fetchPinsCex().then((data) => {
            setPinsCex(data);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    if (!center || !isClient) return null;

    return (
        <div className="w-full h-screen flex flex-col bg-black">
            {/* Header */}
            <MapHeader headerRef={headerRef} />
            {/* Map */}
            <div
                style={{
                    flex: 1,
                    width: "100vw",
                    minHeight: 0,
                }}
            >
                {isClient && MapContainer && (
                    <MapContainer
                        center={center}
                        zoom={zoom}
                        minZoom={2}
                        maxZoom={12}
                        style={{ width: "100vw", height: "100%", minHeight: 0 }}
                        scrollWheelZoom
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <AirportsMarkers
                            airports={airports}
                            bounds={bounds}
                            zoom={zoom}
                            pinsCex={pinsCex}
                            onAirportClick={setSelectedIata}
                        />
                        <MapEvents
                            setBounds={setBounds}
                            setZoom={setZoom}
                            userLocation={userLocation}
                            flyToUser={flyToUser}
                        />
                    </MapContainer>
                )}
            </div>
            <style jsx global>{`
                @media (max-width: 600px) {
                    header {
                        min-height: 32px !important;
                    }
                    .text-xs {
                        font-size: 0.85rem !important;
                        padding: 2px 0 !important;
                    }
                    .flex-wrap {
                        flex-wrap: wrap !important;
                    }
                    .px-4 {
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                    }
                    .py-2 {
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                    }
                    .gap-4 {
                        gap: 6px !important;
                    }
                    .gap-8 {
                        gap: 10px !important;
                    }
                    .text-sm {
                        font-size: 0.95rem !important;
                    }
                    .text-base {
                        font-size: 1rem !important;
                    }
                    .w-full {
                        width: 100vw !important;
                    }
                    .h-screen {
                        height: 100vh !important;
                    }
                    .animate-fade-in,
                    .animate-fade-in-up {
                        animation-duration: 0.4s !important;
                    }
                    .cexmap-logo {
                        display: none !important;
                    }
                }
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
