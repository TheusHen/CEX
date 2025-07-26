"use client";

import React, { useEffect, useState, useMemo } from "react";
import * as Papa from "papaparse";
import MapHeader from "@/app/components/MapHeader";

// SSR/Client detection
const isClient = typeof window !== "undefined";

// --- move leaflet imports inside component to avoid SSR crash ---
let MapContainer: typeof import("react-leaflet").MapContainer | null = null;
let TileLayer: typeof import("react-leaflet").TileLayer | null = null;
let CircleMarker: typeof import("react-leaflet").CircleMarker | null = null;
let Popup: typeof import("react-leaflet").Popup | null = null;
let Tooltip: typeof import("react-leaflet").Tooltip | null = null;
let useMapEvents: typeof import("react-leaflet").useMapEvents | null = null;

if (isClient) {
  (async () => {
    const leaflet = await import("react-leaflet");
    MapContainer = leaflet.MapContainer;
    TileLayer = leaflet.TileLayer;
    CircleMarker = leaflet.CircleMarker;
    Popup = leaflet.Popup;
    Tooltip = leaflet.Tooltip;
    useMapEvents = leaflet.useMapEvents;
  })();
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

const ZOOM_LABELS = 7;

function AirportsMarkers({
  airports,
  bounds,
  zoom,
}: {
  airports: Airport[];
  bounds: [[number, number], [number, number]] | null;
  zoom: number;
}) {
  const [notesMap, setNotesMap] = useState<Record<string, AirportCex[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  async function fetchAirportCex(iata_code: string): Promise<AirportCex[]> {
    // Simple fetch to backend (adjust URL as needed)
    const resp = await fetch(
      `https://api.cex.theushen.me/airport_cex?iata=${encodeURIComponent(iata_code)}`
    );
    if (!resp.ok) return [];
    return await resp.json();
  }

  function handlePopupOpen(iata: string) {
    if (!iata || notesMap[iata] || loadingMap[iata]) return;
    setLoadingMap((prev) => ({ ...prev, [iata]: true }));
    fetchAirportCex(iata).then((notes) => {
      setNotesMap((prev) => ({ ...prev, [iata]: notes }));
      setLoadingMap((prev) => ({ ...prev, [iata]: false }));
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
              add: () => handlePopupOpen(airport.iata_code),
            }}
          >
            <b>{airport.name}</b>
            <br />
            IATA: <b>{airport.iata_code}</b>
            <br />
            {notesMap[airport.iata_code]?.length ? (
              <div style={{ marginTop: 8 }}>
                <b>Notes:</b>
                <ul>
                  {notesMap[airport.iata_code].map((note) => (
                    <li key={note.id}>
                      {new Date(note.created_at).toLocaleDateString()} — 
                      comfort: {note.comfort ?? "-"} | efficiency: {note.efficiency ?? "-"} | aesthetics: {note.aesthetics ?? "-"} | CEx: {note.cex ?? "-"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : loadingMap[airport.iata_code] ? (
              <span style={{ color: "#888" }}>Loading notes...</span>
            ) : (
              <span style={{ color: "#888" }}>No notes found.</span>
            )}
          </Popup>
          {zoom >= ZOOM_LABELS && (
            <Tooltip direction="top" offset={[0, -15]} permanent>
              <b>{airport.iata_code}</b> - {airport.name}
            </Tooltip>
          )}
        </CircleMarker>
      ))}
    </>
  );
}

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

export default function AirportsMapPage() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(3);
  const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyToUser, setFlyToUser] = useState(false);

  // Dynamically import Leaflet CSS on client only
  useEffect(() => {
    if (isClient) {
      // @ts-expect-error Leaflet CSS import is dynamically handled for client-side only
      import("leaflet/dist/leaflet.css");
    }
  }, []);

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
        () => {}
      );
    }
    // Load airports from CSV
    let isMounted = true;
    async function fetchAirports(): Promise<Airport[]> {
      return new Promise<Airport[]>((resolve, reject) => {
        const airports: Airport[] = [];
        Papa.parse("/assets/airports.csv", {
          download: true,
          header: true,
          step: (results: Papa.ParseStepResult<Record<string, string>>) => {
            const a = results.data;
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
                latitude: parseFloat(a.latitude_deg),
                longitude: parseFloat(a.longitude_deg),
                iata_code: a.iata_code,
              });
            }
          },
          complete: () => resolve(airports),
          error: (err) => reject(err),
        });
      });
    }
    fetchAirports().then((data) => {
      if (isMounted) setAirports(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!center || !isClient) return null;

  return (
    <div className="w-full h-screen relative bg-black">
      {/* Header (from image 1) */}
      <MapHeader />
      {/* Map */}
      <div style={{ position: "absolute", inset: "40px 0 0 0", zIndex: 1 }}>
        {isClient && MapContainer && (
          <MapContainer
            center={center}
            zoom={zoom}
            minZoom={2}
            maxZoom={12}
            style={{ width: "100vw", height: "calc(100vh - 40px)" }}
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
      {/* Animations for modal */}
      <style jsx global>{`
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
