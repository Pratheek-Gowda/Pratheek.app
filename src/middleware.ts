import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Public Route Registry (Bypasses Clerk authentication shield)
const isPublicRoute = createRouteMatcher([
  '/shop(.*)',           // Public access to Pratheek Enterprises shop
  '/api/chat(.*)',       // Public access for the shop's AI Chatbot API
  '/sign-in(.*)',        // Clerk Sign-In portal
  '/sign-up(.*)',        // Clerk Sign-Up portal
  '/.well-known(.*)'     // Domain & Microsoft identity verification files
]);

// 2. Edge Middleware with Smart Subpath Routing & Clerk Identity Shield
export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // Automatically route https://pratheek.app/shop -> /shop/index.html
  // Ensuring relative images (d1.png) and links (airtel.html) resolve inside /shop/
  if (pathname === '/shop' || pathname === '/shop/') {
    return NextResponse.redirect(new URL('/shop/index.html', req.url));
  }

  // Support clean extensionless sub-routes (e.g., /shop/airtel -> /shop/airtel.html)
  if (pathname.startsWith('/shop/') && !pathname.includes('.')) {
    return NextResponse.rewrite(new URL(`${pathname}.html`, req.url));
  }

  // Gate 1: Global Identity Shield for protected app & API routes
  if (!isPublicRoute(req)) {
    auth().protect();
  }

  return NextResponse.next();
});

// 3. Edge Matcher Configuration
export const config = {
  matcher: [
    // Skip Next.js internals and direct static file requests
    '/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always execute middleware on API routes
    '/(api|trpc)(.*)',
  ],
};
