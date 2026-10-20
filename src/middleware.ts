import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the routes you want to protect
const isProtectedRoute = createRouteMatcher([
  '/portal(.*)',
  // Add other protected routes here if needed
]);

export default clerkMiddleware((auth, req) => {
  // Protect ONLY the routes defined in isProtectedRoute
  if (isProtectedRoute(req)) {
    // Correct usage for Clerk v5+: call auth() to get the object, then protect()
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
