'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Share2, Star, Edit2, LogOut, ArrowLeft } from 'lucide-react'
import ProfileImageUpload from '../components/ProfileImageUpload'
import TokenLogin from '../components/TokenLogin'

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; bio: string } | null>(null)
  const [isNewUser, setIsNewUser] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState<string>()
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setIsNewUser(false)
      setName(parsedUser.name)
      setBio(parsedUser.bio || '')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNewUser) {
      const newUser = { id: Math.random().toString(36).substr(2, 9), name, email, bio: '' }
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      setIsNewUser(false)
    } else {
      const updatedUser = { ...user!, name, bio }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      showNotification('Profile updated successfully!')
    }
  }

  const handleShareFavorites = async () => {
    try {
      const shareData = {
        title: 'My Favorite Wallpapers',
        text: `Check out my favorite wallpapers collection`,
        url: `${window.location.origin}/share/${user?.id}`
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showNotification('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/share/${user?.id}`);
        showNotification('Share link copied to clipboard!');
      } catch (clipboardError) {
        showNotification('Unable to share or copy link');
      }
    }
  }

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (isNewUser) {
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

        <main className="pt-28 px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full mb-4">
                <Star className="w-4 h-4 text-[#F7F06D]" />
                <span className="text-sm">GET STARTED</span>
              </div>
              <h1 className="text-3xl font-bold">Access Your Profile</h1>
              <p className="mt-4 text-white/60">
                Enter your email to receive an access token and manage your profile.
              </p>
            </div>

            <TokenLogin
              onSuccess={(token) => {
                localStorage.setItem('accessToken', token)
                window.location.reload()
              }}
            />
          </div>
        </main>
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
            <Link href="/" aria-label="Home">
              <Heart className="w-5 h-5 text-white/80" />
            </Link>
          </nav>
        </header>
      </div>

      <main className="pt-28 px-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-16">
          <ProfileImageUpload
            currentImage={profileImage}
            onImageChange={(file) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                setProfileImage(reader.result as string)
              }
              reader.readAsDataURL(file)
            }}
          />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-purple-500" />
              <span className="text-sm">PROFILE</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-white/80 mb-2">Name</label>
                <input
                  type="text"
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10 focus:border-purple-500 focus:ring-0 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10 focus:border-purple-500 focus:ring-0 transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Update Profile
                </button>
                <button
                  type="button"
                  onClick={handleShareFavorites}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Favorites
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link 
            href="/favorites"
            className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <h3 className="font-medium mb-2">Your Favorites</h3>
            <p className="text-sm text-white/60">
              View and manage your favorite wallpapers collection.
            </p>
          </Link>
          <button
            onClick={handleLogout}
            className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-red-500">
              <LogOut className="w-4 h-4" />
              <h3 className="font-medium">Log Out</h3>
            </div>
            <p className="text-sm text-white/60 mt-2">
              Sign out of your account.
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

