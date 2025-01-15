import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart, Grid } from 'lucide-react'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import ProfileIcon from './components/ProfileIcon'

// Lazy load the WallpaperGrid component
const WallpaperGrid = dynamic(() => import('./components/WallpaperGrid'), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F7F06D]"></div>
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
              <Link href="/categories" aria-label="Categories">
                <Grid className="w-5 h-5 text-white/80 transition-transform hover:scale-110" />
              </Link>
              <ProfileIcon />
              <Link 
                href="/about" 
                className="text-[13px] bg-white/10 text-white/90 px-4 py-2 rounded-full hover:bg-white/15 transition-all hover:scale-105"
              >
                About
              </Link>
            </div>
          </nav>
        </header>
      </div>

      {/* Announcement Bar */}
      <div className="flex justify-center px-6 pt-28 pb-20">
        <Link href="/latest" className="bg-[#F7F06D]/10 text-[#F7F06D] px-4 py-1.5 rounded-full flex items-center gap-2 text-[13px] hover:scale-105 transition-transform">
          <span className="font-medium">New</span>
          <span className="mx-1 opacity-40">•</span>
          <span className="opacity-80">Fresh wallpapers added daily</span>
          <span className="ml-1 opacity-60">→</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="px-8 pb-32 text-center">
        <h1 className="font-serif text-[48px] sm:text-[56px] max-w-[900px] mx-auto leading-[1.1] tracking-[-0.02em] animated-gradient">
          The Finest Collection of Minimalist Wallpapers
        </h1>
        <p className="mt-6 text-white/60 max-w-[600px] mx-auto text-lg leading-relaxed">
          Carefully curated wallpapers that bring elegance and simplicity to your screens. 
          Download and enjoy our growing collection.
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

