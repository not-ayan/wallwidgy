import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Metadata } from "next"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

export const metadata: Metadata = {
  title: "Categories - WallWidgy",
}

const categories = [
  { id: "nature", name: "Nature", icon: "🌿" },
  { id: "anime", name: "Anime", icon: "🎭" },
  { id: "art", name: "Art", icon: "🎨" },
  { id: "abstract", name: "Abstract", icon: "🌀" },
  { id: "cars", name: "Cars", icon: "🚗" },
  { id: "architecture", name: "Architecture", icon: "🏛️" },
  { id: "minimal", name: "Minimal", icon: "✨" },
  { id: "tech", name: "Tech", icon: "💻" },
]

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header showBackButton />

      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-32">
        <h1 className="font-title text-[40px] sm:text-[56px] text-center mb-16 animated-gradient">
          Categories
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group relative aspect-square rounded-2xl bg-white/5 hover:bg-white/10 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {category.icon}
                </span>
                <h2 className="text-lg sm:text-xl font-medium text-white/90">
                  {category.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
} 