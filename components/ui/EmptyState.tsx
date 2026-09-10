import { Microscope, FlaskConical, Search } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-search' | 'no-params';
  message?: string;
}

export default function EmptyState({ type = 'no-data', message }: EmptyStateProps) {
  const configs = {
    'no-data': {
      icon: <Microscope size={36} className="text-black" />,
      bg: 'bg-orange-400 border-2 border-black',
      title: 'Belum Ada Data',
      desc: message ?? 'Belum ada pemeriksaan yang tercatat pada periode ini.',
    },
    'no-search': {
      icon: <Search size={36} className="text-black" />,
      bg: 'bg-gray-200 border-2 border-black',
      title: 'Tidak Ditemukan',
      desc: message ?? 'Tidak ada data yang cocok dengan pencarian kamu.',
    },
    'no-params': {
      icon: <FlaskConical size={36} className="text-black" />,
      bg: 'bg-indigo-400 border-2 border-black',
      title: 'Belum Ada Parameter',
      desc: message ?? 'Tidak ada data parameter untuk periode ini.',
    },
  };

  const cfg = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in">
      {/* Icon container */}
      <div className={`w-16 h-16 rounded-xl ${cfg.bg} flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}>
        {cfg.icon}
      </div>
      {/* Decorative dots */}
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-sm font-black text-black dark:text-white mb-1 uppercase">{cfg.title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed font-medium">{cfg.desc}</p>
    </div>
  );
}
