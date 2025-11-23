import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/', '/admin'];
const AUTH_PREFIX = '/auth';

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const isAuthPath = pathname === AUTH_PREFIX || pathname.startsWith(`${AUTH_PREFIX}/`);
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!token && isProtected && !isAuthPath) {
    const url = req.nextUrl.clone();
    url.pathname = AUTH_PREFIX;
    return NextResponse.redirect(url);
  }

  if (token && isAuthPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|api|auth).*)',
  ],
};