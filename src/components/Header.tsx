'use client';

import { useState, useEffect } from 'react';
import { 
  Menu,
  Bell, 
  LogOut, 
  Moon, 
  Sun, 
  User,
  ChevronDown,
  Settings 
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
  const [hasNotifications, setHasNotifications] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  // Initialize theme and profile image
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme === 'dark');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    if (user?.imageUrl) {
      setProfileImage(user.imageUrl);
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
    <header className="sticky top-0 z-50 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Mobile Menu Button - Only visible on mobile */}
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>

        {/* Right Side Items - Always aligned right */}
        <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              id="profile-button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={user?.name || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name || 'Loading...'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {isProfileOpen && (
              <div 
                id="profile-dropdown" 
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'Loading...'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {user?.role || 'student'}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
