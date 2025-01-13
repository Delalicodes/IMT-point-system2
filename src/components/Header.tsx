'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  Moon, 
  Sun, 
  User,
  ChevronDown,
  Settings,
  Menu
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Initialize theme and profile image
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme === 'dark');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Set initial profile image
    if (user?.imageUrl) {
      setProfileImage(user.imageUrl);
    }
  }, [user?.imageUrl]);

  // Fetch fresh user data periodically
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        if (data.imageUrl) {
          setProfileImage(data.imageUrl);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Fetch immediately and then every 5 seconds
    fetchUserData();
    const interval = setInterval(fetchUserData, 5000);

    return () => clearInterval(interval);
  }, []);

  // Force re-render when session changes
  useEffect(() => {
    if (user?.imageUrl) {
      setIsProfileOpen(false); // Close dropdown if open
    }
  }, [user?.imageUrl]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('profile-dropdown');
      const button = document.getElementById('profile-button');
      if (
        dropdown &&
        button &&
        !dropdown.contains(event.target as Node) &&
        !button.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 px-4 lg:px-6 bg-[#0A1E54] border-b border-gray-200 flex items-center justify-between">
      {/* Left side - Menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-white hover:bg-white/10"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Right side - user menu and theme toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-white" />
          ) : (
            <Moon className="h-5 w-5 text-white" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user?.name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="text-sm font-medium text-white hidden md:block">
              {user?.name || 'Loading...'}
            </span>
            <ChevronDown className="h-4 w-4 text-white hidden md:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
