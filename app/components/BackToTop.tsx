'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {/* Mobile: fixed bottom-right corner icon */}
      <div className={`fixed bottom-24 right-4 z-50 md:hidden transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={scrollToTop}
          className="group relative bg-[#0A0A0A] rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[var(--accent-light)]/40 hover:bg-[#111111] transition-all duration-300 hover:scale-105 active:scale-95 w-10 h-10"
          aria-label="Back to top"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-light)]/5 via-transparent to-[var(--accent-light)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <ChevronUp className="w-5 h-5 text-white/80 group-hover:text-[var(--accent-light)] transition-colors duration-300 relative z-10" />
        </button>
      </div>

      {/* Desktop: right-aligned pill within the grid container */}
      <div className={`hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-[88%] xl:max-w-[85%] px-4 md:px-6 lg:px-8 pointer-events-none z-50 justify-end transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <button
          onClick={scrollToTop}
          className={`pointer-events-auto group relative bg-[#0A0A0A] rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[var(--accent-light)]/40 hover:bg-[#111111] transition-all duration-300 hover:scale-105 active:scale-95 h-10 px-5 ${
            !isVisible ? 'pointer-events-none' : ''
          }`}
          aria-label="Back to top"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-light)]/5 via-transparent to-[var(--accent-light)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-2 relative z-10">
            <ChevronUp className="w-4 h-4 text-white/80 group-hover:text-[var(--accent-light)] transition-colors duration-300" />
            <span className="text-white/55 group-hover:text-white text-[10px] font-mono tracking-wider uppercase transition-colors duration-300">
              Back to Top
            </span>
          </div>
        </button>
      </div>
    </>
  )
}
