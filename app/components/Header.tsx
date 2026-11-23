"use client"

import Link from "next/link"
import { Heart, Info, ArrowLeft, User, Smartphone } from "lucide-react"
import { useEffect, useState } from "react"
import { shouldDisableBlurEffects } from "@/lib/utils"
import NotificationCenter from "./NotificationCenter"
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

interface HeaderProps {
  showBackButton?: boolean
  backUrl?: string
}

export default function Header({ showBackButton = false, backUrl = "/" }: HeaderProps) {
  const [disableBlur, setDisableBlur] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
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
    <div
      className={`fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] ${
        disableBlur ? "bg-[#0A0A0A]/95" : "bg-[#0A0A0A]/80 backdrop-blur-md"
      } transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <header className="px-4 sm:px-6 lg:px-8 py-3.5">
        <nav className="flex justify-between items-center max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto">
          {/* Left: Back button & Brand Logo */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Link
                href={backUrl}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity select-none py-1"
              aria-label="WallWidgy Home"
            >
              <img
                src="/logo.svg"
                alt="WallWidgy"
                className="h-[18px] sm:h-5 block"
              />
            </Link>
          </div>

          {/* Right: Navigation Pill & User Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quiet Nav Pill */}
            <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-full p-1">
              <Link
                href="/favorites"
                prefetch={false}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors"
                aria-label="Favorites"
                title="Favorites"
              >
                <Heart className="w-4 h-4" />
              </Link>
              <Link
                href="/android"
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors"
                aria-label="Android App"
                title="Android App"
              >
                <Smartphone className="w-4 h-4" />
              </Link>
              <Link
                href="/news"
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors"
                aria-label="Journal"
                title="Journal"
              >
                <Info className="w-4 h-4" />
              </Link>
              <NotificationCenter />
            </div>

            {/* User Auth: Sign In or UserButton */}
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="p-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-colors sm:hidden"
                  aria-label="Sign In"
                >
                  <User className="w-4 h-4" />
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-7 h-7 rounded-full ring-1 ring-white/10 hover:ring-white/30 transition-all",
                    userButtonPopoverActionButton__manageAccount: "hidden",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Profile"
                    href="/profile"
                    labelIcon={<User className="w-4 h-4 text-white" />}
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