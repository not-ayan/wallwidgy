import Link from 'next/link'
import { Heart, Grid, Info, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { shouldDisableBlurEffects } from '@/lib/utils'

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Header({ showBackButton = false, backUrl = "/" }: HeaderProps) {
  const [disableBlur, setDisableBlur] = useState(false)
  
  useEffect(() => {
    // Check if we should disable blur effects
    setDisableBlur(shouldDisableBlurEffects())
  }, [])
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${disableBlur ? 'bg-[#0A0A0A]/90' : 'bg-[#0A0A0A]/80 backdrop-blur-md'}`}>
      <header className="px-4 sm:px-12 py-5">
        <nav className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link 
                href={backUrl}
                className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <Link href="/" className="text-[var(--accent-light)] hover:text-white transition-all font text-xl sm:text-lg">
              WallWidgy
            </Link>
          </div>
          <div className="flex items-center gap-4 pr-4">
            <Link href="/favorites" aria-label="Favorites">
              <Heart className="w-5 h-5 text-white/80 transition-transform hover:scale-110" />
            </Link>
            <Link href="/categories" aria-label="Categories">
              <Grid className="w-5 h-5 text-white/80 transition-transform hover:scale-110" />
            </Link>
            <Link
              href="/about"
              className="p-2 text-white/80 hover:text-white transition-all"
              aria-label="About"
            >
              <Info className="w-5 h-5" />
            </Link>
          </div>
        </nav>
      </header>
    </div>
  )
}

