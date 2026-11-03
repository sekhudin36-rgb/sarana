import React, { useState, useMemo } from 'react';
import {
  Radio,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Wifi,
  Users,
  Activity,
  Clock,
  Send,
  Megaphone,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Globe,
  Bell,
  Sparkles,
  Layers,
  Server,
  Cpu,
  Database
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';
import { ServerClientModal } from '../components/shared/ServerClientModal';
import { ServerTelemetryConsole } from '../components/server/ServerTelemetryConsole';

export default function ConnectedClients() {
  const { 
    activeClients, 
    sessionHistory, 
    refreshActiveClients, 
    broadcastAlert, 
    serverInfo,
    realtimeStatus,
    isLiveRealtime,
    pingLatency,
    clientId
  } = useData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'broadcast' | 'telemetry'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live timer tick untuk pembaruan detik status real-time
  const [nowTime, setNowTime] = useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Aktif sekarang';
    const diffSec = Math.floor((nowTime - new Date(isoString).getTime()) / 1000);
    if (diffSec <= 4) return 'Aktif sekarang';
    if (diffSec < 60) return `${diffSec} detik lalu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    return `${Math.floor(diffMin / 60)} jam lalu`;
  };

  // Broadcast state
  const [bcTitle, setBcTitle] = useState('Pemberitahuan Sarpras');
  const [bcMessage, setBcMessage] = useState('');
  const [bcLevel, setBcLevel] = useState<'info' | 'warning' | 'success'>('info');
  const [isSendingBc, setIsSendingBc] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshActiveClients();
    setTimeout(() => {
      setIsRefreshing(false);
      toast('Daftar perangkat terhubung berhasil diperbarui.', 'success');
    }, 400);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcMessage.trim()) {
      toast('Harap masukkan isi pesan pengumuman.', 'info');
      return;
    }

    setIsSendingBc(true);
    const success = await broadcastAlert(bcTitle, bcMessage, bcLevel);
    setIsSendingBc(false);

    if (success) {
      toast('Pengumuman berhasil disiarkan ke semua layar HP & Laptop yang sedang membuka aplikasi!', 'success');
      setBcMessage('');
    } else {
      toast('Gagal menyiarkan pengumuman.', 'error');
    }
  };

  // Compute metrics
  const totalActive = activeClients.length;
  const mobileCount = activeClients.filter(c => c.deviceType === 'mobile').length;
  const desktopCount = activeClients.filter(c => c.deviceType === 'desktop' || c.deviceType === 'tablet').length;
  const portalCount = activeClients.filter(c => c.role?.toLowerCase().includes('siswa') || c.path?.includes('portal')).length;

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return activeClients;
    const q = searchQuery.toLowerCase().trim();
    return (activeClients || []).filter(c => {
      if (!c) return false;
      return (
        (c.deviceName || '').toLowerCase().includes(q) ||
        (c.ip || '').toLowerCase().includes(q) ||
        (c.userName || '').toLowerCase().includes(q) ||
        (c.page || '').toLowerCase().includes(q) ||
        (c.os || '').toLowerCase().includes(q)
      );
    });
  }, [activeClients, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return sessionHistory;
    const q = searchQuery.toLowerCase().trim();
    return (sessionHistory || []).filter(c => {
      if (!c) return false;
      return (
        (c.deviceName || '').toLowerCase().includes(q) ||
        (c.ip || '').toLowerCase().includes(q) ||
        (c.userName || '').toLowerCase().includes(q) ||
        (c.page || '').toLowerCase().includes(q)
      );
    });
  }, [sessionHistory, searchQuery]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-indigo-500" />;
      case 'tablet':
        return <Tablet className="h-5 w-5 text-purple-500" />;
      default:
        return <Laptop className="h-5 w-5 text-sky-500" />;
    }
  };

  const exportLogsToCsv = () => {
    const list = sessionHistory.length > 0 ? sessionHistory : activeClients;
    if (list.length === 0) {
      toast('Belum ada log sesi untuk diekspor.', 'info');
      return;
    }

    const headers = ['ID Klien', 'Nama Perangkat', 'Tipe', 'Sistem Operasi', 'Browser', 'Alamat IP', 'Pengguna', 'Peran', 'Halaman Terakhir', 'Waktu Masuk'];
    const rows = list.map(item => [
      item.id,
      `"${item.deviceName}"`,
      item.deviceType,
      item.os,
      item.browser,
      item.ip,
      `"${item.userName}"`,
      `"${item.role}"`,
      `"${item.page}"`,
      item.connectedAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Log-Pengunjung-Sarpras-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Log aktivitas pengunjung berhasil diekspor.', 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Futuristic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-950/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all",
                isLiveRealtime
                  ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-xs shadow-emerald-500/20"
                  : "bg-amber-500/20 border border-amber-400/40 text-amber-300"
              )}>
                <span className="relative flex h-2 w-2">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isLiveRealtime ? "bg-emerald-400" : "bg-amber-400"
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isLiveRealtime ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                </span>
                <span>{isLiveRealtime ? 'Streaming Real-Time Aktif (SSE)' : 'Menghubungkan ke Node Real-Time...'}</span>
                {pingLatency !== null && (
                  <span className="text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-500/40 font-mono">
                    ⚡ {pingLatency} ms
                  </span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold backdrop-blur-md">
                <Wifi className="h-3 w-3 text-cyan-400" />
                <span>Port {serverInfo?.port || 3030} Intranet</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Perangkat & Pengguna Terhubung
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau secara langsung siapa saja yang sedang membuka aplikasi SIM Sarpras dari HP siswa, tablet, maupun laptop guru di jaringan Wi-Fi sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95",
                activeTab === 'telemetry'
                  ? "bg-emerald-600 text-white shadow-emerald-900/30"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-cyan-300"
              )}
            >
              <Server className="h-4 w-4 text-cyan-400" />
              <span>Konsol Server</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4 text-cyan-400", isRefreshing && "animate-spin")} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={() => setIsServerModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <QrCode className="h-4 w-4" />
              <span>QR & IP Jaringan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Holographic / Futuristic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Online */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aktif Sekarang
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalActive}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Perangkat Online
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Terhubung via Port {serverInfo?.port || 3030} Intranet
          </p>
        </div>

        {/* Card 2: Smartphone (HP Siswa & Guru) */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Smartphone (HP)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <Smartphone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {mobileCount}
            </span>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Unit HP Terdeteksi
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Akses via Browser HP (Chrome / Safari)
          </p>
        </div>

        {/* Card 3: Laptop & Komputer */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md hover:border-sky-300 dark:hover:border-sky-800 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Laptop & Komputer
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
              <Laptop className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {desktopCount}
            </span>
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
              PC / Laptop Aktif
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Termasuk Komputer Server Host
          </p>
        </div>

        {/* Card 4: Portal Siswa vs Admin */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Portal Peminjaman
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {portalCount}
            </span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Pengguna Portal
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Sedang melihat sarpras / mengajukan pinjaman
          </p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 w-fit">
          <button
            onClick={() => setActiveTab('live')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'live'
                ? "bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Radio className="h-4 w-4" />
            <span>Sedang Membuka ({activeClients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'broadcast'
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Megaphone className="h-4 w-4" />
            <span>Siarkan Pesan Pengumuman</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'history'
                ? "bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Clock className="h-4 w-4" />
            <span>Riwayat Sesi ({sessionHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'telemetry'
                ? "bg-gradient-to-r from-indigo-600 to-primary-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Server className="h-4 w-4" />
            <span>Konsol Server & Telemetri</span>
          </button>
        </div>

        {activeTab !== 'broadcast' && activeTab !== 'telemetry' && (
          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari IP, perangkat, nama..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button
              onClick={exportLogsToCsv}
              title="Ekspor ke CSV"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Live Active Clients */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Radio className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tidak ada perangkat yang cocok
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Klien di HP atau laptop lain akan muncul otomatis di sini begitu mereka membuka tautan IP server di jaringan Wi-Fi sekolah.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-700 group flex flex-col justify-between"
                >
                  {/* Glowing header bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 opacity-80" />

                  <div>
                    {/* Header: Device Icon & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                          {getDeviceIcon(client.deviceType)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {client.deviceName}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {client.os} • {client.browser}
                          </span>
                        </div>
                      </div>

                      {/* Online Status Pill & Device Identity */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                          Online
                        </span>
                        {client.id === clientId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Layar Anda Ini
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="space-y-2 py-2 border-t border-b border-slate-100 dark:border-slate-800/80 my-3 text-xs">
                      {/* IP Address */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400" />
                          Alamat IP:
                        </span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {client.ip}
                        </span>
                      </div>

                      {/* User Role */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          Pengguna:
                        </span>
                        <span className={cn(
                          "font-bold truncate max-w-[170px]",
                          client.role?.toLowerCase().includes('admin')
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-indigo-600 dark:text-indigo-400"
                        )}>
                          {client.userName}
                        </span>
                      </div>

                      {/* Current Page */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-slate-400" />
                          Halaman:
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[170px] text-right" title={client.page}>
                          {client.page}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Time & Badge */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {client.isHost ? 'Komputer Server (Host)' : 'Klien Eksternal Wi-Fi'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {getRelativeTime(client.lastSeen)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Broadcast Announcement */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Siarkan Pesan ke Semua Layar Klien
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pesan ini akan langsung muncul sebagai jendela pengumuman di setiap HP dan laptop yang sedang membuka aplikasi.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  placeholder="Misal: Pengumuman Sarpras, Batas Peminjaman, dll"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipe Notifikasi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBcLevel('info')}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                      bcLevel === 'info'
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <span>ℹ️ Informasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBcLevel('warning')}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                      bcLevel === 'warning'
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <span>⚠️ Peringatan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBcLevel('success')}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                      bcLevel === 'success'
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <span>✅ Pengumuman Resmi</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Isi Pesan Pengumuman
                </label>
                <textarea
                  rows={4}
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                  placeholder="Contoh: Seluruh siswa yang meminjam proyektor dan kabel HDMI diwajibkan mengembalikan sebelum pukul 13.30 WIB..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingBc || !bcMessage.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-500 hover:to-primary-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>Kirimkan ke Semua Layar Klien</span>
                </button>
              </div>
            </form>
          </div>

          {/* Broadcast Preview Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Pratinjau di Layar HP Siswa:
              </h4>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-2 rounded-xl text-white text-xs",
                    bcLevel === 'warning' ? "bg-amber-500" : bcLevel === 'success' ? "bg-emerald-500" : "bg-indigo-600"
                  )}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {bcTitle || 'Pemberitahuan Sarpras'}
                    </h5>
                    <span className="text-[10px] text-slate-400">Dari: Administrator Sekolah</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  {bcMessage || 'Isi pesan pengumuman akan ditampilkan secara langsung di sini...'}
                </p>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Waktu: Sekarang</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Otomatis Muncul di HP</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Teknologi Realtime Broadcast:
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Pesan disiarkan via Server-Sent Events tanpa membebani kuota internet, langsung mengalir melalui jaringan lokal Wi-Fi port {serverInfo?.port || 3030}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Session History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Riwayat Sesi Pembuka Aplikasi Hari Ini
              </h3>
              <p className="text-xs text-slate-500">
                Mencatat seluruh sesi yang pernah terhubung ke server SIM Sarpras.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Total {filteredHistory.length} Riwayat
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Perangkat</th>
                  <th className="py-3 px-4">Pengguna & Peran</th>
                  <th className="py-3 px-4">Alamat IP</th>
                  <th className="py-3 px-4">Halaman Dibuka</th>
                  <th className="py-3 px-4">Waktu Terkoneksi</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      Belum ada riwayat sesi tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {getDeviceIcon(item.deviceType)}
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.deviceName}</p>
                            <p className="text-[10px] text-slate-400">{item.os} • {item.browser}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{item.userName}</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{item.role}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.ip}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {item.page}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(item.connectedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Selesai / Terputus
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Server Telemetry & Enterprise Engine */}
      {activeTab === 'telemetry' && (
        <ServerTelemetryConsole />
      )}

      {/* Server & QR Modal */}
      <ServerClientModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
      />
    </div>
  );
}
