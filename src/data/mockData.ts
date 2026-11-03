import { Asset, Room, MaintenanceRecord, Consumable, Borrowing, Procurement, Mutation, Stocktake, Disposal, SchoolMapElement } from "../types";
import { subDays, formatISO } from "date-fns";

export const mockRooms: Room[] = [
  { id: "r1", kodeRuangan: "R-VII-A", nama: "Ruang Kelas VII-A", jenis: "Kelas", kapasitas: 32, penanggungJawab: "Bpk. Budi Santoso", bangunan: "Gedung Ruang Kelas Bertingkat (Blok A)", kibCAssetId: "a-kib-c-1", lantai: "Lantai 1", panjang: 8, lebar: 7, luas: 56, tahunBangunan: 2015, kondisi: "Baik" },
  { id: "r2", kodeRuangan: "R-VII-B", nama: "Ruang Kelas VII-B", jenis: "Kelas", kapasitas: 32, penanggungJawab: "Ibu Siti Aminah", bangunan: "Gedung Ruang Kelas Bertingkat (Blok A)", kibCAssetId: "a-kib-c-1", lantai: "Lantai 2", panjang: 8, lebar: 7, luas: 56, tahunBangunan: 2015, kondisi: "Baik" },
  { id: "r3", kodeRuangan: "R-LAB-KOM", nama: "Laboratorium Komputer", jenis: "Laboratorium", kapasitas: 40, penanggungJawab: "Bpk. Adi Gunawan", bangunan: "Gedung Laboratorium Komputer & Bahasa", kibCAssetId: "a-kib-c-2", lantai: "Lantai 1", panjang: 12, lebar: 10, luas: 120, tahunBangunan: 2018, kondisi: "Baik" },
  { id: "r4", kodeRuangan: "R-PERPUS", nama: "Perpustakaan Pusat", jenis: "Perpustakaan", kapasitas: 50, penanggungJawab: "Ibu Ratna Kumala", bangunan: "Gedung Perpustakaan & Sumber Belajar", lantai: "Lantai 1", panjang: 14, lebar: 10, luas: 140, tahunBangunan: 2016, kondisi: "Baik" },
  { id: "r5", kodeRuangan: "R-GURU", nama: "Ruang Guru & Tata Usaha", jenis: "Kantor", kapasitas: 60, penanggungJawab: "Bpk. Kepala Sekolah", bangunan: "Gedung Administrasi & Manajemen", lantai: "Lantai 1", panjang: 15, lebar: 10, luas: 150, tahunBangunan: 2014, kondisi: "Baik" },
  { id: "r6", kodeRuangan: "R-AULA", nama: "Aula Utama & Serbaguna", jenis: "Fasilitas Umum", kapasitas: 200, penanggungJawab: "Staf Sarpras", bangunan: "Gedung Serbaguna & Aula Utama", lantai: "Lantai 1", panjang: 20, lebar: 15, luas: 300, tahunBangunan: 2012, kondisi: "Baik" },
];

export const mockAssets: Asset[] = [
  // KIB A - Tanah
  { id: "a-kib-a-1", kodeBarang: "01.01.01.01.001", nomorRegister: "000001", nama: "Tanah Lapangan & Bangunan Kampus SMP", kategori: "Tanah (KIB A)", merk: "Hak Pakai Pemkab", bahan: "Tanah Darat", tahunPerolehan: 2005, kondisi: "Baik", ruanganId: "r6", harga: 450000000, luasTanah: 2850, letakAlamat: "Jl. Raya Kras No. 45", statusHak: "Hak Pakai No. 12", nomorSertifikat: "HP-3506/2005", penggunaan: "Kampus SMPN 3 Kras", sumberDana: "Pemerintah Pusat", asalUsul: "Pengadaan Pemda" },

  // KIB B - Peralatan & Mesin (BOS & Beli Mandiri)
  { id: "a1", kodeBarang: "02.06.02.01.21", nomorRegister: "000001 - 000100", nibar: "1202350601000000440000202202060201210000100", nama: "Meja Siswa Kelas VII", kategori: "Peralatan & Mesin (KIB B)", merk: "Custom Kayu Jati", bahan: "Kayu Jati", tahunPerolehan: 2022, kondisi: "Baik", ruanganId: "r1", harga: 350000, jumlah: 100, satuan: "Unit", kondisiBaik: 50, kondisiRusakRingan: 0, kondisiRusakBerat: 50, kondisiHilang: 0, kondisiTidakDiketahui: 0, sumberDana: "Mandiri / Kas Sekolah", asalUsul: "Beli Mandiri Kas Sekolah", catatan: "Total 100 unit meja: 50 unit kondisi Baik aktif di kelas, 50 unit kondisi Rusak Berat di gudang penampungan" },
  { id: "a2", kodeBarang: "02.06.02.01.22", nomorRegister: "000001 - 000080", nibar: "1202350601000000440000202302060201220000080", nama: "Kursi Siswa Besi", kategori: "Peralatan & Mesin (KIB B)", merk: "Chitose", bahan: "Besi/Plastik", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r1", harga: 275000, jumlah: 80, satuan: "Unit", kondisiBaik: 60, kondisiRusakRingan: 15, kondisiRusakBerat: 5, kondisiHilang: 0, kondisiTidakDiketahui: 0, sumberDana: "Komite Sekolah", asalUsul: "Beli Mandiri Komite Sekolah", catatan: "Total 80 unit kursi: 60 Baik, 15 Rusak Ringan, 5 Rusak Berat" },
  { id: "a3", kodeBarang: "02.06.02.06.03", nomorRegister: "000003", nibar: "1201350601000000440000202302060206030000003", nama: "Proyektor LCD Epson", kategori: "Peralatan & Mesin (KIB B)", merk: "Epson EB-E500", bahan: "Plastik/Logam", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r1", harga: 5800000, jumlah: 1, satuan: "Unit", kondisiBaik: 1, kondisiRusakRingan: 0, kondisiRusakBerat: 0, kondisiHilang: 0, kondisiTidakDiketahui: 0, sumberDana: "BOS Reguler", asalUsul: "Pembelian Dana BOS Reguler" },
  { id: "a4", kodeBarang: "02.06.03.02.01", nomorRegister: "000004", nibar: "1201350601000000440000202302060302010000004", nama: "PC Desktop All-in-One Core i5", kategori: "Peralatan & Mesin (KIB B)", merk: "Lenovo IdeaCentre", bahan: "Campuran", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r3", harga: 8500000, sumberDana: "BOS Kinerja", asalUsul: "BOS Kinerja Prestasi" },
  { id: "a5", kodeBarang: "02.06.03.02.02", nomorRegister: "000005", nibar: "1201350601000000440000202202060302020000005", nama: "PC Desktop Siswa Lab", kategori: "Peralatan & Mesin (KIB B)", merk: "HP ProDesk", bahan: "Campuran", tahunPerolehan: 2022, kondisi: "Baik", ruanganId: "r3", harga: 7200000, sumberDana: "BOS Reguler", asalUsul: "Dana BOS Reguler" },
  { id: "a6", kodeBarang: "02.06.02.04.04", nomorRegister: "000006", nibar: "1202350601000000440000202102060204040000006", nama: "AC Split 2 PK Daikin", kategori: "Peralatan & Mesin (KIB B)", merk: "Daikin Inverter", bahan: "Campuran", tahunPerolehan: 2021, kondisi: "Rusak Ringan", ruanganId: "r3", harga: 6000000, sumberDana: "Mandiri / Kas Sekolah", asalUsul: "Beli Mandiri Kas Sekolah", catatan: "Pengadaan mandiri kas sekolah tanpa dana BOS" },
  { id: "a7", kodeBarang: "02.06.03.04.12", nomorRegister: "000007", nibar: "1201350601000000440000202102060304120000007", nama: "Switch Hub Gigabit 24 Port", kategori: "Peralatan & Mesin (KIB B)", merk: "Cisco Catalyst", bahan: "Logam", tahunPerolehan: 2021, kondisi: "Baik", ruanganId: "r3", harga: 2400000, sumberDana: "BOS Reguler", asalUsul: "Dana BOS Reguler" },
  { id: "a10", kodeBarang: "02.06.03.03.01", nomorRegister: "000010", nibar: "1201350601000000440000202202060303010000010", nama: "Printer InkTank Multi", kategori: "Peralatan & Mesin (KIB B)", merk: "Epson L3210", bahan: "Plastik", tahunPerolehan: 2022, kondisi: "Rusak Ringan", ruanganId: "r5", harga: 2600000, sumberDana: "BOS Daerah (BOSDa)", asalUsul: "Dana BOSDa" },
  { id: "a11", kodeBarang: "02.06.02.05.05", nomorRegister: "000011", nibar: "1202350601000000440000202202060205050000011", nama: "Dispenser Galon Bawah", kategori: "Peralatan & Mesin (KIB B)", merk: "Miyako", bahan: "Plastik", tahunPerolehan: 2022, kondisi: "Baik", ruanganId: "r5", harga: 850000, sumberDana: "Mandiri / Kas Sekolah", asalUsul: "Beli Mandiri Sekolah" },

  // KIB C - Gedung & Bangunan
  { id: "a-kib-c-1", kodeBarang: "03.01.01.01.001", nomorRegister: "000001", nama: "Gedung Ruang Kelas Bertingkat (Blok A)", kategori: "Gedung & Bangunan (KIB C)", merk: "Konstruksi Beton Bertulang", bahan: "Beton/Bata", tahunPerolehan: 2015, kondisi: "Baik", ruanganId: "r1", harga: 320000000, luasLantai: 240, bertingkat: "Bertingkat", beton: "Beton", sumberDana: "Pemerintah Pusat", asalUsul: "DAK Fisik Pendidikan" },
  { id: "a-kib-c-2", kodeBarang: "03.01.01.01.002", nomorRegister: "000002", nama: "Gedung Laboratorium Komputer & Bahasa", kategori: "Gedung & Bangunan (KIB C)", merk: "Permanen", bahan: "Beton", tahunPerolehan: 2018, kondisi: "Baik", ruanganId: "r3", harga: 185000000, luasLantai: 120, bertingkat: "Tidak", beton: "Beton", sumberDana: "Pemerintah Pusat", asalUsul: "APBD Kabupaten" },
  { id: "a-kib-c-3", kodeBarang: "03.01.01.03.001", nomorRegister: "000003", nama: "Gazebo Belajar Taman Literasi", kategori: "Gedung & Bangunan (KIB C)", merk: "Kayu Kelapa & Genteng", bahan: "Kayu/Genteng", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r6", harga: 14500000, luasLantai: 16, bertingkat: "Tidak", beton: "Bukan", sumberDana: "Komite Sekolah", asalUsul: "Beli Mandiri Komite Sekolah", catatan: "Pembangunan mandiri swadana komite sekolah tanpa BOS" },

  // KIB D - Jalan, Irigasi & Jaringan
  { id: "a-kib-d-1", kodeBarang: "04.01.01.02.001", nomorRegister: "000001", nama: "Paving Jalan Akses Masuk & Lapangan Upacara", kategori: "Jalan, Irigasi & Jaringan (KIB D)", merk: "Paving K300", bahan: "Paving Block", tahunPerolehan: 2020, kondisi: "Baik", ruanganId: "r6", harga: 42000000, konstruksi: "Paving block 8cm", sumberDana: "Pemerintah Pusat", asalUsul: "Pengadaan APBD" },
  { id: "a-kib-d-2", kodeBarang: "04.03.01.01.001", nomorRegister: "000002", nama: "Jaringan Kabel LAN & Fiber Optic Sekolah", kategori: "Jalan, Irigasi & Jaringan (KIB D)", merk: "Cat6 Belden FO 1Gbps", bahan: "Kabel/FO", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r3", harga: 18500000, sumberDana: "BOS Reguler", asalUsul: "Belanja Modal BOS Reguler" },
  { id: "a-kib-d-3", kodeBarang: "04.02.01.01.001", nomorRegister: "000003", nama: "Instalasi Kanopi Parkir & Saluran Resapan", kategori: "Jalan, Irigasi & Jaringan (KIB D)", merk: "Baja Ringan Spandek", bahan: "Baja Ringan/Pipa", tahunPerolehan: 2022, kondisi: "Baik", ruanganId: "r6", harga: 9800000, sumberDana: "Mandiri / Kas Sekolah", asalUsul: "Beli Mandiri Sekolah", catatan: "Pembangunan swadana kas sekolah tanpa dana BOS" },

  // KIB E - Aset Tetap Lainnya
  { id: "a8", kodeBarang: "05.01.01.01.01", nomorRegister: "000008", nama: "Buku Paket Kurikulum Merdeka (Set Lengkap)", kategori: "Aset Tetap Lainnya (KIB E)", merk: "Kemdikbudristek", bahan: "Kertas", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r4", harga: 16500000, sumberDana: "BOS Reguler", asalUsul: "Belanja Buku BOS Reguler" },
  { id: "a-kib-e-2", kodeBarang: "05.02.01.03.001", nomorRegister: "000002", nama: "Alat Musik Gamelan Pelog Slendro", kategori: "Aset Tetap Lainnya (KIB E)", merk: "Pengrajin Solo", bahan: "Kuningan / Kayu", tahunPerolehan: 2021, kondisi: "Baik", ruanganId: "r6", harga: 38000000, sumberDana: "Komite Sekolah", asalUsul: "Beli Mandiri Komite Sekolah", catatan: "Swadana mandiri komite sekolah tanpa BOS" },
  { id: "a-kib-e-3", kodeBarang: "05.01.01.01.02", nomorRegister: "000009", nama: "Ensiklopedia Sains & Teknologi Bergambar", kategori: "Aset Tetap Lainnya (KIB E)", merk: "Tarsito Press", bahan: "Kertas Hardcover", tahunPerolehan: 2020, kondisi: "Rusak Ringan", ruanganId: "r4", harga: 3200000, sumberDana: "BOS Reguler", asalUsul: "Dana BOS Reguler" },

  // Lainnya & Ekstrakomptabel
  { id: "a-ekstra-1", kodeBarang: "07.01.01.01.001", nomorRegister: "000001", nama: "Lisensi Software CBT Ujian Sekolah", kategori: "Aset Tak Berwujud", merk: "EduCBT Server", bahan: "Digital License", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r3", harga: 4500000, sumberDana: "BOS Kinerja", asalUsul: "Dana BOS Kinerja" },
  { id: "a-ekstra-2", kodeBarang: "07.02.01.01.002", nomorRegister: "000002", nama: "Kipas Angin Dinding Cosmos (Ekstra)", kategori: "Ekstrakomptabel", merk: "Cosmos 16 Inch", bahan: "Plastik", tahunPerolehan: 2022, kondisi: "Baik", ruanganId: "r1", harga: 250000, sumberDana: "Mandiri / Kas Sekolah", asalUsul: "Beli Mandiri Sekolah", komptabel: "ekstra" },

  // Aset Kondisi Hilang & Tidak Diketahui (Audit Sensus & Pelaporan)
  { id: "a-hilang-1", kodeBarang: "02.06.03.02.05", nomorRegister: "000014", nibar: "1201350601000000440000202102060302050000014", nama: "Laptop Chromebook Pembelajaran Siswa", kategori: "Peralatan & Mesin (KIB B)", merk: "Asus Chromebook C214", bahan: "Campuran", tahunPerolehan: 2021, kondisi: "Hilang", ruanganId: "r3", harga: 5500000, sumberDana: "Pemerintah Pusat", asalUsul: "Bantuan DAK Fisik Kemendikbud", catatan: "Hilang saat peminjaman kegiatan lomba, dalam proses Berita Acara Pemeriksaan (BAP) Kehilangan & SKTJM" },
  { id: "a-unknown-1", kodeBarang: "05.02.02.01.01", nomorRegister: "000015", nibar: "1201350601000000440000201905020201010000015", nama: "Model Kerangka Manusia (Torso Biologi)", kategori: "Aset Tetap Lainnya (KIB E)", merk: "Pudak Scientific", bahan: "Fiberglass / PVC", tahunPerolehan: 2019, kondisi: "Tidak Diketahui", ruanganId: "r3", harga: 2100000, sumberDana: "BOS Reguler", asalUsul: "Dana BOS Reguler", catatan: "Fisik tidak ditemukan saat rekonsiliasi opname terakhir, status menunggu pelacakan fisik antar laboratorium" },
];

export const mockMaintenance: MaintenanceRecord[] = [
  { id: "m1", assetId: "a6", tanggalLapor: formatISO(subDays(new Date(), 5)), pelapor: "Bpk. Adi Gunawan", deskripsiKerusakan: "AC kurang dingin, sudah 1 minggu tidak terasa anginnya.", status: "Proses Perbaikan", teknisi: "Pak Marno (Teknisi Luar)", biayaEstimasi: 150000 },
  { id: "m2", assetId: "a8", tanggalLapor: formatISO(subDays(new Date(), 30)), pelapor: "Ibu Ratna Kumala", deskripsiKerusakan: "Sampul lepas dan beberapa halaman inti hilang.", status: "Dibatalkan", catatan: "Buku ditarik dari peredaran, ganti baru." } as any,
  { id: "m3", assetId: "a10", tanggalLapor: formatISO(subDays(new Date(), 2)), pelapor: "Ibu Nurul", deskripsiKerusakan: "Hasil print warna hitam putus-putus. Sudah dicoba cleaning tetap sama.", status: "Menunggu" },
];

export const mockConsumables: Consumable[] = [
  { id: "c1", nama: "Kertas HVS A4 80gr", kategori: "ATK & Kertas", stokSisa: 12, satuan: "Rim", batasMinimum: 5 },
  { id: "c2", nama: "Tinta Printer Epson 003 Hitam", kategori: "ATK & Tinta", stokSisa: 2, satuan: "Botol", batasMinimum: 5 },
  { id: "c3", nama: "Spidol Papan Tulis Snowman", kategori: "ATK", stokSisa: 45, satuan: "Pcs", batasMinimum: 20 },
  { id: "c4", nama: "Cairan Pembersih Lantai", kategori: "Kebersihan", stokSisa: 15, satuan: "Botol", batasMinimum: 10 },
];

export const mockBorrowings: Borrowing[] = [
  { id: "b1", assetId: "a3", peminjam: "Bpk. Andi (Guru IPA)", tanggalPinjam: formatISO(subDays(new Date(), 2)), status: "Dipinjam" },
  { id: "b2", assetId: "a7", peminjam: "Staf TU", tanggalPinjam: formatISO(subDays(new Date(), 5)), tanggalKembali: formatISO(subDays(new Date(), 4)), status: "Dikembalikan" },
];

export const mockProcurements: Procurement[] = [
  { id: "p1", namaItem: "Laptop Guru", jumlah: 5, estimasiHarga: 40000000, tanggalPengajuan: formatISO(subDays(new Date(), 15)), status: "Disetujui", sumberDana: "BOS Reguler" },
  { id: "p2", namaItem: "Meja & Kursi Siswa", jumlah: 40, estimasiHarga: 16000000, tanggalPengajuan: formatISO(subDays(new Date(), 3)), status: "Pengajuan", sumberDana: "Yayasan" },
];

export const mockMutations: Mutation[] = [
  { id: "mu1", assetId: "a4", dariRuanganId: "r3", keRuanganId: "r5", tanggalMutasi: formatISO(subDays(new Date(), 10)), alasan: "Pemindahan sementara untuk staf TU", status: "Selesai" },
];

export const mockStocktakes: Stocktake[] = [
  { id: "s1", tanggal: formatISO(subDays(new Date(), 90)), penanggungJawab: "Tim Audit Sarpras", totalAsetDiperiksa: 150, asetSesuai: 148, asetSelisih: 2, status: "Selesai" },
  { id: "s2", tanggal: formatISO(new Date()), penanggungJawab: "Waka Sarpras", totalAsetDiperiksa: 50, asetSesuai: 50, asetSelisih: 0, status: "Berlangsung" },
];

export const mockDisposals: Disposal[] = [
  { id: "d1", assetId: "a8", jumlah: 15, nomorSurat: "421.3/084/SMPN3/DISP/2025", tanggalPengajuan: formatISO(subDays(new Date(), 10)), metode: "Pemusnahan", alasan: "Buku paket kurikulum lama hancur, basah, dan sobek akibat rembesan air", penanggungJawab: "Ibu Ratna Kumala (Kepala Perpustakaan)", status: "Diajukan" },
  { id: "d2", assetId: "a6", jumlah: 1, nomorSurat: "421.3/085/SMPN3/DISP/2025", tanggalPengajuan: formatISO(subDays(new Date(), 25)), metode: "Pemusnahan", alasan: "Kompresor AC terbakar dan bocor freon parah, biaya reparasi melebihi harga beli baru", penanggungJawab: "Staf Sarpras", status: "Disetujui" },
];

export const mockSchoolMap: SchoolMapElement[] = [
  {
    id: "map-gerbang",
    nama: "Gerbang Utama & Pos Keamanan",
    kode: "POS-01",
    tipe: "gerbang",
    lantai: 1,
    x: 42,
    y: 88,
    width: 16,
    height: 10,
    warna: "#64748b",
    keterangan: "Akses gerbang masuk/keluar utama dan pos satpam",
    kapasitas: 4
  },
  {
    id: "map-parkir",
    nama: "Area Parkir Guru & Tamu",
    kode: "PKR-01",
    tipe: "fasilitas",
    lantai: 1,
    x: 4,
    y: 78,
    width: 32,
    height: 18,
    warna: "#94a3b8",
    keterangan: "Kapasitas 40 motor dan 8 mobil guru/karyawan",
    kapasitas: 48
  },
  {
    id: "map-taman",
    nama: "Taman Literasi & Gazebo",
    kode: "TMN-01",
    tipe: "taman",
    lantai: 1,
    x: 64,
    y: 78,
    width: 32,
    height: 18,
    warna: "#10b981",
    keterangan: "Gazebo kayu & area baca santai siswa",
    kapasitas: 25
  },
  {
    id: "map-lapangan",
    nama: "Lapangan Upacara & Olahraga",
    kode: "LAP-01",
    tipe: "lapangan",
    lantai: 1,
    x: 36,
    y: 34,
    width: 28,
    height: 48,
    warna: "#0284c7",
    keterangan: "Lapangan basket, voli, dan upacara bendera",
    kapasitas: 500
  },
  {
    id: "map-r5-guru",
    nama: "Ruang Guru & Tata Usaha",
    kode: "R-GURU",
    tipe: "ruangan",
    ruanganId: "r5",
    bangunan: "Gedung Administrasi & Manajemen",
    lantai: 1,
    x: 4,
    y: 48,
    width: 28,
    height: 26,
    warna: "#0369a1",
    keterangan: "Pusat tata usaha, ruang kepala sekolah, dan guru",
    kapasitas: 60
  },
  {
    id: "map-r1-kelas7a",
    nama: "Ruang Kelas VII-A",
    kode: "R-VII-A",
    tipe: "ruangan",
    ruanganId: "r1",
    bangunan: "Gedung Ruang Kelas Bertingkat (Blok A)",
    lantai: 1,
    x: 4,
    y: 18,
    width: 28,
    height: 26,
    warna: "#2563eb",
    keterangan: "Ruang pembelajaran kelas VII-A (Lantai 1)",
    kapasitas: 32
  },
  {
    id: "map-r2-kelas7b",
    nama: "Ruang Kelas VII-B",
    kode: "R-VII-B",
    tipe: "ruangan",
    ruanganId: "r2",
    bangunan: "Gedung Ruang Kelas Bertingkat (Blok A)",
    lantai: 2,
    x: 4,
    y: 18,
    width: 28,
    height: 26,
    warna: "#4f46e5",
    keterangan: "Ruang pembelajaran kelas VII-B (Lantai 2)",
    kapasitas: 32
  },
  {
    id: "map-r3-lab",
    nama: "Laboratorium Komputer",
    kode: "R-LAB-KOM",
    tipe: "ruangan",
    ruanganId: "r3",
    bangunan: "Gedung Laboratorium Komputer & Bahasa",
    lantai: 1,
    x: 36,
    y: 8,
    width: 28,
    height: 22,
    warna: "#7c3aed",
    keterangan: "Laboratorium CBT dan komputer multimedia",
    kapasitas: 40
  },
  {
    id: "map-r4-perpus",
    nama: "Perpustakaan Pusat",
    kode: "R-PERPUS",
    tipe: "ruangan",
    ruanganId: "r4",
    bangunan: "Gedung Perpustakaan & Sumber Belajar",
    lantai: 1,
    x: 68,
    y: 8,
    width: 28,
    height: 26,
    warna: "#d97706",
    keterangan: "Pusat sumber belajar, buku teks & digital",
    kapasitas: 50
  },
  {
    id: "map-r6-aula",
    nama: "Aula Utama & Serbaguna",
    kode: "R-AULA",
    tipe: "ruangan",
    ruanganId: "r6",
    bangunan: "Gedung Serbaguna & Aula Utama",
    lantai: 1,
    x: 68,
    y: 38,
    width: 28,
    height: 36,
    warna: "#db2777",
    keterangan: "Gedung serbaguna untuk pertemuan dan seni budaya",
    kapasitas: 200
  }
];

