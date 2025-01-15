'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPanel() {
  const [wallpapers, setWallpapers] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        router.push('/login')
      } else {
        initializeAndFetchWallpapers()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function initializeAndFetchWallpapers() {
    try {
      const { data, error } = await supabase
        .from('wallpapers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setWallpapers(data || [])
    } catch (error) {
      console.error('Error fetching wallpapers:', error)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  async function handleUpload() {
    if (!file || !session) return

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(`${Date.now()}_${file.name}`, file)

      if (uploadError) throw uploadError

      if (data) {
        const { error: insertError } = await supabase
          .from('wallpapers')
          .insert({
            name: await generateWallpaperName(file.name),
            file_path: data.path
          })

        if (insertError) throw insertError

        initializeAndFetchWallpapers()
        setFile(null)
      }
    } catch (error) {
      console.error('Error in handleUpload:', error)
    }
  }

  async function generateWallpaperName(fileName: string) {
    // Implement AI name generation here
    // For now, we'll just return the file name without extension
    return fileName.split('.').slice(0, -1).join('.')
  }

  async function handleDelete(id: string) {
    if (!session) return

    try {
      const { error } = await supabase
        .from('wallpapers')
        .delete()
        .match({ id })

      if (error) throw error

      initializeAndFetchWallpapers()
    } catch (error) {
      console.error('Error deleting wallpaper:', error)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!session) {
    return null // Or a loading spinner
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={handleSignOut}
          className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
      <div className="mb-8">
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="mb-2 text-white"
        />
        <button
          onClick={handleUpload}
          disabled={!file}
          className="bg-gray-700 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-gray-600 transition-colors"
        >
          Upload Wallpaper
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wallpapers.map(wallpaper => (
          <div key={wallpaper.id} className="relative group overflow-hidden rounded-lg">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wallpapers/${wallpaper.file_path}`}
              alt={wallpaper.name}
              width={300}
              height={200}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm text-white">{wallpaper.name}</p>
              <button
                onClick={() => handleDelete(wallpaper.id)}
                className="mt-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md hover:bg-gray-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

