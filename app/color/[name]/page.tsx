'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/Header'
import WallpaperGrid from '../../components/WallpaperGrid'
import Footer from '../../components/Footer'
import BackToTop from '../../components/BackToTop'

export default function ColorPage() {
  const { name } = useParams()
  const decodedName = decodeURIComponent(name as string)

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header showBackButton={true} backUrl="/#categories-bar" />

      <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-white text-center">{decodedName} Wallpapers</h1>
        <WallpaperGrid color={decodedName} />
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}

