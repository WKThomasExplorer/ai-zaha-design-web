'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchBlogs = async (pageNum: number, searchQuery: string) => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/blogs', window.location.origin);
      url.searchParams.set('page', pageNum.toString());
      url.searchParams.set('limit', '10');
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        setBlogs(result.data);
        setPagination(result.pagination);
        setError(null);
      } else {
        setError(result.error || 'Failed to load blogs');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs(1, search);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Blog Posts</h1>
          <p className="text-sm text-[#2d2a4a]/60 mt-1">
            Manage published articles and AI-generated content.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-[#2d2a4a]/40" />
          </div>
          <input
            type="text"
            name="search"
            className="block w-full rounded-xl border border-[#2d2a4a]/20 py-2 pl-10 pr-3 text-sm focus:border-[#00d4aa] focus:outline-none focus:ring-1 focus:ring-[#00d4aa] transition-colors"
            placeholder="Search titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
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
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-64">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36]">Summary</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-32">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#1a1f36] w-32">Published At</th>
                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-[#1a1f36] w-24 sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2a4a]/10 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00d4aa] border-t-transparent"></div>
                      Loading blog posts...
                    </div>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#2d2a4a]/60">
                    No blog posts found.
                  </td>
                </tr>
              ) : (
                blogs.map((post) => (
                  <tr key={post.id} className="hover:bg-[#fafbfc] transition-colors group">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#1a1f36] sm:pl-6">
                      #{post.id}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-[#1a1f36] max-w-xs">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="truncate" title={post.title}>{post.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-[#2d2a4a]/80 max-w-sm">
                      <div className="truncate" title={post.summary}>
                        {post.summary}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/80">
                      {/* Hardcoded as schema doesn't have status yet */}
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Published
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2d2a4a]/60">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link 
                        href={`/blog/${post.id}`} 
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[#00d4aa] hover:text-[#00b38f] transition-colors"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
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
