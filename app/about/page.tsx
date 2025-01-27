import Link from 'next/link'
import Image from 'next/image'
import { Heart, Twitter, Instagram, Github, Star, ArrowLeft } from 'lucide-react'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'

export default function About() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link 
              href="/" 
              className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/" aria-label="Home">
              <Heart className="w-5 h-5 text-white/80" />
            </Link>
          </nav>
        </header>
      </div>

      <main className="pt-28 px-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-16">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#0A0A0A]">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/me-SlOED6Wcfz7pJOIEyAotbhuFVB7xVN.png"
              alt="Ayan's Profile"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-[#F7F06D]" />
              <span className="text-sm">SELF-SUMMARY</span>
            </div>

            <h1 className="text-4xl font-bold">Ayan</h1>
            
            <p className="text-lg text-white/80">
              Hi, I’m a new designer diving into web and UI design. I put together this wallpaper collection to share my love for simple, stylish looks that make your digital spaces feel just right.
            </p>

            <div className="flex gap-4">
              <Link 
                href="https://x.com/notayan69" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link 
                href="https://www.instagram.com/notayan_99" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link 
                href="https://github.com/not-ayan" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Experience</h2>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5">
                <div className="text-sm text-[#F7F06D]">2023 - Present</div>
                <div className="font-medium mt-2">Learning web & ui design</div>
                <div className="text-sm text-white/60 mt-1">Freelance</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5">
                <div className="text-sm text-[#F7F06D]">2019 - 2023</div>
                <div className="font-medium mt-2">Graphic Designer</div>
                <div className="text-sm text-white/60 mt-1">Freelance</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Education</h2>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5">
                <div className="text-sm text-[#F7F06D]">2021 - 2024</div>
                <div className="font-medium mt-2">Honours in Mathematical Sciences</div>
                <div className="text-sm text-white/60 mt-1">Chaiduar College</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5">
                <div className="text-sm text-[#F7F06D]">2019 - 2021</div>
                <div className="font-medium mt-2">Almost done with school, college is up next!</div>
                <div className="text-sm text-white/60 mt-1">School</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link 
            href="/"
            className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <h3 className="font-medium mb-2">Browse Wallpapers</h3>
            <p className="text-sm text-white/60">
              Explore our collection of carefully curated minimalist wallpapers.
            </p>
          </Link>
          <Link 
            href="mailto:notayan99@gmail.com"
            className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <h3 className="font-medium mb-2">Get in Touch</h3>
            <p className="text-sm text-white/60">
              Have questions or just want to chat about design? Feel free to reach out!
            </p>
          </Link>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}

