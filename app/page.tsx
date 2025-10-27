import { Suspense } from "react"
import dynamic from "next/dynamic"
// Dynamically import Vercel Analytics (client-only)
const VercelAnalytics = dynamic(() => import("./components/VercelAnalytics"), { ssr: false })
import Link from "next/link"
import { Heart, Grid, Info } from "lucide-react"
import Footer from "./components/Footer"
import BackToTop from "./components/BackToTop"
import SearchBar from "./components/SearchBar"
import { Metadata } from "next"

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
  ssr: false // Disable SSR for better mobile performance
})

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Vercel Analytics */}
      <VercelAnalytics />
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-4 sm:px-12 py-5">
          <nav className="flex justify-between items-center max-w-[1600px] mx-auto">
            <Link href="/" className="transition-opacity hover:opacity-80 pl-4">
              <img src="/logo.svg" alt="WallWidgy" className="h-4 sm:h-5" />
            </Link>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center gap-2 pr-4">
              <Link href="/favorites" className="p-2 text-white/80 hover:text-white transition-all" aria-label="Favorites">
                <Heart className="w-5 h-5 transition-transform hover:scale-110" />
              </Link>
              <Link href="/categories" className="p-2 text-white/80 hover:text-white transition-all" aria-label="Categories">
                <Grid className="w-5 h-5 transition-transform hover:scale-110" />
              </Link>
              <Link
                href="/news"
                className="p-2 text-white/80 hover:text-white transition-all"
                aria-label="News"
              >
                <Info className="w-5 h-5" />
              </Link>
            </div>
          </nav>
        </header>
      </div>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24 text-center">
        <h1 className="font-title text-[12vw] xs:text-[10vw] sm:text-[8vw] md:text-[7vw] lg:text-[6vw] xl:text-[5.5vw] 2xl:text-[120px] max-w-[1200px] mx-auto leading-[1.1] tracking-[-0.02em] text-[var(--accent-light)]">
          <span className="title-animation inline-block" style={{ animationDelay: "0ms" }}>Wall</span>
          <span className="title-animation inline-block" style={{ animationDelay: "80ms" }}>widgy</span>
        </h1>
        <p className="mt-4 text-white/60 max-w-[600px] mx-auto text-base sm:text-lg lg:text-xl leading-relaxed title-animation font-outfit" style={{ animationDelay: "500ms" }}>
         Hand-picked high-quality wallpapers, curated just for you.
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

