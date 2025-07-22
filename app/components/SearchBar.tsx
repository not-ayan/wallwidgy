"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Sparkles, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

// Add custom animation styles
const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
`;

interface Wallpaper {
  sha: string
  name: string
  download_url: string
  preview_url: string
  resolution: string
  platform: string
  width: number
  height: number
}

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const [visibleResults, setVisibleResults] = useState(20)
  const [results, setResults] = useState<Wallpaper[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>(['Minimalist', 'Dark', 'Colorful', 'Nature', 'Abstract', 'Anime'])
  const [isMac, setIsMac] = useState(false)
  const [previousSearch, setPreviousSearch] = useState("")
  const [searchHistoryEnabled, setSearchHistoryEnabled] = useState(false)
  const router = useRouter()
  
  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator?.platform?.includes('Mac') || false)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Instead of navigating, perform search directly
      await performSearch(searchQuery.trim())
    }
  }
  
  const performSearch = async (query: string) => {
    setIsSearching(true)
    setResults([]) // Clear old results first
    setVisibleResults(20) // Reset visible results counter when doing a new search
    try {
      // Fetch all wallpapers from the index
      const response = await fetch("https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json")
      if (!response.ok) throw new Error("Failed to fetch wallpapers")
      
      const data = await response.json()
      
      // Search through the data field for matches
      const matchedWallpapers = data
        .filter((item: any) => {
          if (!item.data) return false
          
          // Convert query and data fields to lowercase for case-insensitive search
          const queryLower = query.toLowerCase()
          
          // Fields to search in
          const searchableFields = [
            item.file_name || '',
            item.data.art_style || '',
            item.data.series || '',
            item.data.category || '',
            item.data.mood || '',
            item.data.technique || '',
            item.data.color_palette || ''
          ]
          
          // Check array fields
          const arrays = [
            item.data.character_names || [],
            item.data.primary_colors || [],
            item.data.secondary_colors || [],
            item.data.tags || []
          ]
          
          // Check if any field contains the query
          return searchableFields.some(field => field.toLowerCase().includes(queryLower)) ||
                 arrays.some(arr => arr.some((val: string) => val.toLowerCase().includes(queryLower)))
        })
        .map((item: any) => {
          // Convert to Wallpaper interface
          const mainFileName = item.file_main_name || `${item.file_name}.png`
          const cacheFileName = item.file_cache_name || `${item.file_name}.webp`
          
          return {
            sha: item.file_name,
            name: mainFileName,
            download_url: `https://raw.githubusercontent.com/not-ayan/storage/main/main/${mainFileName}`,
            preview_url: `https://raw.githubusercontent.com/not-ayan/storage/main/cache/${cacheFileName}`,
            resolution: item.resolution || `${item.width}x${item.height}`,
            platform: item.orientation === "Mobile" ? "Mobile" : "Desktop",
            width: item.width,
            height: item.height,
          }
        })
      
      setResults(matchedWallpapers)
      setTotalResults(matchedWallpapers.length)
    } catch (error) {
      console.error("Error searching wallpapers:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSearch = () => {
    setIsOpen(!isOpen)
    
    if (isOpen) {
      // Only clear if we don't have search history enabled
      if (!searchHistoryEnabled) {
        setResults([])
        setSearchQuery("")
        setVisibleResults(20) // Reset visible results counter when closing
      }
    } else {
      // Focus the input when opening
      setTimeout(() => {
        const input = document.getElementById("search-input")
        if (input) input.focus()
      }, 100)
      
      // If reopening with previous search
      if (searchHistoryEnabled && previousSearch) {
        setSearchQuery(previousSearch)
        performSearch(previousSearch)
        setSearchHistoryEnabled(false) // Reset after use
      }
    }
  }

  // Handle keyboard shortcuts and search events
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Close search on escape key
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setResults([])
        setSearchQuery("")
      }
      
      // Open search on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [isOpen])
  
  // Handle search events from redirected search page
  useEffect(() => {
    const handleSearchEvent = (e: any) => {
      const query = e.detail
      if (query) {
        setSearchQuery(query)
        setIsOpen(true)
        setTimeout(() => {
          performSearch(query)
        }, 300)
      }
    }
    
    window.addEventListener('triggerSearch', handleSearchEvent)
    return () => window.removeEventListener('triggerSearch', handleSearchEvent)
  }, [])
  
  // Backup scroll handler for when intersection observer might not trigger
  useEffect(() => {
    if (!isOpen || results.length <= visibleResults) return;
    
    const handleScroll = (e: Event) => {
      // Check if user has scrolled near the bottom of the content
      const element = e.target as HTMLDivElement;
      const scrollPosition = element.scrollTop + element.clientHeight;
      const scrollThreshold = element.scrollHeight - 300; // 300px from bottom
      
      if (scrollPosition >= scrollThreshold && !loadingMore && results.length > visibleResults) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleResults(prev => Math.min(prev + 20, results.length));
          setLoadingMore(false);
        }, 300);
      }
    };
    
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen, results.length, visibleResults, loadingMore]);

  // Set up infinite scroll with intersection observer
  useEffect(() => {
    // Don't set up observer if there are no more results to load
    if (!isOpen || results.length <= visibleResults) return;
    
    // Create the observer only when the search modal is open
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingMore && results.length > visibleResults) {
        console.log('Intersection observer triggered, loading more results');
        setLoadingMore(true);
        
        // Load more results
        setTimeout(() => {
          setVisibleResults(prev => Math.min(prev + 20, results.length));
          setLoadingMore(false);
        }, 300);
      }
    }, { 
      rootMargin: '0px 0px 300px 0px', // Trigger 300px before reaching the bottom
      threshold: 0.1 // Trigger when 10% of the element is visible
    });
    
    // Reset and observe the loading element when modal is open
    const loaderElement = observerRef.current;
    if (loaderElement) {
      observer.observe(loaderElement);
      console.log('Observer attached to loader element');
    }
    
    return () => {
      if (loaderElement) {
        observer.unobserve(loaderElement);
        console.log('Observer detached from loader element');
      }
    };
  }, [results.length, visibleResults, loadingMore, isOpen]);

  return (
    <>
      {/* Add custom animation styles */}
      <style jsx global>{animationStyles}</style>
      
      {/* Fixed Search Bar - bottom right on mobile, center on desktop */}
      <div className="fixed bottom-6 right-6 sm:bottom-6 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:right-auto z-40">
        <button
          onClick={toggleSearch}
          className="bg-[#0A0A0A]/80 backdrop-blur-xl hover:bg-[#1A1A1A]/90 rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-all hover:scale-105 active:scale-95 p-3.5 sm:px-5 sm:py-3"
          aria-label="Search wallpapers"
        >
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white/90" />
            <span className="text-white/60 text-sm hidden sm:inline">Search by color, style, mood...</span>
            <kbd className="hidden sm:flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/50 ml-1">
              <span className="text-[10px]">{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </kbd>
          </div>
        </button>
      </div>

      {/* Floating search bar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm sm:backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className={`w-[95%] ${results.length > 0 || isSearching ? 'h-[90%]' : 'max-h-[500px]'} max-w-7xl mx-auto will-change-transform`}>
            <div className="bg-[#0A0A0A]/90 rounded-xl sm:rounded-2xl border border-white/10 shadow-xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-2.5 sm:p-4 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                  <h3 className="text-white/90 text-xs sm:text-base font-medium">
                    {results.length > 0 
                      ? `${totalResults} ${totalResults === 1 ? 'result' : 'results'} for "${searchQuery}"`
                      : "Find Your Perfect Wallpaper"}
                  </h3>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 hover:rotate-90 border border-white/10 transition-all duration-300 transform active:scale-90"
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white/70" />
                </button>
              </div>
              
              {/* Main content area - scrollable */}
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-4rem)] md:max-h-[calc(90vh-4rem)]">
                {results.length === 0 && !isSearching ? (
                  /* Search form and suggestions */
                  <div className="p-3 sm:p-6">
                    <form onSubmit={handleSearch} className="flex items-center">
                      <div className="flex-1 flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/20 focus-within:ring-2 ring-white/20 rounded-full border border-white/20 p-1 transition-all transform hover:scale-[1.01] focus-within:scale-[1.01]">
                        <input
                          id="search-input"
                          type="text"
                          placeholder="Search by color, style, mood..."
                          className="flex-1 bg-transparent border-none text-base text-white placeholder:text-white/50 focus:outline-none px-4 py-2.5"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                        <button 
                          type="submit" 
                          className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full text-white/90 transition-all duration-300 transform hover:scale-110 active:scale-95"
                          aria-label="Search"
                        >
                          <Search className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                    
                    {/* Popular searches */}
                    <div className="mt-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-yellow-400/80" />
                        <p className="text-white/70 text-sm font-medium">
                          Popular Searches
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map(tag => (
                          <button
                            key={tag}
                            className="bg-white/10 hover:bg-white/15 active:scale-95 px-3 py-1.5 rounded-full text-white/80 text-sm transition-all transform hover:scale-105"
                            onClick={() => {
                              setSearchQuery(tag)
                              // Perform search immediately to improve responsiveness
                              performSearch(tag)
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Search Results */
                  <div className="p-3 sm:p-6 h-full">
                    {/* Search form at top of results with back button */}
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                      <button 
                        onClick={() => {
                          setResults([])
                          setSearchQuery("")
                        }}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-200 transform hover:scale-110 hover:translate-x-[-2px] active:scale-95"
                        aria-label="Back to search"
                      >
                        <ArrowLeft className="w-4 h-4 text-white/80" />
                      </button>
                      
                      <form onSubmit={handleSearch} className="flex-1">
                        <div className="flex-1 flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/20 focus-within:ring-2 ring-white/20 rounded-full border border-white/20 p-1 transition-all transform hover:scale-[1.01] focus-within:scale-[1.01]">
                          <input
                            id="search-input"
                            type="text"
                            placeholder="Search by color, style, mood..."
                            className="flex-1 bg-transparent border-none text-base text-white placeholder:text-white/50 focus:outline-none px-4 py-2.5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <button 
                            type="submit" 
                            className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full text-white/90 transition-all duration-300 transform hover:scale-110 active:scale-95"
                            aria-label="Search"
                          >
                            <Search className="w-5 h-5" />
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    {isSearching ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                        {[...Array(8)].map((_, i) => (
                          <div 
                            key={i} 
                            className="aspect-[9/16] bg-white/5 rounded-md sm:rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    ) : results.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5 will-change-contents">
                        {results.slice(0, visibleResults).map((wallpaper, index) => (
                          <Link
                            key={wallpaper.sha}
                            href={`/wallpaper/${wallpaper.name.replace(/\.\w+$/, '')}`}
                            className="group"
                            data-index={index}
                            style={{ 
                              animation: `fadeInUp 0.25s ease forwards`,
                              animationDelay: `${Math.min(index < 20 ? index * 0.03 : 0.05, 0.6)}s`,
                              opacity: 0,
                              transform: 'translateY(10px)'
                            }}
                            onClick={() => {
                              // Save search state for back navigation
                              setPreviousSearch(searchQuery)
                              setSearchHistoryEnabled(true)
                              setIsOpen(false)
                            }}
                          >
                            <div className="relative overflow-hidden rounded-md sm:rounded-lg border border-white/10 group-hover:border-white/30 transition-all duration-300 aspect-[9/16] transform group-hover:translate-y-[-5px] group-hover:shadow-xl">
                              <Image
                                src={wallpaper.preview_url}
                                alt={wallpaper.name}
                                fill
                                loading="lazy"
                                decoding="async"
                                sizes="(max-width: 480px) 45vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16.66vw"
                                className="object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105"
                              />
                              
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                              
                              {/* Resolution badge */}
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <p className="text-white text-xs font-medium truncate">
                                    {wallpaper.resolution}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {/* Loader element for intersection observer with loading indicator */}
                        {results.length > visibleResults && (
                          <div 
                            ref={observerRef}
                            className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 flex justify-center py-6 h-20"
                          >
                            {loadingMore ? (
                              <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                            ) : (
                              <div className="w-full h-8"></div> 
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)] py-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white/5 rounded-full p-5 mb-4 animate-pulse">
                          <Search className="w-8 h-8 text-white/40" />
                        </div>
                        <h2 className="text-xl font-medium text-white/90 mb-2">No results found</h2>
                        <p className="text-white/60 text-center max-w-md">
                          We couldn't find any wallpapers matching your search. Try different keywords or explore our categories.
                        </p>
                        <Link 
                          href="/categories" 
                          className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/15 transition-all duration-300 rounded-full text-white hover:scale-105 active:scale-95"
                          onClick={() => setIsOpen(false)}
                        >
                          Browse Categories
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
