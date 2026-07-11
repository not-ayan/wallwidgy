import Link from 'next/link'
import { Twitter, Instagram, Github } from 'lucide-react'

interface FooterProps {
  variant?: 'default' | 'blueprint'
}

export default function Footer({ variant = 'default' }: FooterProps) {
  if (variant === 'blueprint') {
    return (
      <footer className="border-t border-white/10 bg-[#060606] font-mono">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Column 1: Copyright */}
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-4 h-full">
            <span className="text-[9px] text-white/30 uppercase tracking-widest block">SYSTEM ID</span>
            <div className="text-[10px] text-white/60 tracking-wider">
              WALLWIDGY.APP &copy; 2026<br />
              ALL RIGHTS SALVAGED.
            </div>
          </div>

          {/* Column 2: Tech Stack */}
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-4 h-full">
            <span className="text-[9px] text-white/30 uppercase tracking-widest block">STACK ENGINE</span>
            <div className="text-[10px] text-white/60 tracking-wider">
              POWERED BY NEXT.JS &amp;<br />
              VERIFIED CDN NETWORKS.
            </div>
          </div>

          {/* Column 3: Site Navigation */}
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-4 h-full">
            <span className="text-[9px] text-white/30 uppercase tracking-widest block">NAVIGATION</span>
            <div className="flex flex-col gap-2 text-[10px]">
              <Link
                href="/"
                className="text-white/50 hover:text-[#F7F06D] transition-colors"
              >
                // HOME
              </Link>
              <Link
                href="/favorites"
                className="text-white/50 hover:text-[#F7F06D] transition-colors"
              >
                // FAVORITES
              </Link>
              <Link
                href="/#categories-bar"
                className="text-white/50 hover:text-[#F7F06D] transition-colors"
              >
                // CATEGORIES
              </Link>
              <Link
                href="/api"
                className="text-white/50 hover:text-[#F7F06D] transition-colors"
              >
                // REST API
              </Link>
              <Link
                href="/android"
                className="text-white/50 hover:text-[#F7F06D] transition-colors"
              >
                // ANDROID APP
              </Link>
            </div>
          </div>

          {/* Column 4: Access Status */}
          <div className="p-6 sm:p-8 flex flex-col justify-between items-start md:items-end gap-4 h-full">
            <span className="text-[9px] text-white/30 uppercase tracking-widest block">VERIFIED ACCESS</span>
            <span className="text-[10px] text-[#F7F06D] tracking-widest uppercase font-semibold">THANK YOU!</span>
          </div>
        </div>
      </footer>
    )
  }

  // Default variant (modern glassmorphism)
  return (
    <footer className="border-t border-white/[0.04] bg-gradient-to-b from-[#0A0A0A]/40 to-[#050505]/95 backdrop-blur-md mt-32 relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[1px] bg-gradient-to-r from-transparent via-[#F7F06D]/15 to-transparent pointer-events-none" />
      
      <div className="max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-start">
          
          {/* Left: Brand / Logo */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-title text-xl tracking-wider text-white">WALLWIDGY</h3>
                <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase block mt-0.5">MK. II PLATFORM</span>
              </div>
            </div>
            <p className="text-white/40 text-xs max-w-sm font-light leading-relaxed font-outfit">
              A highly curated library of minimal aesthetics and high-resolution digital canvasses.
            </p>
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/30 tracking-widest uppercase pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] animate-pulse" />
              <span>ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Middle: Links */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Navigation</span>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-outfit">
              <Link href="/" className="text-white/50 hover:text-white transition-colors duration-200">
                Home
              </Link>
              <Link href="/favorites" className="text-white/50 hover:text-white transition-colors duration-200">
                Favorites
              </Link>
              <Link href="/#categories-bar" className="text-white/50 hover:text-white transition-colors duration-200">
                Categories
              </Link>
              <Link href="/news" className="text-white/50 hover:text-white transition-colors duration-200">
                Field Journal
              </Link>
              <Link href="/android" className="text-white/50 hover:text-white transition-colors duration-200">
                Android App
              </Link>
              <Link href="/api" className="text-white/50 hover:text-white transition-colors duration-200">
                REST API
              </Link>
            </div>
          </div>

          {/* Right: Social & Gratitude */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end gap-6 text-left md:text-right">
            <div>
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-1">Gratitude</span>
              <div className="text-sm font-light text-white/70 italic font-sans">
                Thank you!
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="https://x.com/notayan69"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#1DA1F2] hover:bg-white/[0.03] transition-all duration-300 p-2 bg-white/5 rounded-lg border border-white/5 hover:border-[#1DA1F2]/20 hover:-translate-y-0.5"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </Link>
              <Link
                href="https://www.instagram.com/notayan_99"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#E1306C] hover:bg-white/[0.03] transition-all duration-300 p-2 bg-white/5 rounded-lg border border-white/5 hover:border-[#E1306C]/20 hover:-translate-y-0.5"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              <Link
                href="https://github.com/not-ayan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white hover:bg-white/[0.03] transition-all duration-300 p-2 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 hover:-translate-y-0.5"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest pt-2">
              WALLWIDGY.APP &copy; 2026
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
