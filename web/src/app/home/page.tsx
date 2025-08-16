"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns-tz";
import { FiGlobe } from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import { Russo_One } from "next/font/google";

// Font setup
const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Types
type GeoData = {
  country?: string;
  timezone?: string;
  city?: string;
  region?: string;
  offset?: number;
  gmtLabel?: string;
};

// Helper: New Card (Glassmorphism, modern, animated)
function FancyCard({
                     href,
                     children,
                     className = "",
                     target,
                     gradient,
                     icon,
                     title,
                     bgImage,
                   }: {
  href: string;
  children?: React.ReactNode;
  className?: string;
  target?: string;
  gradient?: string;
  icon?: React.ReactNode;
  title?: string;
  bgImage?: string;
}) {
  return (
      <motion.div
          whileHover={{ scale: 1.03, boxShadow: "0 10px 32px #0003" }}
          className={`fancy-card ${className} ${gradient}`}
          style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <Link
            href={href}
            target={target}
            className="w-full h-full flex flex-col items-center justify-center relative"
        >
          {!bgImage && <div className="absolute top-5 left-5">{icon}</div>}
          <span className="card-title text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{title}</span>
          {children && <div className="text-lg text-gray-700 font-medium">{children}</div>}
        </Link>
      </motion.div>
  );
}

// Main Component
export default function HomePage() {
  const [time, setTime] = useState("--:--");
  const [geo, setGeo] = useState<GeoData>({});

  // Fetch geolocation on mount
  useEffect(() => {
    fetch("https://ipwho.is/")
        .then(res => res.json())
        .then(data => {
          setGeo({
            country: data.country,
            timezone: data.timezone,
            city: data.city,
            region: data.region,
            offset: typeof data.timezone_offset === "number" ? data.timezone_offset : undefined,
            gmtLabel: data.timezone_gmt
          });
        });
  }, []);

  // Update time based on user's timezone
  useEffect(() => {
    if (!geo.timezone) return;
    const updateClock = () => {
      setTime(format(new Date(), "HH:mm", { timeZone: geo.timezone }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [geo.timezone]);

  // Helper: Format timezone label
  const getZoneLabel = () =>
      geo.country && geo.timezone
          ? `${geo.country}${geo.region ? ` (${geo.region})` : ""} | ${geo.gmtLabel ?? ""}`
          : "Detecting...";

  // Animation config
  const fadeIn = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex flex-col items-center justify-center px-2">
        {/* Header */}
        <div className="flex w-full justify-between items-center px-8 md:px-32 mt-8 mb-3">
          <motion.div {...fadeIn} className="flex flex-col items-start">
          <span className="text-[7vw] font-bold text-white tracking-tight leading-none drop-shadow-lg font-sans">
            {time}
          </span>
            <span className="text-lg text-gray-300">{getZoneLabel()}</span>
            {geo.city && (
                <span className="text-sm text-gray-400">{geo.city}</span>
            )}
          </motion.div>
          <motion.div
              {...fadeIn}
              className={`text-[6vw] font-extrabold text-white tracking-tight ${russoOne.className} flex items-center`}
              style={{
                filter: "drop-shadow(0 2px 12px #00eaff88)"
              }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-teal-200 bg-clip-text text-transparent">CEX</span>
          </motion.div>
        </div>

        {/* New Fancy Grid */}
        <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-7xl mt-16 transition-all"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1 } }}
        >
          {/* Map Card */}
          <FancyCard
              href="/map"
              bgImage="/map.png"
              gradient="from-cyan-400/40 via-blue-300/30 to-teal-200/30 bg-gradient-to-tr"
              title="Map"
              className="col-span-1 md:col-span-2 h-56 md:h-[22rem] rounded-3xl overflow-hidden relative cursor-pointer shadow-xl"
          />

          {/* About & API Card */}
          <FancyCard
              href="https://github.com/TheusHen/CEX/tree/main/docs"
              target="_blank"
              gradient="from-teal-400/40 via-white/20 to-sky-200/40 bg-gradient-to-tr"
              title="About & API"
              icon={<FiGlobe size={42} className="text-teal-600" />}
              className="col-span-1 md:col-span-1 h-56 md:h-[22rem] rounded-3xl overflow-hidden relative cursor-pointer shadow-xl"
          />

          {/* Source Code Card */}
          <FancyCard
              href="https://github.com/TheusHen/CEX"
              target="_blank"
              gradient="from-slate-100/30 via-gray-400/40 to-gray-200/40 bg-gradient-to-tr"
              title="Source Code"
              icon={<FaGithub size={54} className="text-gray-700 opacity-80" />}
              className="col-span-1 md:col-span-2 h-56 md:h-[22rem] rounded-3xl overflow-hidden relative cursor-pointer shadow-xl"
          />

          {/* Credits Card */}
          <FancyCard
              href="/credits"
              gradient="from-yellow-300/60 via-yellow-500/30 to-amber-200/30 bg-gradient-to-tr"
              title="Credits"
              icon={
                <span className="flex items-center justify-center w-12 h-12 bg-yellow-400 rounded-xl font-bold text-white shadow-xl">★</span>
              }
              className="col-span-1 md:col-start-3 md:col-span-1 h-56 md:h-[22rem] rounded-3xl overflow-hidden relative cursor-pointer shadow-xl"
          />
        </motion.div>

        {/* Styles */}
        <style jsx>{`
        .fancy-card {
          backdrop-filter: blur(12px) brightness(1.04);
          background: rgba(255,255,255,0.09);
          border-radius: 2rem;
          min-width: 0;
          transition: box-shadow .3s, transform .3s;
          border: 1.5px solid rgba(185, 210, 255, 0.14);
          position: relative;
          overflow: hidden;
        }
        .fancy-card:hover {
          box-shadow: 0 18px 44px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12);
          transform: translateY(-3px) scale(1.035);
        }
        .card-title {
          letter-spacing: -1px;
          margin-top: 2.5rem;
        }
        @media (max-width: 768px) {
          .fancy-card {
            height: 12rem !important;
            font-size: 1.08rem;
          }
          .card-title {
            margin-top: 2rem;
          }
        }
        @media (max-width: 640px) {
          .fancy-card {
            border-radius: 1.15rem !important;
            height: 9rem !important;
            font-size: 0.97rem;
          }
          .card-title {
            margin-top: 1rem;
            font-size: 1.3rem !important;
          }
        }
      `}</style>
      </main>
  );
}