'use client';

import UseAnimations from 'react-useanimations';
import activity from 'react-useanimations/lib/activity';
import archive from 'react-useanimations/lib/archive';
import searchToX from 'react-useanimations/lib/searchToX';

/**
 * Ikon animasi ringan (useAnimations, MIT, player 8 KB gzip, per ikon ~2 KB).
 * Hormat prefers-reduced-motion bawaan. Hanya untuk status, bukan nav.
 */
const MAP = { 'no-data': archive, 'no-search': searchToX, 'no-params': activity } as const;

export default function AnimatedStatusIcon({
  type,
  size = 36,
}: {
  type: keyof typeof MAP;
  size?: number;
}) {
  return (
    <span className="text-slate-700 dark:text-slate-200" aria-hidden="true">
      <UseAnimations animation={MAP[type]} size={size} />
    </span>
  );
}
