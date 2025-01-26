'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, LogOut, ArrowLeft } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

import EmailSignIn from '../components/EmailSignIn'

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth)
  const [favoriteCount, setFavoriteCount] = useState(0)

  useEffect(() => {
    function fetchFavorites() {
      const storedFavorites = localStorage.getItem('favorites')
      if (storedFavorites) {
        setFavoriteCount(JSON.parse(storedFavorites).length)
      }
    }

    fetchFavorites()
  }, [])

  const handleLogout = () => {
    signOut(auth)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

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
          </nav>
        </header>
      </div>

      <main className="pt-28 px-8 max-w-4xl mx-auto">
        {user ? (
          <div className="space-y-8">
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32 rounded-full overflow-hidden">
                <Image
                  src={user.photoURL || '/placeholder.svg'}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.displayName || user.email}
                </h2>
                <p className="text-white/60">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <Link
                href="/favorites"
                className="flex items-center gap-2 px-4 py-2 bg-[#F7F06D] text-black rounded-xl hover:bg-[#F7F06D]/90 transition-colors"
              >
                <Heart className="w-4 h-4" />
                View Favorites ({favoriteCount})
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">Access Your Profile</h1>
              <p className="mt-4 text-white/60">
                Sign in to manage your favorites and profile.
              </p>
            </div>

            <EmailSignIn />

            <div className="mt-8 text-center">
              <p className="text-white/60">
                Not ready to sign in? You can still{' '}
                <Link href="/favorites" className="text-[#F7F06D] hover:underline">
                  view your favorites ({favoriteCount})
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

