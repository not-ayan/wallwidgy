'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Trash2, RefreshCw } from 'lucide-react'

interface Wallpaper {
  public_id: string;
  name: string;
  preview_url: string;
  resolution: string;
  tag: 'Mobile' | 'Desktop';
  uploadDate: Date;
}

export default function AdminPanel() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWallpapers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/wallpapers')
      const data = await response.json()
      
      const wallpaperData = data.map((wallpaper: any) => ({
        public_id: wallpaper.public_id,
        name: wallpaper.filename,
        preview_url: cloudinaryUrl(wallpaper.public_id, {
          width: 400,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        }),
        resolution: `${wallpaper.width}x${wallpaper.height}`,
        tag: wallpaper.height > wallpaper.width ? 'Mobile' : 'Desktop',
        uploadDate: new Date(wallpaper.created_at),
      }))

      setWallpapers(wallpaperData)
    } catch (err: any) {
      setError(`Failed to fetch wallpapers: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWallpapers()
  }, [fetchWallpapers])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true)
    setError(null)

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        await response.json()
      } catch (err: any) {
        setError(`Failed to upload ${file.name}: ${err.message}`)
      }
    }

    setIsLoading(false)
    fetchWallpapers()
  }, [fetchWallpapers])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleDelete = useCallback(async (public_id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/wallpapers/${public_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }

      fetchWallpapers()
    } catch (err: any) {
      setError(`Failed to delete wallpaper: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [fetchWallpapers])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 text-center cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {isLoading && <p className="text-center mb-4">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {wallpapers.map((wallpaper) => (
          <div key={wallpaper.public_id} className="relative group">
            <img
              src={wallpaper.preview_url || "/placeholder.svg"}
              alt={wallpaper.name}
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                onClick={() => handleDelete(wallpaper.public_id)}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium">{wallpaper.name}</p>
              <p className="text-xs text-gray-500">{wallpaper.resolution} - {wallpaper.tag}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={fetchWallpapers}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
      >
        <RefreshCw size={20} className="mr-2" />
        Refresh Wallpapers
      </button>
    </div>
  )
}

function cloudinaryUrl(publicId: string, options: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
}) {
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  const transformationString = transformations.join(',');
  
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`;
}

