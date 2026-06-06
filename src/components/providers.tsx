'use client';

import { AuthProvider } from '@/context/auth-context';
import { PostHogClientProvider } from '@/components/posthog-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogClientProvider>
      <AuthProvider>{children}</AuthProvider>
    </PostHogClientProvider>
  );
}
