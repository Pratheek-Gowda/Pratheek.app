import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Only protect actual dashboard/admin routes
const isProtectedRoute = createRouteMatcher([
  '/portal(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;
  const referer = req.headers.get('referer') || '';

  // 1. WhatsApp shortlink redirect
  if (pathname === '/whatsapp' || pathname === '/whatsapp/') {
    return NextResponse.redirect(new URL('https://wa.me/9164132150?text=Hello'));
  }

  // 2. Operator shortcuts
  if (pathname === '/vi' || pathname === '/vi/') {
    return NextResponse.redirect(new URL('/shop/vodafoneidea.html', req.url));
  }
  if (pathname === '/airtel' || pathname === '/airtel/') {
    return NextResponse.redirect(new URL('/shop/airtel.html', req.url));
  }
  if (pathname === '/jio' || pathname === '/jio/') {
    return NextResponse.redirect(new URL('/shop/jio.html', req.url));
  }

  // 3. Post-login redirect to portal
  if (pathname === '/' && (referer.includes('/sign-in') || referer.includes('/sign-up'))) {
    return NextResponse.redirect(new URL('/portal', req.url));
  }

  // 4. Send root domain (/) and (/shop) to storefront
  if (pathname === '/' || pathname === '/shop' || pathname === '/shop/') {
    return NextResponse.redirect(new URL('/shop/index.html', req.url));
  }

  // 5. Clean URLs: allow visiting /shop/guide-mnp without typing .html
  if (pathname.startsWith('/shop/') && !pathname.includes('.')) {
    return NextResponse.rewrite(new URL(`${pathname}.html`, req.url));
  }

  // 6. Protect private portal routes only
  if (isProtectedRoute(req)) {
    auth().protect();
  }

  // 7. Serve portal dashboard on /portal
  if (pathname === '/portal' || pathname === '/portal/') {
    return NextResponse.rewrite(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Ignore static files, ads.txt, and sitemap.xml
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
};
