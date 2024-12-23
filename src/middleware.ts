import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      
      // Public paths
      if (path === '/login') return true;
      
      // Protected paths
      if (path.startsWith('/dashboard')) {
        return !!token;
      }
      
      return false;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
