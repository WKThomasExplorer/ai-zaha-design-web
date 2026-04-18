'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
  message?: string;
  progress?: number;
}

export function LoadingState({
  className,
  message = 'Generating your design...',
  progress,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      {/* Animated Logo/Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-[#00d4aa]/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00d4aa] animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#0077ff] animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00d4aa] animate-pulse" />
        </div>
      </div>

      {/* Message */}
      <p className="text-lg font-medium text-[#1a1f36] mb-2">{message}</p>
      <p className="text-sm text-[#2d2a4a]/60 mb-6">
        This may take a few moments...
      </p>

      {/* Progress Bar (optional) */}
      {progress !== undefined && (
        <div className="w-64 h-2 rounded-full bg-[#2d2a4a]/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00d4aa] to-[#0077ff] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Generation Steps */}
      <div className="mt-8 space-y-3">
        <LoadingStep label="Analyzing your facade" done={!!(progress && progress > 20)} />
        <LoadingStep
          label="Generating effect image"
          done={!!(progress && progress > 50)}
          active={!!(progress && progress > 20 && progress <= 50)}
        />
        <LoadingStep
          label="Creating explosion diagram"
          done={!!(progress && progress > 90)}
          active={!!(progress && progress > 50 && progress <= 90)}
        />
      </div>
    </div>
  );
}

interface LoadingStepProps {
  label: string;
  done?: boolean;
  active?: boolean;
}

function LoadingStep({ label, done, active }: LoadingStepProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
          done
            ? 'bg-[#00d4aa]'
            : active
            ? 'bg-[#0077ff]/20 border-2 border-[#0077ff]'
            : 'bg-[#2d2a4a]/10'
        )}
      >
        {done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span
        className={cn(
          'text-sm transition-all duration-300',
          done
            ? 'text-[#00d4aa]'
            : active
            ? 'text-[#0077ff]'
            : 'text-[#2d2a4a]/40'
        )}
      >
        {label}
      </span>
    </div>
  );
}
