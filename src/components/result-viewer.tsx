'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Download, RefreshCw, Image as ImageIcon, Layers, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { GenerationResult } from '@/types';

interface ResultViewerProps {
  result: GenerationResult;
  onRegenerate: () => void;
  className?: string;
}

export function ResultViewer({ result, onRegenerate, className }: ResultViewerProps) {
  const [activeTab, setActiveTab] = useState<'effect' | 'explosion'>('effect');
  const [downloading, setDownloading] = useState<string | null>(null);

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
          Effect
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
          Explosion
        </button>
      </div>

      {/* Image Display */}
      <div className="relative rounded-2xl overflow-hidden bg-[#fafbfc] border border-[#2d2a4a]/10">
        <Image
          src={activeTab === 'effect' ? result.effectImageUrl : result.explosionImageUrl}
          alt={activeTab === 'effect' ? 'Facade effect' : 'Explosion diagram'}
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
          Download {activeTab === 'effect' ? 'Effect' : 'Explosion'}
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
        Download Complete Package (Effect + Explosion + Materials CSV)
      </Button>

      {/* Materials List */}
      {result.materials && result.materials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[#1a1f36]">Materials Used</h4>
            <Button
              onClick={downloadCSV}
              variant="ghost"
              size="sm"
              className="text-xs text-[#00d4aa] hover:text-[#0077ff]"
            >
              <FileText className="w-3 h-3 mr-1" />
              Download CSV
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
