'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'

export default function ProfileIcon() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <Link href="/profile" aria-label="Profile">
      <User className="w-5 h-5 text-white/80 transition-transform hover:scale-110" />
    </Link>
  )
}

