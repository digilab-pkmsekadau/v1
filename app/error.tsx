'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] dark:bg-zinc-950 px-4 py-12 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-black dark:text-white sm:text-6xl uppercase">
            Error!
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg font-bold">
            Terjadi kesalahan tidak terduga. Silakan coba lagi.
          </p>
        </div>

        {error.message && (
          <div className="rounded-xl bg-rose-400 border-2 border-black dark:border-white p-4 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
            <p className="text-sm text-black font-bold">
              {error.message}
            </p>
          </div>
        )}

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 border-2 border-black dark:border-white px-6 py-3 text-base font-black uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
