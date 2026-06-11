"use client"

import { useState, useEffect, useRef, useMemo, memo } from "react"
import { Search, X, Sparkles, ArrowLeft, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useBackHandler } from "@/hooks/use-back-handler"
import { useState as useStableState } from "react"
import Masonry from "react-masonry-css"
import Link from "next/link"

// Global wallpapers index cache to prevent repeated network requests
let globalWallpapersCache: any[] | null = null;

// StableImageComponent: robust memoized image loader
const StableImageComponent = memo(({ src, alt, onError404, ...props }: { src: string; alt: string; onError404?: () => void; [key: string]: any }) => {
  const [unoptimized, setUnoptimized] = useStableState(false);
  const [error, setError] = useStableState(false);
  const [loading, setLoading] = useStableState(true);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-white/10 text-white/60 text-xs rounded-md">
        Failed to load
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
      unoptimized={unoptimized}
      onError={() => {
        if (!unoptimized) {
          setUnoptimized(true);
        } else {
          setError(true);
          onError404?.();
        }
      }}
      onLoad={() => setLoading(false)}
      className={
        "object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105" +
        (loading ? " animate-pulse bg-white/10" : "")
      }
      {...props}
    />
  );
}, (prev, next) => {
  return prev.src === next.src && prev.alt === next.alt;
});
StableImageComponent.displayName = "StableImageComponent";

// SearchCard: memoized wallpaper card inside search results grid
const SearchCard = memo(({ 
  wallpaper, 
  index, 
  showMap, 
  setShowMap, 
  setPreviousSearch, 
  setSearchHistoryEnabled, 
  setIsOpen,
  searchQueryRef
}: { 
  wallpaper: any; 
  index: number; 
  showMap: { [sha: string]: boolean | undefined };
  setShowMap: React.Dispatch<React.SetStateAction<{ [sha: string]: boolean | undefined }>>;
  setPreviousSearch: (val: string) => void;
  setSearchHistoryEnabled: (val: boolean) => void;
  setIsOpen: (val: boolean) => void;
  searchQueryRef: React.RefObject<string>;
}) => {
  if (showMap[wallpaper.sha] === false) return null;
  
  return (
    <div
      className="mb-4"
      style={{ 
        animation: `fadeInUp 0.3s ease forwards`,
        animationDelay: `${Math.min(index < 20 ? index * 0.03 : 0.05, 0.6)}s`,
        opacity: 0,
        transform: 'translateY(10px)'
      }}
    >
      <Link
        href={`/wallpaper/${wallpaper.name.replace(/\.\w+$/, '')}`}
        className="group"
        onClick={() => {
          setPreviousSearch(searchQueryRef.current || "")
          setSearchHistoryEnabled(true)
          setIsOpen(false)
        }}
      >
        <div className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30 ${
          wallpaper.platform === "Mobile" ? 'aspect-[9/16]' : 'aspect-[3/2]'
        }`}>
          <StableImageComponent
            src={wallpaper.preview_url}
            alt={wallpaper.name}
            sizes="(max-width: 480px) 45vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16.66vw"
            onError404={() => setShowMap(prev => ({ ...prev, [wallpaper.sha]: false }))}
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`text-[10px] font-semibold font-mono px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 ${
              wallpaper.platform === "Mobile" 
                ? "text-blue-400" 
                : "text-emerald-400"
            }`}>
              {wallpaper.platform}
            </span>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10px] font-semibold font-mono px-2.5 py-1 rounded-full bg-[var(--accent-light)] text-black backdrop-blur-sm">
              {wallpaper.resolution}
            </span>
          </div>
          
          {/* Hover overlay (bottom gradient) */}
          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)"
            }}
          />
          
          {/* Hover details (bottom details + download button) */}
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between pointer-events-none">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-sm font-medium text-white/90 truncate">
                {wallpaper.name.replace(/\.\w+$/, '')}
              </h3>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider">
                {wallpaper.platform}
              </p>
            </div>
            
            <button
              onClick={async e => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const response = await fetch(wallpaper.download_url);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = wallpaper.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                } catch (err) {
                  alert('Failed to download image.');
                }
              }}
              className="pointer-events-auto p-2.5 rounded-full bg-black/60 border border-white/10 hover:border-[var(--accent-light)]/40 text-white/70 hover:text-[var(--accent-light)] transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
              title="Download wallpaper"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}, (prev, next) => {
  return prev.wallpaper.sha === next.wallpaper.sha && 
         prev.index === next.index &&
         prev.showMap[prev.wallpaper.sha] === next.showMap[next.wallpaper.sha];
});
SearchCard.displayName = "SearchCard";

// Add custom animation styles
const animationStyles = `
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

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
  const [rawResults, setRawResults] = useState<Wallpaper[]>([])
  const [suggestions, setSuggestions] = useState<string[]>(['Minimalist', 'Dark', 'Colorful', 'Nature', 'Abstract', 'Anime'])
  const [isMac, setIsMac] = useState(false)
  const [previousSearch, setPreviousSearch] = useState("")
  const [searchHistoryEnabled, setSearchHistoryEnabled] = useState(false)
  const [showMap, setShowMap] = useState<{ [sha: string]: boolean | undefined }>({});
  const [deviceFilter, setDeviceFilter] = useState<"all" | "desktop" | "mobile">("all")
  const router = useRouter()
  
  const searchQueryRef = useRef(searchQuery)
  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])
  
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

  // Compute filtered search results instantly in memory
  const results = useMemo(() => {
    if (deviceFilter === "all") return rawResults;
    return rawResults.filter((wallpaper) => wallpaper.platform.toLowerCase() === deviceFilter);
  }, [rawResults, deviceFilter]);

  const totalResults = results.length;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Instead of navigating, perform search directly
      await performSearch(searchQuery.trim())
    }
  }
  
  const performSearch = async (query: string) => {
    setIsSearching(true)
    setRawResults([]) // Clear raw results
    setShowMap({}); // Reset showMap for new search
    setVisibleResults(20) // Reset visible results counter when doing a new search
    try {
      let data = globalWallpapersCache;
      if (!data) {
        const response = await fetch("https://raw.githubusercontent.com/not-ayan/storage/refs/heads/main/index.json")
        if (!response.ok) throw new Error("Failed to fetch wallpapers")
        data = await response.json()
        globalWallpapersCache = data;
      }
      
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
      
      setRawResults(matchedWallpapers)
    } catch (error) {
      console.error("Error searching wallpapers:", error)
      setRawResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSearch = () => {
    setIsOpen(!isOpen)
    
    if (isOpen) {
      // Only clear if we don't have search history enabled
      if (!searchHistoryEnabled) {
        setRawResults([])
        setShowMap({}); // Reset showMap when clearing results
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
        setRawResults([])
        setSearchQuery("")
      }
      
      // Open search on Ctrl+K or Cmd+K
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
    if (results.length <= visibleResults) return;
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingMore) {
        setLoadingMore(true);
        
        // Load more results
        setTimeout(() => {
          setVisibleResults(prev => Math.min(prev + 20, results.length));
          setLoadingMore(false);
        }, 300);
      }
    }, { 
      rootMargin: '0px 0px 200px 0px', // Trigger earlier before reaching the bottom
      threshold: 0.1 // Trigger when 10% of the element is visible
    });
    
    // Observe the loading element if it exists
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
      {/* Add custom animation styles */}
      <style jsx global>{animationStyles}</style>
      
      {/* Fixed Search Bar - bottom-left icon on mobile, centered pill on desktop */}
      {/* Mobile: fixed bottom-left corner */}
      <div className="fixed bottom-24 left-4 z-40 md:hidden">
        <button
          onClick={toggleSearch}
          className="pointer-events-auto group relative bg-[#0A0A0A] rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[var(--accent-light)]/40 hover:bg-[#111111] transition-all duration-300 hover:scale-105 active:scale-95 w-10 h-10"
          aria-label="Search wallpapers"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-light)]/5 via-transparent to-[var(--accent-light)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Search className="w-5 h-5 text-white/80 group-hover:text-[var(--accent-light)] transition-colors duration-300 relative z-10" />
        </button>
      </div>
      {/* Desktop: centered pill within grid */}
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[88%] xl:max-w-[85%] px-4 md:px-6 lg:px-8 pointer-events-none z-40 justify-center">
        <button
          onClick={toggleSearch}
          className="pointer-events-auto group relative bg-[#0A0A0A] rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[var(--accent-light)]/40 hover:bg-[#111111] transition-all duration-300 hover:scale-105 active:scale-95 h-10 px-5"
          aria-label="Search wallpapers"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-light)]/5 via-transparent to-[var(--accent-light)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 relative z-10">
            <Search className="w-4 h-4 text-white/80 group-hover:text-[var(--accent-light)] transition-colors duration-300" />
            <span className="text-white/55 group-hover:text-white text-[10px] font-mono tracking-wider uppercase transition-colors duration-300">Search anything :p</span>
            <kbd className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] text-white/40 ml-2 group-hover:border-[var(--accent-light)]/30 group-hover:text-[var(--accent-light)] transition-all duration-300 font-mono">
              <span className="text-[9px]">{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </kbd>
          </div>
        </button>
      </div>

      {/* Floating search bar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className={`w-full ${results.length > 0 || isSearching ? 'h-[92%]' : 'max-h-[450px]'} max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto will-change-transform`}>
            <div className="bg-[#0A0A0A] rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl shadow-black/80 overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-white/90 text-sm sm:text-base font-medium font-mono tracking-wider uppercase">
                      {results.length > 0 
                        ? `${totalResults} ${totalResults === 1 ? 'wallpaper' : 'wallpapers'} found`
                        : "Search Wallpapers"}
                    </h3>
                    {results.length > 0 && (
                      <p className="text-white/40 text-xs mt-0.5 font-mono">for "{searchQuery}"</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 group"
                >
                  <X className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                </button>
              </div>
              
              {/* Device Filter - Only show when there are results */}
              {results.length > 0 && (
                <div className="px-4 sm:px-6 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest">Filter</span>
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                      {[
                        { key: "all", label: "All" },
                        { key: "desktop", label: "Desktop" },
                        { key: "mobile", label: "Mobile" }
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setDeviceFilter(option.key as "all" | "desktop" | "mobile")}
                          className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                            deviceFilter === option.key
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-white/40 hover:text-white/70 hover:bg-white/5"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main content area - scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[calc(90vh-4rem)] md:max-h-[calc(90vh-4rem)]">
                {results.length === 0 && !isSearching ? (
                  /* Search form and suggestions */
                  <div className="p-4 sm:p-8">
                    <form onSubmit={handleSearch} className="flex items-center">
                      <div className="flex-1 flex items-center bg-[#111111] focus-within:bg-[#141414] rounded-2xl border border-white/10 focus-within:border-[var(--accent-light)]/30 focus-within:ring-1 focus-within:ring-[var(--accent-light)]/30 p-1.5 transition-all duration-300">
                        <input
                          id="search-input"
                          type="text"
                          placeholder="Search by color, style, mood..."
                          className="flex-1 bg-transparent border-none text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-0 focus-visible:outline-none px-5 py-3 font-mono tracking-wide"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                        <button 
                          type="submit" 
                          className="p-3 bg-[var(--accent-light)] hover:bg-[var(--accent-light)]/90 text-black rounded-xl font-medium transition-all duration-300 mr-0.5 flex items-center justify-center"
                          aria-label="Search"
                        >
                          <Search className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                    
                    {/* Popular searches */}
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[var(--accent-light)] animate-pulse" />
                        <p className="text-white/40 text-[9px] font-mono uppercase tracking-widest">
                          Trending Curations
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map(tag => (
                          <button
                            key={tag}
                            className="bg-[#111111] hover:bg-[#161616] border border-white/5 hover:border-[var(--accent-light)]/20 px-3.5 py-2 rounded-xl text-white/50 hover:text-[var(--accent-light)] text-[11px] font-mono tracking-wider uppercase transition-all duration-300"
                            onClick={() => {
                              setSearchQuery(tag)
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
                  <div className="p-4 sm:p-6 h-full">
                    {/* Search form at top of results with back button */}
                    <div className="flex items-center gap-3 mb-5 sm:mb-6">
                      <button 
                        onClick={() => {
                          setRawResults([])
                          setShowMap({}); // Reset showMap when clearing results
                          setSearchQuery("")
                        }}
                        className="p-2.5 rounded-xl bg-[#111111] hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200"
                        aria-label="Back to search"
                      >
                        <ArrowLeft className="w-4 h-4 text-white/60" />
                      </button>
                      
                      <form onSubmit={handleSearch} className="flex-1">
                        <div className="flex-1 flex items-center bg-[#111111] focus-within:bg-[#141414] rounded-2xl border border-white/10 focus-within:border-[var(--accent-light)]/30 focus-within:ring-1 focus-within:ring-[var(--accent-light)]/30 p-1.5 transition-all duration-300">
                          <input
                            id="search-input"
                            type="text"
                            placeholder="Search by color, style, mood..."
                            className="flex-1 bg-transparent border-none text-base text-white placeholder:text-white/30 focus:outline-none focus:ring-0 focus-visible:outline-none px-4 py-2.5 font-mono tracking-wide"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <button 
                            type="submit" 
                            className="p-2.5 bg-[var(--accent-light)] hover:bg-[var(--accent-light)]/90 text-black rounded-xl transition-all duration-200 mr-0.5 flex items-center justify-center"
                            aria-label="Search"
                          >
                            <Search className="w-5 h-5" />
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    {isSearching ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(8)].map((_, i) => (
                          <div 
                            key={i} 
                            className="aspect-[3/2] bg-white/5 rounded-2xl animate-pulse"
                            style={{ animationDelay: `${i * 0.05}s` }}
                          />
                        ))}
                      </div>
                    ) : results.length > 0 ? (
                      <Masonry
                        breakpointCols={{
                          default: 4,
                          1100: 3,
                          700: 2,
                        }}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column"
                      >
                        {/* Robust 404 image hiding logic: parent-managed showMap */}
                        {results.filter(wallpaper => showMap[wallpaper.sha] !== false)
                          .slice(0, visibleResults)
                          .map((wallpaper, index) => (
                            <SearchCard
                              key={wallpaper.sha}
                              wallpaper={wallpaper}
                              index={index}
                              showMap={showMap}
                              setShowMap={setShowMap}
                              setPreviousSearch={setPreviousSearch}
                              setSearchHistoryEnabled={setSearchHistoryEnabled}
                              setIsOpen={setIsOpen}
                              searchQueryRef={searchQueryRef}
                            />
                          ))}
                      </Masonry>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)] py-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white/5 rounded-2xl p-6 mb-5">
                          <Search className="w-8 h-8 text-white/30" />
                        </div>
                        <h2 className="text-lg font-medium text-white/80 mb-2">No wallpapers found</h2>
                        <p className="text-white/40 text-sm text-center max-w-sm">
                          Try different keywords or browse our categories for inspiration.
                        </p>
                        <Link 
                          href="/#categories-bar" 
                          className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 rounded-xl text-white/70 hover:text-white text-sm font-medium"
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
