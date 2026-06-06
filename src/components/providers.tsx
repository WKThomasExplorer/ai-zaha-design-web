'use client';

import { AuthProvider } from '@/context/auth-context';
import { PostHogClientProvider } from '@/components/posthog-provider';
import { SessionReplayProvider } from '@/components/session-replay-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogClientProvider>
      <SessionReplayProvider>
        <AuthProvider>{children}</AuthProvider>
      </SessionReplayProvider>
    </PostHogClientProvider>
  );
}
