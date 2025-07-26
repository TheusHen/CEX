"use client";

import React from "react";
import { LuMapPin } from "react-icons/lu";
import Link from "next/link";
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

export default function MapHeader() {
  return (
    <header
      className="w-full flex items-center justify-between px-6 py-2"
      style={{
        background: "#000",
        borderBottom: "2px solid #191919",
        height: "40px",
      }}
    >
      {/* Left: Back Arrow and Go Back */}
      <Link
        href="/"
        className="flex items-center gap-2 text-white text-base group"
        style={{ minWidth: 0 }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform group-hover:-translate-x-1"
        >
          <path d="M18 24L8 14L18 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: "inherit", fontWeight: 400 }}>Go Back</span>
      </Link>

      {/* Right: Icon + CEX (Russo One) + Map (Inter SemiBold Italic) */}
      <div className="flex items-center gap-2">
        <LuMapPin size={20} color="#fff" style={{ marginRight: 2, marginTop: -2 }} />
        <span
          style={{
            fontFamily: russoOne.style.fontFamily,
            fontWeight: 400,
            fontSize: 20,
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
            fontSize: 20,
            color: "#fff",
          }}
        >
          Map
        </span>
      </div>
    </header>
  );
}