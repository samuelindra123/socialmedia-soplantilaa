import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/verify',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/manifesto',
  '/roadmap',
  '/changelog',
  '/early-access',
  '/pricing',
  '/features',
  '/cookies',
  '/blog',
  '/post',
  '/oauth/callback',
  '/oauth/consent',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil token dari cookies
  const token = request.cookies.get('token')?.value;

  // Cek apakah rute saat ini adalah public
  const prefixRoutes = ['/blog', '/features', '/pricing', '/post', '/forgot-password'];

  const isPublicRoute = publicRoutes.some(route => {
    if (prefixRoutes.includes(route)) {
      return pathname === route || pathname.startsWith(route + '/');
    }
    return pathname === route;
  });

  // Izinkan akses ke halaman publik tanpa login
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Jika rute BUKAN public dan TIDAK ada token -> Redirect ke login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika user SUDAH login tapi akses halaman auth -> Redirect ke feed
  if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};