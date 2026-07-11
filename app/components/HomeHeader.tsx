"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, Info, User, Smartphone } from "lucide-react"
import NotificationCenter from "./NotificationCenter"
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

export default function HomeHeader() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Show navbar if scrolling up or at the very top of the page
      if (currentScrollY <= 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false) // Scrolling down
      } else {
        setIsVisible(true) // Scrolling up
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/70 backdrop-blur-md border-b border-white/[0.04] transition-all duration-300 ease-in-out ${
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    }`}>
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex justify-between items-center max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
              <img src="/logo.svg" alt="WallWidgy" className="h-[18px] sm:h-5 block" />
            </Link>
            <span className="hidden sm:inline-block font-mono text-[9px] text-white/30 tracking-widest uppercase border-l border-white/10 pl-3 select-none">
              SYS.V2
            </span>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-full p-1 backdrop-blur-sm">
              <Link href="/favorites" prefetch={false} className="p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5" aria-label="Favorites">
                <Heart className="w-4 h-4 transition-transform hover:scale-110" />
              </Link>
              <Link
                href="/android"
                className="p-2 text-white/60 hover:text-[#F7F06D] transition-all rounded-full hover:bg-white/5"
                aria-label="Android App"
                title="Android App"
              >
                <Smartphone className="w-4 h-4" />
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
            <SignedOut>
              <SignInButton mode="modal">
                <button className="premium-signin-btn p-2.5 rounded-full text-white/90 hover:text-white transition-all sm:hidden" aria-label="Sign In">
                  <User className="w-4 h-4 relative z-10" />
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="premium-signin-btn hidden sm:flex px-5 py-2 rounded-full text-white text-sm font-medium transition-all duration-300 ease-out">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
          </div>
        </nav>
      </header>
    </div>
  )
}
