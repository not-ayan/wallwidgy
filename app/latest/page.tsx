'use client'
import Header from '../components/Header'
import WallpaperGrid from '../components/WallpaperGrid'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'

export default function LatestWallpapers() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header showBackButton={true} backUrl="/" />

      <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8 text-white">Latest Wallpapers</h1>
        <WallpaperGrid />
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}

