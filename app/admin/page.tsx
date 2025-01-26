'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPanel from '../components/AdminPanel'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'bZqfaCt!2kde9vrqhqQ1SEM$xk3uyUxnsP0v9d#Px1'

export default function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthorized(true)
      setError(null)
    } else {
      setError('Invalid credentials')
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-8 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-[#F7F06D] focus:ring-0"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#F7F06D] text-black px-4 py-3 rounded-lg hover:bg-[#F7F06D]/90 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminPanel />
}

