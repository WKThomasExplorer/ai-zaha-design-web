'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  FileText,
  Home,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Generations', href: '/admin/renders', icon: ImageIcon },
  { name: 'Blog Posts', href: '/admin/blog-posts', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-[#2d2a4a]/10">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-[#2d2a4a]/10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a1f36] to-[#2d2a4a] flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-[#1a1f36]">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? 'bg-[#00d4aa]/10 text-[#00d4aa]'
                  : 'text-[#2d2a4a]/60 hover:bg-[#fafbfc] hover:text-[#1a1f36]',
                'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-[#00d4aa]' : 'text-[#2d2a4a]/40 group-hover:text-[#1a1f36]',
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="border-t border-[#2d2a4a]/10 p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-[#fafbfc] border border-[#2d2a4a]/10 flex items-center justify-center">
            <span className="text-sm font-medium text-[#1a1f36]">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1f36] truncate">
              {user?.username || 'Admin'}
            </p>
            <p className="text-xs text-[#2d2a4a]/60 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#2d2a4a]/60 hover:bg-[#fafbfc] hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
