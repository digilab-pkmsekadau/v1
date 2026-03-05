'use client';

import { useEffect, useState } from 'react';
import { Shield, Loader2, AlertCircle, CheckCircle, Trash2, Edit, Plus } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entity_id?: string;
  description: string;
  user_email?: string;
  created_at: string;
}

const actionConfig = {
  CREATE: { icon: Plus,       color: 'text-teal-600',  bg: 'bg-teal-50',  border: 'border-teal-100',  label: 'Dibuat' },
  UPDATE: { icon: Edit,       color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-100',  label: 'Diubah' },
  DELETE: { icon: Trash2,     color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-100',   label: 'Dihapus' },
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/audit?limit=100');
        const json = await res.json();
        if (json.message?.includes('belum dibuat')) {
          setTableExists(false);
        }
        setLogs(json.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}>
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Audit Log</h1>
          <p className="text-xs text-slate-400 font-medium">Riwayat perubahan data sistem</p>
        </div>
      </div>

      {/* Setup notice */}
      {!tableExists && !loading && (
        <div className="glass-panel p-4 mb-4 border-l-4 border-amber-400 bg-amber-50">
          <div className="flex gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Tabel Audit Log Belum Dibuat</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Jalankan SQL berikut di Supabase SQL Editor:
              </p>
              <pre className="mt-2 text-[10px] bg-amber-100 rounded-xl p-3 text-amber-900 overflow-x-auto leading-relaxed">
{`CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  description text,
  user_email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON audit_log USING (true) WITH CHECK (true);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-purple-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel py-10 text-center">
          <CheckCircle size={32} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm font-bold text-slate-400">Belum ada aktivitas tercatat</p>
          <p className="text-xs text-slate-300 mt-1">Log akan muncul di sini setelah ada perubahan data</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {logs.length} aktivitas tercatat
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {logs.map(log => {
              const cfg = actionConfig[log.action] ?? actionConfig.UPDATE;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-xl border ${cfg.bg} ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-extrabold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{log.entity}</span>
                    </div>
                    {log.description && (
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{log.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {log.user_email && (
                        <span className="text-[10px] text-slate-400">{log.user_email}</span>
                      )}
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{timeAgo(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
