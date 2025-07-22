'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { shouldDisableBlurEffects } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const [disableBlur, setDisableBlur] = useState(false)
  
  useEffect(() => {
    // Check if we should disable blur effects
    setDisableBlur(shouldDisableBlurEffects())
    
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-black/95 ${disableBlur ? '' : 'backdrop-blur-sm'}`}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  )
}

