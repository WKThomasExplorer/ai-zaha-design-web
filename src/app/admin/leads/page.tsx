'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Mail } from 'lucide-react';

interface LeadItem {
  id: number;
  email: string;
  source: string;
  prompt: string | null;
  style: string | null;
  effect_image_url: string | null;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/admin/leads?page=1&limit=100');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load leads');
        }

        setLeads(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
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
          Failed to load leads
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1f36]">Email Leads</h1>
        <p className="text-sm text-[#2d2a4a]/60 mt-1">
          Collected emails from unlock flows and lead forms.
        </p>
      </div>

      {pagination && (
        <div className="rounded-xl border border-[#2d2a4a]/10 bg-white p-4 text-sm text-[#2d2a4a]/70">
          Total leads: <span className="font-semibold text-[#1a1f36]">{pagination.total}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#2d2a4a]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2d2a4a]/10">
            <thead className="bg-[#fafbfc]">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#1a1f36]">ID</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Email</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Source</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Prompt</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2a4a]/10 bg-white">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#1a1f36]">#{lead.id}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#00d4aa]" />
                        <span>{lead.email}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">{lead.source}</td>
                    <td className="px-3 py-4 text-sm text-[#2d2a4a]/80 max-w-xs">
                      <div className="truncate" title={lead.prompt || ''}>{lead.prompt || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      {new Date(lead.created_at).toLocaleString('en-US')}
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
