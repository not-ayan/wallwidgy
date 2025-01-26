'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { Loader2 } from 'lucide-react'
import { handleFirebaseError } from '@/lib/firebaseErrors'
import ReCAPTCHA from "react-google-recaptcha"

export default function EmailSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'signin') {
        if (email === 'admin' && password === 'yVZSTJQPrCLr1UWLmSc8EfsJdjA') {
          // Redirect to admin panel
          window.location.href = '/admin'
          return
        }
        await signInWithEmailAndPassword(auth, email, password)
      } else if (mode === 'signup') {
        if (!captchaToken) {
          throw new Error('Please complete the CAPTCHA')
        }
        await createUserWithEmailAndPassword(auth, email, password)
        // Here you would typically store the user's name in your database
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name })
        }
      }
    } catch (error: any) {
      setError(handleFirebaseError(error.code))
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetEmailSent(true)
    } catch (error: any) {
      setError(handleFirebaseError(error.code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {mode !== 'reset' ? (
        <>
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`px-4 py-2 rounded-full ${
                mode === 'signin' ? 'bg-[#F7F06D] text-black' : 'bg-white/10 text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`px-4 py-2 rounded-full ${
                mode === 'signup' ? 'bg-[#F7F06D] text-black' : 'bg-white/10 text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0 transition-colors"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0 transition-colors"
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0 transition-colors"
              />
            </div>
            {mode === 'signup' && (
              <ReCAPTCHA
                sitekey="YOUR_RECAPTCHA_SITE_KEY"
                onChange={(token) => setCaptchaToken(token)}
              />
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-lg hover:bg-[#F7F06D]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Sign Up'}
                </>
              )}
            </button>
          </form>
          <button
            onClick={() => setMode('reset')}
            className="text-sm text-[#F7F06D] hover:underline"
          >
            Forgot password?
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4">Reset Password</h2>
          {resetEmailSent ? (
            <div className="text-center">
              <p className="mb-4">Password reset link sent. Check your email.</p>
              <button
                onClick={() => { setMode('signin'); setResetEmailSent(false); }}
                className="px-4 py-2 bg-[#F7F06D] text-black rounded-lg hover:bg-[#F7F06D]/90 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-white/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0 transition-colors"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-lg hover:bg-[#F7F06D]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}

