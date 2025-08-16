"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spline from "@splinetool/react-spline";

export default function PlaneAnimation() {
  const router = useRouter();
  const [animationLoaded, setAnimationLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Handle animation completion
  useEffect(() => {
    if (animationLoaded) {
      // Wait for animation to complete (approximately 5 seconds)
      const timeout = setTimeout(() => {
        setAnimationComplete(true);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [animationLoaded]);

  // Handle redirection after animation completes
  useEffect(() => {
    if (animationComplete) {
      router.push("/home");
    }
  }, [animationComplete, router]);

  // Handle Spline load event
  const handleSplineLoad = () => {
    setAnimationLoaded(true);
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden z-50">
      <div className="w-full h-full scale-[1.2] origin-center pointer-events-none select-none">
        <Spline 
          scene="https://prod.spline.design/j4SgwwPLBi2objE3/scene.splinecode" 
          onLoad={handleSplineLoad}
        />
      </div>
    </div>
  );
}
