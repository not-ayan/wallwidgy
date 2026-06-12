"use client"

import Link from 'next/link'
import { Heart, Info, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { shouldDisableBlurEffects } from '@/lib/utils'
import NotificationCenter from './NotificationCenter'

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Header({ showBackButton = false, backUrl = "/" }: HeaderProps) {
  const [disableBlur, setDisableBlur] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  useEffect(() => {
    // Check if we should disable blur effects
    setDisableBlur(shouldDisableBlurEffects())
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY <= 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] ${disableBlur ? 'bg-[#0A0A0A]/90' : 'bg-[#0A0A0A]/70 backdrop-blur-md'} transition-all duration-300 ease-in-out ${
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    }`}>
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex justify-between items-center max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link 
                href={backUrl}
                className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="flex items-center gap-3">
              <Link href="/" className="text-[var(--accent-light)] hover:text-white transition-all font text-xl sm:text-lg">
                WallWidgy
              </Link>
              <span className="hidden sm:inline-block font-mono text-[9px] text-white/30 tracking-widest uppercase border-l border-white/10 pl-3 select-none">
                SYS.V2
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-full p-1 backdrop-blur-sm">
              <Link href="/favorites" prefetch={false} className="p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5" aria-label="Favorites">
                <Heart className="w-4 h-4 transition-transform hover:scale-110" />
              </Link>
              <Link
                href="/news"
                className="p-2 text-white/60 hover:text-[#F7F06D] transition-all rounded-full hover:bg-white/5"
                aria-label="News"
              >
                <Info className="w-4 h-4" />
              </Link>
              <NotificationCenter />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}

