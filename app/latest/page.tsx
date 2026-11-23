'use client'
import Header from '../components/Header'
import WallpaperGrid from '../components/WallpaperGrid'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'

export default function LatestWallpapers() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] font-outfit">
      <Header showBackButton={true} backUrl="/" />

      <div className="pt-28 pb-32 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-aspekta text-3xl sm:text-4xl font-light mb-8 text-white tracking-tight">
          Latest Wallpapers
        </h1>
        <WallpaperGrid disableContainer={true} />
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}

