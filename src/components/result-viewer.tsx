'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Download, RefreshCw, Image as ImageIcon, Layers, FileText, Package, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { GenerationResult } from '@/types';
import { usePostHog } from 'posthog-js/react';

interface ResultViewerProps {
  result: GenerationResult;
  onRegenerate: () => void;
  className?: string;
  language?: 'en' | 'zh';
}

export function ResultViewer({ result, onRegenerate, className, language = 'en' }: ResultViewerProps) {
  const isZh = language === 'zh';
  const t = useCallback((en: string, zh: string) => (isZh ? zh : en), [isZh]);
  const posthog = usePostHog();
  const [activeTab, setActiveTab] = useState<'effect' | 'explosion'>('effect');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<'love_it' | 'needs_changes' | 'not_useful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [intentEmail, setIntentEmail] = useState('');
  const [intentSubmitting, setIntentSubmitting] = useState(false);
  const [intentMessage, setIntentMessage] = useState<string | null>(null);

  // Download single file
  const downloadFile = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(
        `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
      );
      if (!response.ok) {
        throw new Error(`Download request failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }, []);

  // Generate CSV content from materials
  const generateMaterialsCSV = useCallback(() => {
    const headers = ['No', 'Layer', 'Material', 'Description'];
    const materials = result.materials || [];
    const rows = materials.map((item, index) => [
      index + 1,
      item.layer || '',
      item.material || '',
      item.description || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }, [result]);

  // Download CSV file
  const downloadCSV = useCallback(() => {
    const csvContent = generateMaterialsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `materials-list-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }, [generateMaterialsCSV]);

  // Download single image
  const handleDownload = useCallback(
    async (type: 'effect' | 'explosion') => {
      const url =
        type === 'effect'
          ? result.effectImageUrl
          : result.explosionImageUrl;
      const filename = `facade-${type}-${Date.now()}.png`;

      setDownloading(type);
      try {
        await downloadFile(url, filename);
      } finally {
        setTimeout(() => setDownloading(null), 500);
      }
    },
    [result, downloadFile]
  );

  // Download all: effect image + explosion image + materials CSV
  const handleDownloadAll = useCallback(async () => {
    setDownloading('all');

    try {
      // Download effect image
      await downloadFile(result.effectImageUrl, `facade-effect-${Date.now()}.png`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Download explosion image
      await downloadFile(result.explosionImageUrl, `facade-explosion-${Date.now()}.png`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Download materials CSV
      downloadCSV();
    } catch (error) {
      console.error('Download all failed:', error);
    } finally {
      setTimeout(() => setDownloading(null), 500);
    }
  }, [result, downloadFile, downloadCSV]);

  const submitPurchaseIntent = useCallback(async () => {
    if (intentSubmitting) {
      return;
    }

    setIntentSubmitting(true);
    setIntentMessage(null);

    try {
      const response = await fetch('/api/purchase-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: intentEmail,
          price: '$19',
          product: 'hd_unlock_waitlist',
          prompt: localStorage.getItem('design_description') || null,
          effectImageUrl: result.effectImageUrl,
          explosionImageUrl: result.explosionImageUrl,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || t('Failed to save your request', '提交失败'));
      }

      setIntentMessage(t('Saved! We will email your HD unlock beta access soon.', '已记录！我们会通过邮件发送 HD 解锁测试资格。'));
      posthog?.capture('purchase_intent_submitted', {
        product: 'hd_unlock_waitlist',
        price: '$19',
      });
      setIntentEmail('');
    } catch (error) {
      posthog?.capture('purchase_intent_failed', {
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      setIntentMessage(error instanceof Error ? error.message : t('Failed to save your request', '提交失败'));
    } finally {
      setIntentSubmitting(false);
    }
  }, [intentEmail, intentSubmitting, posthog, result, t]);
  const submitFeedback = useCallback(async () => {
    if (!feedbackRating || feedbackSubmitting) {
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          email: feedbackEmail,
          prompt: localStorage.getItem('design_description') || null,
          effectImageUrl: result.effectImageUrl,
          explosionImageUrl: result.explosionImageUrl,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || t('Failed to submit feedback', '反馈提交失败'));
      }

      setFeedbackMessage(t('Thanks for the feedback!', '感谢反馈！'));
      posthog?.capture('feedback_submitted', {
        rating: feedbackRating,
        has_email: Boolean(feedbackEmail.trim()),
      });
      setFeedbackComment('');
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : t('Failed to submit feedback', '反馈提交失败'));
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackComment, feedbackEmail, feedbackRating, feedbackSubmitting, posthog, result, t]);
  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-[#f0f0f5] p-1">
        <button
          onClick={() => setActiveTab('effect')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300',
            activeTab === 'effect'
              ? 'bg-white text-[#1a1f36] shadow-sm'
              : 'text-[#2d2a4a]/60 hover:text-[#1a1f36]'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          {t('Effect', '效果图')}
        </button>
        <button
          onClick={() => setActiveTab('explosion')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300',
            activeTab === 'explosion'
              ? 'bg-white text-[#1a1f36] shadow-sm'
              : 'text-[#2d2a4a]/60 hover:text-[#1a1f36]'
          )}
        >
          <Layers className="w-4 h-4" />
          {t('Explosion', '爆炸图')}
        </button>
      </div>

      {/* Image Display */}
      <div className="relative rounded-2xl overflow-hidden bg-[#fafbfc] border border-[#2d2a4a]/10">
        <Image
          src={activeTab === 'effect' ? result.effectImageUrl : result.explosionImageUrl}
          alt={activeTab === 'effect' ? t('Facade effect', '外立面效果图') : t('Explosion diagram', '爆炸图')}
          width={1600}
          height={900}
          sizes="(max-width: 1024px) 100vw, 720px"
          className="w-full h-auto"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => handleDownload(activeTab)}
          disabled={downloading !== null}
          className={cn(
            'flex-1 h-12 rounded-xl font-medium transition-all duration-300',
            'bg-gradient-to-r from-[#00d4aa] to-[#0077ff]',
            'hover:shadow-lg hover:shadow-[#00d4aa]/30',
            'text-white'
          )}
        >
          {downloading === activeTab ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {t('Download', '下载')} {activeTab === 'effect' ? t('Effect', '效果图') : t('Explosion', '爆炸图')}
        </Button>
        <Button
          onClick={onRegenerate}
          variant="outline"
          className={cn(
            'h-12 px-6 rounded-xl font-medium',
            'border-[#2d2a4a]/20',
            'hover:bg-[#2d2a4a]/5'
          )}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Download All Button */}
      <Button
        onClick={handleDownloadAll}
        disabled={downloading !== null}
        variant="outline"
        className={cn(
          'w-full h-14 rounded-xl font-medium transition-all duration-300',
          'border-2 border-dashed border-[#00d4aa]/50',
          'bg-gradient-to-r from-[#00d4aa]/5 to-[#0077ff]/5',
          'hover:border-[#00d4aa]/80 hover:shadow-lg hover:shadow-[#00d4aa]/10',
          'text-[#1a1f36]'
        )}
      >
        {downloading === 'all' ? (
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Package className="w-5 h-5 mr-2" />
        )}
        {t('Download Complete Package (Effect + Explosion + Materials CSV)', '下载完整包（效果图 + 爆炸图 + 材料 CSV）')}
      </Button>

      {/* Purchase intent fake door */}
      <div className="rounded-xl border border-[#2d2a4a]/10 bg-white/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#1a1f36]">
          <Sparkles className="w-4 h-4 text-[#00d4aa]" />
          <p className="text-sm font-medium">{t('Unlock HD Package - $19 (Beta Waitlist)', '解锁高清包 - $19（内测候补）')}</p>
        </div>
        <p className="text-sm text-[#2d2a4a]/70">
          {t('Includes high-resolution images, no watermark output, and commercial-ready package.', '包含高清图片、无水印输出、以及可商用展示包。')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={intentEmail}
            data-hj-suppress
            data-clarity-mask="true"
            onChange={(e) => setIntentEmail(e.target.value)}
            placeholder={t('your@email.com (optional)', '你的邮箱（可选）')}
            className="flex-1 h-10 rounded-lg border border-[#2d2a4a]/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/30"
          />
          <Button
            onClick={submitPurchaseIntent}
            disabled={intentSubmitting}
            className="h-10 rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white"
          >
            {intentSubmitting ? t('Saving...', '提交中...') : t('Join Unlock Waitlist', '加入解锁候补')}
          </Button>
        </div>
        {intentMessage && (
          <p className={cn('text-sm', intentMessage.includes('Saved!') || intentMessage.includes('已记录') ? 'text-emerald-600' : 'text-red-500')}>
            {intentMessage}
          </p>
        )}
      </div>

      {/* Feedback */}
      <div className="rounded-xl border border-[#2d2a4a]/10 bg-white/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#1a1f36]">
          <MessageSquare className="w-4 h-4 text-[#00d4aa]" />
          <p className="text-sm font-medium">{t('How useful is this result?', '这个结果对你有帮助吗？')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setFeedbackRating('love_it')}
            className={cn(
              'h-10 rounded-lg border text-sm transition-colors',
              feedbackRating === 'love_it' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-[#2d2a4a]/20 hover:bg-[#f0f0f5]'
            )}
          >
            {t('Love it', '很满意')}
          </button>
          <button
            onClick={() => setFeedbackRating('needs_changes')}
            className={cn(
              'h-10 rounded-lg border text-sm transition-colors',
              feedbackRating === 'needs_changes' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-[#2d2a4a]/20 hover:bg-[#f0f0f5]'
            )}
          >
            {t('Needs changes', '需要调整')}
          </button>
          <button
            onClick={() => setFeedbackRating('not_useful')}
            className={cn(
              'h-10 rounded-lg border text-sm transition-colors',
              feedbackRating === 'not_useful' ? 'border-red-500 bg-red-50 text-red-700' : 'border-[#2d2a4a]/20 hover:bg-[#f0f0f5]'
            )}
          >
            {t('Not useful', '帮助不大')}
          </button>
        </div>

        {(feedbackRating === 'needs_changes' || feedbackRating === 'not_useful') && (
          <textarea
            value={feedbackComment}
            data-hj-suppress
            data-clarity-mask="true"
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder={t('Tell us what should be improved...', '请告诉我们哪里需要改进...')}
            className="w-full min-h-[88px] rounded-lg border border-[#2d2a4a]/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/30"
          />
        )}

        <input
          type="email"
          value={feedbackEmail}
          data-hj-suppress
          data-clarity-mask="true"
          onChange={(e) => setFeedbackEmail(e.target.value)}
          placeholder={t('Optional: your email for follow-up', '可选：留下邮箱便于我们跟进')}
          className="w-full h-10 rounded-lg border border-[#2d2a4a]/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/30"
        />

        <Button
          onClick={submitFeedback}
          disabled={!feedbackRating || feedbackSubmitting}
          className="h-10 rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#0077ff] text-white"
        >
          {feedbackSubmitting ? t('Submitting...', '提交中...') : t('Submit Feedback', '提交反馈')}
        </Button>

        {feedbackMessage && (
          <p className={cn('text-sm', feedbackMessage.includes('Thanks') || feedbackMessage.includes('感谢') ? 'text-emerald-600' : 'text-red-500')}>
            {feedbackMessage}
          </p>
        )}
      </div>

      {/* Materials List */}
      {result.materials && result.materials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[#1a1f36]">{t('Materials Used', '使用材料')}</h4>
            <Button
              onClick={downloadCSV}
              variant="ghost"
              size="sm"
              className="text-xs text-[#00d4aa] hover:text-[#0077ff]"
            >
              <FileText className="w-3 h-3 mr-1" />
              {t('Download CSV', '下载 CSV')}
            </Button>
          </div>
          <div className="space-y-2">
            {result.materials.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#fafbfc] border border-[#2d2a4a]/10"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0077ff] flex items-center justify-center text-white text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1a1f36]">
                    {item.layer}
                  </p>
                  <p className="text-xs text-[#2d2a4a]/60">
                    {item.material}
                    {item.description && ` - ${item.description}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
