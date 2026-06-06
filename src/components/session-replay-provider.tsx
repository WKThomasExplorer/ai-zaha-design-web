'use client';

import { useEffect } from 'react';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_SV = process.env.NEXT_PUBLIC_HOTJAR_SV || '6';

export function SessionReplayProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (CLARITY_ID) {
      const w = window as Window & {
        clarity?: (...args: unknown[]) => void;
      };

      if (!w.clarity) {
        w.clarity = (...args: unknown[]) => {
          ((w as Window & { __clarityQueue?: unknown[][] }).__clarityQueue ||= []).push(args);
        };
      }

      const existing = document.querySelector('script[data-clarity="true"]');
      if (!existing) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
        script.dataset.clarity = 'true';
        document.head.appendChild(script);
      }
    }

    if (HOTJAR_ID) {
      const w = window as Window & {
        hj?: (...args: unknown[]) => void;
        _hjSettings?: { hjid: number; hjsv: number };
      };

      if (!w.hj) {
        w.hj = (...args: unknown[]) => {
          ((w as Window & { _hjQueue?: unknown[][] })._hjQueue ||= []).push(args);
        };
      }

      w._hjSettings = { hjid: Number(HOTJAR_ID), hjsv: Number(HOTJAR_SV) };

      const existing = document.querySelector('script[data-hotjar="true"]');
      if (!existing) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://static.hotjar.com/c/hotjar-${HOTJAR_ID}.js?sv=${HOTJAR_SV}`;
        script.dataset.hotjar = 'true';
        document.head.appendChild(script);
      }
    }
  }, []);

  return <>{children}</>;
}
