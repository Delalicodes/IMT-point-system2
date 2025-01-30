'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-white">
        {/* Sidebar */}
        <div 
          className={`
            fixed inset-y-0 left-0 z-50 transform 
            md:translate-x-0 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar currentPath={pathname} />
        </div>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 md:ml-64">
          <Header onMenuClick={toggleSidebar} />
          <main className="p-6 bg-white">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
