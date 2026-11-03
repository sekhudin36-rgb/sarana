import React, { useState, useMemo, useEffect, useRef } from "react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { 
  Package, 
  Search, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Printer, 
  BookOpen, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Info, 
  Phone, 
  Check,
  Calendar,
  AlertCircle,
  ChevronDown,
  User,
  Building,
  FileText,
  X,
  CreditCard
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { PortalBottomNav, PortalTab } from "../components/portal/PortalBottomNav";
import { BroadcastAlertModal } from "../components/shared/BroadcastAlertModal";

export default function PortalPeminjaman() {
  const { assets, rooms, borrowings, setBorrowings, schoolProfile, realtimeStatus } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const appIcon = schoolProfile.logoAplikasi || schoolProfile.logoSekolah || "/icon.svg";
  
  const [activeTab, setActiveTab] = useState<PortalTab>("ajukan");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  // Secret Admin Access via Multi-tap on School Logo (3 taps)
  const logoTapRef = useRef<{ count: number; timer: NodeJS.Timeout | null }>({ count: 0, timer: null });
  const handleLogoTap = () => {
    logoTapRef.current.count += 1;
    if (logoTapRef.current.timer) clearTimeout(logoTapRef.current.timer);
    if (logoTapRef.current.count >= 3) {
      logoTapRef.current.count = 0;
      toast("Membuka Gerbang Akses Administrator...", "info");
      navigate("/login");
      return;
    }
    logoTapRef.current.timer = setTimeout(() => {
      logoTapRef.current.count = 0;
    }, 800);
  };

  // Secret Admin Access via Keyboard Shortcut (Ctrl + Shift + A or Alt + L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") || (e.altKey && e.key.toLowerCase() === "l")) {
        e.preventDefault();
        toast("Membuka Gerbang Akses Administrator...", "info");
        navigate("/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, toast]);
  
  // State for check status
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof borrowings>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // State for katalog aset
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const availableAssets = useMemo(() => {
    return assets.filter(a => a.kondisi !== "Rusak Berat");
  }, [assets]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(availableAssets.map(a => a.kategori).filter(Boolean)));
    return ["Semua", ...cats];
  }, [availableAssets]);

  const filteredCatalog = useMemo(() => {
    return (availableAssets || []).filter(a => {
      if (!a) return false;
      const term = (catalogSearch || "").trim().toLowerCase();
      const nama = (a.nama || "").toLowerCase();
      const kode = (a.kodeBarang || "").toLowerCase();
      const merk = (a.merk || "").toLowerCase();
      const matchQuery = !term || nama.includes(term) || kode.includes(term) || merk.includes(term);
      const matchCat = selectedCategory === "Semua" || a.kategori === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [availableAssets, catalogSearch, selectedCategory]);

  const pendingCount = useMemo(() => {
    return borrowings.filter(b => b.status === "Menunggu Persetujuan").length;
  }, [borrowings]);

  const handleDurasiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const durasi = parseInt(e.target.value) || 0;
    const tglPinjam = (document.getElementById('tanggalPinjam') as HTMLInputElement)?.value;
    if (durasi > 0 && tglPinjam) {
      const date = new Date(tglPinjam);
      date.setDate(date.getDate() + durasi);
      const kembaliEl = document.getElementById('rencanaTanggalKembali') as HTMLInputElement;
      if (kembaliEl) {
        kembaliEl.value = date.toISOString().split('T')[0];
      }
    }
  };

  const handleTglPinjamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const durasiEl = document.getElementById('durasi') as HTMLInputElement;
    if (durasiEl && durasiEl.value) {
      handleDurasiChange(durasiEl as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleSelectAssetForBorrow = (assetId: string) => {
    setSelectedAssetId(assetId);
    setActiveTab("ajukan");
    window.scrollTo({ top: 0, behavior: "smooth" });
    const selectedItem = assets.find(a => a.id === assetId);
    toast(`Aset "${selectedItem?.nama || 'Aset'}" telah dipilih. Lengkapi formulir di bawah.`, 'info');
  };

  const handleAjukan = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const chosenAssetId = selectedAssetId || (formData.get('assetId') as string);

    if (!chosenAssetId) {
      toast("Silakan tentukan aset yang ingin dipinjam.", "error");
      return;
    }

    const data: any = {
      peminjam: formData.get('peminjam'),
      nipPeminjam: formData.get('nipPeminjam'),
      kontakPeminjam: formData.get('kontakPeminjam'),
      alamat: formData.get('alamat'),
      jabatan: formData.get('jabatan'),
      unitKerja: formData.get('unitKerja'),
      penanggungJawab: formData.get('penanggungJawab'),
      lokasiPenggunaan: formData.get('lokasiPenggunaan'),
      keperluan: formData.get('keperluan'),
      keterangan: formData.get('keterangan'),
      kondisiPinjam: 'Sesuai kondisi aset',
      assetId: chosenAssetId,
      jumlah: parseInt(formData.get('jumlah') as string) || 1,
      durasi: formData.get('durasi'),
      tanggalPinjam: formData.get('tanggalPinjam'),
      rencanaTanggalKembali: formData.get('rencanaTanggalKembali'),
      status: 'Menunggu Persetujuan',
    };

    setBorrowings(prev => [...prev, { id: `BRW-${Date.now()}`, ...data }]);
    toast("Pengajuan peminjaman berhasil dikirim. Anda dapat memantau statusnya.", 'success');
    (e.target as HTMLFormElement).reset();
    setSelectedAssetId("");
    setActiveTab("status");
    setSearchQuery(data.peminjam);
    handleSearchStatus(data.peminjam);
  };

  const handleSearchStatus = (query: string = searchQuery) => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    const results = (borrowings || []).filter(b => {
      if (!b) return false;
      const peminjam = (b.peminjam || "").toLowerCase();
      const kontak = (b.kontakPeminjam || "").toLowerCase();
      const id = (b.id || "").toLowerCase();
      return peminjam.includes(q) || kontak.includes(q) || id.includes(q);
    }).sort((a, b) => new Date(b.tanggalPinjam || 0).getTime() - new Date(a.tanggalPinjam || 0).getTime());
    
    setSearchResults(results);
    setHasSearched(true);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Menunggu Persetujuan": return <Clock className="w-5 h-5 text-amber-500" />;
      case "Dipinjam": return <CheckCircle className="w-5 h-5 text-primary-500" />;
      case "Dikembalikan": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "Terlambat": return <XCircle className="w-5 h-5 text-rose-500" />;
      case "Ditolak": return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case "Menunggu Persetujuan": return "warning";
      case "Dipinjam": return "secondary";
      case "Dikembalikan": return "success";
      case "Terlambat": return "destructive";
      case "Ditolak": return "destructive";
      default: return "default";
    }
  };

  const selectedAssetObject = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col relative overflow-hidden text-slate-800 selection:bg-primary-500 selection:text-white font-sans antialiased">
      {/* Futuristic Background Atmospheric Glows */}
      <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.03)] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleLogoTap}
            title={schoolProfile.nama}
            className="h-10 w-10 flex items-center justify-center shrink-0 select-none cursor-pointer transition-transform active:scale-95"
          >
            <img src={appIcon} alt="Logo Sekolah" className="h-full w-full object-contain pointer-events-none" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">Portal Sarpras</h1>
            <p className="text-[11px] font-medium text-slate-500 truncate max-w-[200px] sm:max-w-xs">{schoolProfile.nama}</p>
          </div>
        </div>

        {/* Header Right: Bersih dan Elegan tanpa tanda tombol yang mencolok */}
        <div className="flex items-center gap-2">
          {/* Tanggal Hari Ini yang Elegan & Ramah Publik */}
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-700 block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Layanan Mandiri Sekolah</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-32 md:pb-16 relative z-10">
        
        {/* Desktop Hero Section */}
        <div className="hidden md:block text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-bold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Sistem Informasi Layanan Mandiri Sarana & Prasarana</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 leading-tight">
            Peminjaman Aset & Inventaris Sekolah
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
            Permudah proses permohonan peminjaman fasilitas sekolah secara terdata, transparan, dan dapat dipantau langsung statusnya.
          </p>
        </div>

        {/* Mobile Compact Identity Banner (Clean & Space-Efficient) */}
        <div className="md:hidden bg-gradient-to-br from-white to-slate-50/80 rounded-2xl p-4 border border-slate-200/90 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md inline-block mb-1">
                Layanan Publik Mandiri
              </span>
              <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                Peminjaman Fasilitas {schoolProfile.nama}
              </h2>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xs font-extrabold text-slate-900 block leading-none">{availableAssets.length}</span>
              <span className="text-[10px] text-slate-500 font-medium">Aset Siap</span>
            </div>
          </div>
        </div>

        {/* Desktop Tab Selector */}
        <div className="hidden md:flex justify-center mb-8">
          <div className="inline-flex bg-slate-200/60 backdrop-blur-md p-1.5 rounded-2xl gap-1 border border-white/60 shadow-sm">
            <button
              onClick={() => setActiveTab("ajukan")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'ajukan' 
                  ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Ajukan Peminjaman
            </button>
            <button
              onClick={() => setActiveTab("katalog")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'katalog' 
                  ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Katalog Aset
              {availableAssets.length > 0 && (
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                  {availableAssets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'status' 
                  ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Cek Status
              {pendingCount > 0 && (
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("panduan")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'panduan' 
                  ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Panduan & Prosedur
            </button>
          </div>
        </div>

        {/* Tab Card Body */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-5 sm:p-8 transition-all">
          
          {/* TAB 1: FORM PENGAJUAN */}
          {activeTab === "ajukan" && (
            <form onSubmit={handleAjukan} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Form Pengajuan Peminjaman</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Harap isi formulir di bawah ini dengan data yang valid dan dapat dipertanggungjawabkan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("katalog")}
                    className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Pilih dari Katalog</span>
                  </button>
                </div>
              </div>

              {/* Selected Asset Alert if preselected from Catalog */}
              {selectedAssetObject && (
                <div className="p-4 bg-gradient-to-r from-primary-50 to-indigo-50/70 border border-primary-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0 shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-primary-700 uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md inline-block">
                        Aset Dipilih dari Katalog
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {selectedAssetObject.nama} <span className="text-slate-500 font-mono font-normal">({selectedAssetObject.kodeBarang})</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAssetId("")}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 bg-white rounded-xl border border-rose-200 hover:bg-rose-50 transition-all shrink-0 active:scale-95"
                  >
                    Ganti / Reset
                  </button>
                </div>
              )}

              {/* Section 1: Identitas Peminjam */}
              <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm border-b border-slate-200/60 pb-2">
                  <User className="w-4 h-4 text-primary-600" />
                  <span>1. Identitas Lengkap Peminjam</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input 
                      name="peminjam" 
                      required 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="Misal: Ahmad Zaky" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">NIP / NIS / NISN <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input 
                      name="nipPeminjam" 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="Nomor identitas sekolah" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Jabatan / Status <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        name="jabatan" 
                        required 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Pilih status peminjam...</option>
                        <option value="Guru">Guru / Tenaga Pendidik</option>
                        <option value="Staf / Karyawan">Staf / Tenaga Kependidikan</option>
                        <option value="Siswa">Siswa / OSIS</option>
                        <option value="Lainnya">Pihak Luar / Umum</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Unit Kerja / Kelas <span className="text-rose-500">*</span></label>
                    <input 
                      name="unitKerja" 
                      required 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="Misal: Kelas 8B / Lab IPA" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nomor WhatsApp / HP <span className="text-rose-500">*</span></label>
                    <input 
                      name="kontakPeminjam" 
                      required 
                      type="tel" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="081234567890" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Penanggung Jawab <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input 
                      name="penanggungJawab" 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="Nama Wali Kelas/Guru Pembina" 
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Alamat Lengkap <span className="text-rose-500">*</span></label>
                    <textarea 
                      name="alamat" 
                      required 
                      rows={2} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all resize-none" 
                      placeholder="Alamat domisili peminjam saat ini"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Detail Aset & Waktu */}
              <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm border-b border-slate-200/60 pb-2">
                  <Package className="w-4 h-4 text-primary-600" />
                  <span>2. Pilihan Aset & Jadwal Peminjaman</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Aset yang Dipinjam <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        name="assetId" 
                        required 
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Pilih aset dari daftar tersedia...</option>
                        {availableAssets.map(a => {
                          const room = rooms.find(r => r.id === a.ruanganId);
                          return (
                            <option key={a.id} value={a.id}>
                              {a.nama} ({a.kodeBarang}) - Kondisi: {a.kondisi} {room ? `[Lokasi: ${room.nama}]` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Jumlah Unit <span className="text-rose-500">*</span></label>
                    <input 
                      name="jumlah" 
                      required 
                      type="number" 
                      min="1" 
                      defaultValue="1" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lama Pinjam (Hari) <span className="text-rose-500">*</span></label>
                    <input 
                      name="durasi" 
                      id="durasi" 
                      required 
                      type="number" 
                      min="1" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="Contoh: 2" 
                      onChange={handleDurasiChange} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tanggal Pinjam <span className="text-rose-500">*</span></label>
                    <input 
                      name="tanggalPinjam" 
                      id="tanggalPinjam" 
                      required 
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      onChange={handleTglPinjamChange} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Rencana Tanggal Kembali <span className="text-slate-400 font-normal">(Otomatis)</span></label>
                    <input 
                      name="rencanaTanggalKembali" 
                      id="rencanaTanggalKembali" 
                      required 
                      type="date" 
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none text-slate-500 cursor-not-allowed" 
                      readOnly 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Lokasi & Keperluan */}
              <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm border-b border-slate-200/60 pb-2">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <span>3. Lokasi Penggunaan & Tujuan</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lokasi Penggunaan Barang <span className="text-rose-500">*</span></label>
                    <input 
                      name="lokasiPenggunaan" 
                      required 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all" 
                      placeholder="Contoh: Ruang Audio Visual, Lapangan Upacara, dll." 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Keperluan Peminjaman <span className="text-rose-500">*</span></label>
                    <textarea 
                      name="keperluan" 
                      required 
                      rows={2} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 outline-none transition-all resize-none" 
                      placeholder="Tuliskan tujuan peminjaman secara ringkas..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Area */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data terkirim akan langsung tercatat pada sistem administrasi Sarpras.</span>
                </div>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl hover:from-primary-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
                >
                  <span>Kirim Permohonan</span>
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: KATALOG ASET */}
          {activeTab === "katalog" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Katalog Sarana & Fasilitas</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar sarana prasarana sekolah yang siap dipinjamkan.</p>
              </div>

              {/* Search Bar & Reset */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:bg-white focus:ring-3 focus:ring-primary-500/15 outline-none transition-all"
                  placeholder="Cari nama barang, merk, atau kode inventaris..."
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {filteredCatalog.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">Tidak ada aset yang sesuai kriteria</p>
                    <p className="text-xs text-slate-500 mt-0.5">Coba gunakan kata kunci lain atau bersihkan filter.</p>
                  </div>
                ) : (
                  filteredCatalog.map((asset) => {
                    const room = rooms.find(r => r.id === asset.ruanganId);

                    return (
                      <div 
                        key={asset.id} 
                        className="bg-white border border-slate-200/90 hover:border-primary-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {asset.kodeBarang}
                            </span>
                            <Badge 
                              variant={asset.kondisi === "Baik" ? "success" : "warning"}
                              className="text-[10px] font-bold px-2 py-0.5"
                            >
                              {asset.kondisi}
                            </Badge>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm mb-0.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
                            {asset.nama}
                          </h3>
                          <p className="text-xs text-slate-500 mb-3 line-clamp-1">{asset.merk || asset.bahan || "Standar Sekolah"}</p>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 mb-3.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{room ? room.nama : "Ruang Penyimpanan"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Pengadaan: {asset.tahunPerolehan}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectAssetForBorrow(asset.id)}
                          className="w-full py-2 px-3 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Pilih & Pinjam</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CEK STATUS */}
          {activeTab === "status" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Pantau Status Pengajuan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Lacak tahapan verifikasi peminjaman Anda secara langsung.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchStatus()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:border-primary-500 focus:bg-white focus:ring-3 focus:ring-primary-500/15 outline-none transition-all"
                    placeholder="Ketik Nama Lengkap, Nomor HP, atau ID Pengajuan..."
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setSearchResults([]); setHasSearched(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => handleSearchStatus()}
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                >
                  Cari Data
                </button>
              </div>

              {/* Search Results */}
              <div className="space-y-3.5 pt-2">
                {hasSearched && searchResults.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-900 font-bold text-sm">Data Tidak Ditemukan</p>
                    <p className="text-slate-500 text-xs mt-0.5 max-w-sm mx-auto">Pastikan nama peminjam, nomor HP, atau ID pengajuan sesuai dengan yang Anda daftarkan.</p>
                  </div>
                )}

                {searchResults.map((borrow) => {
                  const asset = assets.find(a => a.id === borrow.assetId);
                  return (
                    <div key={borrow.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                            {getStatusIcon(borrow.status)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ID: {borrow.id}</span>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{borrow.peminjam}</h3>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(borrow.status)} className="px-3 py-1 text-[11px] font-bold self-start sm:self-auto rounded-lg">
                          {borrow.status}
                        </Badge>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Barang</span>
                          <span className="font-bold text-slate-900">{asset ? asset.nama : "Tidak diketahui"}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Jumlah Unit</span>
                          <span className="font-bold text-slate-900">{borrow.jumlah || 1} Unit</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Durasi Pinjam</span>
                          <span className="font-bold text-slate-900">{borrow.durasi ? `${borrow.durasi} Hari` : '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Jadwal</span>
                          <span className="font-bold text-slate-900">
                            {new Date(borrow.tanggalPinjam).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} s.d. {borrow.rencanaTanggalKembali ? new Date(borrow.rencanaTanggalKembali).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "?"}
                          </span>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                          <div className="grid sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Lokasi Penggunaan</span>
                              <span className="font-semibold text-slate-900">{borrow.lokasiPenggunaan || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Tujuan Keperluan</span>
                              <p className="text-slate-700">{borrow.keperluan}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <Link 
                          to={`/cetak-bukti/${borrow.id}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5" /> 
                          <span>Cetak Bukti</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN & PROSEDUR */}
          {activeTab === "panduan" && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Alur & Prosedur Peminjaman</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tahapan baku peminjaman inventaris sarana prasarana sekolah.</p>
              </div>

              {/* 4 Steps Roadmap */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    step: "01",
                    title: "Isi Formulir Online",
                    desc: "Pilih aset dari katalog lalu lengkapi form peminjaman.",
                    icon: Send,
                  },
                  {
                    step: "02",
                    title: "Persetujuan Petugas",
                    desc: "Admin Sarpras memverifikasi ketersediaan dan menyetujui.",
                    icon: ShieldCheck,
                  },
                  {
                    step: "03",
                    title: "Pengambilan Barang",
                    desc: "Tunjukkan bukti pengajuan di ruang Sarpras saat mengambil.",
                    icon: Package,
                  },
                  {
                    step: "04",
                    title: "Pengembalian Tepat",
                    desc: "Kembalikan tepat waktu dalam kondisi bersih dan lengkap.",
                    icon: CheckCircle,
                  },
                ].map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <div key={item.step} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 relative">
                      <span className="text-xl font-black text-slate-300 absolute top-3 right-3">{item.step}</span>
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-xs mb-2.5">
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Terms & Regulations */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tata Tertib & Ketentuan Peminjaman</span>
                </div>
                <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Peminjaman hanya diperuntukkan untuk kegiatan resmi sekolah (akademik, ekskul, dinas).</li>
                  <li>Peminjam wajib memeriksa kelengkapan fisik saat serah terima barang di ruang Sarpras.</li>
                  <li>Kerusakan atau kehilangan akibat kelalaian menjadi tanggung jawab peminjam untuk diperbaiki/diganti.</li>
                  <li>Harap melapor bila membutuhkan perpanjangan waktu sebelum masa pengembalian berakhir.</li>
                </ul>
              </div>

              {/* Contact Help */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <h4 className="font-bold text-sm text-white">Butuh Bantuan Teknis?</h4>
                  <p className="text-xs text-slate-400">Silakan hubungi staf pengelola sarana prasarana sekolah.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {schoolProfile.telepon && (
                    <a href={`tel:${schoolProfile.telepon}`} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors">
                      <Phone className="w-3.5 h-3.5 text-primary-300" />
                      <span>{schoolProfile.telepon}</span>
                    </a>
                  )}
                  {schoolProfile.operator && (
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Operator: {schoolProfile.operator}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Futuristic Clean Footer with Secondary Secret Mark */}
      <footer className="w-full border-t border-slate-200/80 py-6 px-4 text-center text-xs text-slate-500 relative z-10 bg-white/40 backdrop-blur-xs mb-16 md:mb-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-600">
            © {new Date().getFullYear()} {schoolProfile.nama} • Portal Layanan Sarana & Prasarana
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <span>Terhubung ke Master Database</span>
            <span className="font-mono text-[10px] text-slate-400">v3.2.0</span>
          </div>
        </div>
      </footer>

      {/* Floating Futuristic Mobile Bottom Navigation Bar */}
      <PortalBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        availableCount={availableAssets.length}
        pendingCount={pendingCount}
      />

      <BroadcastAlertModal />
    </div>
  );
}
