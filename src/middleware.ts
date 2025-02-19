import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      
      // Allow access to public paths and static assets
      if (path === '/login' || path === '/' || path.startsWith('/_next') || path.startsWith('/api/auth')) {
        return true;
      }
      
      // Only check for authentication, allow access to all routes if authenticated
      return !!token;
    },
  },
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
