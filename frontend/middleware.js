import { NextResponse } from 'next/server';

// Cheap edge gate: no session cookie -> /login. The API still verifies the JWT on every request.
export function middleware(req) {
  const hasSession = req.cookies.has('dt_token');
  const { pathname } = req.nextUrl;
  const onLogin = pathname.startsWith('/login');

  if (!hasSession && !onLogin) return NextResponse.redirect(new URL('/login', req.url));
  if (hasSession && onLogin) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
