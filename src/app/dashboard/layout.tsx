'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-white">
        <Sidebar currentPath={pathname} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64">
          <Header onMenuClick={toggleSidebar} />
          <main className="p-4 md:p-6 bg-white min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
