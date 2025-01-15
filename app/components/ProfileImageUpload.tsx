'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'

interface ProfileImageUploadProps {
  currentImage?: string
  onImageChange: (file: File) => void
}

export default function ProfileImageUpload({ currentImage, onImageChange }: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      onImageChange(file)
    }
  }

  return (
    <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#0A0A0A]">
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt="Profile"
          fill
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-white/5" />
      )}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-4 right-4 p-3 rounded-xl bg-[#F7F06D] text-black hover:bg-[#F7F06D]/90 transition-all"
      >
        <Camera className="w-5 h-5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

