'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

const images = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format', // Computer with code
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format', // Modern library
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format', // Tech workspace
];

export default function LoginPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Change image every 5 seconds
  useState(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const loadingToast = toast.loading('Logging in...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.dismiss(loadingToast);
      toast.success('Login successful!');
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />
      {/* Left side - Image carousel */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900">
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={src}
              alt={`Login slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* IMT Logo */}
          <div className="flex justify-center">
            <Image
              src="/imt-logo.png"
              alt="IMT Logo"
              width={200}
              height={80}
              priority
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
