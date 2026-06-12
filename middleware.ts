import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req) => {
  // Allow all routes (including /favorites) to be accessible without forced login.
  // Clerk is used optionally to check sign-in state.
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
