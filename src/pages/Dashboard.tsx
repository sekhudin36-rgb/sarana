import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { 
  Package, DoorClosed, CheckCircle2, AlertTriangle, Activity, Wrench, 
  ArrowRightLeft, Plus, Landmark, Cpu, Building2, Network, BookOpen, 
  Hammer, Binary, FileCheck2, Filter, Download, Printer, Table, LayoutGrid, 
  ChevronRight, Coins, ShieldCheck, Wallet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { motion } from 'motion/react';
import { Link } from "react-router-dom";
import { Asset, getAssetConditionBreakdown } from "../types";
import * as XLSX from "xlsx";

export type FundingFilter = "semua" | "bos" | "mandiri";

interface KibItemConfig {
  kode: string;
  name: string;
  label: string;
  categoryKey: string;
  deskripsi: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  icon: React.ElementType;
  matcher: (a: Asset) => boolean;
}

const KIB_CONFIGS: KibItemConfig[] = [
  {
    kode: "KIB A",
    name: "KIB A - Tanah",
    label: "Tanah",
    categoryKey: "Tanah (KIB A)",
    deskripsi: "Tanah persil, pekarangan, lapangan upacara & fasilitas olahraga",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    badgeBg: "bg-emerald-100 text-emerald-800",
    icon: Landmark,
    matcher: (a) => a.kategori === "Tanah (KIB A)" || (a.kategori || "").includes("KIB A")
  },
  {
    kode: "KIB B",
    name: "KIB B - Peralatan & Mesin",
    label: "Peralatan & Mesin",
    categoryKey: "Peralatan & Mesin (KIB B)",
    deskripsi: "Komputer, proyektor, genset, AC, pompa air, kendaraan, alat lab TIK",
    color: "text-sky-700 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
    badgeBg: "bg-sky-100 text-sky-800",
    icon: Cpu,
    matcher: (a) => a.kategori === "Peralatan & Mesin (KIB B)" || (a.kategori || "").includes("KIB B")
  },
  {
    kode: "KIB C",
    name: "KIB C - Gedung & Bangunan",
    label: "Gedung & Bangunan",
    categoryKey: "Gedung & Bangunan (KIB C)",
    deskripsi: "Gedung kelas VII-IX, kantor TU, lab, perpustakaan, aula, pos satpam",
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    badgeBg: "bg-indigo-100 text-indigo-800",
    icon: Building2,
    matcher: (a) => a.kategori === "Gedung & Bangunan (KIB C)" || (a.kategori || "").includes("KIB C")
  },
  {
    kode: "KIB D",
    name: "KIB D - Jalan, Irigasi & Jaringan",
    label: "Jalan, Irigasi & Jaringan",
    categoryKey: "Jalan, Irigasi & Jaringan (KIB D)",
    deskripsi: "Jalan lingkungan sekolah, drainase, instalasi air bersih, LAN & wifi",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeBg: "bg-amber-100 text-amber-800",
    icon: Network,
    matcher: (a) => a.kategori === "Jalan, Irigasi & Jaringan (KIB D)" || (a.kategori || "").includes("KIB D")
  },
  {
    kode: "KIB E",
    name: "KIB E - Aset Tetap Lainnya",
    label: "Aset Tetap Lainnya",
    categoryKey: "Aset Tetap Lainnya (KIB E)",
    deskripsi: "Buku perpustakaan, buku paket pelajaran, alat peraga musik & seni",
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
    badgeBg: "bg-violet-100 text-violet-800",
    icon: BookOpen,
    matcher: (a) => a.kategori === "Aset Tetap Lainnya (KIB E)" || (a.kategori || "").includes("KIB E")
  },
  {
    kode: "KIB F",
    name: "KIB F - Konstruksi dlm Pengerjaan",
    label: "Konstruksi dlm Pengerjaan",
    categoryKey: "Konstruksi dlm Pengerjaan",
    deskripsi: "Pekerjaan fisik atau renovasi gedung yang masih dalam proses pengerjaan",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    borderColor: "border-orange-200 dark:border-orange-800",
    badgeBg: "bg-orange-100 text-orange-800",
    icon: Hammer,
    matcher: (a) => (a.kategori || "").includes("KIB F") || (a.kategori || "").toLowerCase().includes("konstruksi")
  },
  {
    kode: "KIB ATB",
    name: "Aset Tak Berwujud",
    label: "Aset Tak Berwujud",
    categoryKey: "Aset Tak Berwujud",
    deskripsi: "Lisensi sistem operasi resmi, aplikasi SIM inventaris, hak cipta modul",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    badgeBg: "bg-cyan-100 text-cyan-800",
    icon: Binary,
    matcher: (a) => a.kategori === "Aset Tak Berwujud" || (a.kategori || "").toLowerCase().includes("tak berwujud")
  },
  {
    kode: "EKSTRA",
    name: "Ekstrakomptabel",
    label: "Ekstrakomptabel",
    categoryKey: "Ekstrakomptabel",
    deskripsi: "Barang di bawah nilai batas kapitalisasi yang tetap tercatat resmi sekolah",
    color: "text-rose-700 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800",
    badgeBg: "bg-rose-100 text-rose-800",
    icon: FileCheck2,
    matcher: (a) => a.kategori === "Ekstrakomptabel" || (a.komptabel || "").toLowerCase() === "ekstra" || (a.kategori || "").toLowerCase().includes("ekstra")
  }
];

export default function Dashboard() {
  const { assets, rooms, maintenances, borrowings, schoolProfile } = useData();
  const toast = useToast();

  const [fundingFilter, setFundingFilter] = useState<FundingFilter>("semua");
  const [viewKibMode, setViewKibMode] = useState<"cards" | "table">("cards");

  // Helper detection for funding source
  const isBosAsset = (a: Asset) => {
    const sumber = (a.sumberDana || "").toLowerCase();
    const asal = (a.asalUsul || "").toLowerCase();
    const ket = (a.keterangan || "").toLowerCase();
    const cat = (a.catatan || "").toLowerCase();
    return (
      sumber.includes("bos") ||
      asal.includes("bos") ||
      ket.includes("bos") ||
      cat.includes("bos")
    );
  };

  const isMandiriAsset = (a: Asset) => {
    return !isBosAsset(a);
  };

  // Quantity and breakdown-aware helper
  const getAssetTotal = (a: Asset) => getAssetConditionBreakdown(a).total;
  const getAssetVal = (a: Asset) => (a.harga || 0) * getAssetTotal(a);

  // High-level aggregates (Physical units & value)
  const totalAllAssets = assets.reduce((sum, a) => sum + getAssetTotal(a), 0);
  const totalAllAssetItems = assets.length;
  const totalAllValue = assets.reduce((sum, a) => sum + getAssetVal(a), 0);

  const bosAssets = assets.filter(isBosAsset);
  const totalBosCount = bosAssets.reduce((sum, a) => sum + getAssetTotal(a), 0);
  const totalBosValue = bosAssets.reduce((sum, a) => sum + getAssetVal(a), 0);

  const mandiriAssets = assets.filter(isMandiriAsset);
  const totalMandiriCount = mandiriAssets.reduce((sum, a) => sum + getAssetTotal(a), 0);
  const totalMandiriValue = mandiriAssets.reduce((sum, a) => sum + getAssetVal(a), 0);

  // Filtered assets based on selected funding filter
  const filteredAssets = assets.filter(a => {
    if (fundingFilter === "bos") return isBosAsset(a);
    if (fundingFilter === "mandiri") return isMandiriAsset(a);
    return true;
  });

  const totalFilteredCount = filteredAssets.reduce((sum, a) => sum + getAssetTotal(a), 0);
  const totalFilteredItems = filteredAssets.length;
  const totalFilteredValue = filteredAssets.reduce((sum, a) => sum + getAssetVal(a), 0);

  // Compute breakdown tallies for filtered assets
  const filteredBreakdownTotals = filteredAssets.reduce((acc, a) => {
    const bd = getAssetConditionBreakdown(a);
    acc.baik += bd.baik;
    acc.rusakRingan += bd.rusakRingan;
    acc.rusakBerat += bd.rusakBerat;
    acc.hilang += bd.hilang;
    acc.tidakDiketahui += bd.tidakDiketahui;
    return acc;
  }, { baik: 0, rusakRingan: 0, rusakBerat: 0, hilang: 0, tidakDiketahui: 0 });

  // Compute stats for all 8 KIBs
  const kibSummaries = KIB_CONFIGS.map(config => {
    const allMatching = assets.filter(config.matcher);
    const bosMatching = allMatching.filter(isBosAsset);
    const mandiriMatching = allMatching.filter(isMandiriAsset);

    const currentMatching = allMatching.filter(a => {
      if (fundingFilter === "bos") return isBosAsset(a);
      if (fundingFilter === "mandiri") return isMandiriAsset(a);
      return true;
    });

    const currentUnits = currentMatching.reduce((sum, a) => sum + getAssetTotal(a), 0);
    const currentValue = currentMatching.reduce((sum, a) => sum + getAssetVal(a), 0);

    const matchingBreakdowns = currentMatching.map(getAssetConditionBreakdown);
    const goodCount = matchingBreakdowns.reduce((sum, bd) => sum + bd.baik, 0);
    const damagedCount = matchingBreakdowns.reduce((sum, bd) => sum + bd.rusakRingan + bd.rusakBerat, 0);
    const rusakRinganCount = matchingBreakdowns.reduce((sum, bd) => sum + bd.rusakRingan, 0);
    const rusakBeratCount = matchingBreakdowns.reduce((sum, bd) => sum + bd.rusakBerat, 0);

    return {
      ...config,
      totalCount: allMatching.reduce((sum, a) => sum + getAssetTotal(a), 0),
      totalItems: allMatching.length,
      totalValue: allMatching.reduce((sum, a) => sum + getAssetVal(a), 0),
      count: currentUnits,
      itemsCount: currentMatching.length,
      value: currentValue,
      bosCount: bosMatching.reduce((sum, a) => sum + getAssetTotal(a), 0),
      bosValue: bosMatching.reduce((sum, a) => sum + getAssetVal(a), 0),
      mandiriCount: mandiriMatching.reduce((sum, a) => sum + getAssetTotal(a), 0),
      mandiriValue: mandiriMatching.reduce((sum, a) => sum + getAssetVal(a), 0),
      goodCount,
      damagedCount,
      rusakRinganCount,
      rusakBeratCount,
    };
  });

  // Top header quick stats
  const stats = {
    totalAssets: totalFilteredCount,
    totalItems: totalFilteredItems,
    totalRooms: rooms.length,
    goodCondition: filteredBreakdownTotals.baik,
    rusakRingan: filteredBreakdownTotals.rusakRingan,
    rusakBerat: filteredBreakdownTotals.rusakBerat,
    needsRepair: filteredBreakdownTotals.rusakRingan + filteredBreakdownTotals.rusakBerat,
    hilangCount: filteredBreakdownTotals.hilang,
    unknownCount: filteredBreakdownTotals.tidakDiketahui,
    maintenanceCount: maintenances.length,
    totalValue: totalFilteredValue,
    activeBorrowings: borrowings?.filter(b => b.status === "Dipinjam" || b.status === "Menunggu Persetujuan").length || 0
  };

  // Chart data matching active filter
  const categoryChartData = kibSummaries
    .map(k => ({
      name: k.label,
      jumlah: k.count,
      nilai: k.value
    }))
    .filter(k => k.jumlah > 0 || k.name === "Tanah" || k.name === "Peralatan & Mesin");

  const conditionData = [
    { name: 'Baik', value: filteredBreakdownTotals.baik, color: '#10b981' },
    { name: 'Rusak Ringan', value: filteredBreakdownTotals.rusakRingan, color: '#f59e0b' },
    { name: 'Rusak Berat', value: filteredBreakdownTotals.rusakBerat, color: '#ef4444' },
    { name: 'Hilang', value: filteredBreakdownTotals.hilang, color: '#dc2626' },
    { name: 'Tidak Diketahui', value: filteredBreakdownTotals.tidakDiketahui, color: '#64748b' }
  ].filter(c => c.value > 0);

  // Growth Trend Data by year
  const growthDataMap = filteredAssets.reduce((acc, curr) => {
    const year = curr.tahunPerolehan || new Date().getFullYear();
    if (!acc[year]) acc[year] = 0;
    acc[year] += 1;
    return acc;
  }, {} as Record<number, number>);
  
  const growthData = Object.entries(growthDataMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, total]) => ({ year, total }));

  // Export Rekap KIB to Excel
  const handleExportKibExcel = () => {
    const exportRows = kibSummaries.map((kib, idx) => ({
      "No": idx + 1,
      "Kode KIB": kib.kode,
      "Nama Klasifikasi KIB": kib.name,
      "Deskripsi Cakupan": kib.deskripsi,
      "Jumlah Barang (Item/Unit)": kib.count,
      "Total Nilai Perolehan (Rp)": kib.value,
      "Tercatat di Dana BOS (Unit)": kib.bosCount,
      "Nilai Tercatat BOS (Rp)": kib.bosValue,
      "Beli Mandiri Sekolah (Unit)": kib.mandiriCount,
      "Nilai Mandiri Sekolah (Rp)": kib.mandiriValue,
      "Kondisi Baik (Unit)": kib.goodCount,
      "Kondisi Rusak (Unit)": kib.damagedCount,
    }));

    // Add Grand Total row
    exportRows.push({
      "No": "",
      "Kode KIB": "TOTAL",
      "Nama Klasifikasi KIB": "TOTAL KESELURUHAN",
      "Deskripsi Cakupan": `Sumber: ${fundingFilter === 'bos' ? 'Tercatat Dana BOS' : fundingFilter === 'mandiri' ? 'Beli Mandiri Sekolah Tanpa BOS' : 'Semua Sumber Dana'}`,
      "Jumlah Barang (Item/Unit)": totalFilteredCount,
      "Total Nilai Perolehan (Rp)": totalFilteredValue,
      "Tercatat di Dana BOS (Unit)": totalBosCount,
      "Nilai Tercatat BOS (Rp)": totalBosValue,
      "Beli Mandiri Sekolah (Unit)": totalMandiriCount,
      "Nilai Mandiri Sekolah (Rp)": totalMandiriValue,
      "Kondisi Baik (Unit)": stats.goodCondition,
      "Kondisi Rusak (Unit)": stats.needsRepair,
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekapitulasi_KIB");
    const filename = `Rekap_KIB_${fundingFilter}_${schoolProfile?.nama?.replace(/\s+/g, '_') || 'UPTD_SMPN_3_Kras'}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast("Berhasil mengunduh rekapitulasi KIB ke Excel!", "success");
  };

  const handlePrintKib = () => {
    window.print();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Top Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
            Dashboard Inventaris & Rekap KIB
          </h2>
          <p className="text-xs sm:text-sm text-black dark:text-slate-300 font-medium mt-0.5 sm:mt-1">
            Monitoring sarana, prasarana, nilai perolehan, dan sumber pendanaan {schoolProfile?.nama || "UPTD SMPN 3 Kras"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button 
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-black dark:text-slate-200 px-3 py-2 font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            onClick={() => window.location.hash = '/borrowing'}
          >
            <ArrowRightLeft className="h-4 w-4 text-sky-600" />
            <span>Peminjaman</span>
          </button>
          <button 
            className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-black dark:text-slate-200 px-3 py-2 font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            onClick={() => window.location.hash = '/maintenance'}
          >
            <Wrench className="h-4 w-4 text-amber-600" />
            <span>Lapor Rusak</span>
          </button>
          <button 
            className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 font-bold rounded-xl shadow-sm shadow-sky-600/20 transition-all text-xs sm:text-sm cursor-pointer"
            onClick={() => window.location.hash = '/assets'}
          >
            <Package className="h-4 w-4" />
            <span>Kelola Aset</span>
          </button>
        </div>
      </motion.div>

      {/* Primary KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Aset */}
        <Card className="col-span-2 sm:col-span-1 hover:shadow-md transition-shadow relative overflow-hidden group border-sky-200 bg-white">
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <Package className="h-20 w-20 sm:h-24 sm:w-24 text-sky-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-bold text-black dark:text-slate-300">Total Aset</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-sky-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-black dark:text-white tabular-nums">{stats.totalAssets}</span>
              <span className="text-xs font-bold text-slate-500">Unit ({stats.totalItems} Judul)</span>
            </div>
            <p className="text-xs sm:text-sm text-sky-800 font-bold mt-0.5 truncate tabular-nums">
              Rp {stats.totalValue.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        
        {/* Kondisi Baik */}
        <Card className="col-span-1 hover:shadow-md transition-shadow relative overflow-hidden group border-emerald-200 bg-white">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <CheckCircle2 className="h-16 w-16 sm:h-24 sm:w-24 text-emerald-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-bold text-black dark:text-slate-300">Kondisi Baik</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xl sm:text-3xl font-black text-black dark:text-white tabular-nums">
              {stats.goodCondition} <span className="text-xs font-semibold text-slate-500">Unit</span>
            </div>
            <p className="text-[11px] sm:text-sm text-emerald-800 font-bold mt-0.5 truncate">
              {stats.totalAssets > 0 ? `${Math.round((stats.goodCondition / stats.totalAssets) * 100)}% Siap Digunakan` : "Siap digunakan"}
            </p>
          </CardContent>
        </Card>
        
        {/* Perbaikan */}
        <Card className="col-span-1 hover:shadow-md transition-shadow relative overflow-hidden group border-amber-200 bg-white">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <AlertTriangle className="h-16 w-16 sm:h-24 sm:w-24 text-amber-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-bold text-black dark:text-slate-300">Perbaikan</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xl sm:text-3xl font-black text-black dark:text-white tabular-nums">
              {stats.needsRepair} <span className="text-xs font-semibold text-slate-500">Unit</span>
            </div>
            <p className="text-[11px] sm:text-sm text-amber-800 font-bold mt-0.5 truncate">
              {stats.rusakRingan} RR • {stats.rusakBerat} Rusak Berat
            </p>
          </CardContent>
        </Card>
        
        {/* Dipinjam */}
        <Card className="col-span-1 hover:shadow-md transition-shadow relative overflow-hidden group border-sky-200 bg-white">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <ArrowRightLeft className="h-16 w-16 sm:h-24 sm:w-24 text-sky-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-bold text-black dark:text-slate-300">Dipinjam</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="h-4 w-4 text-sky-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xl sm:text-3xl font-black text-black dark:text-white tabular-nums">{stats.activeBorrowings}</div>
            <p className="text-[11px] sm:text-sm text-sky-800 font-bold mt-0.5 truncate">Sedang dipakai</p>
          </CardContent>
        </Card>
        
        {/* Total Ruangan */}
        <Card className="col-span-1 hover:shadow-md transition-shadow relative overflow-hidden group border-sky-200 bg-white">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <DoorClosed className="h-16 w-16 sm:h-24 sm:w-24 text-sky-700" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-bold text-black dark:text-slate-300">Ruangan</CardTitle>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <DoorClosed className="h-4 w-4 text-sky-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xl sm:text-3xl font-black text-black dark:text-white tabular-nums">{stats.totalRooms}</div>
            <p className="text-[11px] sm:text-sm text-sky-800 font-bold mt-0.5 truncate">Titik lokasi</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alert Banner for Hilang & Tidak Diketahui */}
      {(stats.hilangCount > 0 || stats.unknownCount > 0) && (
        <motion.div variants={itemVariants} className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center shrink-0 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-red-950 dark:text-red-200">
                Perhatian Audit Inventaris: Terdeteksi {stats.hilangCount > 0 ? `${stats.hilangCount} Aset Hilang` : ""}{stats.hilangCount > 0 && stats.unknownCount > 0 ? " & " : ""}{stats.unknownCount > 0 ? `${stats.unknownCount} Aset Tidak Diketahui Keberadaannya` : ""}
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 mt-0.5">
                Segera lakukan pengecekan fisik, Berita Acara Pemeriksaan (BAP), atau usulan penelusuran lebih lanjut.
              </p>
            </div>
          </div>
          <Link
            to="/assets"
            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
          >
            Lihat Daftar Aset
          </Link>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: SEMUA KIB, JUMLAH BARANG, NILAI, & FILTER SUMBER DANA BOS/MANDIRI */}
      {/* ========================================================================= */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="bg-sky-50 dark:bg-slate-900 border-2 border-sky-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
          {/* Header of KIB section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-sky-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-600 text-white">
                  <Landmark className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
                    Rekapitulasi Seluruh KIB & Nilai Barang
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-300 mt-0.5">
                    Menampilkan seluruh klasifikasi KIB (A, B, C, D, E, F, Aset Tak Berwujud, & Ekstrakomptabel) dengan filter sumber dana.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions (View Toggle, Export, Print) */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-sky-200 dark:border-slate-700 shadow-2xs">
                <button
                  onClick={() => setViewKibMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    viewKibMode === "cards" 
                      ? "bg-sky-600 text-white shadow-xs" 
                      : "text-black dark:text-white hover:bg-sky-50 dark:hover:bg-slate-700"
                  }`}
                  title="Tampilan Kartu KIB"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Kartu</span>
                </button>
                <button
                  onClick={() => setViewKibMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    viewKibMode === "table" 
                      ? "bg-sky-600 text-white shadow-xs" 
                      : "text-black dark:text-white hover:bg-sky-50 dark:hover:bg-slate-700"
                  }`}
                  title="Tampilan Tabel Rekapitulasi KIB"
                >
                  <Table className="w-4 h-4" />
                  <span>Tabel Rekap</span>
                </button>
              </div>

              <button
                onClick={handleExportKibExcel}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                title="Ekspor Rekap KIB ke Excel"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={handlePrintKib}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-black dark:text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                title="Cetak Rekap KIB"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* FILTER: SUMBER DANA (SEMUA / TERCATAT BOS / BELI MANDIRI SEKOLAH TANPA DANA BOS) */}
          <div className="pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs sm:text-sm font-black text-black dark:text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-sky-700" />
                Filter Sumber Pendanaan KIB:
              </label>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                Menampilkan: <span className="text-sky-700 dark:text-sky-400 font-extrabold">{totalFilteredCount} Barang</span> • Nilai: <span className="text-sky-700 dark:text-sky-400 font-extrabold">Rp {totalFilteredValue.toLocaleString('id-ID')}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Tab 1: Semua */}
              <button
                type="button"
                onClick={() => setFundingFilter("semua")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  fundingFilter === "semua"
                    ? "bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300"
                    : "bg-white dark:bg-slate-800 text-black dark:text-white border-sky-200 hover:border-sky-400 hover:bg-sky-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${fundingFilter === "semua" ? "text-sky-100" : "text-slate-700"}`}>
                    Semua Pendanaan
                  </span>
                  <Coins className={`w-4 h-4 ${fundingFilter === "semua" ? "text-white" : "text-sky-600"}`} />
                </div>
                <div className="text-base sm:text-lg font-black mt-1">Semua Sumber Dana</div>
                <div className={`text-xs font-bold mt-1 tabular-nums ${fundingFilter === "semua" ? "text-sky-100" : "text-slate-900"}`}>
                  {totalAllAssets} Barang • Rp {totalAllValue.toLocaleString('id-ID')}
                </div>
              </button>

              {/* Tab 2: Tercatat di Dana BOS */}
              <button
                type="button"
                onClick={() => setFundingFilter("bos")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  fundingFilter === "bos"
                    ? "bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300"
                    : "bg-white dark:bg-slate-800 text-black dark:text-white border-sky-200 hover:border-sky-400 hover:bg-sky-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${fundingFilter === "bos" ? "text-sky-100" : "text-emerald-700"}`}>
                    Pemerintah / BOS
                  </span>
                  <ShieldCheck className={`w-4 h-4 ${fundingFilter === "bos" ? "text-white" : "text-emerald-600"}`} />
                </div>
                <div className="text-base sm:text-lg font-black mt-1">Tercatat di Dana BOS</div>
                <div className={`text-xs font-bold mt-1 tabular-nums ${fundingFilter === "bos" ? "text-sky-100" : "text-slate-900"}`}>
                  {totalBosCount} Barang • Rp {totalBosValue.toLocaleString('id-ID')}
                </div>
                <div className={`text-[11px] mt-0.5 font-medium ${fundingFilter === "bos" ? "text-sky-100" : "text-slate-600"}`}>
                  BOS Reguler, Kinerja, & BOS Daerah
                </div>
              </button>

              {/* Tab 3: Beli Mandiri Sekolah Tanpa Dana BOS */}
              <button
                type="button"
                onClick={() => setFundingFilter("mandiri")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  fundingFilter === "mandiri"
                    ? "bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300"
                    : "bg-white dark:bg-slate-800 text-black dark:text-white border-sky-200 hover:border-sky-400 hover:bg-sky-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${fundingFilter === "mandiri" ? "text-sky-100" : "text-indigo-700"}`}>
                    Swadana / Non-BOS
                  </span>
                  <Wallet className={`w-4 h-4 ${fundingFilter === "mandiri" ? "text-white" : "text-indigo-600"}`} />
                </div>
                <div className="text-base sm:text-lg font-black mt-1">Beli Mandiri Sekolah (Tanpa BOS)</div>
                <div className={`text-xs font-bold mt-1 tabular-nums ${fundingFilter === "mandiri" ? "text-sky-100" : "text-slate-900"}`}>
                  {totalMandiriCount} Barang • Rp {totalMandiriValue.toLocaleString('id-ID')}
                </div>
                <div className={`text-[11px] mt-0.5 font-medium ${fundingFilter === "mandiri" ? "text-sky-100" : "text-slate-600"}`}>
                  Kas Sekolah, Komite, Yayasan, & Hibah
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ======================= */}
        {/* VIEW 1: CARDS GRID VIEW */}
        {/* ======================= */}
        {viewKibMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kibSummaries.map((kib, idx) => {
              const IconComp = kib.icon;
              return (
                <Card 
                  key={idx} 
                  className="bg-white dark:bg-slate-900 border-2 border-sky-200 dark:border-slate-800 hover:border-sky-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${kib.badgeBg}`}>
                        {kib.kode}
                      </span>
                      <div className={`p-2 rounded-xl ${kib.bgColor}`}>
                        <IconComp className={`h-4 w-4 ${kib.color}`} />
                      </div>
                    </div>
                    <CardTitle className="text-base font-extrabold text-black dark:text-white mt-2 leading-snug">
                      {kib.name}
                    </CardTitle>
                    <p className="text-xs text-slate-700 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {kib.deskripsi}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Count & Value */}
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl sm:text-3xl font-black text-black dark:text-white tabular-nums">
                          {kib.count} <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Unit</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                          {kib.goodCount} Baik
                        </span>
                      </div>

                      <div className="mt-1">
                        <span className="text-xs font-bold text-slate-600 block">Total Nilai Perolehan:</span>
                        <div className="text-sm sm:text-base font-black text-sky-800 dark:text-sky-300 tabular-nums">
                          Rp {kib.value.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Funding Breakdown Chips */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1 text-slate-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            Tercatat BOS:
                          </span>
                          <span className="tabular-nums font-black text-black">
                            {kib.bosCount} unit <span className="text-slate-600 font-semibold">(Rp {kib.bosValue.toLocaleString('id-ID')})</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1 text-slate-700">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            Beli Mandiri:
                          </span>
                          <span className="tabular-nums font-black text-black">
                            {kib.mandiriCount} unit <span className="text-slate-600 font-semibold">(Rp {kib.mandiriValue.toLocaleString('id-ID')})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct link to filtered Assets */}
                    <div className="pt-2">
                      <Link
                        to={`/assets?kib=${encodeURIComponent(kib.categoryKey)}&dana=${fundingFilter}`}
                        className="w-full flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-900 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-slate-700 transition-colors"
                      >
                        <span>Lihat Daftar Barang ({kib.count})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ================================== */}
        {/* VIEW 2: COMPREHENSIVE REKAP TABLE  */}
        {/* ================================== */}
        {viewKibMode === "table" && (
          <div className="bg-white dark:bg-slate-900 border-2 border-sky-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-black dark:text-white border-collapse">
                <thead className="bg-sky-100/70 dark:bg-slate-800 border-b-2 border-sky-300 dark:border-slate-700 font-black text-black dark:text-white">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4">Klasifikasi KIB</th>
                    <th className="py-3 px-4 hidden md:table-cell">Cakupan / Deskripsi</th>
                    <th className="py-3 px-4 text-center">Jumlah Barang</th>
                    <th className="py-3 px-4 text-right">Total Nilai (Rp)</th>
                    <th className="py-3 px-4 text-center hidden lg:table-cell">Kondisi Baik</th>
                    <th className="py-3 px-4 text-center hidden lg:table-cell">Kondisi Rusak</th>
                    <th className="py-3 px-4 text-right hidden sm:table-cell">Tercatat BOS</th>
                    <th className="py-3 px-4 text-right hidden sm:table-cell">Beli Mandiri</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {kibSummaries.map((kib, idx) => (
                    <tr 
                      key={kib.kode}
                      className="hover:bg-sky-50/60 dark:hover:bg-slate-800/50 transition-colors font-medium"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-black dark:text-white flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${kib.badgeBg}`}>
                            {kib.kode}
                          </span>
                          <span>{kib.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-400 hidden md:table-cell max-w-xs truncate">
                        {kib.deskripsi}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-black dark:text-white tabular-nums">
                        {kib.count} <span className="text-xs font-semibold text-slate-600">Unit</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sky-800 dark:text-sky-300 tabular-nums">
                        Rp {kib.value.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-800 font-bold hidden lg:table-cell tabular-nums">
                        {kib.goodCount}
                      </td>
                      <td className="py-3 px-4 text-center text-rose-700 font-bold hidden lg:table-cell tabular-nums">
                        {kib.damagedCount}
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell tabular-nums text-slate-900 font-semibold">
                        <span className="font-black text-emerald-700">{kib.bosCount}</span> unit
                        <span className="block text-[11px] text-slate-600 font-medium">Rp {kib.bosValue.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell tabular-nums text-slate-900 font-semibold">
                        <span className="font-black text-indigo-700">{kib.mandiriCount}</span> unit
                        <span className="block text-[11px] text-slate-600 font-medium">Rp {kib.mandiriValue.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/assets?kib=${encodeURIComponent(kib.categoryKey)}&dana=${fundingFilter}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs transition-colors"
                          title="Lihat Data Aset"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-sky-100/90 dark:bg-slate-800 font-black border-t-2 border-sky-300 text-black dark:text-white">
                  <tr>
                    <td className="py-3.5 px-3 text-center">#</td>
                    <td className="py-3.5 px-4 font-black">
                      TOTAL KESELURUHAN ({fundingFilter === 'bos' ? 'DANA BOS' : fundingFilter === 'mandiri' ? 'MANDIRI/NON-BOS' : 'SEMUA'})
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-800 font-bold">
                      Akumulasi Seluruh 8 Klasifikasi KIB
                    </td>
                    <td className="py-3.5 px-4 text-center text-base font-black tabular-nums">
                      {totalFilteredCount} Unit
                    </td>
                    <td className="py-3.5 px-4 text-right text-base font-black text-sky-900 dark:text-sky-200 tabular-nums">
                      Rp {totalFilteredValue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-900 font-black hidden lg:table-cell tabular-nums">
                      {stats.goodCondition}
                    </td>
                    <td className="py-3.5 px-4 text-center text-rose-800 font-black hidden lg:table-cell tabular-nums">
                      {stats.needsRepair}
                    </td>
                    <td className="py-3.5 px-4 text-right hidden sm:table-cell tabular-nums">
                      <span className="text-emerald-900 font-black">{totalBosCount} unit</span>
                      <span className="block text-[11px] text-slate-700">Rp {totalBosValue.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right hidden sm:table-cell tabular-nums">
                      <span className="text-indigo-900 font-black">{totalMandiriCount} unit</span>
                      <span className="block text-[11px] text-slate-700">Rp {totalMandiriValue.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Link
                        to={`/assets?dana=${fundingFilter}`}
                        className="text-xs font-bold text-sky-700 underline"
                      >
                        Semua
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* ======================================================= */}
      {/* SECTION: GRAFIK DISTRIBUSI KATEGORI & KONDISI ASET      */}
      {/* ======================================================= */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 shadow-sm border-sky-200 bg-white">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="font-extrabold text-black dark:text-white">
                  Distribusi KIB ({fundingFilter === 'bos' ? 'Tercatat Dana BOS' : fundingFilter === 'mandiri' ? 'Beli Mandiri Sekolah' : 'Semua Sumber Dana'})
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-slate-700 mt-1">
                  Jumlah barang berdasarkan pengelompokan sistem KIB resmi.
                </CardDescription>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg">
                Total: {totalFilteredCount} Barang
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pl-0">
            {categoryChartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bae6fd" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#000000', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#000000', fontWeight: 700 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }} 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.1)', padding: '12px' }}
                      itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="jumlah" fill="#0284c7" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col flex-1 items-center justify-center p-8 text-center min-h-[300px]">
                <Package className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 block">Tidak ada data aset terfilter</p>
                <p className="text-sm text-slate-600 mt-1 max-w-sm">Pilih filter sumber dana lain atau unggah data inventaris.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-sky-200 bg-white">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="font-extrabold text-black dark:text-white">Kondisi Aset</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-700 mt-1">
              Persentase kondisi aset saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            {conditionData.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conditionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {conditionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 mt-6 justify-center">
                  {conditionData.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-black dark:text-white">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name} ({c.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Activity className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 block">Belum Ada Data Kondisi</p>
                <p className="text-sm text-slate-600 mt-1 max-w-[200px]">Data kondisi aset tidak tersedia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ======================================================= */}
      {/* SECTION: TREN PERTAMBAHAN ASET DARI TAHUN KE TAHUN      */}
      {/* ======================================================= */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-sky-200 bg-white">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="font-extrabold text-black dark:text-white">Tren Pengadaan Aset Tahunan</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-700 mt-1">
              Grafik pertumbuhan pengadaan inventaris dari tahun ke tahun.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {growthData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bae6fd" opacity={0.6} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#000000', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#000000', fontWeight: 700 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.1)', padding: '12px' }}
                      itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, fill: "#0284c7", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col flex-1 items-center justify-center p-8 text-center min-h-[250px]">
                <Activity className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 block">Tidak dapat memuat tren</p>
                <p className="text-sm text-slate-600 mt-1 max-w-sm">Data riwayat pengadaan aset masih kosong.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ======================================================= */}
      {/* SECTION: AKTIVITAS PEMELIHARAAN & AKSES CEPAT           */}
      {/* ======================================================= */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2 border-sky-200 bg-white">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="font-extrabold text-black dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-600" />
              Aktivitas Pemeliharaan Terbaru
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-700 mt-1">
              Riwayat 5 tiket pemeliharaan aset terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-80 overflow-y-auto">
            <div className="space-y-4">
              {maintenances.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-700 font-semibold">Belum ada aktivitas pemeliharaan.</p>
                </div>
              ) : (
                maintenances.slice(0, 5).map((record) => {
                  const asset = assets.find(a => a.id === record.assetId);
                  return (
                    <motion.div 
                      key={record.id} 
                      className="flex items-start gap-3.5 group p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex bg-sky-100 dark:bg-sky-900/30 p-2 rounded-full h-10 w-10 items-center justify-center shrink-0">
                        <Wrench className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-extrabold leading-none text-black dark:text-white">
                          {asset?.nama || "Aset"} <span className="text-slate-600 font-normal">({asset?.kodeBarang || record.assetId})</span>
                        </p>
                        <p className="text-xs text-slate-800 dark:text-slate-300 line-clamp-1 leading-snug">
                          {record.deskripsiKerusakan}
                        </p>
                        <div className="flex items-center pt-1 gap-2.5">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${record.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {record.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {new Date(record.tanggalLapor).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-sky-200 bg-white">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="font-extrabold text-black dark:text-white">Akses Cepat</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-700 mt-1">
              Menu navigasi pintas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/assets" className="flex flex-col items-center justify-center p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 transition-colors group">
                <Package className="h-6 w-6 text-sky-700 group-hover:scale-110 mb-2 transition-transform" />
                <span className="text-xs font-bold text-black">Data Aset (KIB)</span>
              </Link>
              <Link to="/procurement" className="flex flex-col items-center justify-center p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 transition-colors group">
                <Plus className="h-6 w-6 text-sky-700 group-hover:scale-110 mb-2 transition-transform" />
                <span className="text-xs font-bold text-black">Pengadaan</span>
              </Link>
              <Link to="/borrowing" className="flex flex-col items-center justify-center p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 transition-colors group">
                <ArrowRightLeft className="h-6 w-6 text-sky-700 group-hover:scale-110 mb-2 transition-transform" />
                <span className="text-xs font-bold text-black">Peminjaman</span>
              </Link>
              <Link to="/reports" className="flex flex-col items-center justify-center p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 transition-colors group">
                <Activity className="h-6 w-6 text-sky-700 group-hover:scale-110 mb-2 transition-transform" />
                <span className="text-xs font-bold text-black">Laporan Aset</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
