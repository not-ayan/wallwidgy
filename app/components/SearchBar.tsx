"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Sparkles, Monitor, Smartphone, ArrowLeft, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useBackHandler } from "@/hooks/use-back-handler"
import { useState as useStableState } from "react"
import Link from "next/link"

// StableImageComponent: robust image loader with error UI
function StableImageComponent({ src, alt, onError404, ...props }: { src: string; alt: string; onError404?: () => void; [key: string]: any }) {
  const [error, setError] = useStableState(false);
  const [loading, setLoading] = useStableState(true);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-white/10 text-white/40 text-[10px] rounded-xl font-mono">
        IMAGE_LOAD_FAILED
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      decoding="async"
      unoptimized={true}
      onError={() => {
        setError(true);
        onError404?.();
      }}
      onLoad={() => setLoading(false)}
      className={
        "object-cover transition-all duration-500 ease-out group-hover:scale-105" +
        (loading ? " animate-pulse bg-white/5" : "")
      }
      {...props}
    />
  );
}

// Add custom animation styles
const animationStyles = `
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.staggered-entry {
  opacity: 0;
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
  const [suggestions] = useState<string[]>(['Minimalist', 'Dark', 'Colorful', 'Nature', 'Abstract', 'Anime'])
  const [isMac, setIsMac] = useState(false)
  const [previousSearch, setPreviousSearch] = useState("")
  const [searchHistoryEnabled, setSearchHistoryEnabled] = useState(false)
  const [showMap, setShowMap] = useState<{ [sha: string]: boolean | undefined }>({})
  const [deviceFilter, setDeviceFilter] = useState<"all" | "desktop" | "mobile">("all")
  
  // Handle browser back button when search is open
  useBackHandler({
    isActive: isOpen,
    onBack: () => setIsOpen(false),
    priority: 1
  })
  
  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator?.platform?.includes('Mac') || false)
  }, [])

  // Combined debounced search logic for real-time console results
  useEffect(() => {
    if (!isOpen) return

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim())
      } else {
        setResults([])
        setTotalResults(0)
      }
    }, 250)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, deviceFilter, isOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim())
    }
  }
  
  const performSearch = async (query: string) => {
    setIsSearching(true)
    setShowMap({}) // Reset showMap for new search
    setVisibleResults(20) // Reset visible results counter
    try {
      // Fetch all wallpapers from the index
      const response = await fetch("https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json")
      if (!response.ok) throw new Error("Failed to fetch wallpapers")
      
      const data = await response.json()
      
      // Search through the data fields for matches
      const matchedWallpapers = data
        .filter((item: any) => {
          if (!item.data) return false
          
          const queryLower = query.toLowerCase()
          
          const searchableFields = [
            item.file_name || '',
            item.data.art_style || '',
            item.data.series || '',
            item.data.category || '',
            item.data.mood || '',
            item.data.technique || '',
            item.data.color_palette || ''
          ]
          
          const arrays = [
            item.data.character_names || [],
            item.data.primary_colors || [],
            item.data.secondary_colors || [],
            item.data.tags || []
          ]
          
          return searchableFields.some(field => field.toLowerCase().includes(queryLower)) ||
                 arrays.some(arr => arr.some((val: string) => val.toLowerCase().includes(queryLower)))
        })
        .map((item: any) => {
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
      
      // Apply device filter
      const filteredResults = deviceFilter === "all" 
        ? matchedWallpapers 
        : matchedWallpapers.filter((wallpaper: Wallpaper) => wallpaper.platform.toLowerCase() === deviceFilter)
      
      setResults(filteredResults)
      setTotalResults(filteredResults.length)
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
      if (!searchHistoryEnabled) {
        setResults([])
        setShowMap({})
        setSearchQuery("")
        setVisibleResults(20)
      }
    } else {
      setTimeout(() => {
        const input = document.getElementById("search-input")
        if (input) input.focus()
      }, 100)
      
      if (searchHistoryEnabled && previousSearch) {
        setSearchQuery(previousSearch)
        performSearch(previousSearch)
        setSearchHistoryEnabled(false)
      }
    }
  }

  // Handle keyboard shortcuts and search events
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setResults([])
        setSearchQuery("")
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    
    const handleOpenSearch = () => {
      setIsOpen(true)
    }
    
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('open-search', handleOpenSearch)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('open-search', handleOpenSearch)
    }
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
  
  // Backup scroll handler for infinite loading
  useEffect(() => {
    if (!isOpen || results.length <= visibleResults) return;
    
    const handleScroll = (e: Event) => {
      const element = e.target as HTMLDivElement;
      const scrollPosition = element.scrollTop + element.clientHeight;
      const scrollThreshold = element.scrollHeight - 300;
      
      if (scrollPosition >= scrollThreshold && !loadingMore && results.length > visibleResults) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleResults(prev => Math.min(prev + 20, results.length));
          setLoadingMore(false);
        }, 300);
      }
    };
    
    const scrollContainer = document.querySelector('.results-viewport');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen, results.length, visibleResults, loadingMore]);

  // Set up infinite scroll intersection observer
  useEffect(() => {
    if (results.length <= visibleResults) return;
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleResults(prev => Math.min(prev + 20, results.length));
          setLoadingMore(false);
        }, 300);
      }
    }, { 
      rootMargin: '0px 0px 300px 0px',
      threshold: 0.1
    });
    
    const loaderElement = observerRef.current;
    if (loaderElement) {
      observer.observe(loaderElement);
    }
    
    return () => {
      if (loaderElement) {
        observer.unobserve(loaderElement);
      }
    };
  }, [results.length, visibleResults, loadingMore]);

  return (
    <>
      <style jsx global>{animationStyles}</style>
      
      {/* Fixed Search Bar (Trigger Button) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[88%] xl:max-w-[85%] px-4 md:px-6 lg:px-8 pointer-events-none z-40 flex justify-start md:justify-center">
        <button
          onClick={toggleSearch}
          className="pointer-events-auto group relative bg-[#0A0A0A] rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[var(--accent-light)]/40 hover:bg-[#111111] transition-all duration-300 hover:scale-105 active:scale-95 w-10 h-10 md:w-auto md:h-10 md:px-5"
          aria-label="Search wallpapers"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-light)]/5 via-transparent to-[var(--accent-light)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 relative z-10">
            <Search className="w-5 h-5 text-white/80 group-hover:text-[var(--accent-light)] transition-colors duration-300 md:w-4 md:h-4" />
            <span className="text-white/55 group-hover:text-white text-[10px] hidden md:inline font-mono tracking-wider uppercase transition-colors duration-300">Search anything :p</span>
            <kbd className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] text-white/40 ml-2 group-hover:border-[var(--accent-light)]/30 group-hover:text-[var(--accent-light)] transition-all duration-300 font-mono">
              <span className="text-[9px]">{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </kbd>
          </div>
        </button>
      </div>

      {/* Redesigned Search Console Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#060606] flex flex-col md:flex-row h-screen w-full overflow-hidden animate-in fade-in duration-300">
          
          {/* Left Panel: Search Controls & Meta */}
          <div className="w-full md:w-[38%] lg:w-[32%] bg-[#0A0A0A] border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-10 flex flex-col justify-between h-auto md:h-screen overflow-y-auto custom-scrollbar">
            
            <div className="space-y-4 md:space-y-12">
              {/* Branding / Heading - Desktop Only */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] animate-pulse" />
                  <span className="font-mono text-[9px] text-white/35 tracking-[0.25em] uppercase">SYSTEM.SEARCH_CONSOLE // V2</span>
                </div>
              </div>

              {/* Large Editorial Search Input */}
              <div className="space-y-1 md:space-y-3">
                <span className="font-mono text-[8px] text-white/25 tracking-widest uppercase hidden md:block">QUERY_CONSOLE</span>
                <div className="flex items-center gap-3">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1">
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xl md:text-3xl lg:text-4xl font-light font-outfit text-white border-b border-white/10 focus:border-[#F7F06D] py-2 md:py-3 focus:outline-none transition-colors duration-300 placeholder:text-white/10 uppercase tracking-wide"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 text-white/60 hover:text-white md:hidden"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Segmented Filter Control */}
              <div className="space-y-1.5 md:space-y-3">
                <span className="font-mono text-[8px] text-white/25 tracking-widest uppercase hidden md:block">PLATFORM_LIMITER</span>
                <div className="flex items-center gap-1 bg-white/[0.02] rounded-xl p-0.5 md:p-1 border border-white/5">
                  {[
                    { key: "all", label: "ALL", icon: Sparkles },
                    { key: "desktop", label: "DESKTOP", icon: Monitor },
                    { key: "mobile", label: "MOBILE", icon: Smartphone }
                  ].map((option) => {
                    const Icon = option.icon
                    const isSelected = deviceFilter === option.key
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setDeviceFilter(option.key as "all" | "desktop" | "mobile")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 md:py-2.5 rounded-lg text-[9px] font-mono tracking-wider transition-all duration-300 ${
                          isSelected
                            ? "bg-[#F7F06D] text-black font-semibold shadow-md shadow-[#F7F06D]/5"
                            : "text-white/40 hover:text-white/80 hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trending Curations tags */}
              <div className="space-y-1.5 md:space-y-4">
                <span className="font-mono text-[8px] text-white/25 tracking-widest uppercase hidden md:block">TRENDING_CURATIONS</span>
                <div className="flex flex-row md:flex-wrap overflow-x-auto md:overflow-visible gap-2 scrollbar-none pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                  {suggestions.map((tag) => {
                    const isCurrent = searchQuery.toLowerCase() === tag.toLowerCase()
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag)
                          performSearch(tag)
                        }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase border transition-all duration-300 ${
                          isCurrent
                            ? "bg-white/10 text-[#F7F06D] border-[#F7F06D]/30"
                            : "bg-white/[0.02] text-white/55 border-white/5 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Console Diagnostics Footer */}
            <div className="hidden md:flex flex-col gap-4 border-t border-white/5 pt-8 mt-12">
              <div className="flex justify-between items-center text-[9px] font-mono text-white/30 tracking-wider">
                <span>QUERY_STATE</span>
                <span className={isSearching ? "text-[#F7F06D] animate-pulse" : results.length > 0 ? "text-emerald-400" : "text-white/40"}>
                  {isSearching ? "SEARCHING..." : results.length > 0 ? "LOADED" : "IDLE"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono text-white/30 tracking-wider">
                <span>INDEX_MATCHES</span>
                <span className="text-white/60 font-semibold">{totalResults} ITEMS</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono text-white/30 tracking-wider">
                <span>TERMINAL_EXIT</span>
                <span>[ESC] TO EXIT</span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-[10px] font-mono tracking-wider uppercase text-white/70 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
              >
                DISMISS CONSOLE
              </button>
            </div>

          </div>

          {/* Right Panel: Results Grid Area */}
          <div className="flex-1 bg-[#060606] h-full overflow-y-auto custom-scrollbar p-4 md:p-10 results-viewport flex flex-col">
            
            {/* Header diagnostics for results */}
            <div className="flex items-center justify-between mb-4 md:mb-8 border-b border-white/5 pb-3 md:pb-5">
              <div>
                <span className="font-mono text-[9px] text-white/20 tracking-widest uppercase block">CATALOG_RESOURCES</span>
                <h3 className="text-white text-sm md:text-base font-outfit font-light mt-1 uppercase tracking-wide">
                  {searchQuery ? `matches found for "${searchQuery}"` : "Input query to explore catalog"}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hidden md:flex p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/55 hover:text-white transition-all duration-300"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Results Content */}
            <div className="flex-1">
              {isSearching ? (
                /* Premium Skeleton Grid */
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="aspect-[9/16] bg-white/5 rounded-2xl animate-pulse border border-white/5 relative overflow-hidden"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                /* Staggered Results Grid */
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {results
                    .filter(wallpaper => showMap[wallpaper.sha] !== false)
                    .slice(0, visibleResults)
                    .map((wallpaper, index) => (
                      <Link
                        key={wallpaper.sha}
                        href={`/wallpaper/${wallpaper.name.replace(/\.\w+$/, '')}`}
                        className="group staggered-entry"
                        style={{ 
                          "--index": index
                        } as React.CSSProperties}
                        onClick={() => {
                          setPreviousSearch(searchQuery)
                          setSearchHistoryEnabled(true)
                          setIsOpen(false)
                        }}
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-white/5 group-hover:border-[#F7F06D]/35 transition-all duration-500 ease-out aspect-[9/16] bg-[#0A0A0A] shadow-lg shadow-black/40 group-hover:shadow-black/70">
                          
                          {/* Image */}
                          <StableImageComponent
                            src={wallpaper.preview_url}
                            alt={wallpaper.name}
                            sizes="(max-width: 480px) 45vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
                            onError404={() => setShowMap(prev => ({ ...prev, [wallpaper.sha]: false }))}
                          />

                          {/* Hover Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/10 to-transparent opacity-40 group-hover:opacity-85 transition-opacity duration-500" />

                          {/* Top Controls: Platform Badge & Download Icon */}
                          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                            <span className={`text-[8px] font-mono tracking-wider px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 ${
                              wallpaper.platform === "Mobile" ? "text-blue-400 border-blue-500/20" : "text-emerald-400 border-emerald-500/20"
                            }`}>
                              {wallpaper.platform.toUpperCase()}
                            </span>
                            
                            <button
                              className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/50 hover:text-[#F7F06D] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
                              title="Download Wallpaper"
                              tabIndex={-1}
                              onClick={async e => {
                                e.preventDefault()
                                e.stopPropagation()
                                try {
                                  const response = await fetch(wallpaper.download_url)
                                  const blob = await response.blob()
                                  const url = window.URL.createObjectURL(blob)
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = wallpaper.name
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
                                } catch (err) {
                                  alert('Failed to download image.')
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"/></svg>
                            </button>
                          </div>

                          {/* Bottom metadata - slides up slightly on hover */}
                          <div className="absolute bottom-3 left-3 right-3 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-10">
                            <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-mono text-white/80 truncate block">{wallpaper.name.replace(/\.\w+$/, '')}</p>
                                <span className="text-[8px] font-mono text-white/40 block mt-0.5">{wallpaper.resolution}</span>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-[#F7F06D] transition-colors" />
                            </div>
                          </div>

                        </div>
                      </Link>
                    ))}
                  
                  {/* Loader for intersection observer */}
                  {results.length > visibleResults && (
                    <div 
                      ref={observerRef}
                      className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-4 flex justify-center py-10"
                    >
                      {loadingMore ? (
                        <div className="w-5 h-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin"></div>
                      ) : (
                        <div className="h-8 w-full" />
                      )}
                    </div>
                  )}
                </div>
              ) : searchQuery ? (
                /* No Results Empty State */
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6">
                    <Search className="w-8 h-8 text-white/20" />
                  </div>
                  <h4 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">No matching resources</h4>
                  <p className="text-white/40 text-xs text-center max-w-xs leading-relaxed font-light font-sans">
                    Your query did not return any wallpapers. Try adjusting filters or searching general categories.
                  </p>
                </div>
              ) : (
                /* Idle/Empty Console State */
                <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
                    <Search className="w-8 h-8 text-white/10" />
                  </div>
                  <h4 className="text-white/50 text-xs font-mono tracking-widest uppercase mb-1.5">AWAITING INPUT QUERY</h4>
                  <p className="text-white/30 text-[10px] text-center max-w-xs font-mono">
                    ENTER KEYWORDS IN CONSOLE PANEL TO INITIATE DATA LOOKUP
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </>
  )
}
