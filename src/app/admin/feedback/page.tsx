'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: number;
  email: string | null;
  rating: 'love_it' | 'needs_changes' | 'not_useful';
  comment: string | null;
  prompt: string | null;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('/api/admin/feedback?page=1&limit=100');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load feedback');
        }

        setItems(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
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
          Failed to load feedback
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const ratingLabel = (rating: FeedbackItem['rating']) => {
    if (rating === 'love_it') return 'Love it';
    if (rating === 'needs_changes') return 'Needs changes';
    return 'Not useful';
  };

  const ratingClass = (rating: FeedbackItem['rating']) => {
    if (rating === 'love_it') return 'bg-emerald-50 text-emerald-700';
    if (rating === 'needs_changes') return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1f36]">Result Feedback</h1>
        <p className="text-sm text-[#2d2a4a]/60 mt-1">
          User quality signals collected from result pages.
        </p>
      </div>

      {pagination && (
        <div className="rounded-xl border border-[#2d2a4a]/10 bg-white p-4 text-sm text-[#2d2a4a]/70">
          Total feedback: <span className="font-semibold text-[#1a1f36]">{pagination.total}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#2d2a4a]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2d2a4a]/10">
            <thead className="bg-[#fafbfc]">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#1a1f36]">ID</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Rating</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Comment</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Email</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2a4a]/10 bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    No feedback yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#1a1f36]">#{item.id}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', ratingClass(item.rating))}>
                        <MessageSquare className="w-3 h-3" />
                        {ratingLabel(item.rating)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-[#2d2a4a]/80 max-w-md">
                      <div className="truncate" title={item.comment || ''}>{item.comment || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">{item.email || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      {new Date(item.created_at).toLocaleString('en-US')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
