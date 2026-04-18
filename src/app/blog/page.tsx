'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Sparkles, Home, Globe, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BlogArticle {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogListPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog');
      const data = await response.json();

      if (data.success) {
        setArticles(data.articles || []);
      } else {
        throw new Error(data.error || 'Failed to fetch articles');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="curve-decoration -top-20 -left-20" />
      <div className="curve-decoration top-1/2 -right-40 w-[500px] h-[500px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#2d2a4a]/10 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <Link href="/" className="flex items-center gap-2 text-[#2d2a4a]/60 hover:text-[#1a1f36] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2d2a4a]/60" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none text-[#2d2a4a]/60 cursor-pointer"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00d4aa]/10 to-[#0077ff]/10 text-sm text-[#2d2a4a] mb-6">
            <Sparkles className="w-4 h-4 text-[#00d4aa]" />
            <span>Facade Renovation Tips</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1f36] mb-4">
            Facade Renovation
            <br />
            <span className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] bg-clip-text text-transparent">
              Tips & Insights
            </span>
          </h1>
          <p className="text-[#2d2a4a]/60 max-w-xl mx-auto">
            Expert advice, practical tips, and insider secrets to help you transform your home facade like a pro.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-[#00d4aa] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchArticles}>Try Again</Button>
          </div>
        )}

        {/* Blog Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <BlogCard key={article.id} article={article} index={index} formatDate={formatDate} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#2d2a4a]/60 mb-4">No articles yet. Check back soon!</p>
          </div>
        )}

        {/* CTA Section */}
        {!loading && !error && (
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-[#1a1f36] to-[#2d2a4a] text-white">
              <h3 className="text-xl font-semibold">Ready to Transform Your Home?</h3>
              <p className="text-white/70 text-sm max-w-md">
                Put these tips into action and see your dream facade come to life with AI-powered design tools.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] hover:shadow-lg hover:shadow-[#00d4aa]/30 text-white">
                  <Home className="w-4 h-4 mr-2" />
                  Try AI Design Tool
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2d2a4a]/10 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-[#2d2a4a]/40">
            AI Zaha Home Design - Transform your space with AI
          </p>
        </div>
      </footer>
    </div>
  );
}

function BlogCard({
  article,
  index,
  formatDate,
}: {
  article: BlogArticle;
  index: number;
  formatDate: (date: string) => string;
}) {
  const colors = [
    'from-[#00d4aa] to-[#0077ff]',
    'from-[#ff6b6b] to-[#feca57]',
    'from-[#5f27cd] to-[#00d4aa]',
  ];
  const bgColors = [
    'bg-[#00d4aa]/10',
    'bg-[#ff6b6b]/10',
    'bg-[#5f27cd]/10',
  ];

  return (
    <Link href={`/blog/${article.id}`}>
      <article
        className={cn(
          'group h-full rounded-2xl overflow-hidden bg-white border border-[#2d2a4a]/10',
          'hover:border-[#00d4aa]/30 hover:shadow-xl hover:shadow-[#00d4aa]/5',
          'transition-all duration-300'
        )}
      >
        {/* Gradient Header */}
        <div className={cn('h-2 bg-gradient-to-r', colors[index % colors.length])} />

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date */}
          <div className="text-xs text-[#2d2a4a]/40">
            {formatDate(article.created_at)}
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-[#1a1f36] leading-snug group-hover:text-[#00d4aa] transition-colors">
            {article.title}
          </h2>

          {/* Summary */}
          <p className="text-sm text-[#2d2a4a]/60 line-clamp-3">
            {article.summary}
          </p>

          {/* Read More Arrow */}
          <div className="flex items-center gap-2 text-[#00d4aa] text-sm font-medium pt-2">
            <span>Read More</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}
