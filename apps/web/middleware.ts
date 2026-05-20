import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && payload?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const protectedPaths = ['/dashboard', '/builds/create'];
  if (
    protectedPaths.some((p) => pathname.startsWith(p)) &&
    !payload
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/builds/create'],
};
