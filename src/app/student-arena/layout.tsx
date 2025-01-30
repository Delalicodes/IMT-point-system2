'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function StudentArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/student-arena';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar currentPath={pathname} />
      </div>
      
      <div className={`flex flex-col flex-1 transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <Header onMenuClick={handleMenuClick} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
