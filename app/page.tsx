import dynamic from "next/dynamic"
import Footer from "./components/Footer"
import BackToTop from "./components/BackToTop"
import SearchBar from "./components/SearchBar"
import { Metadata } from "next"
import HomeHeader from "./components/HomeHeader"

export const metadata: Metadata = {
  title: {
    absolute: "WallWidgy",
  },
  description: "A curated collection of minimalist wallpapers & aesthetic digital canvases",
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
      {/* Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-12 sm:pb-16 text-center">
        <h1 className="font-aspekta text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-[#EDEDED] leading-none max-w-[1200px] mx-auto">
          Wallwidgy
        </h1>
        <p className="mt-4 text-[#8E8E8E] max-w-md mx-auto text-xs sm:text-sm md:text-base font-normal leading-relaxed">
          Curated digital canvases and minimalist wallpapers for desktop and mobile
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

