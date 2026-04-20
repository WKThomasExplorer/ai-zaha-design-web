'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Image as ImageIcon, 
  Layers, 
  FileText, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewData {
  users: { total: number; recent: number };
  blogs: { total: number };
  generations: {
    effectTotal: number;
    explosionTotal: number;
    failedTotal: number;
    recentTotal: number;
  };
}

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        // Need to pass token if it's in localStorage for API routes to verifyAdmin
        // We'll rely on the cookie set by login, which the API route will read.
        const response = await fetch('/api/admin/overview');
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00d4aa] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <div className="flex items-center gap-2 font-medium mb-1">
          <AlertCircle className="w-5 h-5" />
          Failed to load dashboard
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: data?.users.total || 0,
      subtext: `+${data?.users.recent || 0} in last 7 days`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Generations',
      value: (data?.generations.effectTotal || 0) + (data?.generations.explosionTotal || 0),
      subtext: `${data?.generations.recentTotal || 0} in last 7 days`,
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      name: 'Effect Renders',
      value: data?.generations.effectTotal || 0,
      subtext: 'Successful facade designs',
      icon: ImageIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Explosion Diagrams',
      value: data?.generations.explosionTotal || 0,
      subtext: 'Technical breakdowns',
      icon: Layers,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      name: 'Blog Posts',
      value: data?.blogs.total || 0,
      subtext: 'Published articles',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'Failed Tasks',
      value: data?.generations.failedTotal || 0,
      subtext: 'Requires attention',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1f36]">Dashboard Overview</h1>
        <p className="text-sm text-[#2d2a4a]/60 mt-1">
          Welcome to the AI Zaha Home Design admin panel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-xl bg-white border border-[#2d2a4a]/10 shadow-sm transition-all hover:shadow-md"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', stat.bgColor)}>
                    <stat.icon className={cn('h-6 w-6', stat.color)} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-[#2d2a4a]/60">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-2xl font-bold text-[#1a1f36]">
                        {stat.value.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-[#fafbfc] px-5 py-3 border-t border-[#2d2a4a]/5">
              <div className="text-xs font-medium text-[#2d2a4a]/50">
                {stat.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
