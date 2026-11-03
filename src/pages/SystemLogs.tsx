import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  Globe,
  Layers,
  Terminal,
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Activity,
  Server
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { SystemLogEntry, LogLevel, LogCategory } from '../types';
import { cn } from '../lib/utils';

export default function SystemLogs() {
  const navigate = useNavigate();
  const { systemLogs, clearSystemLogs, serverInfo } = useData();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute metrics
  const totalCount = systemLogs.length;
  const successCount = systemLogs.filter(l => l.level === 'SUCCESS').length;
  const warningCount = systemLogs.filter(l => l.level === 'WARNING' || l.level === 'DANGER').length;
  const authCount = systemLogs.filter(l => l.category === 'AUTH' || l.category === 'SECURITY').length;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return (systemLogs || []).filter(item => {
      if (!item) return false;
      const q = (searchQuery || '').trim().toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const actor = (item.actor || '').toLowerCase();
      const action = (item.action || '').toLowerCase();
      const ip = (item.ip || '').toLowerCase();

      const matchSearch = !q || desc.includes(q) || actor.includes(q) || action.includes(q) || ip.includes(q);
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchLevel = selectedLevel === 'ALL' || item.level === selectedLevel;

      return matchSearch && matchCategory && matchLevel;
    });
  }, [systemLogs, searchQuery, selectedCategory, selectedLevel]);

  const handleExportCsv = () => {
    if (systemLogs.length === 0) {
      toast('Belum ada log sistem untuk diekspor.', 'info');
      return;
    }

    const headers = ['ID Log', 'Waktu', 'Level', 'Kategori', 'Aksi', 'Aktor', 'Alamat IP', 'Deskripsi'];
    const rows = systemLogs.map(item => [
      item.id,
      `"${item.timestamp}"`,
      item.level,
      item.category,
      `"${item.action}"`,
      `"${item.actor}"`,
      `"${item.ip}"`,
      `"${item.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `System-Logs-Sarpras-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Berkas log sistem berhasil diekspor ke CSV.', 'success');
  };

  const handleCopyDetails = (log: SystemLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Detail log berhasil disalin ke clipboard.', 'success');
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            SUCCESS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-3 w-3" />
            WARNING
          </span>
        );
      case 'DANGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="h-3 w-3" />
            DANGER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Info className="h-3 w-3" />
            INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (category: LogCategory) => {
    switch (category) {
      case 'AUTH':
        return <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60">AUTENTIKASI</span>;
      case 'ASSET':
        return <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">MASTER ASET</span>;
      case 'CIRCULATION':
        return <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">SIRKULASI</span>;
      case 'MAINTENANCE':
        return <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">PEMELIHARAAN</span>;
      case 'DATABASE':
        return <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">DATABASE / CLOUD</span>;
      default:
        return <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">JARINGAN / SISTEM</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/60 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-300 text-xs font-semibold backdrop-blur-md">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              <span>Audit Trail & System Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Log Sistem & Jejak Aktivitas
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Merekam secara kronologis setiap transaksi aset, pengajuan peminjaman, autentikasi admin, pencadangan Google Drive, dan sinkronisasi intranet port {serverInfo?.port || 3030}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/active-sessions')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/25"
            >
              <Server className="h-4 w-4" />
              <span>Telemetri Server</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={systemLogs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-xs font-semibold text-rose-300 transition-all active:scale-95 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              <span>Bersihkan Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logs */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Log</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalCount}</span>
            <span className="text-xs font-medium text-slate-500">Aktivitas</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tersimpan dalam log sirkulasi</p>
        </div>

        {/* Card 2: Success Events */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kejadian Sukses</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{successCount}</span>
            <span className="text-xs font-medium text-emerald-600">Berhasil</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Aktivitas transaksi normal</p>
        </div>

        {/* Card 3: Warnings */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peringatan / Alert</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{warningCount}</span>
            <span className="text-xs font-medium text-amber-600">Perlu Perhatian</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Stok minimum, keterlambatan, dll</p>
        </div>

        {/* Card 4: Auth & Security */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akses & Keamanan</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 border border-purple-200 dark:border-purple-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{authCount}</span>
            <span className="text-xs font-medium text-purple-600">Sesi Autentikasi</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Log verifikasi kredensial</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari deskripsi, aktor, aksi, IP address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        {/* Filter Category */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="AUTH">Autentikasi (AUTH)</option>
            <option value="ASSET">Master Aset (ASSET)</option>
            <option value="CIRCULATION">Sirkulasi & Peminjaman</option>
            <option value="MAINTENANCE">Pemeliharaan & Servis</option>
            <option value="DATABASE">Database & Cloud Drive</option>
            <option value="NETWORK">Jaringan & Sistem</option>
          </select>

          {/* Filter Level */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="ALL">Semua Level</option>
            <option value="INFO">Level: INFO</option>
            <option value="SUCCESS">Level: SUCCESS</option>
            <option value="WARNING">Level: WARNING</option>
            <option value="DANGER">Level: DANGER</option>
          </select>

          {(searchQuery || selectedCategory !== 'ALL' || selectedLevel !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLevel('ALL');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kronologi Kejadian Sistem
              </h3>
              <p className="text-[11px] text-slate-500">
                Menampilkan {filteredLogs.length} dari total {systemLogs.length} rekaman kejadian
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Auto-logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Status / Level</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Aksi & Aktor</th>
                <th className="py-3 px-4">Alamat IP</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">Tidak ada log yang sesuai dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(log.category)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                          <User className="h-3 w-3" />
                          {log.actor}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.ip}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{log.description}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Detail Log: {selectedLog.action}
                    </h3>
                    {getLevelBadge(selectedLog.level)}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Properties List */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Kejadian</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori</span>
                <div className="mt-0.5">{getCategoryBadge(selectedLog.category)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Aktor / Pengguna</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedLog.actor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Alamat IP</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedLog.ip}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-bold block mb-1">Deskripsi Aktivitas:</span>
              <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {/* Details JSON viewer */}
            {selectedLog.details && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">Payload Data Teknis (JSON):</span>
                  <button
                    onClick={() => handleCopyDetails(selectedLog)}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-40 border border-slate-800">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Bersihkan Log Sistem?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Semua rekaman jejak audit yang tersimpan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  clearSystemLogs();
                  setIsClearModalOpen(false);
                  toast('Log sistem telah dibersihkan.', 'success');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
