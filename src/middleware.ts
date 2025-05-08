import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We no longer need to redirect from root to marketing
  // since we've moved the landing page content directly to the root
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - app (already on app page)
     * - login, register, forgot-password (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|app|login|register|forgot-password).*)',
  ],
};
