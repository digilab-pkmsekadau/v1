'use client';

import UseAnimations from 'react-useanimations';
import loading2 from 'react-useanimations/lib/loading2';

/**
 * Indikator loading animasi (useAnimations loading2, loop).
 * Hormat prefers-reduced-motion bawaan. Selalu pasangkan teks via aria-label.
 */
export default function AnimatedLoader({
  size = 28,
  label = 'Memuat...',
}: {
  size?: number;
  label?: string;
}) {
  return (
    <span role="status" aria-label={label} className="inline-flex text-teal-700 dark:text-teal-400">
      <UseAnimations animation={loading2} size={size} />
    </span>
  );
}
