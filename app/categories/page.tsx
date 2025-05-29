"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

// Import icons as normal static assets
import natureIcon from "../../public/icons/nature.svg"
import animeIcon from "../../public/icons/anime.svg"
import artIcon from "../../public/icons/art.svg"
import abstractIcon from "../../public/icons/abstract.svg"
import carsIcon from "../../public/icons/cars.svg"
import architectureIcon from "../../public/icons/architecture.svg"
import minimalIcon from "../../public/icons/minimal.svg"
import techIcon from "../../public/icons/tech.svg"
import amoledIcon from "../../public/icons/amoled.svg"

// Using imported SVG icons as static assets
const categories = [
  { 
    id: "nature", 
    name: "Nature", 
    icon: natureIcon.src
  },
  { 
    id: "anime", 
    name: "Anime", 
    icon: animeIcon.src
  },
  { 
    id: "art", 
    name: "Art", 
    icon: artIcon.src
  },
  { 
    id: "abstract", 
    name: "Abstract", 
    icon: abstractIcon.src
  },
  { 
    id: "cars", 
    name: "Cars", 
    icon: carsIcon.src
  },
  { 
    id: "architecture", 
    name: "Architecture", 
    icon: architectureIcon.src
  },
  { 
    id: "minimal", 
    name: "Minimal", 
    icon: minimalIcon.src
  },
  { 
    id: "tech", 
    name: "Tech", 
    icon: techIcon.src
  },
  { 
    id: "amoled", 
    name: "AMOLED", 
    icon: amoledIcon.src
  },
]

export default function CategoriesPage() {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch wallpapers and get a sample image for each category
    const fetchCategoryImages = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('https://raw.githubusercontent.com/not-ayan/storage/main/index.json')
        if (!response.ok) throw new Error('Failed to fetch wallpapers')
        
        const data = await response.json()
        const images: Record<string, string> = {}
        
        // Get one image for each category
        categories.forEach(category => {
          // Find the first wallpaper for this category
          const wallpaper = data.find((item: any) => 
            item.category === `#${category.id}`
          )
          
          if (wallpaper) {
            // Use the cache image URL which is likely smaller/optimized
            images[category.id] = `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${wallpaper.file_cache_name}`
          }
        })
        
        setCategoryImages(images)
      } catch (error) {
        console.error('Error fetching category images:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryImages()
  }, [])

  return (
    <main className="min-h-screen bg-[#0A0A0A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/60 via-[#0A0A0A] to-[#0A0A0A]">
      <Header showBackButton />

      <div className="max-w-[1400px] mx-auto px-6 pt-28 pb-32">
        <div className="mb-16 text-center">
          <h1 className="font-title text-[46px] sm:text-[64px] animated-gradient mb-4">
            Categories
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Explore our curated collection of wallpapers organized by themes. Select a category to discover stunning backgrounds for your devices.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group relative aspect-[5/4] rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out both"
              }}
            >
              {/* Background image with overlay */}
              <div className="absolute inset-0 bg-white/5">
                {categoryImages[category.id] ? (
                  <Image 
                    src={categoryImages[category.id]}
                    alt={category.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800/80 to-black/80">
                    {isLoading ? (
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-6xl opacity-30">
                        <Image 
                          src={category.icon}
                          alt={`${category.name} icon`}
                          width={44}
                          height={44}
                          className="text-white filter invert"
                        />
                      </span>
                    )}
                  </div>
                )}
                <div 
                  className="absolute inset-0 transition-opacity duration-500 opacity-100 group-hover:opacity-90"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.3) 100%)"
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-8 text-center transition-all duration-500 group-hover:translate-y-[-8px]">
                <div 
                  className="mb-4 transition-all duration-500 group-hover:scale-125 group-hover:mb-6 drop-shadow-glow"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
                >
                  <Image 
                    src={category.icon}
                    alt={`${category.name} icon`}
                    width={44}
                    height={44}
                    className="text-white filter invert"
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 transition-all duration-500">
                  {category.name}
                </h2>
                <div className="h-0.5 w-12 bg-white/40 rounded-full mb-3 transition-all duration-500 group-hover:w-24 group-hover:bg-white/60"></div>
                <p className="text-sm text-white/70 max-w-[80%] transition-all duration-500 group-hover:text-white/90">
                  Explore amazing {category.name.toLowerCase()} wallpapers for your devices
                </p>
              </div>
              
              {/* Highlight border on hover */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent transition-all duration-500 group-hover:border-white/20"></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Add some global animation styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.4));
        }
      `}</style>

      <Footer />
      <BackToTop />
    </main>
  )
}