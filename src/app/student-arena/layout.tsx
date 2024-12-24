'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function StudentArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        {children}
      </div>
    </div>
  );
}
