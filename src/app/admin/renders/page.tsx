'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Filter, ImageIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface GenerationRun {
  id: number;
  user_id: number | null;
  username: string | null;
  type: string;
  input_image_url: string | null;
  description: string;
  provider: string;
  model: string;
  status: string;
  result_image_url: string | null;
  error_message: string | null;
  latency_ms: number | null;
  created_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminRendersPage() {
  const [renders, setRenders] = useState<GenerationRun[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchRenders = async (pageNum: number, searchQuery: string, statusQuery: string, typeQuery: string) => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/renders', window.location.origin);
      url.searchParams.set('page', pageNum.toString());
      url.searchParams.set('limit', '10');
      if (searchQuery) url.searchParams.set('search', searchQuery);
      if (statusQuery) url.searchParams.set('status', statusQuery);
      if (typeQuery) url.searchParams.set('type', typeQuery);

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        setRenders(result.data);
        setPagination(result.pagination);
        setError(null);
      } else {
        setError(result.error || 'Failed to load renders');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenders(page, search, statusFilter, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRenders(1, search, statusFilter, typeFilter);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'succeeded': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      'failed': 'bg-red-50 text-red-700 ring-red-600/20',
      'running': 'bg-blue-50 text-blue-700 ring-blue-600/20',
      'queued': 'bg-gray-50 text-gray-700 ring-gray-600/20',
    };
    return cn(
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
      colors[status] || colors.queued
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Generations</h1>
          <p className="text-sm text-[#2d2a4a]/60 mt-1">
            View all facade effects and explosion diagrams generated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearch} className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-[#2d2a4a]/40" />
            </div>
            <input
              type="text"
              name="search"
              className="block w-full rounded-xl border border-[#2d2a4a]/20 py-2 pl-10 pr-3 text-sm focus:border-[#00d4aa] focus:outline-none focus:ring-1 focus:ring-[#00d4aa] transition-colors"
              placeholder="Search prompt or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="block w-full sm:w-auto rounded-xl border border-[#2d2a4a]/20 py-2 pl-3 pr-8 text-sm focus:border-[#00d4aa] focus:outline-none focus:ring-1 focus:ring-[#00d4aa] bg-white text-[#2d2a4a]/80 cursor-pointer transition-colors"
            >
              <option value="">All Types</option>
              <option value="effect">Effect</option>
              <option value="explosion">Explosion</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="block w-full sm:w-auto rounded-xl border border-[#2d2a4a]/20 py-2 pl-3 pr-8 text-sm focus:border-[#00d4aa] focus:outline-none focus:ring-1 focus:ring-[#00d4aa] bg-white text-[#2d2a4a]/80 cursor-pointer transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#2d2a4a]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2d2a4a]/10">
            <thead className="bg-[#fafbfc]">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#1a1f36] sm:pl-6 w-16">ID</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-32">Type</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-32">User</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] max-w-xs">Prompt</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-24">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-32">Result</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-32">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2a4a]/10 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00d4aa] border-t-transparent"></div>
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : renders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    No generations found.
                  </td>
                </tr>
              ) : (
                renders.map((run) => (
                  <tr key={run.id} className="hover:bg-[#fafbfc] transition-colors group">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#1a1f36] sm:pl-6">
                      #{run.id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      <div className="flex items-center gap-1.5">
                        {run.type === 'effect' ? <ImageIcon className="w-4 h-4 text-purple-500" /> : <Layers className="w-4 h-4 text-amber-500" />}
                        <span className="capitalize">{run.type}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      {run.username || <span className="text-[#2d2a4a]/40 italic">Anonymous</span>}
                    </td>
                    <td className="px-3 py-4 text-sm text-[#2d2a4a]/80 max-w-xs">
                      <div className="truncate" title={run.description}>
                        {run.description}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={getStatusBadge(run.status)}>
                        {run.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      {run.result_image_url ? (
                        <a href={run.result_image_url} target="_blank" rel="noopener noreferrer" className="text-[#00d4aa] hover:underline flex items-center gap-1">
                          View Image
                        </a>
                      ) : run.error_message ? (
                        <span className="text-red-500 truncate block max-w-xs text-xs" title={run.error_message}>
                          Error
                        </span>
                      ) : (
                        <span className="text-[#2d2a4a]/40">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/60">
                      {formatDate(run.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#2d2a4a]/10 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#2d2a4a]/60">
                  Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-l-md rounded-r-none border-[#2d2a4a]/20"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center px-4 border-y border-[#2d2a4a]/20 text-sm font-medium text-[#1a1f36]">
                    Page {page} of {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="rounded-r-md rounded-l-none border-[#2d2a4a]/20"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
