import React, { useState, useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { Asset, AssetUsageCategory, AssetUsageRecord } from "../types";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { FormModal } from "../components/shared/FormModal";
import { DataActions } from "../components/shared/DataActions";
import { printHtml } from "../lib/printUtils";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { 
  Activity, Search, Filter, ShieldCheck, Printer, CheckCircle2, 
  ArrowRightLeft, Wrench, Package, AlertTriangle, AlertOctagon, HelpCircle, Trash2, 
  RefreshCw, ChevronDown, FileText, Check, Clock, User, 
  DoorClosed, Layers, Building2, Sparkles, ExternalLink, SlidersHorizontal,
  BarChart3, PieChart, Table, ArrowUpRight, CheckSquare
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AssetUsageStatus() {
  const { 
    assets, 
    allAssetUsageRecords, 
    updateAssetUsageStatus, 
    schoolProfile, 
    rooms, 
    borrowings, 
    maintenances, 
    mutations, 
    disposals 
  } = useData();
  
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"detail" | "rekapitulasi">("detail");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMacro, setFilterMacro] = useState<"Semua" | "Digunakan" | "Rusak" | "Sisa" | "Proses" | "Hilang">("Semua");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [filterKategori, setFilterKategori] = useState<string>("Semua");
  const [filterSumberDana, setFilterSumberDana] = useState<string>("Semua");
  const [filterPenetapan, setFilterPenetapan] = useState<string>("Semua");
  const [rekapGroupBy, setRekapGroupBy] = useState<"kategori" | "ruangan">("kategori");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal Penetapan Status Penggunaan (PSP)
  const [isPspModalOpen, setIsPspModalOpen] = useState(false);
  const [isBulkPsp, setIsBulkPsp] = useState(false);
  const [targetAssetId, setTargetAssetId] = useState<string | null>(null);

  const [pspForm, setPspForm] = useState<{
    status: AssetUsageCategory;
    skNomor: string;
    tglSk: string;
    alasan: string;
  }>({
    status: "Digunakan Sendiri (Operasional)",
    skNomor: "",
    tglSk: new Date().toISOString().split("T")[0],
    alasan: ""
  });

  // Calculate live utilization statistics: Total, Digunakan, Rusak, Sisa
  const stats = useMemo(() => {
    const total = allAssetUsageRecords.length;
    let totalNilai = 0;

    // 1. Yang Digunakan (Operasional Mandiri + Sedang Dipinjamkan)
    let operasionalCount = 0;
    let operasionalNilai = 0;
    let dipinjamCount = 0;
    let dipinjamNilai = 0;

    // 2. Rusak (Rusak / Tidak Digunakan + Dalam Pemeliharaan / Perbaikan)
    let rusakBeratCount = 0;
    let rusakBeratNilai = 0;
    let pemeliharaanCount = 0;
    let pemeliharaanNilai = 0;

    // 3. Sisa / Cadangan (Cadangan di Gudang Sarpras)
    let cadanganCount = 0;
    let cadanganNilai = 0;

    // 4. Proses Lainnya (Mutasi + Usulan Penghapusan)
    let mutasiCount = 0;
    let mutasiNilai = 0;
    let penghapusanCount = 0;
    let penghapusanNilai = 0;

    // 5. Hilang & Tidak Diketahui (Audit Sensus & Rekonsiliasi)
    let hilangCount = 0;
    let hilangNilai = 0;
    let tidakDiketahuiCount = 0;
    let tidakDiketahuiNilai = 0;

    allAssetUsageRecords.forEach(rec => {
      const harga = Number(rec.asset.harga) || 0;
      totalNilai += harga;

      switch (rec.computedStatus) {
        case "Digunakan Sendiri (Operasional)":
          operasionalCount++;
          operasionalNilai += harga;
          break;
        case "Sedang Dipinjamkan":
          dipinjamCount++;
          dipinjamNilai += harga;
          break;
        case "Dalam Pemeliharaan":
          pemeliharaanCount++;
          pemeliharaanNilai += harga;
          break;
        case "Cadangan di Gudang":
          cadanganCount++;
          cadanganNilai += harga;
          break;
        case "Proses Mutasi":
          mutasiCount++;
          mutasiNilai += harga;
          break;
        case "Rusak / Tidak Digunakan":
          rusakBeratCount++;
          rusakBeratNilai += harga;
          break;
        case "Proses Penghapusan":
          penghapusanCount++;
          penghapusanNilai += harga;
          break;
        case "Hilang / Tidak Ditemukan":
          hilangCount++;
          hilangNilai += harga;
          break;
        case "Tidak Diketahui Keberadaannya":
          tidakDiketahuiCount++;
          tidakDiketahuiNilai += harga;
          break;
        default:
          operasionalCount++;
          operasionalNilai += harga;
      }
    });

    // Agregasi 4 Pilar Utama: Total, Digunakan, Rusak, Sisa
    const digunakanCount = operasionalCount + dipinjamCount;
    const digunakanNilai = operasionalNilai + dipinjamNilai;
    const digunakanPersen = total > 0 ? Math.round((digunakanCount / total) * 1000) / 10 : 0;

    const rusakCount = rusakBeratCount + pemeliharaanCount;
    const rusakNilai = rusakBeratNilai + pemeliharaanNilai;
    const rusakPersen = total > 0 ? Math.round((rusakCount / total) * 1000) / 10 : 0;

    const sisaCount = cadanganCount;
    const sisaNilai = cadanganNilai;
    const sisaPersen = total > 0 ? Math.round((sisaCount / total) * 1000) / 10 : 0;

    const prosesCount = mutasiCount + penghapusanCount;
    const prosesNilai = mutasiNilai + penghapusanNilai;
    const prosesPersen = total > 0 ? Math.round((prosesCount / total) * 1000) / 10 : 0;

    const hilangTotalCount = hilangCount + tidakDiketahuiCount;
    const hilangTotalNilai = hilangNilai + tidakDiketahuiNilai;
    const hilangPersen = total > 0 ? Math.round((hilangTotalCount / total) * 1000) / 10 : 0;

    return {
      total,
      totalNilai,
      // Digunakan
      digunakanCount,
      digunakanNilai,
      digunakanPersen,
      operasionalCount,
      operasionalNilai,
      dipinjamCount,
      dipinjamNilai,
      // Rusak
      rusakCount,
      rusakNilai,
      rusakPersen,
      rusakBeratCount,
      rusakBeratNilai,
      pemeliharaanCount,
      pemeliharaanNilai,
      // Sisa / Cadangan
      sisaCount,
      sisaNilai,
      sisaPersen,
      // Proses Lainnya
      prosesCount,
      prosesNilai,
      prosesPersen,
      mutasiCount,
      penghapusanCount,
      // Hilang & Tidak Diketahui
      hilangCount,
      hilangNilai,
      tidakDiketahuiCount,
      tidakDiketahuiNilai,
      hilangTotalCount,
      hilangTotalNilai,
      hilangPersen
    };
  }, [allAssetUsageRecords]);

  // Rekapitulasi Matriks: Total, Digunakan, Rusak & Sisa per Kategori KIB
  const rekapKategoriData = useMemo(() => {
    const categories: Record<string, {
      kategori: string;
      totalUnit: number;
      totalNilai: number;
      digunakanUnit: number;
      digunakanNilai: number;
      rusakUnit: number;
      rusakNilai: number;
      sisaUnit: number;
      sisaNilai: number;
      prosesUnit: number;
      prosesNilai: number;
    }> = {};

    allAssetUsageRecords.forEach(rec => {
      const cat = rec.asset.kategori || "Aset Tetap Lainnya (KIB E)";
      if (!categories[cat]) {
        categories[cat] = {
          kategori: cat,
          totalUnit: 0,
          totalNilai: 0,
          digunakanUnit: 0,
          digunakanNilai: 0,
          rusakUnit: 0,
          rusakNilai: 0,
          sisaUnit: 0,
          sisaNilai: 0,
          prosesUnit: 0,
          prosesNilai: 0
        };
      }

      const harga = Number(rec.asset.harga) || 0;
      categories[cat].totalUnit += 1;
      categories[cat].totalNilai += harga;

      if (rec.computedStatus === "Digunakan Sendiri (Operasional)" || rec.computedStatus === "Sedang Dipinjamkan") {
        categories[cat].digunakanUnit += 1;
        categories[cat].digunakanNilai += harga;
      } else if (rec.computedStatus === "Rusak / Tidak Digunakan" || rec.computedStatus === "Dalam Pemeliharaan") {
        categories[cat].rusakUnit += 1;
        categories[cat].rusakNilai += harga;
      } else if (rec.computedStatus === "Cadangan di Gudang") {
        categories[cat].sisaUnit += 1;
        categories[cat].sisaNilai += harga;
      } else {
        categories[cat].prosesUnit += 1;
        categories[cat].prosesNilai += harga;
      }
    });

    return Object.values(categories).sort((a, b) => b.totalUnit - a.totalUnit);
  }, [allAssetUsageRecords]);

  // Rekapitulasi Matriks per Ruangan / Lokasi
  const rekapRuanganData = useMemo(() => {
    const roomMap: Record<string, {
      namaRuang: string;
      gedung: string;
      totalUnit: number;
      totalNilai: number;
      digunakanUnit: number;
      digunakanNilai: number;
      rusakUnit: number;
      rusakNilai: number;
      sisaUnit: number;
      sisaNilai: number;
      prosesUnit: number;
    }> = {};

    allAssetUsageRecords.forEach(rec => {
      const rName = rec.roomName || "Belum Ditentukan Ruangan";
      const gName = rec.buildingName || "Gedung Utama";
      const key = `${rName}_${gName}`;

      if (!roomMap[key]) {
        roomMap[key] = {
          namaRuang: rName,
          gedung: gName,
          totalUnit: 0,
          totalNilai: 0,
          digunakanUnit: 0,
          digunakanNilai: 0,
          rusakUnit: 0,
          rusakNilai: 0,
          sisaUnit: 0,
          sisaNilai: 0,
          prosesUnit: 0
        };
      }

      const harga = Number(rec.asset.harga) || 0;
      roomMap[key].totalUnit += 1;
      roomMap[key].totalNilai += harga;

      if (rec.computedStatus === "Digunakan Sendiri (Operasional)" || rec.computedStatus === "Sedang Dipinjamkan") {
        roomMap[key].digunakanUnit += 1;
        roomMap[key].digunakanNilai += harga;
      } else if (rec.computedStatus === "Rusak / Tidak Digunakan" || rec.computedStatus === "Dalam Pemeliharaan") {
        roomMap[key].rusakUnit += 1;
        roomMap[key].rusakNilai += harga;
      } else if (rec.computedStatus === "Cadangan di Gudang") {
        roomMap[key].sisaUnit += 1;
        roomMap[key].sisaNilai += harga;
      } else {
        roomMap[key].prosesUnit += 1;
      }
    });

    return Object.values(roomMap).sort((a, b) => b.totalUnit - a.totalUnit);
  }, [allAssetUsageRecords]);

  // Filtered asset records for detail table
  const filteredRecords = useMemo(() => {
    return allAssetUsageRecords.filter(rec => {
      const { asset, computedStatus } = rec;
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term ||
        (asset.nama || "").toLowerCase().includes(term) ||
        (asset.kodeBarang || "").toLowerCase().includes(term) ||
        (asset.nomorRegister || "").toLowerCase().includes(term) ||
        (asset.nibar || "").toLowerCase().includes(term) ||
        (rec.roomName || "").toLowerCase().includes(term) ||
        (rec.activeEntityName || "").toLowerCase().includes(term) ||
        (rec.keterangan || "").toLowerCase().includes(term);

      // Macro 4-Pillar quick filter
      let matchesMacro = true;
      if (filterMacro === "Digunakan") {
        matchesMacro = computedStatus === "Digunakan Sendiri (Operasional)" || computedStatus === "Sedang Dipinjamkan";
      } else if (filterMacro === "Rusak") {
        matchesMacro = computedStatus === "Rusak / Tidak Digunakan" || computedStatus === "Dalam Pemeliharaan";
      } else if (filterMacro === "Sisa") {
        matchesMacro = computedStatus === "Cadangan di Gudang";
      } else if (filterMacro === "Proses") {
        matchesMacro = computedStatus === "Proses Mutasi" || computedStatus === "Proses Penghapusan";
      } else if (filterMacro === "Hilang") {
        matchesMacro = computedStatus === "Hilang / Tidak Ditemukan" || computedStatus === "Tidak Diketahui Keberadaannya";
      }

      const matchesStatus = filterStatus === "Semua" || computedStatus === filterStatus;
      const matchesKategori = filterKategori === "Semua" || asset.kategori === filterKategori;
      
      let matchesSumberDana = true;
      if (filterSumberDana !== "Semua") {
        if (filterSumberDana === "BOS") {
          matchesSumberDana = (asset.sumberDana || "").toLowerCase().includes("bos");
        } else if (filterSumberDana === "Mandiri") {
          matchesSumberDana = !(asset.sumberDana || "").toLowerCase().includes("bos");
        } else {
          matchesSumberDana = asset.sumberDana === filterSumberDana;
        }
      }

      let matchesPenetapan = true;
      if (filterPenetapan === "SK") {
        matchesPenetapan = Boolean(asset.skPenetapanPenggunaan);
      } else if (filterPenetapan === "Otomatis") {
        matchesPenetapan = !asset.skPenetapanPenggunaan;
      }

      return matchesSearch && matchesMacro && matchesStatus && matchesKategori && matchesSumberDana && matchesPenetapan;
    });
  }, [allAssetUsageRecords, searchTerm, filterMacro, filterStatus, filterKategori, filterSumberDana, filterPenetapan]);
  // Handle Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.asset.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Open PSP Modal for single asset
  const openSinglePspModal = (asset: Asset) => {
    setIsBulkPsp(false);
    setTargetAssetId(asset.id);
    const currentRec = allAssetUsageRecords.find(r => r.asset.id === asset.id);
    setPspForm({
      status: currentRec?.computedStatus || "Digunakan Sendiri (Operasional)",
      skNomor: asset.skPenetapanPenggunaan || `421.3/${String(Math.floor(Math.random() * 800) + 100).padStart(3, '0')}/SMPN3/PSP/2025`,
      tglSk: asset.tanggalPenetapanPenggunaan || new Date().toISOString().split("T")[0],
      alasan: ""
    });
    setIsPspModalOpen(true);
  };

  // Open PSP Modal for multiple selected assets
  const openBulkPspModal = () => {
    if (selectedIds.length === 0) return;
    setIsBulkPsp(true);
    setTargetAssetId(null);
    setPspForm({
      status: "Digunakan Sendiri (Operasional)",
      skNomor: `421.3/${String(Math.floor(Math.random() * 800) + 100).padStart(3, '0')}/SMPN3/PSP/2025`,
      tglSk: new Date().toISOString().split("T")[0],
      alasan: `Penetapan status penggunaan kolektif untuk ${selectedIds.length} unit barang inventaris`
    });
    setIsPspModalOpen(true);
  };

  // Save PSP
  const handleSavePsp = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBulkPsp) {
      selectedIds.forEach(id => {
        updateAssetUsageStatus(id, pspForm.status, pspForm.skNomor, pspForm.tglSk);
      });
      toast(`Berhasil menetapkan status penggunaan untuk ${selectedIds.length} aset terpilih.`, "success");
      setSelectedIds([]);
    } else if (targetAssetId) {
      updateAssetUsageStatus(targetAssetId, pspForm.status, pspForm.skNomor, pspForm.tglSk);
      toast("Penetapan status penggunaan aset berhasil diperbarui.", "success");
    }

    setIsPspModalOpen(false);
  };

  // Export Columns
  const exportColumns = [
    { header: "Kode Barang", key: "kodeBarang" },
    { header: "No. Register", key: "nomorRegister" },
    { header: "Nama Barang", key: "nama" },
    { header: "Kategori KIB", key: "kategori" },
    { header: "Status Penggunaan", key: "statusPenggunaan" },
    { header: "Dasar / Keterangan", key: "keteranganStatus" },
    { header: "Lokasi Ruangan", key: "lokasi" },
    { header: "No. SK Penetapan", key: "noSk" },
    { header: "Harga Perolehan", key: "harga" },
  ];

  const exportData = filteredRecords.map(r => ({
    kodeBarang: r.asset.kodeBarang,
    nomorRegister: r.asset.nomorRegister,
    nama: r.asset.nama,
    kategori: r.asset.kategori,
    statusPenggunaan: r.computedStatus,
    keteranganStatus: r.keterangan,
    lokasi: r.roomName || "-",
    noSk: r.asset.skPenetapanPenggunaan || "Otomatis Sirkulasi",
    harga: r.asset.harga
  }));

  const handleExportExcel = () => {
    exportToExcel(exportData, exportColumns, `Status_Penggunaan_Aset_BMD`);
    toast("Laporan status penggunaan diekspor ke Excel", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(exportData, exportColumns, `Laporan Status Penggunaan Barang Aset BMD`, schoolProfile);
    toast("Laporan status penggunaan diekspor ke PDF", "success");
  };

  // Cetak Dokumen Penetapan Status Penggunaan (PSP) & Ringkasan Total, Digunakan, Rusak, Sisa
  const handlePrintPspReport = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 10px;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h2 style="margin: 0; text-transform: uppercase;">REKAPITULASI STATUS PENGGUNAAN BARANG MILIK DAERAH (BMD)</h2>
          <h3 style="margin: 4px 0 0 0; color: #1e293b;">${schoolProfile.nama || "SMP NEGERI 3 KRAS"}</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Monitoring Utilitas, Kondisi Fisik, dan Penetapan Status Penggunaan (Permendagri No. 19/2016)</p>
        </div>

        <!-- 4 Kotak Ringkasan Utama: Total, Digunakan, Rusak, Sisa -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">1. TOTAL KESELURUHAN</div>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px;">${stats.total} Item</div>
            <div style="font-size: 12px; color: #334155; margin-top: 2px;">Rp ${stats.totalNilai.toLocaleString('id-ID')}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">100% Seluruh BMD</div>
          </div>

          <div style="border: 1px solid #86efac; border-radius: 8px; padding: 12px; background: #f0fdf4;">
            <div style="font-size: 11px; color: #15803d; font-weight: bold; text-transform: uppercase;">2. YANG DIGUNAKAN</div>
            <div style="font-size: 20px; font-weight: bold; color: #15803d; margin-top: 4px;">${stats.digunakanCount} Item</div>
            <div style="font-size: 12px; color: #166534; margin-top: 2px;">Rp ${stats.digunakanNilai.toLocaleString('id-ID')}</div>
            <div style="font-size: 10px; color: #15803d; font-weight: bold; margin-top: 2px;">${stats.digunakanPersen}% Rasio Utilitas Aktif</div>
          </div>

          <div style="border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; background: #fef2f2;">
            <div style="font-size: 11px; color: #b91c1c; font-weight: bold; text-transform: uppercase;">3. KONDISI RUSAK</div>
            <div style="font-size: 20px; font-weight: bold; color: #b91c1c; margin-top: 4px;">${stats.rusakCount} Item</div>
            <div style="font-size: 12px; color: #991b1b; margin-top: 2px;">Rp ${stats.rusakNilai.toLocaleString('id-ID')}</div>
            <div style="font-size: 10px; color: #b91c1c; font-weight: bold; margin-top: 2px;">${stats.rusakPersen}% Rusak / Perbaikan</div>
          </div>

          <div style="border: 1px solid #d8b4fe; border-radius: 8px; padding: 12px; background: #faf5ff;">
            <div style="font-size: 11px; color: #7e22ce; font-weight: bold; text-transform: uppercase;">4. SISA / CADANGAN</div>
            <div style="font-size: 20px; font-weight: bold; color: #7e22ce; margin-top: 4px;">${stats.sisaCount} Item</div>
            <div style="font-size: 12px; color: #6b21a8; margin-top: 2px;">Rp ${stats.sisaNilai.toLocaleString('id-ID')}</div>
            <div style="font-size: 10px; color: #7e22ce; font-weight: bold; margin-top: 2px;">${stats.sisaPersen}% Stok Cadangan Gudang</div>
          </div>
        </div>

        <div style="margin-bottom: 14px; font-size: 11px; color: #475569; display: flex; justify-content: space-between;">
          <div>Rincian Penggunaan: Operasional Tupoksi (${stats.operasionalCount} Unit), Sedang Dipinjam (${stats.dipinjamCount} Unit)</div>
          <div>Tanggal Pelaporan: ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <!-- Tabel Detail Barang Aset -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;" border="1" cellpadding="6">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="width: 28px; text-align: center;">No</th>
              <th>Kode Barang</th>
              <th>No. Reg</th>
              <th>Nama Barang / Merk</th>
              <th>Kategori KIB</th>
              <th>Status Penggunaan</th>
              <th>Keterangan / Dasar Sirkulasi</th>
              <th>Ruangan / Lokasi</th>
              <th style="text-align: right;">Nilai Perolehan (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map((r, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td style="font-family: monospace;">${r.asset.kodeBarang}</td>
                <td style="font-family: monospace; text-align: center;">${r.asset.nomorRegister}</td>
                <td><strong>${r.asset.nama}</strong><br/><small style="color: #64748b;">${r.asset.merk || '-'}</small></td>
                <td>${r.asset.kategori}</td>
                <td><strong>${r.computedStatus}</strong></td>
                <td>${r.keterangan}</td>
                <td>${r.roomName || '-'}</td>
                <td style="text-align: right;">${(r.asset.harga || 0).toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="8" style="text-align: right;">TOTAL NILAI ASET TERSELEKSI:</td>
              <td style="text-align: right;">Rp ${filteredRecords.reduce((acc, curr) => acc + (curr.asset.harga || 0), 0).toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Tanda Tangan Pengesahan -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; page-break-inside: avoid;">
          <div style="text-align: center; width: 240px;">
            <p style="margin-bottom: 60px;">Menyetujui,<br/>Kepala ${schoolProfile.nama || "SMPN 3 Kras"}</p>
            <p><strong><u>${schoolProfile.kepalaSekolah || "Drs. H. Purnomo, M.Pd"}</u></strong><br/>NIP. ${schoolProfile.nipKepsek || "19720512 199802 1 002"}</p>
          </div>
          <div style="text-align: center; width: 240px;">
            <p style="margin-bottom: 60px;">Kras, ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pengurus Barang Pengguna</p>
            <p><strong><u>${schoolProfile.operator || "Budi Santoso, S.Kom"}</u></strong><br/>NIP. ${schoolProfile.nipOperator || "19850614 201101 1 007"}</p>
          </div>
        </div>
      </div>
    `;

    printHtml(printContent, schoolProfile, "LAPORAN STATUS PENGGUNAAN BMD");
  };

  // Helper badge color
  const getStatusBadge = (status: AssetUsageCategory) => {
    switch (status) {
      case "Digunakan Sendiri (Operasional)":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dot: "bg-emerald-500",
          icon: CheckCircle2
        };
      case "Sedang Dipinjamkan":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          dot: "bg-blue-500",
          icon: ArrowRightLeft
        };
      case "Dalam Pemeliharaan":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          dot: "bg-amber-500",
          icon: Wrench
        };
      case "Cadangan di Gudang":
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          dot: "bg-purple-500",
          icon: Package
        };
      case "Proses Mutasi":
        return {
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          dot: "bg-indigo-500",
          icon: RefreshCw
        };
      case "Rusak / Tidak Digunakan":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          dot: "bg-rose-500",
          icon: AlertTriangle
        };
      case "Proses Penghapusan":
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-300",
          dot: "bg-slate-600",
          icon: Trash2
        };
      case "Hilang / Tidak Ditemukan":
        return {
          bg: "bg-red-50 text-red-800 border-red-200",
          dot: "bg-red-600",
          icon: AlertOctagon
        };
      case "Tidak Diketahui Keberadaannya":
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-300",
          dot: "bg-slate-500",
          icon: HelpCircle
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
          icon: Activity
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Status Penggunaan Barang Aset</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sinkron Otomatis Realtime
            </span>
          </div>
          <p className="text-slate-700 text-sm mt-0.5">
            Monitoring data status penggunaan aset: Total aset, barang yang digunakan, kondisi rusak, dan sisa cadangan gudang sesuai Permendagri 19/2016.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DataActions
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onExportCsv={() => toast("Mengekspor data ke CSV...", "info")}
          />
          <Button variant="outline" onClick={handlePrintPspReport} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Cetak Dokumen PSP</span>
          </Button>
          {selectedIds.length > 0 && (
            <Button onClick={openBulkPspModal} className="flex items-center gap-1.5 bg-primary-600">
              <ShieldCheck className="w-4 h-4" />
              <span>Tetapkan SK Terpilih ({selectedIds.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 CORE PILLARS OVERVIEW CARDS: Total, Digunakan, Rusak, Sisa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PILAR 1: TOTAL KESELURUHAN ASET */}
        <div 
          onClick={() => { setFilterMacro("Semua"); setFilterStatus("Semua"); }}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all shadow-sm relative overflow-hidden bg-white ${
            filterMacro === "Semua" ? "ring-2 ring-slate-900 border-slate-900 shadow-md" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-700" />
              1. Total Aset
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              100% Tercatat
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-slate-950 tracking-tight">{stats.total} <span className="text-sm font-semibold text-slate-500">Unit</span></p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Rp {stats.totalNilai.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Seluruh Master BMD Sekolah</span>
            <span className="font-semibold text-slate-900">Klik untuk filter</span>
          </div>
        </div>

        {/* PILAR 2: TOTAL YANG DIGUNAKAN */}
        <div 
          onClick={() => setFilterMacro("Digunakan")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 ${
            filterMacro === "Digunakan" ? "ring-2 ring-emerald-600 border-emerald-600 shadow-md bg-emerald-50/60" : "border-emerald-200/90 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Yang Digunakan
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {stats.digunakanPersen}% Utilitas
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">{stats.digunakanCount} <span className="text-sm font-semibold text-emerald-600">Unit</span></p>
              <p className="text-xs font-semibold text-emerald-800 mt-0.5">Rp {stats.digunakanNilai.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-[11px] text-emerald-700">
            <span>{stats.operasionalCount} Operasional • {stats.dipinjamCount} Dipinjam</span>
            <span className="font-bold">Aktif Produktif</span>
          </div>
        </div>

        {/* PILAR 3: TOTAL KONDISI RUSAK */}
        <div 
          onClick={() => setFilterMacro("Rusak")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-rose-50/40 ${
            filterMacro === "Rusak" ? "ring-2 ring-rose-600 border-rose-600 shadow-md bg-rose-50/60" : "border-rose-200/90 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-rose-800 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              3. Kondisi Rusak
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {stats.rusakPersen}% Rusak
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-rose-700 tracking-tight">{stats.rusakCount} <span className="text-sm font-semibold text-rose-600">Unit</span></p>
              <p className="text-xs font-semibold text-rose-800 mt-0.5">Rp {stats.rusakNilai.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-[11px] text-rose-700">
            <span>{stats.rusakBeratCount} Rusak Berat • {stats.pemeliharaanCount} Servis</span>
            <span className="font-bold">Perlu Tindakan</span>
          </div>
        </div>

        {/* PILAR 4: TOTAL SISA / CADANGAN */}
        <div 
          onClick={() => setFilterMacro("Sisa")}
          className={`cursor-pointer rounded-2xl border p-4.5 transition-all shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-purple-50/40 ${
            filterMacro === "Sisa" ? "ring-2 ring-purple-600 border-purple-600 shadow-md bg-purple-50/60" : "border-purple-200/90 hover:border-purple-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-purple-800 uppercase flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-600" />
              4. Sisa / Cadangan
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {stats.sisaPersen}% Stok Gudang
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-purple-700 tracking-tight">{stats.sisaCount} <span className="text-sm font-semibold text-purple-600">Unit</span></p>
              <p className="text-xs font-semibold text-purple-800 mt-0.5">Rp {stats.sisaNilai.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-100/80 flex items-center justify-between text-[11px] text-purple-700">
            <span>Stok Buffer Gudang Sarpras</span>
            <span className="font-bold">Siap Pakai</span>
          </div>
        </div>
      </div>

      {/* PROPORTIONAL DISTRIBUTION BAR & QUICK FILTER PILLS */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary-600" />
              Distribusi Rasio Utilitas Barang Inventaris:
            </span>
            <span className="text-slate-500">
              Total {stats.total} Item Terpetakan (Nilai Kumulatif: Rp {stats.totalNilai.toLocaleString('id-ID')})
            </span>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${stats.digunakanPersen}%` }} 
              title={`Digunakan: ${stats.digunakanCount} unit (${stats.digunakanPersen}%)`}
              className="bg-emerald-500 h-full transition-all hover:opacity-90"
            />
            <div 
              style={{ width: `${stats.sisaPersen}%` }} 
              title={`Sisa/Cadangan: ${stats.sisaCount} unit (${stats.sisaPersen}%)`}
              className="bg-purple-500 h-full transition-all hover:opacity-90"
            />
            <div 
              style={{ width: `${stats.rusakPersen}%` }} 
              title={`Rusak/Perbaikan: ${stats.rusakCount} unit (${stats.rusakPersen}%)`}
              className="bg-rose-500 h-full transition-all hover:opacity-90"
            />
            <div 
              style={{ width: `${stats.prosesPersen}%` }} 
              title={`Proses Sirkulasi: ${stats.prosesCount} unit (${stats.prosesPersen}%)`}
              className="bg-amber-400 h-full transition-all hover:opacity-90"
            />
            {stats.hilangTotalCount > 0 && (
              <div 
                style={{ width: `${stats.hilangPersen}%` }} 
                title={`Hilang & Tidak Diketahui: ${stats.hilangTotalCount} unit (${stats.hilangPersen}%)`}
                className="bg-red-600 h-full transition-all hover:opacity-90"
              />
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">Filter Cepat:</span>
            
            <button
              onClick={() => { setFilterMacro("Semua"); setFilterStatus("Semua"); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterMacro === "Semua"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Semua ({stats.total})
            </button>

            <button
              onClick={() => setFilterMacro("Digunakan")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterMacro === "Digunakan"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sedang Digunakan ({stats.digunakanCount} Unit • {stats.digunakanPersen}%)
            </button>

            <button
              onClick={() => setFilterMacro("Rusak")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterMacro === "Rusak"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Kondisi Rusak ({stats.rusakCount} Unit • {stats.rusakPersen}%)
            </button>

            <button
              onClick={() => setFilterMacro("Sisa")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterMacro === "Sisa"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Sisa / Cadangan ({stats.sisaCount} Unit • {stats.sisaPersen}%)
            </button>

            {stats.prosesCount > 0 && (
              <button
                onClick={() => setFilterMacro("Proses")}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterMacro === "Proses"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Proses Sirkulasi ({stats.prosesCount} Unit)
              </button>
            )}

            {stats.hilangTotalCount > 0 && (
              <button
                onClick={() => setFilterMacro("Hilang")}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterMacro === "Hilang"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-red-50 text-red-800 border border-red-200 hover:bg-red-100"
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Hilang & Tidak Diketahui ({stats.hilangTotalCount} Unit)
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* VIEW MODE TABS: Daftar Detail vs Rekapitulasi Matriks */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-4">
        <button
          onClick={() => setActiveTab("detail")}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "detail"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Daftar Detail Aset & Penetapan SK ({filteredRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("rekapitulasi")}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "rekapitulasi"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Rekapitulasi: Total, Digunakan, Rusak & Sisa</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR DETAIL ASET */}
      {activeTab === "detail" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <Card>
            <CardContent className="p-3.5 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-start lg:items-center bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nama aset, register, lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full appearance-none bg-white pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
                {/* Filter Status Penggunaan Spesifik */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 font-medium text-slate-800"
                  >
                    <option value="Semua">Semua Kategori Status</option>
                    <option value="Digunakan Sendiri (Operasional)">🟢 Digunakan Sendiri</option>
                    <option value="Sedang Dipinjamkan">🔵 Sedang Dipinjamkan</option>
                    <option value="Dalam Pemeliharaan">🟠 Dalam Pemeliharaan</option>
                    <option value="Cadangan di Gudang">🟣 Cadangan di Gudang</option>
                    <option value="Proses Mutasi">🟡 Proses Mutasi</option>
                    <option value="Rusak / Tidak Digunakan">🔴 Rusak / Tidak Digunakan</option>
                    <option value="Proses Penghapusan">⚫ Proses Penghapusan</option>
                    <option value="Hilang / Tidak Ditemukan">🛑 Hilang / Tidak Ditemukan</option>
                    <option value="Tidak Diketahui Keberadaannya">❓ Tidak Diketahui Keberadaannya</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Filter Kategori KIB */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500"
                  >
                    <option value="Semua">Semua KIB</option>
                    <option value="Tanah (KIB A)">KIB A (Tanah)</option>
                    <option value="Peralatan & Mesin (KIB B)">KIB B (Peralatan & Mesin)</option>
                    <option value="Gedung & Bangunan (KIB C)">KIB C (Gedung & Bangunan)</option>
                    <option value="Jalan, Irigasi & Jaringan (KIB D)">KIB D (Jalan & Jaringan)</option>
                    <option value="Aset Tetap Lainnya (KIB E)">KIB E (Buku & Lainnya)</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Filter Sumber Dana (BOS vs Mandiri) */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterSumberDana}
                    onChange={(e) => setFilterSumberDana(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500"
                  >
                    <option value="Semua">Semua Sumber Dana</option>
                    <option value="BOS">Dana BOS (Reguler/Kinerja/Daerah)</option>
                    <option value="Mandiri">Beli Mandiri Sekolah (Tanpa BOS)</option>
                    <option value="Komite Sekolah">Komite Sekolah</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Filter Dasar Penetapan SK */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterPenetapan}
                    onChange={(e) => setFilterPenetapan(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 font-semibold text-primary-700"
                  >
                    <option value="Semua">Semua Penetapan</option>
                    <option value="SK">📜 Ditetapkan Melalui SK</option>
                    <option value="Otomatis">⚡ Sinkron Sirkulasi Otomatis</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Table */}
          <Card>
            <CardContent className="p-0">
              {selectedIds.length > 0 && (
                <div className="bg-primary-50 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-primary-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-primary-700">
                    {selectedIds.length} aset terpilih
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={openBulkPspModal} className="h-8 text-xs bg-primary-600">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Tetapkan Status Penggunaan Masal
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedIds([])} 
                      className="h-8 text-xs"
                    >
                      Batal Pilih
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto min-h-[350px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-300">
                    <tr>
                      <th className="px-5 py-3 font-medium w-10">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-5 py-3 font-medium">Kode & No. Register</th>
                      <th className="px-5 py-3 font-medium">Nama Barang & Merk</th>
                      <th className="px-5 py-3 font-medium">Kategori KIB</th>
                      <th className="px-5 py-3 font-medium">Status Penggunaan</th>
                      <th className="px-5 py-3 font-medium">Dasar / Detail Sinkronisasi</th>
                      <th className="px-5 py-3 font-medium">Ruangan & Gedung</th>
                      <th className="px-5 py-3 font-medium">Dasar Penetapan SK</th>
                      <th className="px-5 py-3 font-medium text-right pr-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((rec) => {
                        const { asset, computedStatus, isAutomatic, keterangan } = rec;
                        const badge = getStatusBadge(computedStatus);
                        const StatusIcon = badge.icon;

                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                checked={selectedIds.includes(asset.id)}
                                onChange={() => toggleSelect(asset.id)}
                              />
                            </td>

                            {/* Kode & Register */}
                            <td className="px-5 py-4 text-slate-700 font-mono text-xs">
                              <div className="font-bold text-slate-900">{asset.kodeBarang}</div>
                              <span className="text-[11px] text-slate-500">Reg: {asset.nomorRegister}</span>
                            </td>

                            {/* Nama & Merk */}
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900 text-sm max-w-[220px] truncate" title={asset.nama}>
                                {asset.nama}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {asset.merk || asset.bahan || "-"} • Thn {asset.tahunPerolehan}
                              </div>
                            </td>

                            {/* Kategori */}
                            <td className="px-5 py-4">
                              <span className="text-xs text-slate-700 font-medium">
                                {asset.kategori}
                              </span>
                            </td>

                            {/* Status Penggunaan Badge */}
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                {computedStatus}
                              </span>
                            </td>

                            {/* Detail / Alasan Sinkron */}
                            <td className="px-5 py-4 text-xs text-slate-600 max-w-[280px]">
                              <div className="truncate font-medium text-slate-800" title={keterangan}>
                                {keterangan}
                              </div>
                              {isAutomatic ? (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <Sparkles className="w-3 h-3" />
                                  Otomatis dari Sirkulasi Sistem
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <ShieldCheck className="w-3 h-3" />
                                  Penetapan Manual Pengurus
                                </span>
                              )}
                            </td>

                            {/* Ruangan & Gedung */}
                            <td className="px-5 py-4 text-xs text-slate-700">
                              <div className="font-medium text-slate-900 truncate max-w-[160px]">
                                {rec.roomName || "-"}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {rec.buildingName || "Gedung Utama"}
                              </span>
                            </td>

                            {/* SK Penetapan */}
                            <td className="px-5 py-4 text-xs">
                              {asset.skPenetapanPenggunaan ? (
                                <div>
                                  <span className="font-mono font-semibold text-slate-800 text-[11px] block truncate max-w-[140px]" title={asset.skPenetapanPenggunaan}>
                                    {asset.skPenetapanPenggunaan}
                                  </span>
                                  <span className="text-[10px] text-slate-500">{asset.tanggalPenetapanPenggunaan || '-'}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Belum Ada SK Khusus</span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="px-5 py-4 text-right pr-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSinglePspModal(asset)}
                                className="text-xs h-8 px-2.5 hover:border-primary-500 hover:text-primary-700"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                                Tetapkan SK
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                          <Activity className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-sm">Tidak ada data aset yang cocok dengan filter</p>
                          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah pilihan status penggunaan.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: REKAPITULASI MATRIKS: TOTAL, DIGUNAKAN, RUSAK & SISA */}
      {activeTab === "rekapitulasi" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tabel Matriks Rekapitulasi Status Penggunaan BMD</h3>
                <p className="text-xs text-slate-600 mt-0.5">Ringkasan perbandingan Total Barang, Yang Digunakan, Kondisi Rusak, dan Sisa Stok Cadangan</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Kelompokkan:</span>
                <div className="bg-white border border-slate-300 rounded-lg p-0.5 flex">
                  <button
                    onClick={() => setRekapGroupBy("kategori")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      rekapGroupBy === "kategori" ? "bg-primary-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Kategori KIB
                  </button>
                  <button
                    onClick={() => setRekapGroupBy("ruangan")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      rekapGroupBy === "ruangan" ? "bg-primary-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ruangan & Lokasi
                  </button>
                </div>
              </div>
            </CardContent>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="px-5 py-3.5 font-bold w-12 text-center">No</th>
                      <th className="px-5 py-3.5 font-bold">
                        {rekapGroupBy === "kategori" ? "Kategori KIB" : "Ruangan & Gedung"}
                      </th>
                      {/* 1. TOTAL */}
                      <th className="px-5 py-3.5 font-bold bg-slate-200/50 text-slate-900 text-center">
                        <div>1. TOTAL ASET</div>
                        <div className="text-[10px] font-normal lowercase">(unit & nominal)</div>
                      </th>
                      {/* 2. YANG DIGUNAKAN */}
                      <th className="px-5 py-3.5 font-bold bg-emerald-100/60 text-emerald-900 text-center">
                        <div>2. YANG DIGUNAKAN</div>
                        <div className="text-[10px] font-normal lowercase">(operasional & pinjam)</div>
                      </th>
                      {/* 3. KONDISI RUSAK */}
                      <th className="px-5 py-3.5 font-bold bg-rose-100/60 text-rose-900 text-center">
                        <div>3. KONDISI RUSAK</div>
                        <div className="text-[10px] font-normal lowercase">(berat & servis)</div>
                      </th>
                      {/* 4. SISA / CADANGAN */}
                      <th className="px-5 py-3.5 font-bold bg-purple-100/60 text-purple-900 text-center">
                        <div>4. SISA / CADANGAN</div>
                        <div className="text-[10px] font-normal lowercase">(stok gudang)</div>
                      </th>
                      {/* RASIO UTILITAS */}
                      <th className="px-5 py-3.5 font-bold text-center">Rasio Kesiapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rekapGroupBy === "kategori" ? (
                      rekapKategoriData.map((row, idx) => {
                        const rasio = row.totalUnit > 0 ? Math.round((row.digunakanUnit / row.totalUnit) * 100) : 0;
                        return (
                          <tr key={row.kategori} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">{row.kategori}</div>
                              <div className="text-[11px] text-slate-500">
                                {row.prosesUnit > 0 ? `${row.prosesUnit} unit dalam proses mutasi/hapus` : "Semua telah terpetakan"}
                              </div>
                            </td>
                            {/* Total */}
                            <td className="px-5 py-3.5 text-center bg-slate-50/50">
                              <span className="font-bold text-slate-900 text-sm">{row.totalUnit} Unit</span>
                              <div className="text-[11px] text-slate-600 font-mono">Rp {row.totalNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Digunakan */}
                            <td className="px-5 py-3.5 text-center bg-emerald-50/30">
                              <span className="font-bold text-emerald-700 text-sm">{row.digunakanUnit} Unit</span>
                              <div className="text-[11px] text-emerald-800 font-mono">Rp {row.digunakanNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Rusak */}
                            <td className="px-5 py-3.5 text-center bg-rose-50/30">
                              <span className={`font-bold text-sm ${row.rusakUnit > 0 ? "text-rose-700" : "text-slate-400"}`}>
                                {row.rusakUnit} Unit
                              </span>
                              <div className="text-[11px] text-rose-800 font-mono">Rp {row.rusakNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Sisa / Cadangan */}
                            <td className="px-5 py-3.5 text-center bg-purple-50/30">
                              <span className={`font-bold text-sm ${row.sisaUnit > 0 ? "text-purple-700" : "text-slate-400"}`}>
                                {row.sisaUnit} Unit
                              </span>
                              <div className="text-[11px] text-purple-800 font-mono">Rp {row.sisaNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Rasio */}
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-16 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${rasio}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-700">{rasio}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      rekapRuanganData.map((row, idx) => {
                        const rasio = row.totalUnit > 0 ? Math.round((row.digunakanUnit / row.totalUnit) * 100) : 0;
                        return (
                          <tr key={`${row.namaRuang}_${row.gedung}`} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 text-center font-semibold text-slate-500">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">{row.namaRuang}</div>
                              <div className="text-[11px] text-slate-500">{row.gedung}</div>
                            </td>
                            {/* Total */}
                            <td className="px-5 py-3.5 text-center bg-slate-50/50">
                              <span className="font-bold text-slate-900 text-sm">{row.totalUnit} Unit</span>
                              <div className="text-[11px] text-slate-600 font-mono">Rp {row.totalNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Digunakan */}
                            <td className="px-5 py-3.5 text-center bg-emerald-50/30">
                              <span className="font-bold text-emerald-700 text-sm">{row.digunakanUnit} Unit</span>
                              <div className="text-[11px] text-emerald-800 font-mono">Rp {row.digunakanNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Rusak */}
                            <td className="px-5 py-3.5 text-center bg-rose-50/30">
                              <span className={`font-bold text-sm ${row.rusakUnit > 0 ? "text-rose-700" : "text-slate-400"}`}>
                                {row.rusakUnit} Unit
                              </span>
                              <div className="text-[11px] text-rose-800 font-mono">Rp {row.rusakNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Sisa */}
                            <td className="px-5 py-3.5 text-center bg-purple-50/30">
                              <span className={`font-bold text-sm ${row.sisaUnit > 0 ? "text-purple-700" : "text-slate-400"}`}>
                                {row.sisaUnit} Unit
                              </span>
                              <div className="text-[11px] text-purple-800 font-mono">Rp {row.sisaNilai.toLocaleString('id-ID')}</div>
                            </td>
                            {/* Rasio */}
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-16 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${rasio}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-700">{rasio}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* BARIS TOTAL AKUMULATIF */}
                  <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-900">
                    <tr>
                      <td colSpan={2} className="px-5 py-4 text-right uppercase tracking-wider text-xs">
                        JUMLAH AKUMULASI KESELURUHAN (TOTAL BMD):
                      </td>
                      {/* Total */}
                      <td className="px-5 py-4 text-center bg-slate-800">
                        <div className="text-base font-black text-amber-300">{stats.total} Unit</div>
                        <div className="text-xs text-slate-300 font-mono">Rp {stats.totalNilai.toLocaleString('id-ID')}</div>
                      </td>
                      {/* Digunakan */}
                      <td className="px-5 py-4 text-center bg-emerald-900/60">
                        <div className="text-base font-black text-emerald-300">{stats.digunakanCount} Unit ({stats.digunakanPersen}%)</div>
                        <div className="text-xs text-emerald-200 font-mono">Rp {stats.digunakanNilai.toLocaleString('id-ID')}</div>
                      </td>
                      {/* Rusak */}
                      <td className="px-5 py-4 text-center bg-rose-900/60">
                        <div className="text-base font-black text-rose-300">{stats.rusakCount} Unit ({stats.rusakPersen}%)</div>
                        <div className="text-xs text-rose-200 font-mono">Rp {stats.rusakNilai.toLocaleString('id-ID')}</div>
                      </td>
                      {/* Sisa */}
                      <td className="px-5 py-4 text-center bg-purple-900/60">
                        <div className="text-base font-black text-purple-300">{stats.sisaCount} Unit ({stats.sisaPersen}%)</div>
                        <div className="text-xs text-purple-200 font-mono">Rp {stats.sisaNilai.toLocaleString('id-ID')}</div>
                      </td>
                      {/* Rasio Total */}
                      <td className="px-5 py-4 text-center">
                        <span className="bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-black">
                          {stats.digunakanPersen}% Efektif
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Penetapan Status Penggunaan (PSP) */}
      <FormModal
        isOpen={isPspModalOpen}
        onClose={() => setIsPspModalOpen(false)}
        title={isBulkPsp ? `Penetapan Status Penggunaan Kolektif (${selectedIds.length} Aset)` : "Penetapan Status Penggunaan (PSP) Barang Aset"}
        onSubmit={handleSavePsp}
      >
        <div className="grid gap-4 max-h-[75vh] overflow-y-auto px-1">
          <div className="bg-primary-50 p-3 rounded-xl border border-primary-200 text-xs text-primary-900">
            <strong>Dasar Kebijakan Pengelolaan BMD:</strong> Penetapan status penggunaan barang inventaris sesuai tupoksi menjamin kepastian hukum, optimalisasi pemanfaatan, dan akuntabilitas pelaporan aset sekolah.
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-800">Status Penggunaan Barang</label>
            <select
              value={pspForm.status}
              onChange={(e) => setPspForm(prev => ({ ...prev, status: e.target.value as any }))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-slate-900 outline-none focus:border-primary-500"
            >
              <option value="Digunakan Sendiri (Operasional)">🟢 Digunakan Sendiri untuk Operasional / Tupoksi Sekolah</option>
              <option value="Sedang Dipinjamkan">🔵 Sedang Dipinjamkan ke Pihak Lain / Guru / Siswa</option>
              <option value="Dalam Pemeliharaan">🟠 Dalam Pemeliharaan / Perbaikan Teknis</option>
              <option value="Cadangan di Gudang">🟣 Cadangan / Disimpan di Gudang</option>
              <option value="Proses Mutasi">🟡 Dalam Proses Mutasi Antar Unit/Ruang</option>
              <option value="Rusak / Tidak Digunakan">🔴 Rusak Berat / Tidak Dapat Digunakan</option>
              <option value="Proses Penghapusan">⚫ Usulan / Proses Penghapusan BMD</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Nomor SK / Surat Keputusan Penetapan</label>
              <input
                type="text"
                required
                value={pspForm.skNomor}
                onChange={(e) => setPspForm(prev => ({ ...prev, skNomor: e.target.value }))}
                placeholder="421.3/028/SMPN3/PSP/2025"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary-500"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Tanggal Penetapan SK</label>
              <input
                type="date"
                required
                value={pspForm.tglSk}
                onChange={(e) => setPspForm(prev => ({ ...prev, tglSk: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-800">Alasan / Catatan Kebijakan Penetapan</label>
            <textarea
              rows={2}
              value={pspForm.alasan}
              onChange={(e) => setPspForm(prev => ({ ...prev, alasan: e.target.value }))}
              placeholder="Contoh: Digunakan untuk kelancaran kegiatan belajar mengajar kelas reguler dan perpustakaan..."
              className="border border-slate-300 rounded-lg p-2.5 text-xs outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
