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

// Helper: Bento Card
function BentoCard({
  href,
  children,
  className = "",
  target,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
}) {
  return (
    <div className={`bento-card group ${className}`}>
      <Link
        href={href}
        className="w-full h-full flex items-center justify-center relative"
        target={target}
      >
        {children}
      </Link>
    </div>
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
      {/* Header: Time, Location, Logo */}
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
          className={`text-[6vw] font-extrabold text-white tracking-tight ${russoOne.className}`}
        >
          CEX
        </motion.div>
      </div>

      {/* Bento Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-7xl mt-16 transition-all"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 1 } }}
      >
        {/* Map Card */}
        <BentoCard
          href="/map"
          className="col-span-1 md:col-span-2 h-52 md:h-[22rem] rounded-[2.2rem] overflow-hidden relative cursor-pointer shadow-lg bg-gradient-to-tr from-blue-100 via-blue-300 to-blue-200 transition-all"
        >
          <img
            src="/map.png"
            alt="Map"
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-black drop-shadow-lg">
            Map
          </span>
        </BentoCard>

        {/* About & API Card */}
        <BentoCard
          href="https://github.com/TheusHen/CEX/tree/main/docs"
          target="_blank"
          className="col-span-1 md:col-span-1 h-52 md:h-[22rem] rounded-[2.2rem] overflow-hidden relative cursor-pointer shadow-lg bg-gradient-to-tr from-teal-100 via-gray-200 to-teal-300 transition-all"
        >
          <span className="text-4xl font-bold text-black mr-2">About & API</span>
          <FiGlobe size={54} className="absolute right-6 bottom-6 text-black opacity-40 group-hover:scale-110 transition-transform" />
        </BentoCard>

        {/* Source Code Card */}
        <BentoCard
          href="https://github.com/TheusHen/CEX"
          target="_blank"
          className="col-span-1 md:col-span-2 h-52 md:h-[22rem] rounded-[2.2rem] overflow-hidden relative cursor-pointer shadow-lg bg-gradient-to-tr from-gray-100 via-gray-400 to-gray-200 transition-all"
        >
          <span className="text-4xl font-bold text-black">Source Code</span>
          <FaGithub size={74} className="absolute right-6 bottom-6 text-black opacity-30 group-hover:scale-110 transition-transform" />
        </BentoCard>

        {/* Credits Card */}
        <BentoCard
          href="/credits"
          className="col-span-1 md:col-start-3 md:col-span-1 h-52 md:h-[22rem] rounded-[2.2rem] overflow-hidden relative cursor-pointer shadow-lg bg-gradient-to-tr from-yellow-100 via-yellow-300 to-yellow-200 transition-all"
        >
          <span className="text-4xl font-bold text-black">Credits</span>
        </BentoCard>
      </motion.div>

      {/* Styles */}
      <style jsx>{`
        .bento-card {
          min-width: 0;
          transition: box-shadow .3s, transform .3s;
        }
        .bento-card:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.12);
          transform: translateY(-2px) scale(1.025);
        }
        @media (max-width: 768px) {
          .bento-card {
            height: 12rem !important;
            font-size: 1.1rem;
          }
        }
        @media (max-width: 640px) {
          .bento-card {
            border-radius: 1.2rem !important;
            height: 9rem !important;
            font-size: 1rem;
          }
        }
      `}</style>
    </main>
  );
}