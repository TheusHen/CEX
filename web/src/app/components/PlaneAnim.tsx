"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Spline from "@splinetool/react-spline";

export default function PlaneAnimation() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/home");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden z-50">
      <div className="w-full h-full scale-[1.2] origin-center pointer-events-none select-none">
        <Spline scene="https://prod.spline.design/j4SgwwPLBi2objE3/scene.splinecode" />
      </div>
    </div>
  );
}
