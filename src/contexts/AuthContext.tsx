'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  imageUrl: string | null;
  username: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      console.log('Session updated:', session.user);
      setUser({
        id: session.user.id as string,
        name: session.user.name || null,
        email: session.user.email || null,
        role: session.user.role as string || 'student',
        imageUrl: session.user.imageUrl as string | null,
        username: session.user.username as string,
        firstName: session.user.firstName as string,
        lastName: session.user.lastName as string,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [session, status]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
