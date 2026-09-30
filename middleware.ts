import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Only execute Clerk middleware on routes that require server-side auth
    '/favorites(.*)',
    '/api/favorites(.*)',
  ],
}

