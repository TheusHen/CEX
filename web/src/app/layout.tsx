import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "CEX - Flight Experience",
  description: "CEX is an innovative platform to compare, visualize, and explore flight experiences between airports worldwide, using AI for analysis and recommendations.",
  keywords: [
    "CEX",
    "Flight Experience",
    "Airports",
    "Flights",
    "AI",
    "Flight comparison",
    "Airport map",
    "OpenAI",
    "Gemini",
    "Travel experience"
  ],
  authors: [{ name: "TheusHen", url: "https://github.com/TheusHen/CEX" }],
  creator: "TheusHen",
  openGraph: {
    title: "CEX - Flight Experience",
    description: "Compare flight experiences, visualize airports, and get smart recommendations with AI.",
    url: "https://cex.theushen.me",
    siteName: "CEX",
    images: [
      {
        url: "https://cex.theushen.me/CEX.png",
        width: 1200,
        height: 630,
        alt: "CEX"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "CEX - Flight Experience",
    description: "Compare flight experiences, visualize airports, and get smart recommendations with AI.",
    images: ["https://cex.theushen.me/CEX.png"]
  },
  icons: {
    icon: "https://cex.theushen.me/favicon.ico",
    shortcut: "https://cex.theushen.me/favicon.ico",
    apple: "https://cex.theushen.me/favicon.ico"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#312e81" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="https://cex.theushen.me/favicon.ico" />
        <link rel="apple-touch-icon" href="https://cex.theushen.me/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
