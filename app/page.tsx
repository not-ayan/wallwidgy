import { Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Heart, Grid, Info, User } from "lucide-react"
import Footer from "./components/Footer"
import BackToTop from "./components/BackToTop"
import SearchBar from "./components/SearchBar"
import { Metadata } from "next"
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

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
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/70 backdrop-blur-md border-b border-white/[0.04]">
        <header className="px-4 sm:px-12 py-4">
          <nav className="flex justify-between items-center max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 pl-4">
              <Link href="/" className="transition-opacity hover:opacity-80">
                <img src="/logo.svg" alt="WallWidgy" className="h-4 sm:h-5" />
              </Link>
              <span className="hidden sm:inline-block font-mono text-[9px] text-white/30 tracking-widest uppercase border-l border-white/10 pl-3 select-none">
                SYS.V2
              </span>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center gap-3 pr-4">
              <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-full p-1 backdrop-blur-sm">
                <Link href="/favorites" className="p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5" aria-label="Favorites">
                  <Heart className="w-4 h-4 transition-transform hover:scale-110" />
                </Link>
                <Link href="/categories" className="p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5" aria-label="Categories">
                  <Grid className="w-4 h-4 transition-transform hover:scale-110" />
                </Link>
                <Link
                  href="/news"
                  className="p-2 text-white/60 hover:text-[#F7F06D] transition-all rounded-full hover:bg-white/5"
                  aria-label="News"
                >
                  <Info className="w-4 h-4" />
                </Link>
              </div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="premium-signin-btn p-2.5 rounded-full text-white/90 hover:text-white transition-all sm:hidden" aria-label="Sign In">
                    <User className="w-4 h-4 relative z-10" />
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="premium-signin-btn hidden sm:flex px-5 py-2 rounded-full text-white text-sm font-medium transition-all duration-300 ease-out">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </nav>
        </header>
      </div>

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

