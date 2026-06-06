'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Mail, Sparkles } from 'lucide-react';

interface PurchaseIntent {
  id: number;
  email: string | null;
  price: string;
  product: string;
  prompt: string | null;
  effect_image_url: string | null;
  explosion_image_url: string | null;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminIntentsPage() {
  const [intents, setIntents] = useState<PurchaseIntent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntents = async () => {
      try {
        const response = await fetch('/api/admin/intents?page=1&limit=50');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load intents');
        }

        setIntents(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load intents');
      } finally {
        setLoading(false);
      }
    };

    fetchIntents();
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
          Failed to load intents
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1f36]">Purchase Intents</h1>
        <p className="text-sm text-[#2d2a4a]/60 mt-1">
          Users who clicked unlock and joined the HD waitlist.
        </p>
      </div>

      {pagination && (
        <div className="rounded-xl border border-[#2d2a4a]/10 bg-white p-4 text-sm text-[#2d2a4a]/70">
          Total intents: <span className="font-semibold text-[#1a1f36]">{pagination.total}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#2d2a4a]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2d2a4a]/10">
            <thead className="bg-[#fafbfc]">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#1a1f36]">ID</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Email</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Offer</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Prompt</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2a4a]/10 bg-white">
              {intents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    No purchase intents yet.
                  </td>
                </tr>
              ) : (
                intents.map((intent) => (
                  <tr key={intent.id} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#1a1f36]">
                      #{intent.id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#00d4aa]" />
                        <span>{intent.email || 'Anonymous click (no email)'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>{intent.price} · {intent.product}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-[#2d2a4a]/80 max-w-xs">
                      <div className="truncate" title={intent.prompt || ''}>
                        {intent.prompt || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      {new Date(intent.created_at).toLocaleString('en-US')}
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
