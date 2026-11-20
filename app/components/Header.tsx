"use client"

import Link from 'next/link'
import { Heart, Info, ArrowLeft, User, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { shouldDisableBlurEffects } from '@/lib/utils'
import NotificationCenter from './NotificationCenter'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

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
          <div className="flex items-center gap-3 sm:gap-4">
            {showBackButton && (
              <Link 
                href={backUrl}
                className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-80 select-none py-1 group"
              aria-label="WallWidgy Home"
            >
              <img
                src="/logo.svg"
                alt="WallWidgy"
                className="h-[18px] sm:h-5 block transition-transform group-hover:scale-105"
              />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-full p-1 backdrop-blur-sm">
              <Link href="/favorites" prefetch={false} className="p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5" aria-label="Favorites" title="Favorites">
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
                title="News"
              >
                <Info className="w-4 h-4" />
              </Link>
              <NotificationCenter />
            </div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="premium-signin-btn p-2 rounded-full text-white/90 hover:text-white transition-all sm:hidden" aria-label="Sign In">
                  <User className="w-4 h-4 relative z-10" />
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="premium-signin-btn hidden sm:flex px-4 py-1.5 rounded-full text-white text-xs font-medium transition-all duration-300 ease-out">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full ring-1 ring-white/10 hover:ring-[var(--accent-light)]/40 transition-all",
                    userButtonPopoverActionButton__manageAccount: "hidden",
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Profile"
                    href="/profile"
                    labelIcon={<User className="w-4 h-4 text-[var(--accent-light)]" />}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </nav>
      </header>
    </div>
  )
}

