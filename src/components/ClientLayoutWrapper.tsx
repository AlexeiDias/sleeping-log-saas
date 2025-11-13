'use client';

import { Toaster } from 'react-hot-toast';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {children}
    </>
  );
}
