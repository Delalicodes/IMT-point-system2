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
  BookOpen
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSetup, setOpenSetup] = useState(false);

  const handleNavigation = (href: string) => {
    if (href !== '#') {
      router.push(href);
    }
  };

  return (
    <div className="fixed top-0 left-0 flex flex-col h-screen bg-[#0A1E54] text-white w-64 p-6">
      <div className="flex items-center mb-8">
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
