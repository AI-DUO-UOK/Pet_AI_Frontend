import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/select-role',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/forgot-password',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow root page and public assets/routes
  if (pathname === '/' || publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for Supabase access token in cookies
  const token = request.cookies.get('sb-access-token')?.value;

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    // Store original destination to redirect after login if needed
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
