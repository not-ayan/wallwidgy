"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import BackToTop from "../../components/BackToTop"
import AdBanner from "../../components/AdBanner"

const WallpaperGrid = dynamic(() => import("../../components/WallpaperGrid"), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="loader"></div>
    </div>
  ),
})

const categories = {
  nature: { name: "Nature", icon: "🌿" },
  anime: { name: "Anime", icon: "🎭" },
  art: { name: "Art", icon: "🎨" },
  abstract: { name: "Abstract", icon: "🌀" },
  cars: { name: "Cars", icon: "🚗" },
  architecture: { name: "Architecture", icon: "🏛️" },
  minimal: { name: "Minimal", icon: "✨" },
  tech: { name: "Tech", icon: "💻" },
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const [wallpapers, setWallpapers] = useState<string[]>([])
  const category = categories[params.category as keyof typeof categories]

  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
        if (!response.ok) throw new Error('Failed to fetch wallpapers')
        
        const data = await response.json()
        const filteredWallpapers = data.filter((item: any) => 
          item.category === `#${params.category}`
        ).map((item: any) => item.file_name)
        
        setWallpapers(filteredWallpapers)
      } catch (error) {
        console.error('Error fetching wallpapers:', error)
      }
    }

    fetchWallpapers()
  }, [params.category])

  if (!category) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-white/90 mb-4">Category not found</h1>
          <Link
            href="/categories"
            className="text-[var(--accent-light)] hover:text-white transition-all inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Categories
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header showBackButton backUrl="/categories" />

      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-32">
        <div className="flex items-center gap-4 mb-12">
          <h1 className="font-title text-[32px] sm:text-[40px] animated-gradient flex items-center gap-3">
            <span className="text-[32px] sm:text-[40px]">{category.icon}</span>
            {category.name}
          </h1>
        </div>

        <AdBanner />

        <WallpaperGrid categoryFilter={`#${params.category}`} />
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
} 