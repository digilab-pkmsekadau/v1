import { Microscope, FlaskConical, Search } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-search' | 'no-params';
  message?: string;
}

export default function EmptyState({ type = 'no-data', message }: EmptyStateProps) {
  const configs = {
    'no-data': {
      icon: <Microscope size={36} className="text-teal-400" />,
      bg: 'bg-teal-50',
      title: 'Belum Ada Data',
      desc: message ?? 'Belum ada pemeriksaan yang tercatat pada periode ini.',
    },
    'no-search': {
      icon: <Search size={36} className="text-slate-400" />,
      bg: 'bg-slate-50',
      title: 'Tidak Ditemukan',
      desc: message ?? 'Tidak ada data yang cocok dengan pencarian kamu.',
    },
    'no-params': {
      icon: <FlaskConical size={36} className="text-blue-400" />,
      bg: 'bg-blue-50',
      title: 'Belum Ada Parameter',
      desc: message ?? 'Tidak ada data parameter untuk periode ini.',
    },
  };

  const cfg = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in">
      {/* Icon container */}
      <div className={`w-16 h-16 rounded-2xl ${cfg.bg} flex items-center justify-center mb-4`}>
        {cfg.icon}
      </div>
      {/* Decorative dots */}
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-sm font-bold text-slate-600 mb-1">{cfg.title}</p>
      <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">{cfg.desc}</p>
    </div>
  );
}
