'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-white">
        <Sidebar currentPath={pathname} />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-6 bg-white">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
