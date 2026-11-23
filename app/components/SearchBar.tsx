"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { useBackHandler } from "@/hooks/use-back-handler"
import InteractiveSearch from "./InteractiveSearch"

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMac, setIsMac] = useState(false)

  // Handle browser back button when search is open
  useBackHandler({
    isActive: isOpen,
    onBack: () => setIsOpen(false),
    priority: 1,
  })

  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator?.platform?.includes("Mac") || false)
  }, [])

  // Handle keyboard shortcuts (Cmd+K / Ctrl+K) and open-search event
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    const handleOpenSearch = () => {
      setIsOpen(true)
    }

    window.addEventListener("keydown", handleKeydown)
    window.addEventListener("open-search", handleOpenSearch)
    return () => {
      window.removeEventListener("keydown", handleKeydown)
      window.removeEventListener("open-search", handleOpenSearch)
    }
  }, [])

  // Handle search events from external components or deep-links
  useEffect(() => {
    const handleSearchEvent = (e: any) => {
      const query = e.detail
      if (query) {
        setSearchQuery(query)
        setIsOpen(true)
      }
    }

    window.addEventListener("triggerSearch", handleSearchEvent)
    return () => window.removeEventListener("triggerSearch", handleSearchEvent)
  }, [])

  return (
    <>
      {/* Fixed Search Bar (Trigger Capsule Button) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[88%] xl:max-w-[85%] px-4 md:px-6 lg:px-8 pointer-events-none z-40 flex justify-start md:justify-center">
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group relative bg-[#0A0A0A] rounded-full flex items-center justify-center shadow-xl border border-white/10 hover:border-white/25 hover:bg-[#141414] transition-all duration-200 active:scale-95 w-10 h-10 md:w-auto md:h-10 md:px-4"
          aria-label="Search wallpapers"
        >
          <div className="flex items-center gap-2.5 relative z-10">
            <Search className="w-4 h-4 text-[#8E8E8E] group-hover:text-[#EDEDED] transition-colors" />
            <span className="text-[#8E8E8E] group-hover:text-[#EDEDED] text-xs hidden md:inline font-normal transition-colors">
              Search wallpapers
            </span>
            <kbd className="hidden md:flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded text-[10px] text-[#8E8E8E] ml-1 font-mono">
              <span>{isMac ? "⌘" : "Ctrl"}</span>
              <span>K</span>
            </kbd>
          </div>
        </button>
      </div>

      {/* Interactive Bar Search Modal */}
      {isOpen && (
        <InteractiveSearch
          mode="modal"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialQuery={searchQuery}
        />
      )}
    </>
  )
}
