import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Only define routes that explicitly REQUIRE a login
// Any route NOT listed here will remain accessible or correctly show a 404 if it does not exist.
const isProtectedRoute = createRouteMatcher([
  '/portal(.*)',
  // Add any private API routes here if needed, e.g.: '/api/admin(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const referer = req.headers.get('referer') || '';

  // 1. If Clerk just finished signing in and redirected to '/', send user to '/portal'
  if (pathname === '/' && (referer.includes('/sign-in') || referer.includes('/sign-up'))) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  // 2. Route main domain (/) and (/shop) directly to your shop storefront
  if (pathname === '/' || pathname === '/shop' || pathname === '/shop/') {
    return NextResponse.redirect(new URL('/shop/index.html', req.url));
  }

  // 3. Support clean links inside shop (e.g., /shop/airtel -> /shop/airtel.html)
  if (pathname.startsWith('/shop/') && !pathname.includes('.')) {
    return NextResponse.rewrite(new URL(`${pathname}.html`, req.url));
  }

  // 4. Protect ONLY the routes defined in isProtectedRoute (/portal, etc.)
  if (isProtectedRoute(req)) {
    if (typeof auth.protect === 'function') {
      await auth.protect();
    } else {
      auth().protect();
    }
  }

  // 5. Serve your existing src/app/page.tsx dashboard on the /portal subpath
  if (pathname === '/portal' || pathname === '/portal/') {
    return NextResponse.rewrite(new URL('/', req.url));
  }

  // 6. Let all other requests pass through (allowing Next.js to trigger 404 for unknown URLs)
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Exclude static assets, ads.txt, and sitemap.xml so they bypass the middleware entirely
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
};
