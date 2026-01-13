"use client"

import { useState, useEffect, use } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import BackToTop from "../../components/BackToTop"

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
  amoled: { name: "AMOLED", icon: "🌑" },
}

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = use(params)
  const [wallpapers, setWallpapers] = useState<string[]>([])
  const category = categories[categorySlug as keyof typeof categories]

  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
        if (!response.ok) throw new Error('Failed to fetch wallpapers')
        
        const data = await response.json()
        const filteredWallpapers = data.filter((item: any) => 
          item.category === `#${categorySlug}`
        ).map((item: any) => item.file_name)
        
        setWallpapers(filteredWallpapers)
      } catch (error) {
        console.error('Error fetching wallpapers:', error)
      }
    }

    fetchWallpapers()
  }, [categorySlug])

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

      <div className="pt-24 pb-32">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl sm:text-6xl">{category.icon}</span>
              <h1 className="font-title text-4xl sm:text-5xl animated-gradient leading-tight">
                {category.name}
              </h1>
            </div>
            <p className="text-white/60 text-base sm:text-lg max-w-2xl">
              Discover beautiful {category.name.toLowerCase()} wallpapers perfect for your device
            </p>
          </div>
        </div>

        <WallpaperGrid categoryFilter={`#${categorySlug}`} />
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}