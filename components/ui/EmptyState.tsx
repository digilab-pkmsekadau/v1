import AnimatedStatusIcon from '@/components/ui/AnimatedStatusIcon';

interface EmptyStateProps {
  type?: 'no-data' | 'no-search' | 'no-params';
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ type = 'no-data', message, action }: EmptyStateProps) {
  const configs = {
    'no-data': {
      bg: 'bg-teal-600 border-2 border-black dark:border-white',
      title: 'Belum Ada Data',
      desc: message ?? 'Belum ada pemeriksaan yang tercatat pada periode ini.',
    },
    'no-search': {
      bg: 'bg-slate-200 dark:bg-zinc-700 border-2 border-black dark:border-white',
      title: 'Tidak Ditemukan',
      desc: message ?? 'Tidak ada data yang cocok dengan pencarian kamu.',
    },
    'no-params': {
      bg: 'bg-teal-600 border-2 border-black dark:border-white',
      title: 'Belum Ada Parameter',
      desc: message ?? 'Tidak ada data parameter untuk periode ini.',
    },
  };

  const cfg = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className={`w-16 h-16 rounded-xl ${cfg.bg} flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]`}>
        <AnimatedStatusIcon type={type} />
      </div>
      <p className="text-sm font-black text-black dark:text-white mb-1 uppercase">{cfg.title}</p>
      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-[240px] leading-relaxed font-medium">{cfg.desc}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
