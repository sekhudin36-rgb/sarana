import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAssetConditionBreakdown } from '../types';

export interface ColumnDef {
  header: string;
  key: string;
  render?: (item: any) => string;
}

export const KIB_B_OFFICIAL_COLUMNS = [
  "SKPD",
  "Kode Barang",
  "Uraian Barang",
  "NIBAR",
  "Kode Register",
  "Nama Barang",
  "Merek / Tipe",
  "Spesifikasi Lainnya",
  "No. Polisi",
  "No. Rangka",
  "No. Mesin",
  "No. BPKB",
  "Lokasi",
  "Ruangan",
  "Tgl Perolehan",
  "Komptabel",
  "Nilai Perolehan",
  "Asal Usul",
  "Kondisi",
  "Penggunaan",
  "Keterangan"
];

export const MASTER_ASET_DETAILED_COLUMNS = [
  "No",
  "SKPD / Unit",
  "Kode Barang",
  "NIBAR (44 Digit)",
  "No. Register",
  "Nama Barang",
  "Kategori / KIB",
  "Merek / Model",
  "Spesifikasi & Bahan",
  "Ruangan / Lokasi",
  "Penanggung Jawab",
  "Tahun Perolehan",
  "Tgl Perolehan",
  "Sumber Dana",
  "Asal Usul",
  "Jumlah Total",
  "Satuan",
  "Kondisi Baik (Unit)",
  "Rusak Ringan (Unit)",
  "Rusak Berat (Unit)",
  "Hilang (Unit)",
  "Rincian Fisik",
  "Kondisi Utama",
  "Komptabel",
  "Harga Satuan (Rp)",
  "Total Nilai Perolehan (Rp)",
  "Akumulasi Penyusutan (Rp)",
  "Total Nilai Buku (Rp)",
  "Identitas Kendaraan / Sertifikat / Dokumen",
  "Keterangan"
];

export function exportKibBToExcel(assets: any[], schoolProfile: any, rooms: any[], filename = "Daftar_Barang_KIB_B") {
  const exportData = assets.map(item => {
    const room = rooms?.find(r => r.id === item.ruanganId);
    const roomName = room ? room.nama : (item.ruanganId || "");
    const skpdName = item.skpd || schoolProfile?.nama || "UPTD SMPN 3 Kras";
    const dateFormatted = item.tanggalPerolehan || (item.tahunPerolehan ? `${item.tahunPerolehan}-06-30` : "");
    const komptabelVal = item.komptabel || (item.kategori === 'Ekstrakomptabel' || (item.harga && Number(item.harga) < 500000) ? "ekstra" : "intra");

    return {
      "SKPD": skpdName,
      "Kode Barang": item.kodeBarang || "",
      "Uraian Barang": item.uraianBarang || item.nama || "",
      "NIBAR": item.nibar || item.nomorRegister || "",
      "Kode Register": item.nomorRegister || item.nibar || "",
      "Nama Barang": item.nama || item.uraianBarang || "",
      "Merek / Tipe": item.merk ? (String(item.merk).toLowerCase().startsWith("merk:") ? item.merk : `Merk: ${item.merk}`) : "",
      "Spesifikasi Lainnya": item.spesifikasiLainnya || item.ukuranCc || item.ukuranBahan || "",
      "No. Polisi": item.nomorPolisi || "",
      "No. Rangka": item.nomorRangka || "",
      "No. Mesin": item.nomorMesin || "",
      "No. BPKB": item.nomorBpkb || "",
      "Lokasi": item.lokasi || skpdName,
      "Ruangan": roomName,
      "Tgl Perolehan": dateFormatted,
      "Komptabel": komptabelVal,
      "Nilai Perolehan": typeof item.harga === 'number' ? item.harga : (parseFloat(item.harga) || 0),
      "Asal Usul": item.asalUsul || item.sumberDana || "Pengadaan APBD",
      "Kondisi": item.kondisi || "Baik",
      "Penggunaan": item.penggunaan || skpdName,
      "Keterangan": item.keterangan || item.catatan || ""
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: KIB_B_OFFICIAL_COLUMNS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KIB B');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportKibBToCsv(assets: any[], schoolProfile: any, rooms: any[], filename = "Daftar_Barang_KIB_B") {
  const exportData = assets.map(item => {
    const room = rooms?.find(r => r.id === item.ruanganId);
    const roomName = room ? room.nama : (item.ruanganId || "");
    const skpdName = item.skpd || schoolProfile?.nama || "UPTD SMPN 3 Kras";
    const dateFormatted = item.tanggalPerolehan || (item.tahunPerolehan ? `${item.tahunPerolehan}-06-30` : "");
    const komptabelVal = item.komptabel || (item.kategori === 'Ekstrakomptabel' || (item.harga && Number(item.harga) < 500000) ? "ekstra" : "intra");

    return {
      "SKPD": skpdName,
      "Kode Barang": item.kodeBarang || "",
      "Uraian Barang": item.uraianBarang || item.nama || "",
      "NIBAR": item.nibar || item.nomorRegister || "",
      "Kode Register": item.nomorRegister || item.nibar || "",
      "Nama Barang": item.nama || item.uraianBarang || "",
      "Merek / Tipe": item.merk ? (String(item.merk).toLowerCase().startsWith("merk:") ? item.merk : `Merk: ${item.merk}`) : "",
      "Spesifikasi Lainnya": item.spesifikasiLainnya || item.ukuranCc || item.ukuranBahan || "",
      "No. Polisi": item.nomorPolisi || "",
      "No. Rangka": item.nomorRangka || "",
      "No. Mesin": item.nomorMesin || "",
      "No. BPKB": item.nomorBpkb || "",
      "Lokasi": item.lokasi || skpdName,
      "Ruangan": roomName,
      "Tgl Perolehan": dateFormatted,
      "Komptabel": komptabelVal,
      "Nilai Perolehan": typeof item.harga === 'number' ? item.harga : (parseFloat(item.harga) || 0),
      "Asal Usul": item.asalUsul || item.sumberDana || "Pengadaan APBD",
      "Kondisi": item.kondisi || "Baik",
      "Penggunaan": item.penggunaan || skpdName,
      "Keterangan": item.keterangan || item.catatan || ""
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: KIB_B_OFFICIAL_COLUMNS });
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDetailedAssetsToExcel(assets: any[], schoolProfile: any, rooms: any[], filename = "Laporan_Detail_Semua_Aset") {
  const currentYear = new Date().getFullYear();
  const exportData = assets.map((item, index) => {
    const room = rooms?.find(r => r.id === item.ruanganId);
    const roomName = room ? room.nama : (item.ruanganId || "-");
    const pjRoom = room ? (room.penanggungJawab || "-") : "-";
    const skpdName = item.skpd || schoolProfile?.nama || "UPTD SMPN 3 Kras";
    const dateFormatted = item.tanggalPerolehan || (item.tahunPerolehan ? `${item.tahunPerolehan}-06-30` : "-");
    const komptabelVal = item.komptabel || (item.kategori === 'Ekstrakomptabel' || (item.harga && Number(item.harga) < 500000) ? "ekstra" : "intra");
    const bd = getAssetConditionBreakdown(item);
    const hargaPerUnit = typeof item.harga === 'number' ? item.harga : (parseFloat(item.harga) || 0);
    const totalHargaPerolehan = hargaPerUnit * bd.total;

    // Penyusutan estimasi
    const usiaTahun = Math.max(0, currentYear - (item.tahunPerolehan || currentYear));
    const isTanah = item.kategori === "Tanah (KIB A)";
    const akumulasiPerUnit = isTanah ? 0 : Math.min(hargaPerUnit, hargaPerUnit * 0.1 * usiaTahun);
    const nilaiBukuPerUnit = isTanah ? hargaPerUnit : Math.max(0, hargaPerUnit - akumulasiPerUnit);
    const totalNilaiBuku = nilaiBukuPerUnit * bd.total;

    // Identitas spesifik KIB
    const specificDocs: string[] = [];
    if (item.nomorPolisi) specificDocs.push(`Nopol: ${item.nomorPolisi}`);
    if (item.nomorRangka) specificDocs.push(`Rangka: ${item.nomorRangka}`);
    if (item.nomorMesin) specificDocs.push(`Mesin: ${item.nomorMesin}`);
    if (item.nomorBpkb) specificDocs.push(`BPKB: ${item.nomorBpkb}`);
    if (item.nomorSertifikat) specificDocs.push(`Sertifikat: ${item.nomorSertifikat} (${item.statusHak || 'Hak Pakai'})`);
    if (item.luasTanah) specificDocs.push(`Luas Tanah: ${item.luasTanah} m²`);
    if (item.luasLantai) specificDocs.push(`Luas Lantai: ${item.luasLantai} m²`);
    if (item.dokumenGedungNomor) specificDocs.push(`Dok Gedung: ${item.dokumenGedungNomor}`);
    if (item.bukuJudulPencipta) specificDocs.push(`Judul/Pengarang: ${item.bukuJudulPencipta}`);

    const rincianFisik = bd.isMixed
      ? `${bd.baik > 0 ? `${bd.baik} Baik ` : ''}${bd.rusakRingan > 0 ? `${bd.rusakRingan} RR ` : ''}${bd.rusakBerat > 0 ? `${bd.rusakBerat} RB ` : ''}${bd.hilang > 0 ? `${bd.hilang} Hilang` : ''}`.trim()
      : `${bd.total} ${item.kondisi || "Baik"}`;

    return {
      "No": index + 1,
      "SKPD / Unit": skpdName,
      "Kode Barang": item.kodeBarang || "-",
      "NIBAR (44 Digit)": item.nibar || item.nomorRegister || "-",
      "No. Register": item.nomorRegister || "-",
      "Nama Barang": item.nama || item.uraianBarang || "-",
      "Kategori / KIB": item.kategori || "-",
      "Merek / Model": item.merk || "-",
      "Spesifikasi & Bahan": [item.spesifikasiLainnya, item.ukuranCc, item.ukuranBahan, item.bahan].filter(Boolean).join(", ") || "-",
      "Ruangan / Lokasi": roomName,
      "Penanggung Jawab": pjRoom,
      "Tahun Perolehan": item.tahunPerolehan || "-",
      "Tgl Perolehan": dateFormatted,
      "Sumber Dana": item.sumberDana || item.asalUsul || "Pengadaan APBD",
      "Asal Usul": item.asalUsul || item.sumberDana || "-",
      "Jumlah Total": bd.total,
      "Satuan": bd.satuan,
      "Kondisi Baik (Unit)": bd.baik,
      "Rusak Ringan (Unit)": bd.rusakRingan,
      "Rusak Berat (Unit)": bd.rusakBerat,
      "Hilang (Unit)": bd.hilang,
      "Rincian Fisik": rincianFisik,
      "Kondisi Utama": item.kondisi || "Baik",
      "Komptabel": komptabelVal,
      "Harga Satuan (Rp)": hargaPerUnit,
      "Total Nilai Perolehan (Rp)": totalHargaPerolehan,
      "Akumulasi Penyusutan (Rp)": akumulasiPerUnit * bd.total,
      "Total Nilai Buku (Rp)": totalNilaiBuku,
      "Identitas Kendaraan / Sertifikat / Dokumen": specificDocs.join(" | ") || "-",
      "Keterangan": item.keterangan || item.catatan || "-"
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: MASTER_ASET_DETAILED_COLUMNS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Aset Detail');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToExcel(data: any[], columns: ColumnDef[], filename: string) {
  const exportData = data.map((item, index) => {
    const row: any = { No: index + 1 };
    columns.forEach(col => {
      row[col.header] = col.render ? col.render(item) : (item[col.key] ?? "");
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Laporan');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPdf(data: any[], columns: ColumnDef[], title: string, schoolProfile: any, subtitleInfo?: string) {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  if (schoolProfile?.logoDinas || schoolProfile?.logoSekolah) {
    try {
      const logo = schoolProfile.logoDinas || schoolProfile.logoSekolah;
      const formatMatch = logo.match(/data:image\/(.*?);/);
      const format = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
      const parsedFormat = format === 'JPEG' || format === 'JPG' ? 'JPEG' : 'PNG';
      doc.addImage(logo, parsedFormat, 35, 20, 50, 50);
    } catch(e) {
      console.warn("Failed to add logo to PDF:", e);
    }
  }

  // Kop Sekolah Header
  let currentY = 28;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolProfile?.kementerian?.toUpperCase() || 'PEMERINTAH KABUPATEN KEDIRI - DINAS PENDIDIKAN', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 16;
  doc.setFontSize(14);
  doc.text(schoolProfile?.nama?.toUpperCase() || 'UPTD SMP NEGERI 3 KRAS', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 13;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const address = `${schoolProfile?.alamat || ''} ${schoolProfile?.kodePos || ''}`.trim();
  doc.text(address || "Jl. Raya Kras No. 123, Kras, Kab. Kediri, Jawa Timur", pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 12;
  const contact = `Telp: ${schoolProfile?.telepon || '-'} | Email: ${schoolProfile?.email || '-'} | Website: ${schoolProfile?.website || '-'}`;
  doc.text(contact, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 8;
  doc.setLineWidth(1.5);
  doc.line(35, currentY, pageWidth - 35, currentY);
  doc.setLineWidth(0.5);
  doc.line(35, currentY + 2, pageWidth - 35, currentY + 2);
  
  currentY += 18;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  
  if (subtitleInfo) {
    currentY += 12;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitleInfo, pageWidth / 2, currentY, { align: 'center' });
  }

  currentY += 12;
  
  const head = [['No', ...columns.map(col => col.header)]];
  const body = data.map((item, index) => [
    index + 1,
    ...columns.map(col => String(col.render ? col.render(item) : (item[col.key] ?? '')))
  ]);

  // Dynamic font size depending on column count
  const fontSize = columns.length > 10 ? 6.5 : columns.length > 7 ? 7.5 : 8.5;
  const cellPadding = columns.length > 10 ? 2 : 3;

  autoTable(doc, {
    head,
    body,
    startY: currentY,
    theme: 'grid',
    styles: { 
      fontSize, 
      cellPadding,
      lineColor: [200, 205, 215],
      lineWidth: 0.5,
      textColor: [15, 23, 42],
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: 255, 
      halign: 'center',
      fontStyle: 'bold',
      lineColor: [15, 23, 42],
      lineWidth: 0.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (dataObj) => {
      // Add page number in footer
      const str = `Halaman ${dataObj.pageNumber} | Sistem Informasi Sarana Prasarana (SIM Sarpras)`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(str, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 25;
  const needNewPageForSignatures = finalY > pageHeight - 100;
  
  if (needNewPageForSignatures) {
    doc.addPage();
  }

  const sigY = needNewPageForSignatures ? 50 : finalY;
  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Signatures
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 80, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', 80, sigY + 12, { align: 'center' });
  doc.text(schoolProfile?.kepalaSekolah || '(_____________________)', 80, sigY + 55, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolProfile?.nipKepsek || '...................'}`, 80, sigY + 67, { align: 'center' });

  doc.text(`Kediri, ${currentDate}`, pageWidth - 120, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Pengelola Sarpras / Pengurus Barang', pageWidth - 120, sigY + 12, { align: 'center' });
  doc.text(schoolProfile?.operator || '(_____________________)', pageWidth - 120, sigY + 55, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${schoolProfile?.nipOperator || '...................'}`, pageWidth - 120, sigY + 67, { align: 'center' });

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
