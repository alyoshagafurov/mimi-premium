import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Role-based route protection.
 *   • /admin/*     → ADMIN only (clients bounced to /dashboard)
 *   • /dashboard/* → any signed-in user (admins bounced to /admin)
 * Unauthenticated visitors are redirected to /auth/login with a callbackUrl.
 */
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    const role = token?.role;

    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname.startsWith('/dashboard') && role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Gate access on the presence of a valid session token.
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: '/auth/login' },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
