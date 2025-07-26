import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-black text-white font-bold px-8 py-6 flex flex-col">
      <header className="flex items-center mb-8">
        <Link href="/home" className="flex items-center gap-2 group">
          <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition" />
          <span className="text-lg font-normal">Go Back</span>
        </Link>
      </header>

      <main className="flex flex-col gap-12">
        <section>
          <h2 className="text-4xl md:text-5xl mb-6">Animation created with:</h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="w-56 h-56 relative">
              <Image
                src="/spline-logo.png"
                alt="Spline Logo"
                width={224}
                height={224}
                className="rounded-full object-cover"
              />
            </div>
            <span className="text-[4rem] md:text-[5rem] leading-none">Spline</span>
          </div>
        </section>

        <section>
          <h2 className="text-4xl md:text-5xl mb-6">3D Plane Model by:</h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="w-48 h-48 relative">
              <Image
                src="/meshy-logo.png"
                alt="Meshy AI Logo"
                width={192}
                height={192}
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-[3rem] md:text-[4rem] leading-none block">Meshy AI</span>
              <span className="text-base font-normal text-gray-300">
                License:{" "}
                <Link
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  className="underline hover:text-blue-400"
                >
                  CC BY 4.0
                </Link>
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}