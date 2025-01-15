'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Grid, Palette } from 'lucide-react'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'

interface Category {
  name: string;
  count: number;
  similarTags?: string[];
}

interface Color {
  name: string;
  hex: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesResponse, colorsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/colors')
        ])

        if (!categoriesResponse.ok || !colorsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const categoriesData = await categoriesResponse.json()
        const colorsData = await colorsResponse.json()

        // Group similar tags
        const groupedCategories = categoriesData.reduce((acc: Category[], curr: Category) => {
          const mainCategory = curr.name.split('/')[0].trim()
          const existingCategory = acc.find(c => c.name === mainCategory)
          
          if (existingCategory) {
            existingCategory.count += curr.count
            if (!existingCategory.similarTags) existingCategory.similarTags = []
            existingCategory.similarTags.push(curr.name)
          } else {
            acc.push({
              name: mainCategory,
              count: curr.count,
              similarTags: [curr.name]
            })
          }
          
          return acc
        }, [])

        setCategories(groupedCategories)
        setColors(colorsData)
      } catch (error: any) {
        console.error('Error fetching data:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link 
              href="/" 
              className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </nav>
        </header>
      </div>

      <div className="pt-28 px-8 max-w-[1400px] mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-white text-center">Categories</h1>
        
        {isLoading ? (
          <div className="text-center text-white/60">Loading categories...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {categories.map((category) => (
                <div key={category.name} className="space-y-4">
                  <button
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.name ? null : category.name
                    )}
                    className="w-full bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Grid className="w-6 h-6 text-[#F7F06D]" />
                      <span className="text-sm text-white/60">{category.count} wallpapers</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      {category.name}
                    </h2>
                  </button>
                  
                  {selectedCategory === category.name && category.similarTags && (
                    <div className="pl-4 space-y-2">
                      {category.similarTags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/category/${encodeURIComponent(tag)}`}
                          className="block text-white/60 hover:text-white transition-colors py-2"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <Palette className="w-6 h-6 text-[#F7F06D]" />
                <h2 className="text-2xl font-bold text-white">Choose by Color</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {colors.map((color) => (
                  <Link
                    key={color.name}
                    href={`/color/${encodeURIComponent(color.name)}`}
                    className="group"
                  >
                    <div 
                      className="w-full aspect-square rounded-full mb-2 border-2 border-transparent group-hover:border-white transition-all"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="text-sm text-center text-white/80 group-hover:text-white transition-colors">
                      {color.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
      <BackToTop />
    </main>
  )
}

