import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Execute Clerk middleware on routes that require server-side auth or user metadata
    '/favorites(.*)',
    '/api/favorites(.*)',
    '/profile(.*)',
    '/api/profile(.*)',
    '/api/setups(.*)',
  ],
}

