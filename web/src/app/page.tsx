"use client";

import React, { useEffect, useState } from "react";
import { Russo_One } from "next/font/google";

import PlaneAnimation from "./components/PlaneAnim";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function CEXLoader() {
  const [progress, setProgress] = useState(0);
  const [showOther, setShowOther] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 3000;
    let raf: number;

    function animate() {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p * 100);

      if (p < 1) {
        raf = requestAnimationFrame(animate);
      }
    }

    raf = requestAnimationFrame(animate);

    const timeout = setTimeout(() => {
      setShowOther(true);
    }, duration);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  if (showOther) {
    return <PlaneAnimation />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <h1
        className={`${russoOne.className} text-white text-[8vw] mb-16 select-none`}
      >
        CEX
      </h1>
      <div className="w-[30vw] max-w-xl min-w-[220px] h-3 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div
          className="h-full bg-indigo-100 transition-all duration-100"
          style={{
            width: `${progress}%`,
            borderRadius: "0.5rem",
          }}
        />
      </div>
    </div>
  );
}

