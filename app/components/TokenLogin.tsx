'use client'

import { useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'

interface TokenLoginProps {
  onSuccess: (user: any) => void
}

export default function TokenLogin({ onSuccess }: TokenLoginProps) {
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSignup, setIsSignup] = useState(true)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setMessage(`Signup successful! Your token is: ${data.token}`)
      setToken(data.token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      onSuccess(data.user)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setIsSignup(true)}
          className={`px-4 py-2 rounded-full ${
            isSignup ? 'bg-[#F7F06D] text-black' : 'bg-white/10 text-white'
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => setIsSignup(false)}
          className={`px-4 py-2 rounded-full ${
            !isSignup ? 'bg-[#F7F06D] text-black' : 'bg-white/10 text-white'
          }`}
        >
          Login
        </button>
      </div>

      {isSignup ? (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0 transition-colors"
              placeholder="Enter your name"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          {message && (
            <p className="text-green-500 text-sm">{message}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-xl hover:bg-[#F7F06D]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing up...
              </>
            ) : (
              <>
                <span className="text-lg">Sign Up</span>
                <div className="ml-2 bg-black/10 rounded-full p-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-white/80 mb-2">
              Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 rounded-xl text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0 transition-colors"
              placeholder="Enter your token"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-xl hover:bg-[#F7F06D]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <span className="text-lg">Login</span>
                <div className="ml-2 bg-black/10 rounded-full p-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

