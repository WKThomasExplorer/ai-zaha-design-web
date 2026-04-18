'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Tag, Home, Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  // Route: /blog/[id] where id is the numeric article ID
  const articleId = parseInt(params.slug as string, 10);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (!isNaN(articleId)) {
      fetchArticle(articleId);
    }
  }, [articleId]);

  const fetchArticle = async (articleId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${articleId}`);
      const data = await response.json();

      if (data.success && data.article) {
        setArticle(data.article);
      } else {
        throw new Error(data.error || 'Article not found');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#00d4aa] animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a1f36] mb-4">
            {error || 'Article Not Found'}
          </h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <Link href="/blog" className="flex items-center gap-2 text-[#2d2a4a]/60 hover:text-[#1a1f36] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Blog</span>
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
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <article className="bg-white rounded-3xl shadow-xl shadow-[#1a1f36]/5 border border-[#2d2a4a]/10 overflow-hidden">
          {/* Gradient Header */}
          <div className="h-3 bg-gradient-to-r from-[#00d4aa] to-[#0077ff]" />

          <div className="p-8 sm:p-12">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1f36] leading-tight mb-6">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 pb-8 mb-8 border-b border-[#2d2a4a]/10">
              <div className="flex items-center gap-2 text-sm text-[#2d2a4a]/60">
                <User className="w-4 h-4" />
                <span>AI Zaha Team</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2d2a4a]/60">
                <Tag className="w-4 h-4" />
                <span>{formatDate(article.created_at)}</span>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {article.content.split('\n\n').map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[#2d2a4a] leading-relaxed mb-6 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 pt-8 border-t border-[#2d2a4a]/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#00d4aa]/5 to-[#0077ff]/5">
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1f36] mb-1">
                    Ready to see it in action?
                  </h3>
                  <p className="text-sm text-[#2d2a4a]/60">
                    Try our AI design tool to transform your facade today.
                  </p>
                </div>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] hover:shadow-lg hover:shadow-[#00d4aa]/30 text-white">
                    <Home className="w-4 h-4 mr-2" />
                    Try AI Design
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Back to Blog */}
        <div className="mt-8 text-center">
          <Link href="/blog">
            <Button variant="outline" className="border-[#2d2a4a]/20 text-[#2d2a4a]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Articles
            </Button>
          </Link>
        </div>
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
