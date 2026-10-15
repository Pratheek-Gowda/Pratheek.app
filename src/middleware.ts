import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Make root (/), /shop, and Clerk auth pages public
const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/api/chat(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/.well-known(.*)'
]);

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;
  const referer = req.headers.get('referer') || '';

  // If Clerk just finished signing in and redirected to '/', send user to '/portal'
  if (pathname === '/' && (referer.includes('/sign-in') || referer.includes('/sign-up'))) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  // Route main domain (/) and (/shop) directly to your shop storefront
  if (pathname === '/' || pathname === '/shop' || pathname === '/shop/') {
    return NextResponse.redirect(new URL('/shop/index.html', req.url));
  }

  // Support clean links inside shop (e.g., /shop/airtel -> /shop/airtel.html)
  if (pathname.startsWith('/shop/') && !pathname.includes('.')) {
    return NextResponse.rewrite(new URL(`${pathname}.html`, req.url));
  }

  // Protect all non-public routes (including /portal and /api/*) with Clerk
  if (!isPublicRoute(req)) {
    auth().protect();
  }

  // Serve your existing src/app/page.tsx dashboard on the /portal subpath
  if (pathname === '/portal' || pathname === '/portal/') {
    return NextResponse.rewrite(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
