'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  Settings,
  UserCog,
  Medal,
  BookOpen,
  GraduationCap,
  MessageCircle,
  UserCheck,
  Home,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  subItems?: MenuItem[];
}

interface SidebarProps {
  currentPath: string;
}

const adminMenuItems: MenuItem[] = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { 
    icon: Settings, 
    label: 'Setup', 
    href: '#',
    subItems: [
      { icon: UserCog, label: 'Users', href: '/dashboard/setups/user' },
      { icon: GraduationCap, label: 'Courses', href: '/dashboard/setups/course' },
      { icon: BookOpen, label: 'Subjects', href: '/dashboard/setups/subject' },
    ]
  },
  { icon: GraduationCap, label: 'Courses', href: '/dashboard/courses' },
  { icon: Users, label: 'Students', href: '/dashboard/students' },
  { icon: UserCheck, label: 'Supervisors', href: '/dashboard/setups/supervisor' },
  { icon: MessageCircle, label: 'Chat', href: '/dashboard/chat' },
  { icon: Medal, label: 'Points', href: '/dashboard/points' },
];

const supervisorMenuItems: MenuItem[] = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
  { icon: Medal, label: 'Points', href: '/dashboard/points' },
];

const studentMenuItems: MenuItem[] = [
  { icon: Home, label: 'Home', href: '/student-arena' },
  { icon: MessageSquare, label: 'Chat', href: '/student-arena/chat' },
  { icon: Medal, label: 'Points', href: '/student-arena/points' },
  { icon: Clock, label: 'Clocking', href: '/student-arena/clocking' },
];

export default function Sidebar({ currentPath }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSetup, setOpenSetup] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { data: session } = useSession();

  const isStudent = session?.user?.role === 'STUDENT';
  const isSupervisor = session?.user?.role === 'SUPERVISOR';
  const menuItems = isStudent ? studentMenuItems : isSupervisor ? supervisorMenuItems : adminMenuItems;

  useEffect(() => {
    if (session?.user?.imageUrl) {
      setProfileImage(session.user.imageUrl);
    }
  }, [session?.user?.imageUrl]);

  const handleNavigation = (href: string) => {
    if (href !== '#') {
      router.push(href);
    }
  };

  const isActive = (path: string) => {
    return currentPath.startsWith(path);
  };

  return (
    <div className="h-full w-64 bg-[#0A1E54] text-white p-6 overflow-y-auto">
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

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems !== undefined;

          return (
            <div key={item.href}>
              {hasSubItems ? (
                <div>
                  <button
                    onClick={() => setOpenSetup(!openSetup)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      isActive('/dashboard/setups')
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
                  {openSetup && item.subItems && (
                    <div className="mt-2 space-y-2">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <button
                            key={subItem.href}
                            onClick={() => handleNavigation(subItem.href)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                              isActive(subItem.href)
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
                    isActive(item.href)
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
