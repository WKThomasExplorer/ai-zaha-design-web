import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Providers } from '@/components/providers';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen bg-[#fafbfc] overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
          <AdminSidebar />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col md:pl-64 overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-[#fafbfc] p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
