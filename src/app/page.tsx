'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
      router.refresh(); // Force a refresh to ensure the session is updated
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // This will briefly show while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8">
        <Image
          src="/imt-logo.png"
          alt="IMT Logo"
          width={200}
          height={80}
          priority
        />
      </div>
      <div className="animate-pulse text-gray-600">
        Redirecting...
      </div>
    </div>
  );
}
