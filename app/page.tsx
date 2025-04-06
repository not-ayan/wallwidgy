import dynamic from "next/dynamic"
import Link from "next/link"
import { Heart, Grid, ArrowDownAZ, Clock, History, Code, Info } from "lucide-react"
import Footer from "./components/Footer"
import BackToTop from "./components/BackToTop"

// Lazy load the WallpaperGrid component
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link href="/favorites" aria-label="Favorites">
              <Heart className="w-5 h-5 text-white/80 transition-transform hover:scale-110" />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/api/docs"
                aria-label="API Docs"
              >
                <Code className="w-5 h-5 text-white/80 transition-transform hover:scale-110" />
              </Link>
              <Link
                href="/about"
                className="p-2 text-white/80 hover:text-white transition-all"
                aria-label="About"
              >
                <Info className="w-5 h-5" />
              </Link>
            </div>
          </nav>
        </header>
      </div>

      {/* Hero Section */}
      <section className="px-8 pt-24 sm:pt-32 pb-16 sm:pb-24 text-center">
        <h1 className="font-sagite text-[32px] sm:text-[56px] max-w-[900px] mx-auto leading-[1.1] tracking-[-0.02em] text-[#F7F06D]">
          The Finest Collection of Minimalist Wallpapers
        </h1>
        <p className="mt-4 text-white/60 max-w-[600px] mx-auto text-base sm:text-lg leading-relaxed">
          Carefully curated wallpapers that bring elegance and simplicity to your screens. Download and enjoy our
          growing collection.
        </p>
      </section>

      {/* Wallpaper Grid */}
      <WallpaperGrid />

      {/* Footer */}
      <Footer />

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}

