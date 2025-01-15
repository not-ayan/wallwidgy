'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

interface BottomSheetProps {
  children: React.ReactNode
  preview: React.ReactNode
}

export default function BottomSheet({ children, preview }: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY
      currentY.current = sheet.getBoundingClientRect().top
      sheet.style.transition = 'none'
    }

    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY.current
      const newY = Math.min(
        Math.max(currentY.current + deltaY, window.innerHeight * 0.2),
        window.innerHeight * 0.9
      )
      sheet.style.transform = `translateY(${newY - currentY.current}px)`
    }

    const handleTouchEnd = () => {
      sheet.style.transition = 'transform 0.3s ease-out'
      const currentTransform = sheet.style.transform
      const currentPosition = parseInt(currentTransform.replace(/[^-\d.]/g, '')) || 0
      
      if (currentPosition < -50) {
        setIsExpanded(true)
        sheet.style.transform = 'translateY(0)'
      } else if (currentPosition > 50) {
        setIsExpanded(false)
        sheet.style.transform = 'translateY(0)'
      } else {
        sheet.style.transform = 'translateY(0)'
      }
    }

    const dragHandle = dragRef.current
    if (dragHandle) {
      dragHandle.addEventListener('touchstart', handleTouchStart)
      dragHandle.addEventListener('touchmove', handleTouchMove)
      dragHandle.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener('touchstart', handleTouchStart)
        dragHandle.removeEventListener('touchmove', handleTouchMove)
        dragHandle.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [])

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 bg-[#0A0A0A] rounded-t-3xl transition-transform duration-300 ease-out ${
        isExpanded ? 'h-[80vh]' : 'h-auto'
      }`}
    >
      <div
        ref={dragRef}
        className="h-12 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full" />
      </div>
      <div className="px-4 pb-8 overflow-y-auto max-h-[calc(80vh-3rem)]">
        {isExpanded ? children : preview}
      </div>
    </div>
  )
}

