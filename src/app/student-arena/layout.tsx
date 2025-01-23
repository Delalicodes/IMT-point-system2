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
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPath={pathname} />
      <div className="flex-1 ml-64">
        <Header onMenuClick={handleMenuClick} />
        {children}
      </div>
    </div>
  );
}
