import { Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Footer from "./components/Footer"
import BackToTop from "./components/BackToTop"
import SearchBar from "./components/SearchBar"
import { Metadata } from "next"
import HomeHeader from "./components/HomeHeader"

// Dynamically import Vercel Analytics (client-only component handles its own client directive)
const VercelAnalytics = dynamic(() => import("./components/VercelAnalytics"))

export const metadata: Metadata = {
  title: "WallWidgy",
}

// Lazy load components that are not immediately visible
const WallpaperGrid = dynamic(() => import("./components/WallpaperGrid"), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="loader"></div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Vercel Analytics */}
      <VercelAnalytics />
      {/* Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="px-4 sm:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24 text-center">
        <h1 className="font-aspekta text-[9vw] sm:text-[8vw] md:text-[7vw] lg:text-[6vw] xl:text-[5.5vw] 2xl:text-[84px] font-light tracking-[-0.03em] text-[var(--accent-light)] leading-[1.05] max-w-[1200px] mx-auto">
          <span className="title-animation inline-block" style={{ animationDelay: "0ms" }}>Wallwidgy</span>
        </h1>
        <p className="mt-5 text-white/40 max-w-[600px] mx-auto text-[10px] sm:text-xs tracking-[0.2em] font-aspekta uppercase title-animation" style={{ animationDelay: "200ms" }}>
          A curated library of minimal digital canvases
        </p>
      </section>

      {/* Wallpaper Grid */}
      <WallpaperGrid />

      {/* Footer */}
      <Footer />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Persistent Search Bar */}
      <SearchBar />
    </main>
  )
}

