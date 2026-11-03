export type AssetState = "Baik" | "Rusak Ringan" | "Rusak Berat" | "Hilang" | "Tidak Diketahui";
export type AssetCategory = "Tanah (KIB A)" | "Peralatan & Mesin (KIB B)" | "Gedung & Bangunan (KIB C)" | "Jalan, Irigasi & Jaringan (KIB D)" | "Aset Tetap Lainnya (KIB E)" | "Aset Tak Berwujud" | "Ekstrakomptabel";
export type MaintenanceStatus = "Menunggu" | "Proses Perbaikan" | "Selesai" | "Dibatalkan";

export interface Asset {
  id: string;
  kodeBarang: string;
  kodeAset?: string;
  nomorRegister: string;
  nama: string;
  kategori: AssetCategory;
  merk: string;
  bahan: string;
  tahunPerolehan: number;
  kondisi: AssetState;
  ruanganId: string;
  harga: number;
  sumberDana: "BOS Reguler" | "BOS Kinerja" | "BOS Daerah (BOSDa)" | "BOS Afirmasi" | "Mandiri / Kas Sekolah" | "Komite Sekolah" | "Swadana Sekolah" | "Hibah / Sumbangan" | "Yayasan" | "Pemerintah Pusat" | "Pengadaan APBD" | "Lainnya" | string;
  catatan?: string;
  keterangan?: string;
  asalUsul?: string;
  ukuranBahan?: string;
  gambarUrl?: string;
  
  // Specific KIB A (Tanah) Properties
  luasTanah?: number;
  letakAlamat?: string;
  statusHak?: string;
  tanggalSertifikat?: string;
  nomorSertifikat?: string;
  penggunaan?: string;

  // Specific KIB B (Peralatan dan Mesin) & SIPD BMD Properties
  skpd?: string;
  uraianBarang?: string;
  nibar?: string;
  spesifikasiLainnya?: string;
  lokasi?: string;
  tanggalPerolehan?: string;
  komptabel?: "intra" | "ekstra" | string;
  ukuranCc?: string;
  nomorPabrik?: string;
  nomorRangka?: string;
  nomorMesin?: string;
  nomorPolisi?: string;
  nomorBpkb?: string;

  // Specific KIB C (Gedung dan Bangunan) Properties
  bertingkat?: "Bertingkat" | "Tidak";
  beton?: "Beton" | "Bukan";
  luasLantai?: number;
  dokumenGedungTanggal?: string;
  dokumenGedungNomor?: string;
  statusTanah?: string;
  nomorKodeTanah?: string;
  kondisiBangunan?: string;
  createdAt?: string;
  updatedAt?: string;

  // Specific KIB D (Jalan, Irigasi dan Jaringan) Properties
  konstruksi?: string;
  panjang?: number;
  lebar?: number;
  luasKibD?: number;
  dokumenTanggalKibD?: string;
  dokumenNomorKibD?: string;
  statusTanahKibD?: string;
  nomorKodeTanahKibD?: string;

  // Specific KIB E (Aset Tetap Lainnya) Properties
  bukuJudulPencipta?: string;
  bukuSpesifikasi?: string;
  seniAsalDaerah?: string;
  seniPencipta?: string;
  seniBahan?: string;
  hewanTumbuhanJenis?: string;
  hewanTumbuhanUkuran?: string;
  jumlahKibE?: number;
  tahunCetakKibE?: string;
  // Kuantitas & Rincian Jumlah per Kondisi Fisik
  jumlah?: number;
  satuan?: string;
  kondisiBaik?: number;
  kondisiRusakRingan?: number;
  kondisiRusakBerat?: number;
  kondisiHilang?: number;
  kondisiTidakDiketahui?: number;

  // Operational state machine & audit log
  statusOperasional?: "Tersedia" | "Dipinjam" | "Dalam Perbaikan" | "Dihapus / Dimusnahkan" | "Diarsipkan";
  statusPenggunaanManual?: AssetUsageCategory;
  skPenetapanPenggunaan?: string;
  tanggalPenetapanPenggunaan?: string;
  auditHistory?: AssetAuditLog[];
}

export interface AssetConditionBreakdown {
  total: number;
  baik: number;
  rusakRingan: number;
  rusakBerat: number;
  hilang: number;
  tidakDiketahui: number;
  isMixed: boolean;
  satuan: string;
}

export function getAssetConditionBreakdown(asset: Asset | null | undefined): AssetConditionBreakdown {
  if (!asset) {
    return {
      total: 0,
      baik: 0,
      rusakRingan: 0,
      rusakBerat: 0,
      hilang: 0,
      tidakDiketahui: 0,
      isMixed: false,
      satuan: "Unit"
    };
  }

  const rawTotal = Number(asset.jumlah);
  const total = !isNaN(rawTotal) && rawTotal > 0 ? rawTotal : 1;
  const satuan = asset.satuan || "Unit";

  const hasExplicitBreakdown = 
    asset.kondisiBaik !== undefined ||
    asset.kondisiRusakRingan !== undefined ||
    asset.kondisiRusakBerat !== undefined ||
    asset.kondisiHilang !== undefined ||
    asset.kondisiTidakDiketahui !== undefined;

  if (hasExplicitBreakdown) {
    const baik = Math.max(0, Number(asset.kondisiBaik) || 0);
    const rusakRingan = Math.max(0, Number(asset.kondisiRusakRingan) || 0);
    const rusakBerat = Math.max(0, Number(asset.kondisiRusakBerat) || 0);
    const hilang = Math.max(0, Number(asset.kondisiHilang) || 0);
    const tidakDiketahui = Math.max(0, Number(asset.kondisiTidakDiketahui) || 0);
    const sum = baik + rusakRingan + rusakBerat + hilang + tidakDiketahui;

    if (sum === 0) {
      return {
        total,
        baik: asset.kondisi === "Baik" ? total : 0,
        rusakRingan: asset.kondisi === "Rusak Ringan" ? total : 0,
        rusakBerat: asset.kondisi === "Rusak Berat" ? total : 0,
        hilang: asset.kondisi === "Hilang" ? total : 0,
        tidakDiketahui: asset.kondisi === "Tidak Diketahui" ? total : 0,
        isMixed: false,
        satuan
      };
    }

    const nonZeroCount = [baik > 0, rusakRingan > 0, rusakBerat > 0, hilang > 0, tidakDiketahui > 0].filter(Boolean).length;

    return {
      total: sum > 0 ? sum : total,
      baik,
      rusakRingan,
      rusakBerat,
      hilang,
      tidakDiketahui,
      isMixed: nonZeroCount > 1,
      satuan
    };
  }

  return {
    total,
    baik: asset.kondisi === "Baik" ? total : 0,
    rusakRingan: asset.kondisi === "Rusak Ringan" ? total : 0,
    rusakBerat: asset.kondisi === "Rusak Berat" ? total : 0,
    hilang: asset.kondisi === "Hilang" ? total : 0,
    tidakDiketahui: asset.kondisi === "Tidak Diketahui" ? total : 0,
    isMixed: false,
    satuan
  };
}

export interface AssetAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

export interface AssetLiveStatus {
  status: "Tersedia" | "Dipinjam" | "Dalam Perbaikan" | "Dihapus";
  keterangan: string;
  canBorrow: boolean;
  canMutate: boolean;
  canMaintain: boolean;
  lockReason?: string;
  activeBorrowing?: Borrowing;
  activeMaintenance?: MaintenanceRecord;
  activeDisposal?: Disposal;
}

export interface Room {
  id: string;
  kodeRuangan: string;
  nama: string;
  jenis: "Kelas" | "Laboratorium" | "Perpustakaan" | "Kantor" | "Gudang" | "Fasilitas Umum" | "Lainnya";
  panjang?: number;
  lebar?: number;
  tinggi?: number;
  luas?: number;
  bangunan?: string;
  kibCAssetId?: string;
  lantai?: string;
  kondisi?: string;
  kapasitas: number;
  penanggungJawab: string; // Nama guru/staf
  nipPenanggungJawab?: string;
  tahunBangunan?: number;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  tanggalLapor: string; // ISO Date string
  pelapor: string;
  deskripsiKerusakan: string;
  status: MaintenanceStatus;
  tanggalSelesai?: string;
  biayaEstimasi?: number;
  teknisi?: string;
  catatanTeknisi?: string;
  prioritas?: string;
}

export interface Consumable {
  id: string;
  nama: string;
  kategori: string;
  merk?: string;
  spesifikasi?: string;
  lokasiPenyimpanan?: string;
  stokSisa: number;
  satuan: string;
  batasMinimum: number;
}

export interface Borrowing {
  id: string;
  assetId: string;
  peminjam: string;
  nipPeminjam?: string;
  kontakPeminjam?: string;
  alamat?: string;
  unitKerja?: string;
  jabatan?: string; // e.g. Guru, Siswa, Staf, etc.
  lokasiPenggunaan?: string; // Where the asset will be used
  penanggungJawab?: string; // Supervisor/Person in charge if applicable
  keperluan?: string;
  tanggalPinjam: string;
  rencanaTanggalKembali?: string;
  tanggalKembali?: string;
  kondisiPinjam?: string;
  kondisiKembali?: string;
  keterangan?: string;
  jumlah?: number;
  durasi?: string;
  status: "Menunggu Persetujuan" | "Dipinjam" | "Dikembalikan" | "Terlambat" | "Ditolak";
}

export interface Procurement {
  id: string;
  namaItem: string;
  jumlah: number;
  estimasiHarga: number;
  tanggalPengajuan: string;
  status: "Pengajuan" | "Disetujui" | "Selesai" | "Ditolak";
  sumberDana: string;
}

export interface Mutation {
  id: string;
  assetId: string;
  dariRuanganId: string;
  keRuanganId: string;
  tanggalMutasi: string;
  alasan: string;
  status: "Proses" | "Selesai";
}

export interface Stocktake {
  id: string;
  tanggal: string;
  penanggungJawab: string;
  totalAsetDiperiksa: number;
  asetSesuai: number;
  asetSelisih: number;
  status: "Berlangsung" | "Selesai";
}

export interface Disposal {
  id: string;
  assetId: string;
  jumlah: number;
  nomorSurat?: string;
  tanggalPengajuan: string;
  metode: "Pemusnahan" | "Penjualan / Lelang" | "Hibah" | string;
  alasan: string;
  status: "Diajukan" | "Disetujui" | "Selesai";
  penanggungJawab?: string;
  catatan?: string;
  tanggalEksekusi?: string;
}

// Stats for dashboard
export interface DashboardStats {
  totalAssets: number;
  totalRooms: number;
  assetsGoodCondition: number;
  assetsNeedRepair: number;
  totalValue: number;
  recentMaintenanceCount: number;
}

export type LogLevel = "INFO" | "SUCCESS" | "WARNING" | "DANGER";
export type LogCategory = "AUTH" | "ASSET" | "CIRCULATION" | "MAINTENANCE" | "DATABASE" | "SECURITY" | "NETWORK";

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  actor: string;
  ip: string;
  description: string;
  details?: Record<string, any>;
}

export type AssetUsageCategory =
  | "Digunakan Sendiri (Operasional)"
  | "Sedang Dipinjamkan"
  | "Dalam Pemeliharaan"
  | "Cadangan di Gudang"
  | "Proses Mutasi"
  | "Rusak / Tidak Digunakan"
  | "Proses Penghapusan"
  | "Hilang / Tidak Ditemukan"
  | "Tidak Diketahui Keberadaannya";

export interface AssetUsageRecord {
  asset: Asset;
  computedStatus: AssetUsageCategory;
  isAutomatic: boolean;
  keterangan: string;
  roomName?: string;
  buildingName?: string;
  activeEntityName?: string;
  sinceDate?: string;
  skNomor?: string;
  tglSk?: string;
}

export interface SchoolMapElement {
  id: string;
  nama: string;
  kode?: string;
  tipe: "ruangan" | "gedung" | "lapangan" | "taman" | "fasilitas" | "gerbang";
  ruanganId?: string; // Link to Room ID
  bangunan?: string;
  lantai: number; // 1 = Lantai 1, 2 = Lantai 2, etc.
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  width: number; // Percentage 0 - 100
  height: number; // Percentage 0 - 100
  warna?: string;
  keterangan?: string;
  kapasitas?: number;
}


