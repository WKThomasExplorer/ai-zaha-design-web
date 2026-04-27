'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, X, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import type { UploadedImage } from '@/types';

interface ImageUploaderProps {
  onImageUploaded: (image: UploadedImage) => void;
  className?: string;
  language?: 'en' | 'zh';
}

export function ImageUploader({ onImageUploaded, className, language = 'en' }: ImageUploaderProps) {
  const isZh = language === 'zh';
  const t = useCallback((en: string, zh: string) => (isZh ? zh : en), [isZh]);
  const { user, loading } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeImageDataUrl = useCallback((img: HTMLImageElement, originalDataUrl: string): string => {
    const MAX_EDGE = 1600;
    const maxEdge = Math.max(img.width, img.height);
    const scale = maxEdge > MAX_EDGE ? MAX_EDGE / maxEdge : 1;
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));

    if (scale === 1 && originalDataUrl.length < 1_500_000) {
      return originalDataUrl;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return originalDataUrl;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return optimizedDataUrl.length < originalDataUrl.length ? optimizedDataUrl : originalDataUrl;
  }, []);

  const validateAndProcessImage = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      setError(null);

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError(t('Please upload a JPG, PNG, or WebP image', '请上传 JPG、PNG 或 WebP 图片'));
        return null;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(t('Image size must be less than 10MB', '图片大小需小于 10MB'));
        return null;
      }

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new window.Image();
          img.onload = () => {
            // Check minimum dimensions
            if (img.width < 400 || img.height < 400) {
              setError(t('Image must be at least 400x400 pixels', '图片尺寸至少为 400x400 像素'));
              resolve(null);
              return;
            }

            const optimizedPreview = optimizeImageDataUrl(img, dataUrl);
            setPreview(optimizedPreview);

            resolve({
              file,
              preview: optimizedPreview,
              width: img.width,
              height: img.height,
            });
          };
          img.onerror = () => {
            setError(t('Failed to load image', '图片加载失败'));
            resolve(null);
          };
          img.src = dataUrl;
        };
        reader.onerror = () => {
          setError(t('Failed to read file', '文件读取失败'));
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    },
    [optimizeImageDataUrl, t]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const result = await validateAndProcessImage(file);
        if (result) {
          onImageUploaded(result);
        }
      }
    },
    [validateAndProcessImage, onImageUploaded]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        const result = await validateAndProcessImage(file);
        if (result) {
          onImageUploaded(result);
        }
      }
    },
    [validateAndProcessImage, onImageUploaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  // Show login prompt if user is not logged in
  if (!loading && !user) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="relative rounded-2xl border-2 border-[#2d2a4a]/10 bg-gradient-to-br from-[#1a1f36]/5 to-[#2d2a4a]/5 overflow-hidden">
          <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d4aa]/20 to-[#0077ff]/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-[#00d4aa]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1a1f36] mb-2">
              {t('Login Required', '请先登录')}
            </h3>
            <p className="text-[#2d2a4a]/60 mb-6 max-w-md">
              {t(
                'Please login to upload your facade image and access all features. Create a free account to get started!',
                '请先登录后上传外立面图片并使用全部功能。注册免费账号即可开始。'
              )}
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-[#00d4aa] to-[#0077ff] hover:opacity-90 text-white">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('Login', '登录')}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa]/10">
                  {t('Create Account', '创建账号')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {!preview ? (
        <div
          className={cn(
            'relative rounded-2xl border-2 border-dashed transition-all duration-300',
            isDragging
              ? 'border-[#00d4aa] bg-[#00d4aa]/5 scale-[1.02]'
              : 'border-[#2d2a4a]/20 hover:border-[#00d4aa]/50',
            'cursor-pointer'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <label className="flex flex-col items-center justify-center cursor-pointer p-12 min-h-[300px]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0077ff] flex items-center justify-center mb-6 shadow-lg shadow-[#00d4aa]/20">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-medium text-[#1a1f36] mb-2">
              {t('Upload your facade image', '上传你的建筑外立面图片')}
            </p>
            <p className="text-sm text-[#2d2a4a]/60 mb-4">
              {t('Drag and drop or click to browse', '拖拽到此处，或点击选择文件')}
            </p>
            <p className="text-xs text-[#2d2a4a]/40">
              {t('JPG, PNG, WebP up to 10MB (min 400x400px)', '支持 JPG/PNG/WebP，最大 10MB（至少 400x400）')}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-[#fafbfc] border border-[#2d2a4a]/10">
          <div className="relative w-full max-h-[400px] aspect-[4/3]">
            <Image
              src={preview}
              alt={t('Uploaded facade', '已上传外立面')}
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-contain"
              unoptimized
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-[#1a1f36]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#1a1f36] transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
