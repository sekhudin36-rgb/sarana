import React, { useState } from "react";
import { Server, Wifi, Copy, Check, QrCode, X, Radio, RefreshCw, Smartphone, Laptop } from "lucide-react";
import QRCode from "react-qr-code";
import { useData } from "../../contexts/DataContext";
import { useToast } from "../../contexts/ToastContext";

interface ServerClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerClientModal({ isOpen, onClose }: ServerClientModalProps) {
  const { realtimeStatus, serverInfo, lastSyncTime } = useData();
  const toast = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedQrUrl, setSelectedQrUrl] = useState<string>("");

  if (!isOpen) return null;

  const currentPort = serverInfo?.port || 3030;
  const ips = serverInfo?.localIps || [];

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    toast("Tautan berhasil disalin ke clipboard!", "success");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const defaultQrUrl = ips.length > 0 ? ips[0].portalUrl || ips[0].url : `http://localhost:${currentPort}`;
  const activeQrUrl = selectedQrUrl || defaultQrUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Server-Client & Sinkronisasi Realtime
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    realtimeStatus === 'connected' ? 'bg-emerald-400' : realtimeStatus === 'connecting' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    realtimeStatus === 'connected' ? 'bg-emerald-500' : realtimeStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data terpusat di server, perubahan disinkronkan otomatis ke HP & laptop client
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">Status Server</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Radio className={`h-3.5 w-3.5 ${realtimeStatus === 'connected' ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                {realtimeStatus === 'connected' ? 'Aktif (Realtime)' : realtimeStatus === 'connecting' ? 'Menghubungkan...' : 'Offline'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">Port Aplikasi</span>
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 block mt-0.5">
                :{currentPort}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">Sinkronisasi Terakhir</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5 text-xs truncate">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString("id-ID") : "Baru saja"}
              </span>
            </div>
          </div>

          {/* QR Code & Direct Scan */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-slate-800/40 border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-md border border-indigo-100 dark:border-slate-700 shrink-0">
              <QRCode value={activeQrUrl} size={110} />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Smartphone className="h-4 w-4" />
                Scan Pakai Kamera HP / Tablet Siswa
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Arahkan kamera HP ke QR Code di samping untuk langsung membuka <strong>Portal Peminjaman</strong> atau aplikasi tanpa perlu mengetik alamat IP secara manual.
              </p>
              <div className="pt-1">
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 break-all">
                  {activeQrUrl}
                </span>
              </div>
            </div>
          </div>

          {/* List of IP Addresses for Client Access */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-primary-500" />
                Alamat IP Server di Jaringan Wi-Fi Sekolah:
              </span>
              <span className="text-[11px] text-slate-500">Klik untuk menyalin tautan</span>
            </div>

            <div className="space-y-2">
              {/* Localhost / Server PC */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">Komputer Server Ini</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">Local</span>
                  </div>
                  <div className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                    http://localhost:{currentPort}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(`http://localhost:${currentPort}`, -1)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0"
                  title="Salin Tautan"
                >
                  {copiedIndex === -1 ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Network IPs */}
              {ips.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedQrUrl(item.portalUrl || item.url)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    activeQrUrl === (item.portalUrl || item.url)
                      ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{item.label || item.interface}</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">Wi-Fi LAN</span>
                    </div>
                    <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                      {item.url}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Portal: {item.portalUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQrUrl(item.portalUrl || item.url);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                      title="Tampilkan QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.url, idx);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                      title="Salin Tautan"
                    >
                      {copiedIndex === idx ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Database terpusat: <span className="font-mono font-semibold">data/database.json</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
