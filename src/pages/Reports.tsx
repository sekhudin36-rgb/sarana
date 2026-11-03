import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useData } from "../contexts/DataContext";
import { 
  FileText, 
  FileSpreadsheet, 
  PieChart, 
  TrendingUp, 
  AlertCircle, 
  FileStack, 
  Printer, 
  X, 
  Download, 
  Box, 
  ChevronDown,
  Filter
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { exportDetailedAssetsToExcel } from "../lib/exportUtils";
import { getAssetConditionBreakdown } from "../types";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";

interface ReportPrintViewProps {
  reportId: string;
  data: any;
  onBack: () => void;
}

function ReportPrintView({ reportId, data, onBack }: ReportPrintViewProps) {
  const { assets, rooms, maintenances, consumables, borrowings, disposals } = data;
  const { schoolProfile } = useData();
  const toast = useToast();
  
  const [periodType, setPeriodType] = useState<'semua' | 'hari' | 'bulan' | 'tahun'>('semua');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState<string>(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterKib, setFilterKib] = useState<string>('semua');
  const [filterSumberDana, setFilterSumberDana] = useState<string>('semua');

  // Input fields for printing
  const [printKepsek, setPrintKepsek] = useState(schoolProfile.kepalaSekolah || "");
  const [printNipKepsek, setPrintNipKepsek] = useState(schoolProfile.nipKepsek || "");
  const [printOperator, setPrintOperator] = useState(schoolProfile.operator || "");
  const [printNipOperator, setPrintNipOperator] = useState(schoolProfile.nipOperator || "");
  const [printNomorSurat, setPrintNomorSurat] = useState(`001 / LAP-SARPRAS / SMP / ${new Date().getFullYear()}`);

  // Filter logic
  let displayedAssets = [...assets];
  let displayedMaintenances = [...maintenances];
  let displayedBorrowings = [...borrowings];
  let displayedDisposals = [...disposals];
  let periodText = "Semua Waktu";

  if (periodType === 'hari' && filterDate) {
    const d = new Date(filterDate);
    const yr = d.getFullYear();
    displayedAssets = displayedAssets.filter(a => a.tahunPerolehan === yr);
    displayedMaintenances = displayedMaintenances.filter(m => m.tanggalLapor && m.tanggalLapor.startsWith(filterDate));
    displayedBorrowings = displayedBorrowings.filter(b => b.tanggalPinjam && b.tanggalPinjam.startsWith(filterDate));
    displayedDisposals = displayedDisposals.filter(disp => disp.tanggalPengajuan && disp.tanggalPengajuan.startsWith(filterDate));
    periodText = `Tanggal: ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  } else if (periodType === 'bulan' && filterMonth) {
    const yr = parseInt(filterMonth.split('-')[0]);
    displayedAssets = displayedAssets.filter(a => a.tahunPerolehan === yr);
    displayedMaintenances = displayedMaintenances.filter(m => m.tanggalLapor && m.tanggalLapor.startsWith(filterMonth));
    displayedBorrowings = displayedBorrowings.filter(b => b.tanggalPinjam && b.tanggalPinjam.startsWith(filterMonth));
    displayedDisposals = displayedDisposals.filter(disp => disp.tanggalPengajuan && disp.tanggalPengajuan.startsWith(filterMonth));
    const d = new Date(`${filterMonth}-01`);
    periodText = `Bulan: ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
  } else if (periodType === 'tahun' && filterYear) {
    const yr = parseInt(filterYear);
    displayedAssets = displayedAssets.filter(a => a.tahunPerolehan === yr);
    displayedMaintenances = displayedMaintenances.filter(m => m.tanggalLapor && m.tanggalLapor.startsWith(filterYear));
    displayedBorrowings = displayedBorrowings.filter(b => b.tanggalPinjam && b.tanggalPinjam.startsWith(filterYear));
    displayedDisposals = displayedDisposals.filter(disp => disp.tanggalPengajuan && disp.tanggalPengajuan.startsWith(filterYear));
    periodText = `Tahun: ${filterYear}`;
  }

  // Filter KIB for asset reports
  if (filterKib !== 'semua') {
    displayedAssets = displayedAssets.filter(a => a.kategori && a.kategori.includes(`(KIB ${filterKib})`));
  }

  // Filter Sumber Dana for asset reports
  if (filterSumberDana !== 'semua') {
    if (filterSumberDana === 'BOS') {
      displayedAssets = displayedAssets.filter(a => (a.sumberDana || '').toLowerCase().includes('bos') || (a.asalUsul || '').toLowerCase().includes('bos'));
    } else if (filterSumberDana === 'Mandiri') {
      displayedAssets = displayedAssets.filter(a => !(a.sumberDana || '').toLowerCase().includes('bos') && !(a.asalUsul || '').toLowerCase().includes('bos'));
    }
  }

  let title = "Laporan Sarpras";
  let content = null;
  const currentYear = new Date().getFullYear();

  if (reportId === "r1") {
    title = "Laporan Detail Master Aset (Buku Inventaris Lengkap KIB A - F)";
    let totalHarga = 0;
    let totalNilaiBuku = 0;

    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2 py-2 text-center w-8">No</th>
                <th className="border-r border-slate-900 px-2 py-2">NIBAR / Reg</th>
                <th className="border-r border-slate-900 px-2 py-2">Kode Barang</th>
                <th className="border-r border-slate-900 px-2 py-2">Nama Barang & Merek</th>
                <th className="border-r border-slate-900 px-2 py-2">Kategori (KIB)</th>
                <th className="border-r border-slate-900 px-2 py-2">Ruangan</th>
                <th className="border-r border-slate-900 px-2 py-2">Sumber Dana</th>
                <th className="border-r border-slate-900 px-2 py-2 text-center">Tahun</th>
                <th className="border-r border-slate-900 px-2 py-2 text-center font-bold bg-slate-300">Jumlah Fisik</th>
                <th className="border-r border-slate-900 px-2 py-2 text-center font-bold bg-slate-300">Rincian Kondisi Fisik</th>
                <th className="border-r border-slate-900 px-2 py-2 text-right">Harga Satuan</th>
                <th className="border-r border-slate-900 px-2 py-2 text-right font-bold bg-slate-300">Total Perolehan</th>
                <th className="border-r border-slate-900 px-2 py-2 text-right font-bold">Total Nilai Buku</th>
                <th className="px-2 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {displayedAssets.length > 0 ? displayedAssets.map((asset: any, index: number) => {
                const room = rooms.find((r: any) => r.id === asset.ruanganId);
                const bd = getAssetConditionBreakdown(asset);
                const usia = Math.max(0, currentYear - (asset.tahunPerolehan || currentYear));
                const isTanah = asset.kategori === "Tanah (KIB A)";
                const hargaPerUnit = asset.harga || 0;
                const totalItemHarga = hargaPerUnit * bd.total;
                const akmPerUnit = isTanah ? 0 : Math.min(hargaPerUnit, hargaPerUnit * 0.1 * usia);
                const nilaiBukuPerUnit = isTanah ? hargaPerUnit : Math.max(0, hargaPerUnit - akmPerUnit);
                const totalItemNilaiBuku = nilaiBukuPerUnit * bd.total;

                totalHarga += totalItemHarga;
                totalNilaiBuku += totalItemNilaiBuku;

                const docDetail = [asset.nomorPolisi && `Nopol: ${asset.nomorPolisi}`, asset.nomorSertifikat && `Sertifikat: ${asset.nomorSertifikat}`, asset.luasTanah && `${asset.luasTanah} m²`, asset.keterangan || asset.catatan].filter(Boolean).join(" | ") || "-";

                return (
                  <tr key={asset.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px] text-slate-800 font-medium">
                      <div>{asset.nibar || asset.nomorRegister || "-"}</div>
                      <div className="text-[10px] text-slate-500">Reg: {asset.nomorRegister || "-"}</div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">
                      <div>{asset.kodeBarang || asset.kodeAset || "-"}</div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-medium">
                      <div className="font-bold text-slate-900">{asset.nama}</div>
                      {asset.merk && <div className="text-[10px] text-slate-600">Merk: {asset.merk}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{asset.kategori}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">
                      <div className="font-semibold">{room?.nama || asset.ruanganId || "-"}</div>
                      {room?.penanggungJawab && <div className="text-[10px] text-slate-500">PJ: {room.penanggungJawab}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-300">
                        {asset.sumberDana || asset.asalUsul || "Pengadaan APBD"}
                      </span>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center">{asset.tahunPerolehan || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-mono font-bold text-slate-900 bg-slate-50">
                      {bd.total} {bd.satuan}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-semibold">
                      {bd.isMixed ? (
                        <div className="space-y-0.5 text-[11px]">
                          {bd.baik > 0 && <span className="inline-block mr-1 text-emerald-800 font-bold">🟢 {bd.baik} Baik</span>}
                          {bd.rusakRingan > 0 && <span className="inline-block mr-1 text-amber-800 font-bold">🟡 {bd.rusakRingan} RR</span>}
                          {bd.rusakBerat > 0 && <span className="inline-block mr-1 text-rose-800 font-bold">🔴 {bd.rusakBerat} RB</span>}
                          {bd.hilang > 0 && <span className="inline-block mr-1 text-red-800 font-bold">🛑 {bd.hilang} Hilang</span>}
                        </div>
                      ) : (
                        <span className={asset.kondisi === 'Baik' ? 'text-emerald-700 font-bold' : asset.kondisi === 'Rusak Ringan' ? 'text-amber-700 font-bold' : 'text-rose-700 font-bold'}>
                          {bd.total} Unit {asset.kondisi || "Baik"}
                        </span>
                      )}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono text-[11px]">
                      Rp {hargaPerUnit.toLocaleString("id-ID")}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono font-bold text-slate-900 bg-slate-50">
                      Rp {totalItemHarga.toLocaleString("id-ID")}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono font-bold text-blue-900">
                      Rp {totalItemNilaiBuku.toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-700 max-w-[150px] truncate">{docDetail}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-slate-600 italic">
                    Tidak ada data aset untuk kriteria dan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
            {displayedAssets.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={11} className="border-r border-slate-900 px-3 py-2 text-right uppercase">
                    Total Rekapitulasi ({displayedAssets.reduce((sum, a) => sum + getAssetConditionBreakdown(a).total, 0)} Unit Fisik / {displayedAssets.length} Judul Barang):
                  </td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono text-xs text-slate-900">
                    Rp {totalHarga.toLocaleString("id-ID")}
                  </td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono text-xs text-blue-900">
                    Rp {totalNilaiBuku.toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  } else if (reportId === "r2") {
    title = "Laporan Detail Kondisi Barang Rusak, Hilang & Tidak Diketahui";
    const damagedAssets = displayedAssets.filter((asset: any) => {
      const bd = getAssetConditionBreakdown(asset);
      return bd.rusakRingan > 0 || bd.rusakBerat > 0 || bd.hilang > 0 || bd.tidakDiketahui > 0 || asset.kondisi !== "Baik";
    });
    let totalNilaiRusak = 0;
    let totalUnitRusak = 0;

    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2 py-2 text-center w-8">No</th>
                <th className="border-r border-slate-900 px-2 py-2">NIBAR</th>
                <th className="border-r border-slate-900 px-2 py-2">Kode Barang</th>
                <th className="border-r border-slate-900 px-2 py-2">Nama Barang & Merek</th>
                <th className="border-r border-slate-900 px-2 py-2">Kategori</th>
                <th className="border-r border-slate-900 px-2 py-2">Lokasi Terakhir</th>
                <th className="border-r border-slate-900 px-2 py-2">Penanggung Jawab</th>
                <th className="border-r border-slate-900 px-2 py-2">Sumber Dana</th>
                <th className="border-r border-slate-900 px-2 py-2 text-center font-bold bg-slate-300">Unit Bermasalah</th>
                <th className="border-r border-slate-900 px-2 py-2 text-center font-bold bg-slate-300">Rincian Fisik</th>
                <th className="border-r border-slate-900 px-2 py-2 text-right">Nilai Terdampak (Rp)</th>
                <th className="px-2 py-2">Rekomendasi Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody>
              {damagedAssets.length > 0 ? damagedAssets.map((asset: any, index: number) => {
                const room = rooms.find((r: any) => r.id === asset.ruanganId);
                const bd = getAssetConditionBreakdown(asset);
                const damagedUnits = (bd.rusakRingan + bd.rusakBerat + bd.hilang + bd.tidakDiketahui) || (asset.kondisi !== 'Baik' ? bd.total : 0);
                const nilaiRusakItem = (asset.harga || 0) * damagedUnits;
                totalNilaiRusak += nilaiRusakItem;
                totalUnitRusak += damagedUnits;

                const hasRusakBerat = bd.rusakBerat > 0 || asset.kondisi === "Rusak Berat";
                const hasHilang = bd.hilang > 0 || asset.kondisi === "Hilang";
                const hasRusakRingan = bd.rusakRingan > 0 || asset.kondisi === "Rusak Ringan";

                return (
                  <tr key={asset.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{asset.nibar || asset.nomorRegister || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{asset.kodeBarang || asset.kodeAset || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-medium">
                      <div className="font-bold text-slate-900">{asset.nama}</div>
                      {asset.merk && <div className="text-[10px] text-slate-600">Merk: {asset.merk}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{asset.kategori}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{room?.nama || asset.ruanganId || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{room?.penanggungJawab || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{asset.sumberDana || asset.asalUsul || "Pengadaan APBD"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-mono font-bold text-rose-800 bg-rose-50">
                      {damagedUnits} {bd.satuan}
                      {bd.total > damagedUnits && <div className="text-[10px] text-slate-500 font-normal">dari total {bd.total}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5">
                      <div className="space-y-0.5 text-[11px]">
                        {bd.baik > 0 && <span className="inline-block mr-1 text-emerald-700">🟢 {bd.baik} Baik</span>}
                        {bd.rusakRingan > 0 && <span className="inline-block mr-1 text-amber-700 font-bold">🟡 {bd.rusakRingan} Rusak Ringan</span>}
                        {bd.rusakBerat > 0 && <span className="inline-block mr-1 text-rose-700 font-bold">🔴 {bd.rusakBerat} Rusak Berat</span>}
                        {bd.hilang > 0 && <span className="inline-block mr-1 text-red-700 font-extrabold">🛑 {bd.hilang} Hilang</span>}
                      </div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono font-bold text-rose-900">
                      Rp {nilaiRusakItem.toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-1.5 text-[11px]">
                      {hasHilang ? (
                        <span className="font-bold text-red-700">BAP Kehilangan & Tuntutan Ganti Rugi (SKTJM)</span>
                      ) : hasRusakBerat ? (
                        <span className="font-bold text-rose-700">Usulan Penghapusan (Disposal) / Lelang Aset</span>
                      ) : hasRusakRingan ? (
                        <span className="font-semibold text-amber-800">Servis Pemeliharaan Berkala (Maintenance)</span>
                      ) : (
                        <span className="text-slate-600">Pemeriksaan Fisik Lanjutan</span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-slate-600 italic">
                    Alhamdulillah, tidak ada data aset dalam kondisi rusak atau bermasalah.
                  </td>
                </tr>
              )}
            </tbody>
            {damagedAssets.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={8} className="border-r border-slate-900 px-3 py-2 text-right uppercase">
                    Total Aset Rusak & Bermasalah:
                  </td>
                  <td className="border-r border-slate-900 px-2 py-2 text-center font-mono text-xs text-rose-900">
                    {totalUnitRusak} Unit
                  </td>
                  <td className="border-r border-slate-900 px-2 py-2"></td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono text-xs text-rose-900">
                    Rp {totalNilaiRusak.toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  } else if (reportId === "r3") {
    title = "Laporan Rekapitulasi Kartu Inventaris Ruangan (KIR) Resmi";
    content = (
      <div className="space-y-8 mt-6">
        {rooms.map((room: any) => {
          const roomAssets = displayedAssets.filter((a: any) => a.ruanganId && a.ruanganId.includes(room.id));
          const totalNilaiRuang = roomAssets.reduce((sum: number, a: any) => sum + ((a.harga || 0) * getAssetConditionBreakdown(a).total), 0);
          const totalUnitRuang = roomAssets.reduce((sum: number, a: any) => sum + getAssetConditionBreakdown(a).total, 0);

          return (
            <div key={room.id} className="border border-slate-900 p-4 bg-white rounded shadow-sm">
              <div className="border-b border-slate-400 pb-2 mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="text-base font-extrabold uppercase text-slate-900">
                    Ruang: {room.nama} ({room.kodeRuangan})
                  </h3>
                  <p className="text-xs text-slate-700">
                    Jenis: <span className="font-semibold">{room.jenis}</span> | Kapasitas: <span className="font-semibold">{room.kapasitas} Orang</span> | Luas: <span className="font-semibold">{room.luas ? `${room.luas} m²` : '-'}</span> | Total Fisik: <span className="font-bold text-primary-700">{totalUnitRuang} Unit</span>
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-slate-800">Penanggung Jawab:</span> {room.penanggungJawab} {room.nipPenanggungJawab ? `(NIP. ${room.nipPenanggungJawab})` : ''}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                      <th className="border border-slate-900 px-2 py-1 text-center w-8">No</th>
                      <th className="border border-slate-900 px-2 py-1">NIBAR</th>
                      <th className="border border-slate-900 px-2 py-1">Kode Barang</th>
                      <th className="border border-slate-900 px-2 py-1">No. Reg</th>
                      <th className="border border-slate-900 px-2 py-1">Nama Barang</th>
                      <th className="border border-slate-900 px-2 py-1">Merk / Model</th>
                      <th className="border border-slate-900 px-2 py-1 text-center">Tahun</th>
                      <th className="border border-slate-900 px-2 py-1">Sumber Dana</th>
                      <th className="border border-slate-900 px-2 py-1 text-center font-bold bg-slate-200">Jumlah</th>
                      <th className="border border-slate-900 px-2 py-1 text-center font-bold bg-slate-200">Rincian Kondisi</th>
                      <th className="border border-slate-900 px-2 py-1 text-right">Harga Satuan</th>
                      <th className="border border-slate-900 px-2 py-1 text-right font-bold bg-slate-200">Total Nilai</th>
                      <th className="border border-slate-900 px-2 py-1">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomAssets.length > 0 ? roomAssets.map((asset: any, index: number) => {
                      const bd = getAssetConditionBreakdown(asset);
                      const totalItemVal = (asset.harga || 0) * bd.total;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50 border-b border-slate-200">
                          <td className="border border-slate-900 px-2 py-1 text-center font-medium">{index + 1}</td>
                          <td className="border border-slate-900 px-2 py-1 font-mono text-[11px]">{asset.nibar || asset.nomorRegister || "-"}</td>
                          <td className="border border-slate-900 px-2 py-1 font-mono text-[11px]">{asset.kodeBarang || asset.kodeAset || "-"}</td>
                          <td className="border border-slate-900 px-2 py-1 font-mono text-[11px]">{asset.nomorRegister || "-"}</td>
                          <td className="border border-slate-900 px-2 py-1 font-bold text-slate-900">{asset.nama}</td>
                          <td className="border border-slate-900 px-2 py-1">{asset.merk || "-"}</td>
                          <td className="border border-slate-900 px-2 py-1 text-center">{asset.tahunPerolehan || "-"}</td>
                          <td className="border border-slate-900 px-2 py-1">{asset.sumberDana || "BOS"}</td>
                          <td className="border border-slate-900 px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-50">
                            {bd.total} {bd.satuan}
                          </td>
                          <td className="border border-slate-900 px-2 py-1 font-semibold text-[11px]">
                            {bd.isMixed ? (
                              <div className="space-y-0.5">
                                {bd.baik > 0 && <span className="inline-block mr-1 text-emerald-800 font-bold">🟢 {bd.baik} Baik</span>}
                                {bd.rusakRingan > 0 && <span className="inline-block mr-1 text-amber-800 font-bold">🟡 {bd.rusakRingan} RR</span>}
                                {bd.rusakBerat > 0 && <span className="inline-block mr-1 text-rose-800 font-bold">🔴 {bd.rusakBerat} RB</span>}
                              </div>
                            ) : (
                              <span className={
                                asset.kondisi === 'Baik' ? 'text-emerald-700' :
                                asset.kondisi === 'Rusak Ringan' ? 'text-amber-700' :
                                asset.kondisi === 'Rusak Berat' ? 'text-rose-700' :
                                'text-slate-700'
                              }>
                                {bd.total} {asset.kondisi || "Baik"}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-900 px-2 py-1 text-right font-mono text-[11px]">
                            Rp {(asset.harga || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="border border-slate-900 px-2 py-1 text-right font-mono font-bold text-slate-900 bg-slate-50">
                            Rp {totalItemVal.toLocaleString("id-ID")}
                          </td>
                          <td className="border border-slate-900 px-2 py-1 text-[11px]">{asset.keterangan || asset.catatan || "-"}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={13} className="border border-slate-900 px-3 py-4 text-center text-slate-500 italic">
                          Belum ada aset terdaftar di ruangan ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {roomAssets.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-900">
                        <td colSpan={8} className="border border-slate-900 px-2 py-1 text-right">
                          Total Inventaris Ruangan:
                        </td>
                        <td className="border border-slate-900 px-2 py-1 text-center font-mono text-primary-700 font-bold">
                          {totalUnitRuang} Unit
                        </td>
                        <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right">
                          Total Nilai:
                        </td>
                        <td className="border border-slate-900 px-2 py-1 text-right font-mono text-slate-900 font-bold">
                          Rp {totalNilaiRuang.toLocaleString("id-ID")}
                        </td>
                        <td className="border border-slate-900 px-2 py-1"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (reportId === "r4") {
    title = "Laporan Detail Pemeliharaan & Perawatan Sarana Prasarana";
    const totalPengeluaran = displayedMaintenances.reduce((sum: number, m: any) => sum + (m.biayaEstimasi || 0), 0);

    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2.5 py-2 text-center w-10">No</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Tanggal Lapor</th>
                <th className="border-r border-slate-900 px-2.5 py-2">NIBAR & Kode Aset</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Nama Barang & Lokasi</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Pelapor</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Keluhan / Kerusakan</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Teknisi / Rekanan</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Prioritas</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Status</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-right">Biaya Perbaikan</th>
                <th className="px-2.5 py-2">Tgl Selesai / Catatan</th>
              </tr>
            </thead>
            <tbody>
              {displayedMaintenances.length > 0 ? displayedMaintenances.map((m: any, index: number) => {
                const asset = assets.find((a: any) => a.id === m.assetId);
                const room = asset?.ruanganId ? rooms.find((r: any) => r.id === asset.ruanganId) : null;

                return (
                  <tr key={m.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 whitespace-nowrap">
                      {new Date(m.tanggalLapor).toLocaleDateString('id-ID')}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">
                      <div>{asset?.nibar || asset?.nomorRegister || "-"}</div>
                      <div className="text-[10px] text-slate-500">{asset?.kodeBarang || "-"}</div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-medium">
                      <div className="font-bold text-slate-900">{asset?.nama || "Tidak Ditemukan"}</div>
                      <div className="text-[10px] text-slate-500">Ruang: {room?.nama || "-"}</div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{m.pelapor || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{m.keluhan || m.deskripsiKerusakan}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{m.teknisi || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{m.prioritas || "Sedang"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-bold">
                      <span className={m.status === 'Selesai' ? 'text-emerald-700' : m.status === 'Proses Perbaikan' ? 'text-blue-700' : 'text-amber-700'}>
                        {m.status}
                      </span>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono font-semibold">
                      Rp {(m.biayaEstimasi || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-1.5 text-[11px]">
                      {m.tanggalSelesai ? `Selesai: ${new Date(m.tanggalSelesai).toLocaleDateString('id-ID')}` : (m.catatan || "-")}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={11} className="px-3 py-6 text-center text-slate-600">Tidak ada riwayat pemeliharaan pada periode ini.</td></tr>
              )}
            </tbody>
            {displayedMaintenances.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={9} className="border-r border-slate-900 px-3 py-2 text-right">Total Biaya Pemeliharaan:</td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono">Rp {totalPengeluaran.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  } else if (reportId === "r5") {
    title = "Laporan Detail Persediaan Barang Habis Pakai (BHP & ATK)";
    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2.5 py-2 text-center w-10">No</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Kode BHP</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Nama Barang Habis Pakai</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Kategori</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Merek / Spesifikasi</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Lokasi Rak / Lemari</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Satuan</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Stok Sisa</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Batas Minimum</th>
                <th className="px-2.5 py-2 text-center">Status Stok</th>
              </tr>
            </thead>
            <tbody>
              {consumables.length > 0 ? consumables.map((c: any, index: number) => {
                const isLow = c.stokSisa <= c.batasMinimum;
                return (
                  <tr key={c.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{c.id}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-bold text-slate-900">{c.nama}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{c.kategori}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{[c.merk, c.spesifikasi].filter(Boolean).join(" - ") || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{c.lokasiPenyimpanan || "Gudang Sarpras"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-medium">{c.satuan}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-mono font-bold text-sm text-slate-900">{c.stokSisa}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-mono">{c.batasMinimum}</td>
                    <td className="px-2 py-1.5 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${isLow ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isLow ? 'KRITIS (Perlu Restok)' : 'AMAN'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-slate-600">Tidak ada data persediaan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else if (reportId === "r6") {
    title = "Laporan Detail Sirkulasi Peminjaman Sarana Prasarana";
    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2.5 py-2 text-center w-10">No</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Tanggal Pinjam</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Peminjam</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Unit / Kontak</th>
                <th className="border-r border-slate-900 px-2.5 py-2">NIBAR / Kode Aset</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Nama Barang & Merek</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Jumlah</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Keperluan / Lokasi</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Target Kembali</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Realisasi Kembali</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Kondisi</th>
                <th className="px-2.5 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedBorrowings.length > 0 ? displayedBorrowings.map((b: any, index: number) => {
                const asset = assets.find((a: any) => a.id === b.assetId);

                return (
                  <tr key={b.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 whitespace-nowrap">
                      {new Date(b.tanggalPinjam).toLocaleDateString('id-ID')}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-bold text-slate-900">{b.peminjam}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">
                      <div>{b.unitKerja || "-"}</div>
                      {b.kontakPeminjam && <div className="text-[10px] text-slate-500">HP: {b.kontakPeminjam}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">
                      <div>{asset?.nibar || asset?.nomorRegister || "-"}</div>
                      <div className="text-[10px] text-slate-500">{asset?.kodeBarang || "-"}</div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-medium">
                      <div className="font-bold text-slate-900">{asset?.nama || "-"}</div>
                      {asset?.merk && <div className="text-[10px] text-slate-500">Merk: {asset.merk}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-bold">{b.jumlah || 1} unit</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{b.keperluan || b.lokasiPenggunaan || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 whitespace-nowrap">
                      {b.rencanaTanggalKembali ? new Date(b.rencanaTanggalKembali).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 whitespace-nowrap">
                      {b.tanggalKembali ? new Date(b.tanggalKembali).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center text-[11px]">
                      {b.status === 'Dikembalikan' ? (b.kondisiKembali || 'Baik') : (b.kondisiPinjam || 'Baik')}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">
                      <span className={b.status === 'Dikembalikan' ? 'text-emerald-700' : 'text-blue-700'}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-600">Tidak ada transaksi peminjaman pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else if (reportId === "r7") {
    title = "Laporan Detail Penyusutan & Nilai Buku Aset (Depresiasi BMD)";
    let totalHargaOriginal = 0;
    let totalPenyusutanAkumulasi = 0;
    let totalNilaiBuku = 0;

    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2.5 py-2 text-center w-10">No</th>
                <th className="border-r border-slate-900 px-2.5 py-2">NIBAR</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Kode Aset</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Nama Barang & Merek</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Kategori</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Ruangan</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Sumber Dana</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Tahun</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Usia Pakai</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-right">Harga Perolehan</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-right">Akumulasi Penyusutan</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-right">Nilai Buku</th>
                <th className="px-2.5 py-2 text-center">Kondisi</th>
              </tr>
            </thead>
            <tbody>
              {displayedAssets.length > 0 ? displayedAssets.map((a: any, index: number) => {
                const room = rooms.find((r: any) => r.id === a.ruanganId);
                const usiaTahun = Math.max(0, currentYear - (a.tahunPerolehan || currentYear));
                const isTanah = a.kategori === "Tanah (KIB A)";
                const akumulasi = isTanah ? 0 : Math.min(a.harga || 0, (a.harga || 0) * 0.1 * usiaTahun);
                const nilaiBuku = isTanah ? (a.harga || 0) : Math.max(0, (a.harga || 0) - akumulasi);
                
                totalHargaOriginal += (a.harga || 0);
                totalPenyusutanAkumulasi += akumulasi;
                totalNilaiBuku += nilaiBuku;

                return (
                  <tr key={a.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{a.nibar || a.nomorRegister || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{a.kodeAset || a.kodeBarang || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-medium">
                      <div className="font-bold text-slate-900">{a.nama}</div>
                      {a.merk && <div className="text-[10px] text-slate-500">Merk: {a.merk}</div>}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{a.kategori}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{room?.nama || a.ruanganId || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{a.sumberDana || "BOS"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center">{a.tahunPerolehan || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{usiaTahun} Thn</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono">
                      Rp {(a.harga || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono text-rose-600 font-semibold">
                      Rp {akumulasi.toLocaleString('id-ID')}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono font-bold text-emerald-700">
                      Rp {nilaiBuku.toLocaleString('id-ID')}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">
                      <span className={a.kondisi === 'Baik' ? 'text-emerald-700' : 'text-amber-700'}>
                        {a.kondisi || "Baik"}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={13} className="px-3 py-6 text-center text-slate-600">Tidak ada data aset.</td></tr>
              )}
            </tbody>
            {displayedAssets.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={9} className="border-r border-slate-900 px-3 py-2 text-right">Total Depresiasi & Nilai Buku:</td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono">Rp {totalHargaOriginal.toLocaleString('id-ID')}</td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono text-rose-600">Rp {totalPenyusutanAkumulasi.toLocaleString('id-ID')}</td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono text-emerald-700">Rp {totalNilaiBuku.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  } else if (reportId === "r8") {
    title = "Laporan Detail Penghapusan & Berita Acara Aset Rusak Berat (Disposal)";
    let totalUnit = 0;
    let totalNilaiHapus = 0;

    content = (
      <div className="space-y-4 mt-6">
        <div className="overflow-x-auto border border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border-r border-slate-900 px-2.5 py-2 text-center w-10">No</th>
                <th className="border-r border-slate-900 px-2.5 py-2">No. SK / Berita Acara</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Tanggal Pengajuan</th>
                <th className="border-r border-slate-900 px-2.5 py-2">NIBAR</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Kode Barang</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Nama Barang & Lokasi Asal</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-center">Jumlah Unit</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-right">Nilai Satuan</th>
                <th className="border-r border-slate-900 px-2.5 py-2 text-right">Total Nilai Buku</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Metode Penghapusan</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Alasan Penghapusan</th>
                <th className="border-r border-slate-900 px-2.5 py-2">Penanggung Jawab</th>
                <th className="px-2.5 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedDisposals.length > 0 ? displayedDisposals.map((d: any, index: number) => {
                const asset = assets.find((a: any) => a.id === d.assetId);
                const room = asset?.ruanganId ? rooms.find((r: any) => r.id === asset.ruanganId) : null;
                const unit = d.jumlah || 1;
                const nilaiTotal = (asset?.harga || 0) * unit;
                totalUnit += unit;
                totalNilaiHapus += nilaiTotal;

                return (
                  <tr key={d.id} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-semibold">{index + 1}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px] font-semibold text-blue-900">
                      {d.nomorSurat || `421.3/${String(d.id).replace(/\D/g, '').padStart(3, '0')}/BA-HPS/${new Date(d.tanggalPengajuan).getFullYear()}`}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 whitespace-nowrap">
                      {new Date(d.tanggalPengajuan).toLocaleDateString('id-ID')}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{asset?.nibar || asset?.nomorRegister || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-mono text-[11px]">{asset?.kodeBarang || "-"}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-medium">
                      <div className="font-bold text-slate-900">{asset?.nama || "-"}</div>
                      <div className="text-[10px] text-slate-500">Ruang Asal: {room?.nama || "-"}</div>
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-center font-mono font-bold text-sm text-slate-900">{unit} Unit</td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono">
                      Rp {(asset?.harga || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 text-right font-mono font-bold text-rose-700">
                      Rp {nilaiTotal.toLocaleString("id-ID")}
                    </td>
                    <td className="border-r border-slate-900 px-2 py-1.5 font-semibold text-slate-800">{d.metode}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{d.alasan}</td>
                    <td className="border-r border-slate-900 px-2 py-1.5">{d.penanggungJawab || schoolProfile.operator || "-"}</td>
                    <td className="px-2 py-1.5 text-center font-bold">
                      <span className={d.status === 'Disetujui' ? 'text-emerald-700' : d.status === 'Selesai' ? 'text-blue-700' : 'text-amber-700'}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={13} className="px-3 py-6 text-center text-slate-600">Tidak ada pengajuan penghapusan untuk periode ini.</td></tr>
              )}
            </tbody>
            {displayedDisposals.length > 0 && (
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={6} className="border-r border-slate-900 px-3 py-2 text-right">Total Unit & Nilai Buku Dihapus:</td>
                  <td className="border-r border-slate-900 px-3 py-2 text-center font-mono text-xs">{totalUnit} Unit</td>
                  <td className="border-r border-slate-900 px-3 py-2"></td>
                  <td className="border-r border-slate-900 px-3 py-2 text-right font-mono text-xs text-rose-700">Rp {totalNilaiHapus.toLocaleString("id-ID")}</td>
                  <td colSpan={4} className="px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  }

  const downloadCSV = () => {
    let csvContent = "";
    if (reportId === "r1") {
      csvContent += "No,SKPD,NIBAR (44 Digit),Kode Barang,No Register,Nama Barang,Merek,Spesifikasi,Kategori KIB,Ruangan,Penanggung Jawab,Tahun Perolehan,Sumber Dana,Kondisi,Harga Perolehan (Rp),Nilai Buku (Rp),Keterangan\n";
      let totalHarga = 0;
      let totalNilaiBuku = 0;
      displayedAssets.forEach((a: any, i: number) => {
        const room = rooms.find((r: any) => r.id === a.ruanganId);
        const usia = Math.max(0, currentYear - (a.tahunPerolehan || currentYear));
        const isTanah = a.kategori === "Tanah (KIB A)";
        const akm = isTanah ? 0 : Math.min(a.harga || 0, (a.harga || 0) * 0.1 * usia);
        const nilaiBuku = isTanah ? (a.harga || 0) : Math.max(0, (a.harga || 0) - akm);
        totalHarga += (a.harga || 0);
        totalNilaiBuku += nilaiBuku;

        csvContent += `${i + 1},"${schoolProfile.nama}","${a.nibar || a.nomorRegister || ''}","${a.kodeBarang || a.kodeAset || ''}","${a.nomorRegister || ''}","${(a.nama || '').replace(/"/g, '""')}","${(a.merk || '').replace(/"/g, '""')}","${(a.spesifikasiLainnya || a.ukuranBahan || '').replace(/"/g, '""')}","${a.kategori}","${(room?.nama || '').replace(/"/g, '""')}","${(room?.penanggungJawab || '').replace(/"/g, '""')}",${a.tahunPerolehan || ''},"${a.sumberDana || 'BOS'}","${a.kondisi || 'Baik'}",${a.harga || 0},${nilaiBuku},"${(a.keterangan || a.catatan || '').replace(/"/g, '""')}"\n`;
      });
      csvContent += `,,,,,,,,,,,,,,Total:,${totalHarga},${totalNilaiBuku},\n`;
    } else if (reportId === "r2") {
      csvContent += "No,NIBAR,Kode Barang,Nama Barang,Merek,Kategori,Lokasi Terakhir,Penanggung Jawab,Sumber Dana,Kondisi,Nilai Perolehan (Rp),Rekomendasi Tindak Lanjut\n";
      const damagedAssets = displayedAssets.filter((a: any) => a.kondisi !== "Baik");
      damagedAssets.forEach((a: any, i: number) => {
        const room = rooms.find((r: any) => r.id === a.ruanganId);
        const isBerat = a.kondisi === "Rusak Berat";
        csvContent += `${i + 1},"${a.nibar || a.nomorRegister || ''}","${a.kodeBarang || ''}","${(a.nama || '').replace(/"/g, '""')}","${(a.merk || '').replace(/"/g, '""')}","${a.kategori}","${(room?.nama || '').replace(/"/g, '""')}","${(room?.penanggungJawab || '').replace(/"/g, '""')}","${a.sumberDana || 'BOS'}","${a.kondisi}",${a.harga || 0},"${isBerat ? 'Pengajuan Penghapusan (Disposal)' : 'Perlu Pemeliharaan'}"\n`;
      });
    } else if (reportId === "r3") {
      csvContent += "Ruangan,Kode Ruang,No,NIBAR,Kode Barang,No Register,Nama Barang,Merek,Spesifikasi,Tahun,Sumber Dana,Kondisi,Nilai (Rp),Keterangan\n";
      rooms.forEach((room: any) => {
        const roomAssets = displayedAssets.filter((a: any) => a.ruanganId === room.id);
        if (roomAssets.length === 0) {
          csvContent += `"${room.nama}","${room.kodeRuangan}",-,-,-,-,"Kosong",-,-,-,-,-,-,-\n`;
        } else {
          roomAssets.forEach((a: any, i: number) => {
            csvContent += `"${room.nama}","${room.kodeRuangan}",${i + 1},"${a.nibar || a.nomorRegister || ''}","${a.kodeBarang || ''}","${a.nomorRegister || ''}","${(a.nama || '').replace(/"/g, '""')}","${(a.merk || '').replace(/"/g, '""')}","${(a.bahan || '').replace(/"/g, '""')}",${a.tahunPerolehan || ''},"${a.sumberDana || 'BOS'}","${a.kondisi}",${a.harga || 0},"${(a.keterangan || '').replace(/"/g, '""')}"\n`;
          });
        }
      });
    } else if (reportId === "r4") {
      csvContent += "No,Tanggal Lapor,NIBAR,Kode Aset,Nama Aset,Ruangan,Pelapor,Keluhan Kerusakan,Teknisi,Prioritas,Status,Biaya Perbaikan (Rp),Tanggal Selesai\n";
      let totalPengeluaran = 0;
      displayedMaintenances.forEach((m: any, i: number) => {
        const asset = assets.find((a: any) => a.id === m.assetId);
        const room = asset?.ruanganId ? rooms.find((r: any) => r.id === asset.ruanganId) : null;
        totalPengeluaran += (m.biayaEstimasi || 0);
        csvContent += `${i + 1},${new Date(m.tanggalLapor).toLocaleDateString('id-ID')},"${asset?.nibar || asset?.nomorRegister || ''}","${asset?.kodeBarang || ''}","${(asset?.nama || '').replace(/"/g, '""')}","${(room?.nama || '').replace(/"/g, '""')}","${m.pelapor || ''}","${(m.keluhan || m.deskripsiKerusakan || '').replace(/"/g, '""')}","${m.teknisi || ''}","${m.prioritas || ''}","${m.status}",${m.biayaEstimasi || 0},"${m.tanggalSelesai ? new Date(m.tanggalSelesai).toLocaleDateString('id-ID') : '-'}"\n`;
      });
      csvContent += `,,,,,,,,,,,,Total: ,${totalPengeluaran},\n`;
    } else if (reportId === "r5") {
      csvContent += "No,Kode BHP,Nama Barang Habis Pakai,Kategori,Merek Spesifikasi,Lokasi Penyimpanan,Satuan,Stok Sisa,Batas Minimum,Status Stok\n";
      consumables.forEach((c: any, i: number) => {
        const isLow = c.stokSisa <= c.batasMinimum;
        csvContent += `${i + 1},"${c.id}","${(c.nama || '').replace(/"/g, '""')}","${c.kategori}","${[c.merk, c.spesifikasi].filter(Boolean).join(' - ')}","${c.lokasiPenyimpanan || 'Gudang'}","${c.satuan}",${c.stokSisa},${c.batasMinimum},"${isLow ? 'Kritis' : 'Aman'}"\n`;
      });
    } else if (reportId === "r6") {
      csvContent += "No,Tanggal Pinjam,Peminjam,Unit Kerja,Kontak HP,NIBAR,Kode Barang,Nama Aset,Jumlah,Keperluan,Target Kembali,Realisasi Kembali,Kondisi,Status\n";
      displayedBorrowings.forEach((b: any, i: number) => {
        const asset = assets.find((a: any) => a.id === b.assetId);
        csvContent += `${i + 1},${new Date(b.tanggalPinjam).toLocaleDateString('id-ID')},"${b.peminjam}","${b.unitKerja || ''}","${b.kontakPeminjam || ''}","${asset?.nibar || asset?.nomorRegister || ''}","${asset?.kodeBarang || ''}","${(asset?.nama || '').replace(/"/g, '""')}",${b.jumlah || 1},"${(b.keperluan || '').replace(/"/g, '""')}","${b.rencanaTanggalKembali ? new Date(b.rencanaTanggalKembali).toLocaleDateString('id-ID') : '-'}","${b.tanggalKembali ? new Date(b.tanggalKembali).toLocaleDateString('id-ID') : '-'}","${b.kondisiKembali || b.kondisiPinjam || 'Baik'}","${b.status}"\n`;
      });
    } else if (reportId === "r7") {
      csvContent += "No,NIBAR,Kode Aset,Nama Barang,Kategori,Ruangan,Sumber Dana,Tahun Perolehan,Usia Pakai (Thn),Harga Perolehan (Rp),Akumulasi Penyusutan (Rp),Nilai Buku (Rp),Kondisi\n";
      let totalHarga = 0; let totalAkm = 0; let totalNilai = 0;
      displayedAssets.forEach((a: any, i: number) => {
        const room = rooms.find((r: any) => r.id === a.ruanganId);
        const usia = Math.max(0, currentYear - (a.tahunPerolehan || currentYear));
        const isTanah = a.kategori === "Tanah (KIB A)";
        const akm = isTanah ? 0 : Math.min(a.harga || 0, (a.harga || 0) * 0.1 * usia);
        const nilaiBuku = isTanah ? (a.harga || 0) : Math.max(0, (a.harga || 0) - akm);
        totalHarga += (a.harga || 0); totalAkm += akm; totalNilai += nilaiBuku;

        csvContent += `${i + 1},"${a.nibar || a.nomorRegister || ''}","${a.kodeAset || a.kodeBarang || ''}","${(a.nama || '').replace(/"/g, '""')}","${a.kategori}","${(room?.nama || '').replace(/"/g, '""')}","${a.sumberDana || 'BOS'}",${a.tahunPerolehan || ''},${usia},${a.harga || 0},${akm},${nilaiBuku},"${a.kondisi || 'Baik'}"\n`;
      });
      csvContent += `,,,,,,,,,Total:,${totalHarga},${totalAkm},${totalNilai},\n`;
    } else if (reportId === "r8") {
      csvContent += "No,No Berita Acara,Tanggal Pengajuan,NIBAR,Kode Barang,Nama Aset,Ruang Asal,Jumlah Unit,Harga Satuan (Rp),Total Nilai Buku (Rp),Metode Penghapusan,Alasan,Penanggung Jawab,Status\n";
      displayedDisposals.forEach((d: any, i: number) => {
        const asset = assets.find((a: any) => a.id === d.assetId);
        const room = asset?.ruanganId ? rooms.find((r: any) => r.id === asset.ruanganId) : null;
        const unit = d.jumlah || 1;
        const nilaiTotal = (asset?.harga || 0) * unit;
        csvContent += `${i + 1},"${d.nomorSurat || ''}",${new Date(d.tanggalPengajuan).toLocaleDateString('id-ID')},"${asset?.nibar || asset?.nomorRegister || ''}","${asset?.kodeBarang || ''}","${(asset?.nama || '').replace(/"/g, '""')}","${(room?.nama || '').replace(/"/g, '""')}",${unit},${asset?.harga || 0},${nilaiTotal},"${d.metode}","${(d.alasan || '').replace(/"/g, '""')}","${d.penanggungJawab || ''}","${d.status}"\n`;
      });
    }

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Berhasil mengunduh data laporan lengkap (CSV/Excel)", "success");
  };

  const generateReportPDF = (action: 'download' | 'print') => {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF('landscape', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        const logo = schoolProfile.logoDinas || schoolProfile.logoSekolah;
        if (logo) {
          try {
            const formatMatch = logo.match(/data:image\/(.*?);/);
            let format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
            format = format === 'JPEG' || format === 'JPG' ? 'JPEG' : 'PNG';
            doc.addImage(logo, format, 35, 20, 50, 50);
          } catch(e) {
            console.warn("Failed to add logo to PDF:", e);
          }
        }
        
        // Add header
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolProfile.kementerian?.toUpperCase() || 'PEMERINTAH KABUPATEN KEDIRI - DINAS PENDIDIKAN', pageWidth / 2, 30, { align: 'center' });
        doc.setFontSize(15);
        doc.text(schoolProfile.nama?.toUpperCase() || 'UPTD SMP NEGERI 3 KRAS', pageWidth / 2, 48, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${schoolProfile.alamat || ''} - ${schoolProfile.kodePos || ''}`, pageWidth / 2, 62, { align: 'center' });
        doc.text(`Telp. ${schoolProfile.telepon || '-'} | Email: ${schoolProfile.email || '-'} | Website: ${schoolProfile.website || '-'}`, pageWidth / 2, 74, { align: 'center' });
        
        // Line
        doc.setLineWidth(1.5);
        doc.line(35, 84, pageWidth - 35, 84);
        doc.setLineWidth(0.5);
        doc.line(35, 86, pageWidth - 35, 86);
        
        // Title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), pageWidth / 2, 104, { align: 'center' });
        
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nomor Dokumen: ${printNomorSurat}  |  Periode: ${periodText}  |  Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 118, { align: 'center' });
        
        let startY = 130;

        if (reportId === "r1") {
          let totalHarga = 0;
          let totalNilaiBuku = 0;
          const body = displayedAssets.map((a: any, i: number) => {
            const room = rooms.find((r: any) => r.id === a.ruanganId);
            const bd = getAssetConditionBreakdown(a);
            const usia = Math.max(0, currentYear - (a.tahunPerolehan || currentYear));
            const isTanah = a.kategori === "Tanah (KIB A)";
            const hargaUnit = a.harga || 0;
            const totalItemHarga = hargaUnit * bd.total;
            const akmPerUnit = isTanah ? 0 : Math.min(hargaUnit, hargaUnit * 0.1 * usia);
            const nilaiBukuPerUnit = isTanah ? hargaUnit : Math.max(0, hargaUnit - akmPerUnit);
            const totalItemNilaiBuku = nilaiBukuPerUnit * bd.total;
            totalHarga += totalItemHarga;
            totalNilaiBuku += totalItemNilaiBuku;

            const conditionText = bd.isMixed 
              ? `${bd.baik > 0 ? `${bd.baik} Baik ` : ''}${bd.rusakRingan > 0 ? `${bd.rusakRingan} RR ` : ''}${bd.rusakBerat > 0 ? `${bd.rusakBerat} RB` : ''}`.trim()
              : `${bd.total} ${a.kondisi || "Baik"}`;

            return [
              i + 1,
              a.nibar || a.nomorRegister || "-",
              a.kodeBarang || a.kodeAset || "-",
              a.nama,
              a.kategori,
              room?.nama || "-",
              `${bd.total} ${bd.satuan}`,
              conditionText,
              `Rp ${hargaUnit.toLocaleString('id-ID')}`,
              `Rp ${totalItemHarga.toLocaleString('id-ID')}`,
              `Rp ${totalItemNilaiBuku.toLocaleString('id-ID')}`
            ];
          });
          body.push(['', '', '', '', '', '', '', 'Total:', '', `Rp ${totalHarga.toLocaleString('id-ID')}`, `Rp ${totalNilaiBuku.toLocaleString('id-ID')}`]);

          autoTable(doc, {
            startY,
            head: [['No', 'NIBAR', 'Kode Barang', 'Nama Barang', 'Kategori', 'Ruangan', 'Jumlah', 'Kondisi & Rincian', 'Harga Satuan', 'Total Perolehan', 'Total Nilai Buku']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 6.5, cellPadding: 2, textColor: [15, 23, 42], overflow: 'linebreak' },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else if (reportId === "r2") {
          const damagedAssets = displayedAssets.filter((a: any) => {
            const bd = getAssetConditionBreakdown(a);
            return bd.rusakRingan > 0 || bd.rusakBerat > 0 || bd.hilang > 0 || bd.tidakDiketahui > 0 || a.kondisi !== "Baik";
          });
          let totalNilaiRusak = 0;
          let totalUnitRusak = 0;

          const body = damagedAssets.map((a: any, i: number) => {
            const room = rooms.find((r: any) => r.id === a.ruanganId);
            const bd = getAssetConditionBreakdown(a);
            const damagedUnits = (bd.rusakRingan + bd.rusakBerat + bd.hilang + bd.tidakDiketahui) || (a.kondisi !== 'Baik' ? bd.total : 0);
            const itemNilaiRusak = (a.harga || 0) * damagedUnits;
            totalNilaiRusak += itemNilaiRusak;
            totalUnitRusak += damagedUnits;

            const rincianText = bd.isMixed
              ? `${bd.rusakRingan > 0 ? `${bd.rusakRingan} RR ` : ''}${bd.rusakBerat > 0 ? `${bd.rusakBerat} RB ` : ''}${bd.hilang > 0 ? `${bd.hilang} Hilang` : ''}`.trim()
              : `${damagedUnits} ${a.kondisi}`;

            return [
              i + 1,
              a.nibar || a.nomorRegister || "-",
              a.kodeBarang || "-",
              a.nama,
              a.kategori,
              room?.nama || "-",
              `${damagedUnits} ${bd.satuan}`,
              rincianText,
              `Rp ${itemNilaiRusak.toLocaleString('id-ID')}`,
              bd.rusakBerat > 0 || a.kondisi === 'Rusak Berat' ? 'Usul Penghapusan / Lelang' :
              bd.hilang > 0 || a.kondisi === 'Hilang' ? 'BAP Kehilangan & SKTJM' :
              bd.rusakRingan > 0 || a.kondisi === 'Rusak Ringan' ? 'Pemeliharaan Teknis' : 'Audit Lokasi'
            ];
          });
          body.push(['', '', '', '', '', '', `${totalUnitRusak} Unit`, 'Total Nilai Rusak:', `Rp ${totalNilaiRusak.toLocaleString('id-ID')}`, '']);

          autoTable(doc, {
            startY,
            head: [['No', 'NIBAR', 'Kode Barang', 'Nama Barang', 'Kategori', 'Lokasi', 'Jml Rusak', 'Rincian Kerusakan', 'Nilai Terdampak', 'Rekomendasi Tindak Lanjut']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 6.5, cellPadding: 2, textColor: [15, 23, 42] },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else if (reportId === "r3") {
          rooms.forEach((room: any, index: number) => {
            if (index > 0) startY = (doc as any).lastAutoTable.finalY + 25;
            if (startY > pageHeight - 120) {
              doc.addPage();
              startY = 40;
            }
            
            const roomAssets = displayedAssets.filter((a: any) => a.ruanganId && a.ruanganId.includes(room.id));
            const totalUnit = roomAssets.reduce((sum: number, a: any) => sum + getAssetConditionBreakdown(a).total, 0);
            const totalNilai = roomAssets.reduce((sum: number, a: any) => sum + ((a.harga || 0) * getAssetConditionBreakdown(a).total), 0);

            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.text(`Ruangan: ${room.nama} (${room.kodeRuangan}) - PJ: ${room.penanggungJawab} | Total: ${totalUnit} Unit | Nilai: Rp ${totalNilai.toLocaleString('id-ID')}`, 35, startY);
            
            const body = roomAssets.length > 0 
              ? roomAssets.map((a: any, i: number) => {
                  const bd = getAssetConditionBreakdown(a);
                  const totalVal = (a.harga || 0) * bd.total;
                  const condStr = bd.isMixed
                    ? `${bd.baik > 0 ? `${bd.baik} Baik ` : ''}${bd.rusakRingan > 0 ? `${bd.rusakRingan} RR ` : ''}${bd.rusakBerat > 0 ? `${bd.rusakBerat} RB` : ''}`.trim()
                    : `${bd.total} ${a.kondisi || "Baik"}`;

                  return [
                    i + 1, 
                    a.nibar || a.nomorRegister || "-", 
                    a.kodeBarang || "-", 
                    a.nama, 
                    a.merk || "-", 
                    a.tahunPerolehan || "-", 
                    a.sumberDana || "BOS", 
                    `${bd.total} ${bd.satuan}`,
                    condStr,
                    `Rp ${(a.harga || 0).toLocaleString('id-ID')}`,
                    `Rp ${totalVal.toLocaleString('id-ID')}`
                  ];
                })
              : [['-', '-', '-', 'Kosong / Belum Ada Aset', '-', '-', '-', '-', '-', '-', '-']];

            autoTable(doc, {
              startY: startY + 6,
              head: [['No', 'NIBAR', 'Kode Barang', 'Nama Barang', 'Merek', 'Tahun', 'Sumber Dana', 'Jumlah', 'Rincian Kondisi', 'Harga Satuan', 'Total Nilai']],
              body: body,
              theme: 'grid',
              styles: { fontSize: 6.5, cellPadding: 2, textColor: [15, 23, 42] },
              headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] }
            });
          });
        } else if (reportId === "r4") {
          let totalPengeluaran = 0;
          const body = displayedMaintenances.map((m: any, i: number) => {
            const asset = assets.find((a: any) => a.id === m.assetId);
            const room = asset?.ruanganId ? rooms.find((r: any) => r.id === asset.ruanganId) : null;
            totalPengeluaran += (m.biayaEstimasi || 0);
            return [
              i + 1, 
              new Date(m.tanggalLapor).toLocaleDateString('id-ID'), 
              asset?.nibar || asset?.nomorRegister || "-",
              asset?.nama || "-", 
              room?.nama || "-",
              m.pelapor || "-",
              m.keluhan || m.deskripsiKerusakan, 
              m.teknisi || "-",
              m.status, 
              `Rp ${(m.biayaEstimasi || 0).toLocaleString('id-ID')}`
            ];
          });
          body.push(['', '', '', '', '', '', '', '', 'Total Biaya:', `Rp ${totalPengeluaran.toLocaleString('id-ID')}`]);

          autoTable(doc, {
            startY,
            head: [['No', 'Tanggal', 'NIBAR', 'Nama Aset', 'Ruang', 'Pelapor', 'Keluhan / Kerusakan', 'Teknisi', 'Status', 'Biaya']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42] },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else if (reportId === "r5") {
          const body = consumables.map((c: any, i: number) => {
            const isLow = c.stokSisa <= c.batasMinimum;
            return [
              i + 1,
              c.id,
              c.nama,
              c.kategori,
              c.merk || "-",
              c.lokasiPenyimpanan || "Gudang",
              c.satuan,
              c.stokSisa,
              c.batasMinimum,
              isLow ? 'KRITIS' : 'AMAN'
            ];
          });

          autoTable(doc, {
            startY,
            head: [['No', 'Kode BHP', 'Nama Barang', 'Kategori', 'Merek', 'Lokasi', 'Satuan', 'Stok Sisa', 'Batas Min', 'Status']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [15, 23, 42] },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else if (reportId === "r6") {
          const body = displayedBorrowings.map((b: any, i: number) => {
            const asset = assets.find((a: any) => a.id === b.assetId);
            return [
              i + 1,
              new Date(b.tanggalPinjam).toLocaleDateString('id-ID'),
              b.peminjam,
              b.unitKerja || "-",
              asset?.nibar || asset?.nomorRegister || "-",
              asset?.nama || "-",
              `${b.jumlah || 1} unit`,
              b.keperluan || "-",
              b.rencanaTanggalKembali ? new Date(b.rencanaTanggalKembali).toLocaleDateString('id-ID') : '-',
              b.tanggalKembali ? new Date(b.tanggalKembali).toLocaleDateString('id-ID') : '-',
              b.status
            ];
          });

          autoTable(doc, {
            startY,
            head: [['No', 'Tgl Pinjam', 'Peminjam', 'Unit/Kelas', 'NIBAR', 'Nama Aset', 'Jml', 'Keperluan', 'Tgt Kembali', 'Realisasi', 'Status']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42] },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else if (reportId === "r7") {
          let totalHarga = 0; let totalAkm = 0; let totalNilai = 0;
          const body = displayedAssets.map((a: any, i: number) => {
            const room = rooms.find((r: any) => r.id === a.ruanganId);
            const usia = Math.max(0, currentYear - (a.tahunPerolehan || currentYear));
            const isTanah = a.kategori === "Tanah (KIB A)";
            const akm = isTanah ? 0 : Math.min(a.harga || 0, (a.harga || 0) * 0.1 * usia);
            const nilaiBuku = isTanah ? (a.harga || 0) : Math.max(0, (a.harga || 0) - akm);
            totalHarga += (a.harga || 0); totalAkm += akm; totalNilai += nilaiBuku;

            return [
              i + 1,
              a.nibar || a.nomorRegister || "-",
              a.kodeAset || a.kodeBarang || "-",
              a.nama,
              a.kategori,
              room?.nama || "-",
              a.tahunPerolehan || "-",
              `${usia} Thn`,
              `Rp ${(a.harga || 0).toLocaleString('id-ID')}`,
              `Rp ${akm.toLocaleString('id-ID')}`,
              `Rp ${nilaiBuku.toLocaleString('id-ID')}`,
              a.kondisi || "Baik"
            ];
          });
          body.push(['', '', '', '', '', '', '', 'Total:', `Rp ${totalHarga.toLocaleString('id-ID')}`, `Rp ${totalAkm.toLocaleString('id-ID')}`, `Rp ${totalNilai.toLocaleString('id-ID')}`, '']);

          autoTable(doc, {
            startY,
            head: [['No', 'NIBAR', 'Kode Aset', 'Nama Barang', 'Kategori', 'Ruang', 'Tahun', 'Usia', 'Harga Perolehan', 'Akumulasi Depresiasi', 'Nilai Buku', 'Kondisi']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42] },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        } else if (reportId === "r8") {
          let totalUnit = 0;
          let totalNilai = 0;
          const body = displayedDisposals.map((d: any, i: number) => {
            const asset = assets.find((a: any) => a.id === d.assetId);
            const room = asset?.ruanganId ? rooms.find((r: any) => r.id === asset.ruanganId) : null;
            const unit = d.jumlah || 1;
            const subtotal = (asset?.harga || 0) * unit;
            totalUnit += unit;
            totalNilai += subtotal;

            return [
              i + 1,
              d.nomorSurat || "-",
              new Date(d.tanggalPengajuan).toLocaleDateString('id-ID'),
              asset?.nibar || asset?.nomorRegister || "-",
              asset?.nama || "-",
              room?.nama || "-",
              `${unit} Unit`,
              `Rp ${(asset?.harga || 0).toLocaleString('id-ID')}`,
              `Rp ${subtotal.toLocaleString('id-ID')}`,
              d.metode,
              d.alasan,
              d.status
            ];
          });
          body.push(['', '', '', '', '', 'Total:', `${totalUnit} Unit`, '', `Rp ${totalNilai.toLocaleString('id-ID')}`, '', '', '']);

          autoTable(doc, {
            startY,
            head: [['No', 'No. SK / BA', 'Tanggal', 'NIBAR', 'Nama Aset', 'Ruang Asal', 'Jumlah', 'Harga Satuan', 'Total Nilai Buku', 'Metode', 'Alasan', 'Status']],
            body: body,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42] },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
        }
        
        // Signatures
        const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 30 : startY + 80;
        const needNewPage = finalY > pageHeight - 90;
        if (needNewPage) {
          doc.addPage();
        }
        
        const sigY = needNewPage ? 45 : finalY;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Left
        doc.text("Mengetahui,", 100, sigY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text("Kepala Sekolah", 100, sigY + 12, { align: 'center' });
        doc.text(printKepsek || "-", 100, sigY + 55, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${printNipKepsek || "-"}`, 100, sigY + 67, { align: 'center' });

        // Right
        doc.text(`Kabupaten Kediri, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 120, sigY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text("Pengelola Sarpras / Operator BMD", pageWidth - 120, sigY + 12, { align: 'center' });
        doc.text(printOperator || "-", pageWidth - 120, sigY + 55, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${printNipOperator || "-"}`, pageWidth - 120, sigY + 67, { align: 'center' });

        if (action === 'print') {
          try {
            const bloburl = doc.output('bloburl');
            const newWin = window.open(bloburl, '_blank');
            if (!newWin) {
              doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
              toast?.("Popup diblokir, file otomatis diunduh.", "info");
            }
          } catch (e) {
            doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
          }
        } else {
          doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
          toast("Berhasil mengunduh dokumen laporan PDF lengkap", "success");
        }
      });
    });
  };

  const exportAllMasterAssets = () => {
    exportDetailedAssetsToExcel(
      displayedAssets,
      schoolProfile,
      rooms,
      `Laporan_Lengkap_Master_Aset_${schoolProfile?.nama?.replace(/\s+/g, '_') || 'UPTD_SMPN_3_Kras'}`
    );
    toast("Berhasil mengekspor Laporan Detail Master Aset (22 Kolom Resmi BMD)", "success");
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] overflow-y-auto bg-slate-100 z-50 print:bg-white pb-20 print:pb-0 print:h-auto print:overflow-visible">
      <div className="sticky top-0 right-0 bg-white border-b border-slate-300 p-4 flex flex-col gap-3 print:hidden shadow-md z-50">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <X className="mr-1.5 h-4 w-4" /> Kembali
            </Button>
            <h2 className="text-base sm:text-lg font-black text-slate-900 border-l pl-3 border-slate-300">{title}</h2>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-300">
              {reportId === "r1" && (
                <>
                  <div className="relative">
                    <select
                      className="appearance-none text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 pr-7 font-bold text-blue-700 outline-none hover:bg-slate-50 shadow-sm"
                      value={filterKib}
                      onChange={(e) => setFilterKib(e.target.value)}
                    >
                      <option value="semua">Semua KIB</option>
                      <option value="A">KIB A (Tanah)</option>
                      <option value="B">KIB B (Peralatan & Mesin)</option>
                      <option value="C">KIB C (Gedung & Bangunan)</option>
                      <option value="D">KIB D (Jalan, Irigasi, Jaringan)</option>
                      <option value="E">KIB E (Aset Tetap Lainnya)</option>
                      <option value="F">KIB F (Konstruksi Dalam Pengerjaan)</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      className="appearance-none text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 pr-7 font-bold text-emerald-700 outline-none hover:bg-slate-50 shadow-sm"
                      value={filterSumberDana}
                      onChange={(e) => setFilterSumberDana(e.target.value)}
                    >
                      <option value="semua">Semua Dana</option>
                      <option value="BOS">Dana BOS</option>
                      <option value="Mandiri">Beli Mandiri / Non-BOS</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </>
              )}

              <div className="relative">
                <select 
                  className="appearance-none text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 pr-7 font-semibold text-slate-700 outline-none hover:bg-slate-50 shadow-sm"
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as any)}
                >
                  <option value="semua">Semua Waktu</option>
                  <option value="hari">Per Hari</option>
                  <option value="bulan">Per Bulan</option>
                  <option value="tahun">Per Tahun</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              
              {periodType === 'hari' && (
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 shadow-sm" />
              )}
              {periodType === 'bulan' && (
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 shadow-sm" />
              )}
              {periodType === 'tahun' && (
                <input type="number" min="2000" max="2100" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 w-20 shadow-sm" />
              )}
            </div>

            {reportId === "r1" && (
              <Button size="sm" onClick={exportAllMasterAssets} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-xs">
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Unduh Master Excel 22 Kolom
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={downloadCSV} className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs">
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Unduh CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => generateReportPDF('print')} className="border-slate-600 text-slate-800 hover:bg-slate-50 font-bold text-xs">
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Cetak / Print
            </Button>
            <Button size="sm" onClick={() => generateReportPDF('download')} className="bg-primary-600 hover:bg-primary-700 font-bold text-xs text-white">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center bg-amber-50/80 p-2 rounded-xl border border-amber-200">
          <span className="text-xs font-bold text-amber-900">Pejabat & No. Surat (Cetak/PDF):</span>
          <input type="text" value={printKepsek} onChange={e => setPrintKepsek(e.target.value)} placeholder="Nama Kepala Sekolah" className="border border-slate-300 px-2 py-1 text-xs rounded bg-white w-40 outline-none" />
          <input type="text" value={printNipKepsek} onChange={e => setPrintNipKepsek(e.target.value)} placeholder="NIP Kepala Sekolah" className="border border-slate-300 px-2 py-1 text-xs rounded bg-white w-36 outline-none" />
          <span className="text-slate-400">|</span>
          <input type="text" value={printOperator} onChange={e => setPrintOperator(e.target.value)} placeholder="Nama Pengurus Barang" className="border border-slate-300 px-2 py-1 text-xs rounded bg-white w-40 outline-none" />
          <input type="text" value={printNipOperator} onChange={e => setPrintNipOperator(e.target.value)} placeholder="NIP Operator" className="border border-slate-300 px-2 py-1 text-xs rounded bg-white w-36 outline-none" />
          <span className="text-slate-400">|</span>
          <input type="text" value={printNomorSurat} onChange={e => setPrintNomorSurat(e.target.value)} placeholder="Nomor Dokumen Laporan" className="border border-slate-300 px-2 py-1 text-xs rounded bg-white flex-1 min-w-[200px] outline-none font-mono" />
        </div>
      </div>
      
      <StickyTableWrapper
        className="w-full print:overflow-visible"
        tableContainerClassName="p-4 sm:p-6 md:p-8"
        label="Tabel Laporan & Rekapitulasi Sarpras"
      >
        <div id="print-area" className="w-full max-w-7xl mx-auto bg-white p-6 sm:p-10 shadow-xl print:shadow-none print:m-0 print:p-0 text-slate-900 rounded-2xl print:rounded-none border border-slate-200 print:border-none">
          {/* Kop Surat Resmi */}
          <div className="text-center border-b-[3px] border-double border-slate-900 pb-3 mb-6 flex items-center justify-between relative min-h-[90px]">
            {schoolProfile.logoDinas && (
              <img src={schoolProfile.logoDinas} alt="Logo Dinas" className="w-20 h-20 object-contain absolute left-0 top-1/2 -translate-y-1/2 hidden print:block" />
            )}
            {schoolProfile.logoDinas && (
              <img src={schoolProfile.logoDinas} alt="Logo Dinas" className="w-20 h-20 object-contain mr-4 shrink-0 print:hidden" />
            )}
            <div className="flex-1 text-center">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900">
                {schoolProfile.kementerian || 'PEMERINTAH KABUPATEN KEDIRI - DINAS PENDIDIKAN'}
              </h2>
              <h1 className="text-xl sm:text-2xl font-black uppercase my-0.5 text-slate-950 tracking-tight">
                {schoolProfile.nama || 'UPTD SMP NEGERI 3 KRAS'}
              </h1>
              <p className="text-xs text-slate-700 font-medium">{schoolProfile.alamat} {schoolProfile.kodePos}</p>
              <p className="text-xs text-slate-600">
                Telp: {schoolProfile.telepon || '-'} | Email: {schoolProfile.email || '-'} | Website: {schoolProfile.website || '-'}
              </p>
            </div>
            {schoolProfile.logoSekolah && (
              <img src={schoolProfile.logoSekolah} alt="Logo Sekolah" className="w-20 h-20 object-contain ml-4 shrink-0" />
            )}
          </div>

          {/* Judul Laporan */}
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-extrabold uppercase underline underline-offset-4 decoration-2 text-slate-950">
              {title}
            </h2>
            <p className="text-xs mt-1.5 font-bold text-slate-800">Nomor: {printNomorSurat}</p>
            <p className="text-xs font-semibold text-slate-600">Periode: {periodText}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Konten Laporan */ }
          <div className="min-h-[400px]">
            {content}
          </div>

          {/* Tanda Tangan Formal BMD */}
          <div className="flex justify-between mt-12 pt-6 px-10 break-inside-avoid text-xs sm:text-sm">
            <div className="text-center flex flex-col items-center">
              <p className="font-semibold text-slate-800">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala Sekolah</p>
              <div className="h-20"></div>
              <p className="font-bold underline decoration-1 underline-offset-4 text-slate-950">{printKepsek || "-"}</p>
              <p className="text-slate-700 font-medium">NIP. {printNipKepsek || "-"}</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="text-slate-700">Kediri, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-bold text-slate-900">Pengelola Sarpras / Pengurus Barang</p>
              <div className="h-20"></div>
              <p className="font-bold underline decoration-1 underline-offset-4 text-slate-950">{printOperator || "-"}</p>
              <p className="text-slate-700 font-medium">NIP. {printNipOperator || "-"}</p>
            </div>
          </div>
        </div>
      </StickyTableWrapper>
    </div>
  );
}

export default function Reports() {
  const { assets, rooms, maintenances, consumables, borrowings, disposals } = useData();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const reports = [
    {
      id: "r1",
      title: "Laporan Semua Aset (Buku Inventaris Detail KIB A-F)",
      description: "Data lengkap seluruh barang inventaris dengan 44-digit NIBAR, kode register, spesifikasi, lokasi ruang, sumber dana BOS/Mandiri, kondisi, harga perolehan, dan nilai buku.",
      icon: FileStack,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: "r2",
      title: "Laporan Kondisi Barang Rusak (Rusak Ringan & Rusak Berat)",
      description: "Daftar rinci seluruh aset dengan kondisi rusak, dilengkapi rekomendasi pemeliharaan berkala atau pengajuan penghapusan (disposal).",
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      id: "r3",
      title: "Laporan Rekapitulasi per Ruangan (KIR Resmi)",
      description: "Sebaran barang inventaris per ruangan sekolah sesuai format standar Kartu Inventaris Ruangan (KIR) dinas pendidikan.",
      icon: PieChart,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      id: "r4",
      title: "Laporan Pemeliharaan & Perawatan Aset",
      description: "Histori perbaikan, teknisi rekanan, rincian biaya pengeluaran pemeliharaan sarpras, dan status penyelesaian.",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      id: "r5",
      title: "Laporan Persediaan Barang Habis Pakai (BHP & ATK)",
      description: "Rekap data stok barang habis pakai, posisi stok sisa, batas ambang kritis minimum, dan lokasi rak gudang sarpras.",
      icon: Box,
      color: "text-sky-600",
      bg: "bg-sky-50"
    },
    {
      id: "r6",
      title: "Laporan Sirkulasi Peminjaman Sarpras",
      description: "Histori peminjaman sarana prasarana sekolah, peminjam, peruntukan kelas/kegiatan, dan status pengembalian barang.",
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      id: "r7",
      title: "Laporan Penyusutan & Nilai Buku Aset (Depresiasi BMD)",
      description: "Perhitungan depresiasi garis lurus, usia pakai, akumulasi beban penyusutan, dan nilai buku akhir setiap barang milik daerah.",
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      id: "r8",
      title: "Laporan Penghapusan Aset & Berita Acara (Disposal)",
      description: "Data pengajuan penghapusan barang rusak berat, nomor SK/Berita Acara, jumlah unit, total nilai buku, metode pemusnahan/lelang, dan tanda tangan pejabat.",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50"
    }
  ];

  if (selectedReportId) {
    return (
      <ReportPrintView 
        reportId={selectedReportId} 
        data={{ assets, rooms, maintenances, consumables, borrowings, disposals }} 
        onBack={() => setSelectedReportId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Laporan & Rekapitulasi Sarpras BMD</h2>
          <p className="text-slate-700 text-sm mt-0.5">
            Cetak dan ekspor laporan inventaris sarana prasarana sekolah secara detail, lengkap, dan berstandar resmi SIPD/BMD Pemerintah Kabupaten Kediri.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} className="flex flex-col border border-slate-300 hover:border-primary-400 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className={`p-3.5 rounded-2xl ${report.bg} shrink-0 border border-slate-200`}>
                <report.icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg text-slate-950 font-bold">{report.title}</CardTitle>
                <CardDescription className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {report.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto border-t border-slate-200 pt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedReportId(report.id)} 
                className="flex-1 bg-white hover:bg-slate-50 font-bold text-xs border-slate-300 text-primary-700 hover:text-primary-800"
              >
                <FileText className="mr-2 h-4 w-4 text-primary-600" />
                Buka & Pratinjau Laporan Detail
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
