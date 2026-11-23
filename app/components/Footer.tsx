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
                className="text-white/50 hover:text-[#EDEDED] transition-colors"
              >
                // HOME
              </Link>
              <Link
                href="/favorites"
                className="text-white/50 hover:text-[#EDEDED] transition-colors"
              >
                // FAVORITES
              </Link>
              <Link
                href="/#categories-bar"
                className="text-white/50 hover:text-[#EDEDED] transition-colors"
              >
                // CATEGORIES
              </Link>
              <Link
                href="/api"
                className="text-white/50 hover:text-[#EDEDED] transition-colors"
              >
                // REST API
              </Link>
              <Link
                href="/android"
                className="text-white/50 hover:text-[#EDEDED] transition-colors"
              >
                // ANDROID APP
              </Link>
            </div>
          </div>

          {/* Column 4: Access Status */}
          <div className="p-6 sm:p-8 flex flex-col justify-between items-start md:items-end gap-4 h-full">
            <span className="text-[9px] text-white/30 uppercase tracking-widest block">VERIFIED ACCESS</span>
            <span className="text-[10px] text-[#EDEDED] tracking-widest uppercase font-semibold">THANK YOU!</span>
          </div>
        </div>
      </footer>
    )
  }

  // Default variant (clean editorial footer)
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0A] mt-24 relative overflow-hidden">
      <div className="max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 items-start">
          
          {/* Left: Brand / Info */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-base font-medium tracking-tight text-[#EDEDED]">Wallwidgy</h3>
            <p className="text-[#8E8E8E] text-xs max-w-sm leading-relaxed">
              A curated collection of minimalist wallpapers &amp; high-resolution digital canvases for desktop and mobile.
            </p>
            <p className="text-xs text-[#555555]">
              wallwidgy.app &copy; 2026
            </p>
          </div>

          {/* Middle: Links */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="text-xs font-medium text-[#EDEDED]">Navigation</span>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
              <Link href="/" className="text-[#8E8E8E] hover:text-[#EDEDED] transition-colors">
                Home
              </Link>
              <Link href="/favorites" className="text-[#8E8E8E] hover:text-[#EDEDED] transition-colors">
                Favorites
              </Link>
              <Link href="/search" className="text-[#8E8E8E] hover:text-[#EDEDED] transition-colors">
                Search
              </Link>
              <Link href="/news" className="text-[#8E8E8E] hover:text-[#EDEDED] transition-colors">
                Journal
              </Link>
              <Link href="/android" className="text-[#8E8E8E] hover:text-[#EDEDED] transition-colors">
                Android App
              </Link>
              <Link href="/api" className="text-[#8E8E8E] hover:text-[#EDEDED] transition-colors">
                REST API
              </Link>
            </div>
          </div>

          {/* Right: Social Links */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end gap-4 text-left md:text-right">
            <span className="text-xs font-medium text-[#EDEDED]">Connect</span>
            <div className="flex items-center gap-2">
              <Link
                href="https://x.com/notayan69"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-white/[0.08] transition-colors p-2 bg-white/[0.03] rounded-lg border border-white/[0.08]"
                title="Twitter / X"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </Link>
              <Link
                href="https://www.instagram.com/notayan_99"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-white/[0.08] transition-colors p-2 bg-white/[0.03] rounded-lg border border-white/[0.08]"
                title="Instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              <Link
                href="https://github.com/not-ayan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-white/[0.08] transition-colors p-2 bg-white/[0.03] rounded-lg border border-white/[0.08]"
                title="GitHub"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
