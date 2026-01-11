import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/categories(.*)',
  '/color(.*)',
  '/wallpaper(.*)',
  '/latest(.*)',
  '/search(.*)',
  '/favorites(.*)',
  '/news(.*)',
  '/api(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Add security headers
  const response = NextResponse.next()
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET')
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Cache images aggressively
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|gif|png|webp|svg)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Protect non-public routes (uncomment below to enforce auth)
  // if (!isPublicRoute(request)) {
  //   await auth.protect()
  // }
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
