import { NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

// 1) Swagger UI is served by the Express API. Proxy it here (public, no login) and keep the
//    exact path: Next's rewrites strip trailing slashes, which makes Express redirect forever.
// 2) Everything else: no session cookie -> /login. The API still verifies the JWT on every request.
export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/api-docs' || pathname.startsWith('/api-docs/') || pathname === '/api-docs.json') {
    return NextResponse.rewrite(new URL(`${pathname}${search}`, BACKEND_URL));
  }

  const hasSession = req.cookies.has('dt_token');
  const onLogin = pathname.startsWith('/login');

  if (!hasSession && !onLogin) return NextResponse.redirect(new URL('/login', req.url));
  if (hasSession && onLogin) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
