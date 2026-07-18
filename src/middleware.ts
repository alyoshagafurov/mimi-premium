import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { isStaff, canAccessSection, sectionFromPath } from '@/lib/roles';

/**
 * Role-based route protection.
 *   • /admin/*     → staff roles (ADMIN/OPS/videographer/sales/…); clients bounced
 *                    to /dashboard. Limited staff can only reach sections their
 *                    role allows (everything else → /admin/calendar).
 *   • /dashboard/* → clients only (staff bounced to /admin).
 * Unauthenticated visitors are redirected to /auth/login with a callbackUrl.
 */
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    const role = token?.role as string | undefined;

    if (pathname.startsWith('/admin')) {
      if (!isStaff(role)) return NextResponse.redirect(new URL('/dashboard', req.url));
      if (!canAccessSection(role, sectionFromPath(pathname))) {
        return NextResponse.redirect(new URL('/admin/calendar', req.url));
      }
    }
    if (pathname.startsWith('/dashboard') && isStaff(role)) {
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
