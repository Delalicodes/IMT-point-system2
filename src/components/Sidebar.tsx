'use client';

import { 
  LayoutDashboard, 
  Settings,
  Users,
  MessageCircle,
  Award,
  ChevronDown,
  Wrench,
  UserCog,
  Medal,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { 
    icon: Settings, 
    label: 'Setups', 
    href: '#',
    subItems: [
      { icon: Wrench, label: 'General Setup', href: '/dashboard/setups/general' },
      { icon: UserCog, label: 'User Setup', href: '/dashboard/setups/user' },
      { icon: Medal, label: 'Points Setup', href: '/dashboard/setups/points' },
      { icon: BookOpen, label: 'Course Setup', href: '/dashboard/setups/course' },
    ]
  },
  { icon: Users, label: 'Students', href: '/dashboard/students' },
  { icon: MessageCircle, label: 'Chat', href: '/dashboard/chat' },
  { icon: Award, label: 'Points', href: '/dashboard/points' },
];

const studentMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: GraduationCap, label: 'Student Arena', href: '/student-arena' },
  { icon: MessageCircle, label: 'Chat', href: '/dashboard/chat' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSetup, setOpenSetup] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { data: session } = useSession();

  const isStudent = session?.user?.role === 'STUDENT';
  const menuItems = isStudent ? studentMenuItems : adminMenuItems;

  useEffect(() => {
    if (session?.user?.imageUrl) {
      setProfileImage(session.user.imageUrl);
    }
  }, [session?.user?.imageUrl]);

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

    fetchUserData();
    const interval = setInterval(fetchUserData, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (href: string) => {
    if (href !== '#') {
      router.push(href);
    }
  };

  return (
    <div className="fixed top-0 left-0 flex flex-col h-screen bg-[#0A1E54] text-white w-64 p-6">
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden mr-3">
          {profileImage ? (
            <img
              src={profileImage}
              alt={session?.user?.name || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-6 h-6 text-white" />
          )}
        </div>
        <h1 className="text-2xl font-bold">IMT POINTS</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const hasSubItems = item.subItems !== undefined;

          return (
            <div key={item.href}>
              {hasSubItems ? (
                <div>
                  <button
                    onClick={() => setOpenSetup(!openSetup)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      pathname.includes('/dashboard/setups')
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform ${
                        openSetup ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openSetup && (
                    <div className="mt-2 space-y-2">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <button
                            key={subItem.href}
                            onClick={() => handleNavigation(subItem.href)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                              pathname === subItem.href
                                ? 'bg-white/10 text-white'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <SubIcon size={20} />
                            <span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
