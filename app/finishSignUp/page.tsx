'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'

export default function FinishSignUp() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        email = window.prompt('Please provide your email for confirmation')
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn')
            router.push('/profile')
          })
          .catch((error) => {
            setError(error.message)
          })
      }
    }
  }, [router])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return <div className="text-white">Finishing sign-in...</div>
}

