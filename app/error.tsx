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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Something went wrong
          </h1>
          <p className="text-base text-gray-500 sm:text-lg">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {error.message && (
          <div className="rounded-lg bg-red-50 p-4 text-left">
            <p className="text-sm text-red-800">
              {error.message}
            </p>
          </div>
        )}

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
