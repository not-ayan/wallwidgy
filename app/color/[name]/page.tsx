'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import WallpaperGrid from '../../components/WallpaperGrid'
import Footer from '../../components/Footer'
import BackToTop from '../../components/BackToTop'

export default function ColorPage() {
  const { name } = useParams()
  const decodedName = decodeURIComponent(name as string)

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link 
              href="/categories" 
              className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </nav>
        </header>
      </div>

      <div className="pt-28 px-8 max-w-[1400px] mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-white text-center">{decodedName} Wallpapers</h1>
        <WallpaperGrid color={decodedName} />
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}

