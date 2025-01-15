import Image from 'next/image'
import Link from 'next/link'
import { Twitter, Instagram, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 mt-32">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <Link 
              href="https://x.com/notayan69" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </Link>
            <Link 
              href="https://www.instagram.com/notayan_99" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </Link>
            <Link 
              href="https://github.com/not-ayan" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </Link>
          </div>

          <div className="order-first md:order-none">
            <Link href="mailto:notayan99@gmail.com">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image2-l5WVyj1lUkkbqQwuMEHCuDmCxHznok.png"
                alt="Ayan's Logo"
                width={40}
                height={40}
                className="hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          <div className="text-[13px] text-white/60">
            Thank you!
          </div>
        </div>
      </div>
    </footer>
  )
}

