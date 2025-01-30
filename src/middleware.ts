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
      
      // Student routes - only students can access student arena
      if (path.startsWith('/student-arena')) {
        return ['STUDENT', 'SUPERVISOR'].includes(userRole);
      }
      
      // Dashboard routes
      if (path.startsWith('/dashboard')) {
        // Chat is accessible by all users
        if (path.startsWith('/dashboard/chat')) {
          return true;
        }

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

        // Points accessible by admin and supervisor
        if (path.startsWith('/dashboard/points')) {
          return ['ADMIN', 'SUPERVISOR'].includes(userRole);
        }

        // Main dashboard accessible by admin and supervisor
        if (path === '/dashboard') {
          return ['ADMIN', 'SUPERVISOR'].includes(userRole);
        }

        // By default, only admin can access other dashboard routes
        return userRole === 'ADMIN';
      }
      
      return false;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/student-arena/:path*'],
};
