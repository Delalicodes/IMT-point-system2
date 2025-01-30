import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      
      // Public paths
      if (path === '/login') return true;
      
      if (!token) return false;

      const userRole = token.role as string;
      
      // Student routes
      if (path.startsWith('/student-arena')) {
        return userRole === 'STUDENT';
      }
      
      // Dashboard routes
      if (path.startsWith('/dashboard')) {
        // Only admin can access setup routes
        if (path.startsWith('/dashboard/setups')) {
          return userRole === 'ADMIN';
        }

        // Only admin can access student and supervisor management
        if (path.startsWith('/dashboard/students') || path.startsWith('/dashboard/supervisors')) {
          return userRole === 'ADMIN';
        }

        // Only admin can access course management
        if (path.startsWith('/dashboard/courses')) {
          return userRole === 'ADMIN';
        }

        // Chat, points, and main dashboard accessible by admin and supervisor
        if (path === '/dashboard' || path.startsWith('/dashboard/chat') || path.startsWith('/dashboard/points')) {
          return ['ADMIN', 'SUPERVISOR'].includes(userRole);
        }

        return userRole === 'ADMIN';
      }
      
      return false;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/student-arena/:path*'],
};
