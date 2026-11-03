import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, Printer , ChevronDown, Filter, Inbox} from "lucide-react";
import { RowActions } from "../components/shared/RowActions";
import { FormModal } from "../components/shared/FormModal";
import { DetailModal } from "../components/shared/DetailModal";
import { PrintBastModal } from "../components/shared/PrintBastModal";
import { useToast } from "../contexts/ToastContext";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";

export default function Procurement() {
  const { procurements, setProcurements, schoolProfile } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBastModalOpen, setIsBastModalOpen] = useState(false);
  const [bastType, setBastType] = useState<'PBJ_BOS' | 'SERAH_TERIMA_PENGGUNA'>('PBJ_BOS');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
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
      setProcurements(prev => prev.filter(item => !selectedIds.includes(item.id)));
      toast(`Berhasil menghapus ${selectedIds.length} data terpilih.`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      setProcurements(prev => prev.filter(item => item.id !== deleteModalState.idToDelete));
      toast('Berhasil menghapus data.', 'success');
      setSelectedIds(prev => prev.filter(id => id !== deleteModalState.idToDelete));
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProcurements.length && filteredProcurements.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProcurements.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };
const handleAction = (msg: string, type: 'info'|'success'|'error' = 'info') => toast(msg, type);

  const openDetail = (id: string) => {
    setSelectedItemId(id);
    setIsDetailModalOpen(true);
  };

  const openEdit = (id: string, name: string) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
    handleAction(`Edit mode: ${name}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {
      tanggalPengajuan: formData.get('tanggalPengajuan'),
      namaItem: formData.get('namaItem'),
      jumlah: parseInt(formData.get('jumlah') as string) || 1,
      estimasiHarga: parseInt(formData.get('estimasiHarga') as string) || 0,
      sumberDana: formData.get('sumberDana'),
      spesifikasi: formData.get('spesifikasi'),
      alasan: formData.get('alasan'),
    };
    
    if (selectedItemId) {
      setProcurements(prev => prev.map(p => p.id === selectedItemId ? { ...p, ...data } : p));
      handleAction("Pengajuan diperbarui", "success");
    } else {
      setProcurements(prev => [...prev, { id: `PRC-${Date.now()}`, status: "Pengajuan", ...data }]);
      handleAction("Pengajuan berhasil disimpan", "success");
    }
    
    setIsModalOpen(false);
  };

  const selectedItem = procurements.find(p => p.id === selectedItemId);

  const filteredProcurements = (procurements || []).filter(item => {
    if (!item) return false;
    const term = (searchTerm || "").toLowerCase().trim();
    const nama = (item.namaItem || "").toLowerCase();
    const sumber = (item.sumberDana || "").toLowerCase();
    const matchesSearch = !term || nama.includes(term) || sumber.includes(term);
    const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Terbaru":
        return new Date(b.tanggalPengajuan || 0).getTime() - new Date(a.tanggalPengajuan || 0).getTime();
      case "Terlama":
        return new Date(a.tanggalPengajuan || 0).getTime() - new Date(b.tanggalPengajuan || 0).getTime();
      case "Nama A-Z":
        return (a.namaItem || "").localeCompare(b.namaItem || "");
      case "Nama Z-A":
        return (b.namaItem || "").localeCompare(a.namaItem || "");
      case "Estimasi Harga Tertinggi":
        return (b.estimasiHarga || 0) - (a.estimasiHarga || 0);
      case "Estimasi Harga Terendah":
        return (a.estimasiHarga || 0) - (b.estimasiHarga || 0);
      default:
        return 0;
    }
  });

  const exportColumns = [
    { header: "Tanggal", key: "tanggalPengajuan", render: (item: any) => new Date(item.tanggalPengajuan).toLocaleDateString("id-ID") },
    { header: "Nama Item", key: "namaItem" },
    { header: "Jml", key: "jumlah" },
    { header: "Estimasi Harga", key: "estimasiHarga", render: (item: any) => `Rp ${item.estimasiHarga?.toLocaleString('id-ID') || 0}` },
    { header: "Sumber Dana", key: "sumberDana" },
    { header: "Spesifikasi", key: "spesifikasi" },
    { header: "Status", key: "status" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredProcurements, exportColumns, `Data_Pengadaan`);
    toast("Berhasil mengekspor data pengadaan ke Excel", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredProcurements, exportColumns, `Laporan Data Pengadaan Aset`, schoolProfile);
    toast("Berhasil mengekspor data pengadaan ke PDF", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Pengadaan Aset</h2>
          <p className="text-slate-700">Rencana Pembelian, Hibah, dan BOS terkait penerimaan aset baru.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataActions 
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
          <Button onClick={() => { setSelectedItemId(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 w-4 h-4" />
            Ajukan Pengadaan
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
                placeholder="Cari nama item pengadaan..."
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
                <option value="Pengajuan">Pengajuan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
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
                <option value="Nama A-Z">Urutkan: Nama A-Z</option>
                <option value="Nama Z-A">Urutkan: Nama Z-A</option>
                <option value="Estimasi Harga Tertinggi">Urutkan: Harga Tertinggi</option>
                <option value="Estimasi Harga Terendah">Urutkan: Harga Terendah</option>
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
      <th className="px-6 py-3 font-medium w-12"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.length === filteredProcurements.length && filteredProcurements.length > 0} onChange={toggleSelectAll} /></th>
      <th className="px-6 py-3 font-medium">Tanggal Pengajuan</th>
      <th className="px-6 py-3 font-medium">Nama Item</th>
      <th className="px-6 py-3 font-medium text-right">Jumlah</th>
      <th className="px-6 py-3 font-medium text-right">Estimasi Total Harga</th>
      <th className="px-6 py-3 font-medium">Sumber Dana</th>
      <th className="px-6 py-3 font-medium">Status</th>
      <th className="px-6 py-3 font-medium text-right">Aksi</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    {filteredProcurements.length > 0 ? (
      filteredProcurements.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
          <td className="px-6 py-4 font-medium text-slate-900">{new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
          <td className="px-6 py-4">{item.namaItem}</td>
          <td className="px-6 py-4 text-right font-medium">{item.jumlah}</td>
          <td className="px-6 py-4 text-right text-slate-900 font-medium">Rp {item.estimasiHarga ? item.estimasiHarga.toLocaleString('id-ID') : 0}</td>
          <td className="px-6 py-4 text-slate-700">{item.sumberDana}</td>
          <td className="px-6 py-4">
            <Badge variant={item.status === "Disetujui" ? "success" : item.status === "Ditolak" ? "destructive" : "warning"}>
              {item.status}
            </Badge>
          </td>
          <td className="px-6 py-4 text-right pr-4">
            <RowActions actions={[
              ...(item.status === 'Pengajuan' ? [
                { label: "Setujui", icon: CheckCircle, onClick: () => { setProcurements(prev => prev.map(p => p.id === item.id ? { ...p, status: "Disetujui" } : p)); handleAction("Pengajuan disetujui", "success"); } },
                { label: "Tolak", icon: Trash2, onClick: () => { setProcurements(prev => prev.map(p => p.id === item.id ? { ...p, status: "Ditolak" } : p)); handleAction("Pengajuan ditolak", "error"); } }
              ] : []),
              { label: "Update Status", icon: Edit, onClick: () => { setSelectedItemId(item.id); setIsModalOpen(true); } },
              { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(item.id, item.namaItem) }
            ]} />
          </td>
        </tr>
      ))
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
        title={selectedItemId ? "Edit Pengajuan Pengadaan" : "Formulir Pengadaan Barang"}
        onSubmit={handleSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Tanggal Pengajuan</label>
            <input name="tanggalPengajuan" required type="date" defaultValue={selectedItem?.tanggalPengajuan ? new Date(selectedItem.tanggalPengajuan).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Nama Barang/Aset yang Diajukan</label>
            <input name="namaItem" required type="text" defaultValue={selectedItem?.namaItem || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Masukkan spesifikasi barang" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Jumlah (Qty)</label>
              <input name="jumlah" required type="number" min="1" defaultValue={selectedItem?.jumlah || 1} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="10" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Estimasi Total Harga</label>
              <input name="estimasiHarga" required type="number" defaultValue={selectedItem?.estimasiHarga || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Rp 0" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Sumber Dana</label>
            <select name="sumberDana" defaultValue={selectedItem?.sumberDana || "BOS Pusat"} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
              <option value="BOS Pusat">BOS Pusat</option>
              <option value="BOS Daerah">BOS Daerah</option>
              <option value="Hibah / Komite">Hibah / Komite</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Spesifikasi Merek/Tipe</label>
            <textarea name="spesifikasi" rows={2} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Isikan merk atau kriteria teknis pendukung..."></textarea>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Alasan/Prioritas Pengadaan</label>
            <textarea name="alasan" required rows={3} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Jelaskan kebutuhan pengadaan ini (Penting mendesak, dsb)..."></textarea>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Lampiran Harga/Katalog (PDF/Image)</label>
            <input type="file" className="text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          </div>
        </div>
      </FormModal>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Pengadaan Barang/Aset"
      >
        {selectedItem ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900">{selectedItem.namaItem}</h4>
                <p className="text-sm text-slate-700 mt-1">Diajukan pada {new Date(selectedItem.tanggalPengajuan).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <Badge 
                variant={
                  selectedItem.status === "Selesai" ? "success" : 
                  selectedItem.status === "Disetujui" ? "default" :
                  selectedItem.status === "Pengajuan" ? "warning" : "destructive"
                }
              >
                {selectedItem.status}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 text-sm bg-slate-50 p-5 rounded-xl border border-slate-300">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-700 block text-xs uppercase font-medium">Jumlah Pengajuan</span> 
                  <span className="font-semibold text-slate-900">{selectedItem.jumlah} Unit/Pcs</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-xs uppercase font-medium">Estimasi Total Harga</span> 
                  <span className="font-semibold text-slate-900 text-primary-700">Rp {selectedItem.estimasiHarga.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-xs uppercase font-medium">Harga Satuan (Estimasi)</span> 
                  <span className="font-semibold text-slate-900">Rp {(selectedItem.estimasiHarga / selectedItem.jumlah).toLocaleString("id-ID")}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-700 block text-xs uppercase font-medium">Rencana Sumber Dana</span> 
                  <span className="font-semibold text-slate-900">{selectedItem.sumberDana}</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-xs uppercase font-medium">Prioritas Pengkajian</span> 
                  <span className="font-semibold text-slate-900">Tinggi (Pendesak)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-slate-900 text-sm">Spesifikasi Merek/Tipe Rekomendasi</h5>
              <div className="p-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
                Spesifikasi teknis dasar untuk {selectedItem.namaItem} meliputi kebutuhan operasional ruangan, garansi minimal 1 tahun, suku cadang mudah didapat. Sesuai standar e-katalog LKPP.
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-slate-900 text-sm">Alasan Pengajuan / Latar Belakang</h5>
              <div className="p-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700">
                Barang lama yang ada di ruangan telah mencapai umur ekonomis dan sering rusak, menyebabkan kegiatan belajar/operasional menjadi terhambat. Sangat direkomendasikan untuk diganti dalam anggaran waktu dekat.
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-sm">
                <span className="text-slate-700">Dibuat oleh Tim Perencanaan Sekolah</span>
                <Button variant="outline" className="h-8">Cetak Form Pengajuan</Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-700">Memuat data...</div>
        )}
      </DetailModal>

      <PrintBastModal
        isOpen={isBastModalOpen}
        onClose={() => setIsBastModalOpen(false)}
        item={selectedItem}
        type={bastType}
      />
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
