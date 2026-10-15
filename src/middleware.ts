import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are completely public
const isPublicRoute = createRouteMatcher([
  '/shop(.*)',           // Allows public access to the shop and all its pages/assets
  '/api/chat(.*)',       // Allows the shop AI chatbot to work without requiring login
  '/sign-in(.*)',        // Clerk Sign In page
  '/sign-up(.*)',        // Clerk Sign Up page
  '/.well-known(.*)'     // Domain & identity verification files
]);

// Gate 1: Global Identity Shield
// This middleware runs on Vercel's Edge network before the page or API is even hit.
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // If the user does not have a valid Clerk session, they are instantly 
    // redirected to the Clerk Login page using the Environment Variables you set.
    await auth.protect();
  }
});

// Configure the matcher to run on all pages and API routes, excluding static assets
export const config = {
  matcher: [
    // Skip Next.js internals and static files (like your style.css or script.js)
    '/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always protect all API routes (your existing /api/admin, /api/login, etc.)
    '/(api|trpc)(.*)',
  ],
};
