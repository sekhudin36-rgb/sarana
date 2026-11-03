import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { Play, Search, Eye, Edit, Trash2, Calendar, User, FileText, CheckCircle, Printer , ChevronDown, Filter, Inbox} from "lucide-react";
import { RowActions } from "../components/shared/RowActions";
import { FormModal } from "../components/shared/FormModal";
import { DetailModal } from "../components/shared/DetailModal";
import { useToast } from "../contexts/ToastContext";
import { printRawHtml } from "../lib/printUtils";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";

export default function Stocktake() {
  const { stocktakes, setStocktakes, schoolProfile, assets, rooms, applyStocktakeReconciliation } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStocktakeId, setSelectedStocktakeId] = useState<string | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, isBulk: boolean, idToDelete?: string, title?: string, message?: string}>({isOpen: false, isBulk: false});
const toast = useToast();

  
  const openDeleteModal = (id: string, name?: string) => {
    setDeleteModalState({
      isOpen: true,
      isBulk: false,
      idToDelete: id,
      title: "Hapus Data",
      message: `Apakah Anda yakin ingin menghapus data ${name ? '"'+name+'"' : 'ini'}? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const openBulkDeleteModal = () => {
    setDeleteModalState({
      isOpen: true,
      isBulk: true,
      title: "Hapus Kelompok Data",
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const confirmDelete = () => {
    if (deleteModalState.isBulk) {
      setStocktakes(prev => prev.filter(item => !selectedIds.includes(item.id)));
      toast(`Berhasil menghapus ${selectedIds.length} data terpilih.`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      setStocktakes(prev => prev.filter(item => item.id !== deleteModalState.idToDelete));
      toast('Berhasil menghapus data.', 'success');
      setSelectedIds(prev => prev.filter(id => id !== deleteModalState.idToDelete));
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStocktakes.length && filteredStocktakes.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStocktakes.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };
const handleAction = (msg: string, type: 'info'|'success'|'error' = 'info') => toast(msg, type);

  const openDetail = (id: string) => {
    setSelectedStocktakeId(id);
    setIsDetailModalOpen(true);
  };

  const openEdit = (id: string) => {
    setSelectedStocktakeId(id);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {
      tanggal: formData.get('tanggal'),
      penanggungJawab: formData.get('penanggungJawab'),
      status: formData.get('status') || 'Berlangsung',
      catatan: formData.get('catatan'),
      totalAsetDiperiksa: parseInt(formData.get('totalAsetDiperiksa') as string) || 0,
      asetSesuai: parseInt(formData.get('asetSesuai') as string) || 0,
      asetSelisih: parseInt(formData.get('asetSelisih') as string) || 0,
    };
    
    if (selectedStocktakeId) {
      setStocktakes(prev => prev.map(s => s.id === selectedStocktakeId ? { ...s, ...data } : s));
      handleAction("Sesi opname diperbarui", "success");
    } else {
      setStocktakes(prev => [...prev, { 
        id: `STK-${Date.now()}`, 
        totalAsetDiperiksa: 0,
        asetSesuai: 0,
        asetSelisih: 0,
        ...data 
      }]);
      handleAction("Sesi opname baru berhasil dimulai", "success");
    }
    setIsModalOpen(false);
  };

  const selectedStocktake = stocktakes.find(s => s.id === selectedStocktakeId);

  const filteredStocktakes = (stocktakes || []).filter(item => {
    if (!item) return false;
    const term = (searchTerm || "").toLowerCase().trim();
    const pj = (item.penanggungJawab || "").toLowerCase();
    const id = (item.id || "").toLowerCase();
    const catatan = ((item as any).catatan || "").toLowerCase();

    const matchesSearch = !term || pj.includes(term) || id.includes(term) || catatan.includes(term);
    const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Terbaru":
        return new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime();
      case "Terlama":
        return new Date(a.tanggal || 0).getTime() - new Date(b.tanggal || 0).getTime();
      case "PJ A-Z":
        return (a.penanggungJawab || "").localeCompare(b.penanggungJawab || "");
      case "PJ Z-A":
        return (b.penanggungJawab || "").localeCompare(a.penanggungJawab || "");
      default:
        return 0;
    }
  });

  const exportColumns = [
    { header: "Kode Sesi", key: "id", render: (item: any) => item.id || "-" },
    { header: "Tanggal Opname", key: "tanggal", render: (item: any) => new Date(item.tanggal).toLocaleDateString("id-ID") },
    { header: "Penanggung Jawab", key: "penanggungJawab" },
    { header: "Total Diperiksa", key: "totalAsetDiperiksa", render: (item: any) => `${item.totalAsetDiperiksa || 0} unit` },
    { header: "Kondisi Sesuai", key: "asetSesuai", render: (item: any) => `${item.asetSesuai || 0} unit` },
    { header: "Selisih / Hilang", key: "asetSelisih", render: (item: any) => `${item.asetSelisih || 0} unit` },
    { header: "Kesesuaian (%)", key: "akurasi", render: (item: any) => item.totalAsetDiperiksa > 0 ? `${Math.round(((item.asetSesuai || 0) / item.totalAsetDiperiksa) * 100)}%` : "0%" },
    { header: "Catatan Pemeriksaan", key: "catatan", render: (item: any) => item.catatan || "-" },
    { header: "Status", key: "status" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredStocktakes, exportColumns, `Data_Detail_Stok_Opname_Fisik`);
    toast("Berhasil mengekspor data opname detail ke Excel", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredStocktakes, exportColumns, `Laporan Detail Sesi Stok Opname Fisik`, schoolProfile, `Total Sesi: ${filteredStocktakes.length} Pemeriksaan`);
    toast("Berhasil mengekspor data opname detail ke PDF", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Stok Opname</h2>
          <p className="text-slate-700">Pencocokan data sistem dengan fisik di lapangan (Audit Fisik).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataActions 
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
          <Button onClick={() => { setSelectedStocktakeId(null); setIsModalOpen(true); }}>
            <Play className="mr-2 w-4 h-4" />
            Mulai Sesi Opname
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-300 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-600" />
              <input
                type="text"
                placeholder="Cari penanggung jawab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full appearance-none bg-white pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
              <div className="hidden xl:flex items-center mr-1">
                <Filter className="h-4 w-4 text-slate-600" />
              </div>
              <div className="relative w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 transition-colors shadow-sm"
              >
                <option value="Semua">Semua Status</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            </div>
              <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <option value="Terbaru">Urutkan: Tanggal Terbaru</option>
                <option value="Terlama">Urutkan: Tanggal Terlama</option>
                <option value="PJ A-Z">Urutkan: Penanggung Jawab A-Z</option>
                <option value="PJ Z-A">Urutkan: Penanggung Jawab Z-A</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            </div>
            </div>
          </div>
                  {selectedIds.length > 0 && (
          <div className="bg-primary-50 px-6 py-3 border-b border-primary-100 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.length} baris terpilih
            </span>
            <Button variant="destructive" size="sm" onClick={openBulkDeleteModal} className="h-8">
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Terpilih
            </Button>
          </div>
        )}
        <div className="overflow-x-auto min-h-[300px] pb-24">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50/50 border-b border-slate-300">
<tr>
<th className="px-6 py-3 font-medium w-12"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.length === filteredStocktakes.length && filteredStocktakes.length > 0} onChange={toggleSelectAll} /></th>
                  <th className="px-6 py-3 font-medium">Tanggal Audit</th>
                  <th className="px-6 py-3 font-medium">Penanggung Jawab</th>
                  <th className="px-6 py-3 font-medium text-right">Aset Diperiksa</th>
                  <th className="px-6 py-3 font-medium text-right text-emerald-600">Sesuai Fisik</th>
                  <th className="px-6 py-3 font-medium text-right text-rose-600">Selisih/Hilang</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
                                          <tbody className="divide-y divide-slate-100">
                {filteredStocktakes.length > 0 ? (
                  filteredStocktakes.map((item) => {
                    
                    return (
                                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-6 py-4 text-slate-900 font-medium">{item.penanggungJawab || "-"}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">{item.totalAsetDiperiksa ?? 0}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">{item.asetSesuai ?? 0}</td>
                      <td className="px-6 py-4 text-right text-rose-600 font-medium">{item.asetSelisih ?? 0}</td>
                      <td className="px-6 py-4">
                        <Badge variant={item.status === "Selesai" ? "success" : "warning"}>
                          {item.status || "Berlangsung"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right pr-4">
                        <RowActions actions={[
                          { label: "Update Hasil", icon: Edit, onClick: () => { setSelectedStocktakeId(item.id); setIsModalOpen(true); } },
                          
                          { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(item.id, undefined) }
                        ]} />
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-700">
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-slate-700 font-medium text-base">Tidak Ada Data</p>
                          <p className="text-slate-600 text-sm mt-1">Belum ada catatan yang ditemukan atau kriteria pencarian tidak cocok.</p>
                        </div>
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStocktakeId ? "Edit Sesi Opname" : "Mulai Sesi Opname Baru"}
        onSubmit={handleSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Nama/ID Sesi Opname</label>
            <input required defaultValue={selectedStocktake?.id ? `Opname #${selectedStocktake.id.substring(0,6)}` : ''} type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none block opacity-70 cursor-not-allowed" placeholder="Opname Akhir Semester Ganjil 2024" disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Tanggal Mulai</label>
              <input name="tanggal" required defaultValue={selectedStocktake?.tanggal ? (isNaN(new Date(selectedStocktake.tanggal).getTime()) ? new Date().toISOString().split('T')[0] : new Date(selectedStocktake.tanggal).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]} type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Penanggung Jawab</label>
              <input name="penanggungJawab" required defaultValue={selectedStocktake?.penanggungJawab || ''} type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Nama..." />
            </div>
          </div>
          {selectedStocktake && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Total Diperiksa</label>
                  <input name="totalAsetDiperiksa" type="number" defaultValue={(selectedStocktake as any).totalAsetDiperiksa || 0} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" min={0} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-emerald-600">Sesuai Fisik</label>
                  <input name="asetSesuai" type="number" defaultValue={(selectedStocktake as any).asetSesuai || 0} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none" min={0} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-rose-600">Selisih/Hilang</label>
                  <input name="asetSelisih" type="number" defaultValue={(selectedStocktake as any).asetSelisih || 0} className="border border-rose-200 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none" min={0} />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Status Opname</label>
                <select name="status" defaultValue={selectedStocktake.status} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
                    <option value="Berlangsung">Berlangsung (Dalam Proses)</option>
                    <option value="Selesai">Selesai Diverifikasi</option>
                </select>
              </div>
            </>
          )}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Catatan/Instruksi</label>
            <textarea name="catatan" required rows={3} defaultValue={selectedStocktake ? "Lakukan pengecekan menyeluruh." : ""} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"></textarea>
          </div>
        </div>
      </FormModal>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Laporan Stok Opname"
      >
        {selectedStocktake ? (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-300 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Laporan Audit Fisik</h4>
                  <div className="flex items-center gap-1.5 text-slate-700 text-sm mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {selectedStocktake.tanggal && !isNaN(new Date(selectedStocktake.tanggal).getTime()) ? new Date(selectedStocktake.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                  </div>
                </div>
              </div>
              <Badge 
                variant={selectedStocktake.status === "Selesai" ? "success" : "warning"}
                className="text-sm px-3 py-1"
              >
                {selectedStocktake.status}
              </Badge>
            </div>

            <div className="space-y-3">
                <h5 className="font-semibold text-slate-900">Informasi Pelaksanaan</h5>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-300 divide-y divide-slate-100">
                   <div className="flex justify-between py-2 items-center">
                     <span className="text-slate-700 text-sm">Penanggung Jawab (Auditor)</span>
                     <span className="font-medium text-slate-900 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-600" />
                        {selectedStocktake.penanggungJawab}
                     </span>
                   </div>
                   <div className="flex justify-between py-2 items-center">
                     <span className="text-slate-700 text-sm">ID Sesi</span>
                     <span className="font-mono text-xs text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded">
                        #{selectedStocktake.id.substring(0,8).toUpperCase()}
                     </span>
                   </div>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <h5 className="font-semibold text-slate-900">Rekapitulasi Hasil Opname</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white border text-center border-slate-300 p-4 rounded-xl">
                        <span className="block text-3xl font-bold text-slate-900 mb-1">{selectedStocktake.totalAsetDiperiksa}</span>
                        <span className="text-sm text-slate-700 font-medium">Total Aset Diperiksa</span>
                    </div>
                    <div className="bg-emerald-50 border text-center border-emerald-100 p-4 rounded-xl">
                        <span className="block text-3xl font-bold text-emerald-600 mb-1">{selectedStocktake.asetSesuai}</span>
                        <span className="text-sm text-emerald-700 font-medium">Cocok dengan Sistem</span>
                    </div>
                    <div className={`border text-center p-4 rounded-xl ${selectedStocktake.asetSelisih > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-300'}`}>
                        <span className={`block text-3xl font-bold mb-1 ${selectedStocktake.asetSelisih > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{selectedStocktake.asetSelisih}</span>
                        <span className={`text-sm font-medium ${selectedStocktake.asetSelisih > 0 ? 'text-rose-700' : 'text-slate-700'}`}>Selisih / Hilang / Rusak</span>
                    </div>
                </div>
            </div>

            {selectedStocktake.asetSelisih > 0 && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                    <div className="mt-0.5 text-orange-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h6 className="text-sm font-bold text-orange-900">Perhatian: Ditemukan {selectedStocktake.asetSelisih} Selisih Fisik</h6>
                        <p className="text-sm text-orange-800 mt-1">
                           Terdapat aset yang kondisinya berbeda atau berpindah lokasi saat opname fisik. Anda dapat langsung merekonsiliasi Master Data secara otomatis.
                        </p>
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs"
                            onClick={() => {
                              const damagedAssets = assets.filter(a => a.kondisi === "Rusak Ringan" || a.kondisi === "Rusak Berat" || a.kondisi === "Hilang" || a.kondisi === "Tidak Diketahui");
                              const reconciliations = damagedAssets.slice(0, Math.max(1, selectedStocktake.asetSelisih)).map(a => ({
                                assetId: a.id,
                                kondisiBaru: a.kondisi,
                              }));
                              const res = applyStocktakeReconciliation(selectedStocktake.id, reconciliations, selectedStocktake.penanggungJawab);
                              toast(`Rekonsiliasi opname sukses: ${res.updatedCount} aset master berhasil disinkronkan & status opname ditutup.`, 'success');
                              setIsDetailModalOpen(false);
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Terapkan Rekonsiliasi Otomatis ke Master Data ({selectedStocktake.asetSelisih} Selisih)
                          </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 border-t border-slate-300 pt-6">
              <h5 className="font-semibold text-slate-800 mb-2">Pengaturan Cetak Bukti Opname</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Surat</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                    defaultValue={`${String(selectedStocktake.id).replace(/\D/g, '').padStart(3, '0') || '001'} / BA-SO / SMP / ${new Date(selectedStocktake.tanggal).getFullYear()}`}
                    id="nomor-surat-stocktake"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kepala Sekolah</label>
                  <input type="text" id="s-kepsek" defaultValue={schoolProfile.kepalaSekolah || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm mb-1" placeholder="Nama" />
                  <input type="text" id="s-nip1" defaultValue={schoolProfile.nipKepsek || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm" placeholder="NIP (Opsional)" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Penanggung Jawab / Auditor</label>
                  <input type="text" id="s-pj" defaultValue={selectedStocktake.penanggungJawab || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm mb-1" placeholder="Nama" />
                  <input type="text" id="s-nip2" defaultValue="" className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm" placeholder="NIP (Opsional)" />
                </div>
              </div>
              <div className="flex gap-3 print:hidden">
                <Button variant="outline" className="flex-1 bg-white" onClick={() => {
                  const dateStr = new Date(selectedStocktake.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  const customNomor = (document.getElementById('nomor-surat-stocktake') as HTMLInputElement)?.value || `${String(selectedStocktake.id).replace(/\D/g, '').padStart(3, '0') || '001'} / BA-SO / SMP / ${new Date(selectedStocktake.tanggal).getFullYear()}`;
                  
                  const kepsekName = (document.getElementById('s-kepsek') as HTMLInputElement)?.value || "(........................................)";
                  const nip1 = (document.getElementById('s-nip1') as HTMLInputElement)?.value;
                  const kepsekNip = nip1 ? (nip1.startsWith('NIP') ? nip1 : `NIP. ${nip1}`) : "";

                  const pjName = (document.getElementById('s-pj') as HTMLInputElement)?.value || "(........................................)";
                  const nip2 = (document.getElementById('s-nip2') as HTMLInputElement)?.value;
                  const pjNip = nip2 ? (nip2.startsWith('NIP') ? nip2 : `NIP. ${nip2}`) : "";

                  const logoHtml = schoolProfile.logoDinas 
                    ? `<img src="${schoolProfile.logoDinas}" alt="Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px; position: absolute; left: 0; top: 0;" />` 
                    : '';

                  const html = `
                    <div style="font-family: sans-serif; padding: 20px;">
                      <div style="text-align: center; border-bottom: 3px double; padding-bottom: 10px; margin-bottom: 20px; position: relative; min-height: 70px;">
                        ${logoHtml}
                        <h3 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">${schoolProfile?.kementerian || 'KEMENTERIAN PENDIDIKAN'}</h3>
                        <h2 style="margin: 2px 0 5px; font-size: 16pt; font-weight: bold; text-transform: uppercase;">${schoolProfile?.nama || 'NAMA SEKOLAH'}</h2>
                        <p style="margin: 0; font-size: 11pt;">${schoolProfile?.alamat || ''} ${schoolProfile?.kodePos || ''}</p>
                        <p style="margin: 0; font-size: 11pt; margin-bottom: 5px;">Telp: ${schoolProfile?.telepon || '-'} | Email: ${schoolProfile?.email || '-'} | Website: ${schoolProfile?.website || '-'}</p>
                      </div>
                      <h2 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5px; text-decoration: underline;">BERITA ACARA STOK OPNAME (AUDIT FISIK) ASET</h2>
                      
                      <p style="text-align: center; margin-top: 0; margin-bottom: 20px; font-size: 14px;">Nomor: ${customNomor}</p>
                    
                    <p>Pada hari ini <strong>${dateStr}</strong>, telah dilakukan stok opname aset / audit fisik dengan rincian sebagai berikut:</p>
                    
                    <table style="width: 100%; margin-top: 15px; margin-bottom: 20px; font-size: 14px; border-collapse: collapse;">
                      <tr><td style="padding: 5px 0; width: 200px;"><strong>ID Sesi Stok Opname</strong></td><td>: ${selectedStocktake.id}</td></tr>
                      <tr><td style="padding: 5px 0;"><strong>Penanggung Jawab</strong></td><td>: ${selectedStocktake.penanggungJawab}</td></tr>
                      <tr><td style="padding: 5px 0;"><strong>Status Stok Opname</strong></td><td>: ${selectedStocktake.status}</td></tr>
                    </table>

                    <h3 style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;">Hasil Pemeriksaan Fisik:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                      <tr>
                        <td style="border: 1px solid #000; padding: 10px;">Total Aset Diperiksa</td>
                        <td style="border: 1px solid #000; padding: 10px; font-weight: bold; text-align: right;">${selectedStocktake.totalAsetDiperiksa} Aset</td>
                      </tr>
                      <tr>
                        <td style="border: 1px solid #000; padding: 10px;">Aset Sesuai Fisik & Sistem</td>
                        <td style="border: 1px solid #000; padding: 10px; font-weight: bold; text-align: right;">${selectedStocktake.asetSesuai} Aset</td>
                      </tr>
                      <tr>
                        <td style="border: 1px solid #000; padding: 10px;">Selisih / Hilang / Rusak</td>
                        <td style="border: 1px solid #000; padding: 10px; font-weight: bold; text-align: right;">${selectedStocktake.asetSelisih} Aset</td>
                      </tr>
                    </table>
                    
                    ${selectedStocktake.asetSelisih > 0 ? `
                      <p style="color: #c2410c; margin-bottom: 20px;">
                        <em>* Catatan: Terdapat selisih ${selectedStocktake.asetSelisih} aset yang akan ditelusuri atau diajukan penghapusan.</em>
                      </p>
                    ` : ''}

                    <p>Demikian berita acara stok opname ini dibuat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.</p>
                    
                    <table style="width: 100%; margin-top: 50px; text-align: center;">
                      <tr>
                        <td style="width: 50%;">
                          <p>Mengetahui,</p>
                          <p style="margin-bottom: 80px;">Kepala Sekolah</p>
                          <p><strong>${kepsekName}</strong></p>
                          <p>${kepsekNip}</p>
                        </td>
                        <td style="width: 50%;">
                          <p>Dilaksanakan di: ${schoolProfile?.alamat || '______________'}</p>
                          <p style="margin-bottom: 80px;">Penanggung Jawab / Auditor</p>
                          <p><strong>${pjName}</strong></p>
                          <p>${pjNip}</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                `;
                printRawHtml(html, `Surat_Bukti_Stock_Opname_${selectedStocktake.id}`);
              }}>
                <Printer className="mr-2 h-4 w-4" /> Cetak Bukti Opname
              </Button>
               {selectedStocktake.status !== "Selesai" && (
                <Button variant="default" className="flex-1" onClick={() => {
                  setStocktakes(prev => prev.map(s => s.id === selectedStocktake.id ? { ...s, status: "Selesai" } : s));
                  setIsDetailModalOpen(false);
                  handleAction("Sesi opname ditutup dan diverifikasi", "success");
                }}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verifikasi Akhir & Tutup Sesi
                </Button>
               )}
              </div>
            </div>
          </div>
        ) : (
           <div className="p-8 text-center text-slate-700">Mencari data stok opname...</div>
        )}
      </DetailModal>
          <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, isBulk: false })}
        onConfirm={confirmDelete}
        title={deleteModalState.title}
        message={deleteModalState.message}
      />
    </div>
  );
}
