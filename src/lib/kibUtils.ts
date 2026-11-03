import { Asset, AssetCategory } from "../types";

export type FundingFilterType = "semua" | "bos" | "mandiri" | "lainnya";

export interface KibCategoryMeta {
  code: string; // e.g. "KIB A"
  name: string; // e.g. "Tanah"
  category: AssetCategory;
  deskripsi: string;
  iconName: string;
}

export const ALL_KIB_DEFINITIONS: KibCategoryMeta[] = [
  {
    code: "KIB A",
    name: "Tanah",
    category: "Tanah (KIB A)",
    deskripsi: "Tanah bangunan, halaman, lapangan, kebun sekolah",
    iconName: "MapPin"
  },
  {
    code: "KIB B",
    name: "Peralatan & Mesin",
    category: "Peralatan & Mesin (KIB B)",
    deskripsi: "Komputer, printer, mesin, kendaraan, mebel, elektronik",
    iconName: "Package"
  },
  {
    code: "KIB C",
    name: "Gedung & Bangunan",
    category: "Gedung & Bangunan (KIB C)",
    deskripsi: "Gedung kelas, kantor, lab, perpustakaan, aula, toilet",
    iconName: "Building2"
  },
  {
    code: "KIB D",
    name: "Jalan, Irigasi & Jaringan",
    category: "Jalan, Irigasi & Jaringan (KIB D)",
    deskripsi: "Paving jalan, saluran drainase, jaringan pipa & internet/listrik",
    iconName: "Route"
  },
  {
    code: "KIB E",
    name: "Aset Tetap Lainnya",
    category: "Aset Tetap Lainnya (KIB E)",
    deskripsi: "Buku perpustakaan, alat peraga, kesenian, hewan/tanaman",
    iconName: "BookOpen"
  },
  {
    code: "Lainnya",
    name: "Aset Tak Berwujud & Ekstra",
    category: "Ekstrakomptabel",
    deskripsi: "Software/lisensi, aset ekstrakomptabel, dan aset tak berwujud",
    iconName: "Layers"
  }
];

/**
 * Memeriksa apakah suatu aset didanai melalui Dana BOS (BOS Reguler, Kinerja, Afirmasi, BOSDa).
 */
export function isDanaBos(asset: Asset): boolean {
  if (!asset) return false;
  const sumber = (asset.sumberDana || "").toLowerCase();
  const asal = (asset.asalUsul || "").toLowerCase();
  const catatan = (asset.catatan || "").toLowerCase();
  const ket = (asset.keterangan || "").toLowerCase();

  return (
    sumber.includes("bos") ||
    asal.includes("bos") ||
    catatan.includes("dana bos") ||
    ket.includes("dana bos") ||
    catatan.includes("bos reguler") ||
    ket.includes("bos reguler") ||
    catatan.includes("bosda") ||
    ket.includes("bosda")
  );
}

/**
 * Memeriksa apakah suatu aset merupakan Beli Mandiri Sekolah Tanpa Dana BOS
 * (Kas Sekolah, Komite Sekolah, Swadana Sekolah, Iuran/Tabungan, Usaha Sekolah, Yayasan).
 */
export function isBeliMandiri(asset: Asset): boolean {
  if (!asset) return false;
  // Jika sudah termasuk BOS, maka bukan mandiri tanpa BOS
  if (isDanaBos(asset)) return false;

  const sumber = (asset.sumberDana || "").toLowerCase();
  const asal = (asset.asalUsul || "").toLowerCase();
  const catatan = (asset.catatan || "").toLowerCase();
  const ket = (asset.keterangan || "").toLowerCase();

  const mandiriKeywords = [
    "mandiri",
    "kas sekolah",
    "komite",
    "swadana",
    "swadaya",
    "yayasan",
    "iuran",
    "beli sendiri",
    "tanpa bos",
    "usaha sekolah",
    "internal sekolah",
    "koperasi sekolah"
  ];

  return mandiriKeywords.some(
    kw => sumber.includes(kw) || asal.includes(kw) || catatan.includes(kw) || ket.includes(kw)
  );
}

/**
 * Memeriksa apakah suatu aset dari sumber lainnya (Pemerintah Pusat, APBD, Hibah Eksternal, dll).
 */
export function isSumberLainnya(asset: Asset): boolean {
  return !isDanaBos(asset) && !isBeliMandiri(asset);
}

/**
 * Label sumber dana yang mudah dipahami
 */
export function getFundingBadgeInfo(asset: Asset): { label: string; badgeClass: string; type: "bos" | "mandiri" | "lainnya" } {
  if (isDanaBos(asset)) {
    return {
      label: asset.sumberDana && asset.sumberDana.toLowerCase().includes("bos") ? asset.sumberDana : "Dana BOS",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      type: "bos"
    };
  }
  if (isBeliMandiri(asset)) {
    const label = asset.sumberDana || asset.asalUsul || "Mandiri Sekolah (Non-BOS)";
    return {
      label: label.includes("Komite") ? "Komite Sekolah" : label.includes("Kas") ? "Kas Sekolah (Mandiri)" : "Beli Mandiri Sekolah",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
      type: "mandiri"
    };
  }
  return {
    label: asset.sumberDana || asset.asalUsul || "Pemerintah / Lainnya",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    type: "lainnya"
  };
}

/**
 * Memfilter daftar aset berdasarkan filter sumber dana
 */
export function filterAssetsByFunding(assets: Asset[], filter: FundingFilterType): Asset[] {
  if (!assets) return [];
  if (filter === "semua") return assets;
  if (filter === "bos") return assets.filter(isDanaBos);
  if (filter === "mandiri") return assets.filter(isBeliMandiri);
  if (filter === "lainnya") return assets.filter(isSumberLainnya);
  return assets;
}

export interface KibSummaryItem {
  code: string;
  name: string;
  category: AssetCategory;
  deskripsi: string;
  iconName: string;
  count: number;
  totalValue: number;
  countBaik: number;
  countRusak: number;
  countBos: number;
  valBos: number;
  countMandiri: number;
  valMandiri: number;
  countLainnya: number;
  valLainnya: number;
}

export interface KibGrandSummary {
  items: KibSummaryItem[];
  totalCount: number;
  totalValue: number;
  totalBosCount: number;
  totalBosValue: number;
  totalMandiriCount: number;
  totalMandiriValue: number;
  totalLainnyaCount: number;
  totalLainnyaValue: number;
  totalBaikCount: number;
  totalRusakCount: number;
}

/**
 * Menghitung rekapitulasi seluruh KIB beserta jumlah barang, nilai, dan rincian BOS vs Beli Mandiri.
 */
export function calculateKibSummary(assets: Asset[], activeFundingFilter: FundingFilterType = "semua"): KibGrandSummary {
  const safeAssets = assets || [];

  // Hitung summary per KIB
  const items: KibSummaryItem[] = ALL_KIB_DEFINITIONS.map(def => {
    // Cari aset yang masuk dalam kategori ini
    const kibAssets = safeAssets.filter(a => {
      if (def.code === "Lainnya") {
        return (
          a.kategori === "Aset Tak Berwujud" ||
          a.kategori === "Ekstrakomptabel" ||
          (a.komptabel && String(a.komptabel).toLowerCase().includes("ekstra")) ||
          (!a.kategori.includes("KIB") && a.kategori !== "Tanah (KIB A)")
        );
      }
      return a.kategori === def.category || (a.kategori && a.kategori.includes(def.code));
    });

    // Breakdown per sumber dana
    const bosAssets = kibAssets.filter(isDanaBos);
    const mandiriAssets = kibAssets.filter(isBeliMandiri);
    const lainnyaAssets = kibAssets.filter(isSumberLainnya);

    const valBos = bosAssets.reduce((sum, a) => sum + (Number(a.harga) || 0), 0);
    const valMandiri = mandiriAssets.reduce((sum, a) => sum + (Number(a.harga) || 0), 0);
    const valLainnya = lainnyaAssets.reduce((sum, a) => sum + (Number(a.harga) || 0), 0);

    // Filter aset sesuai active funding filter untuk tampilan nilai & jumlah aktif
    let filteredKibAssets = kibAssets;
    if (activeFundingFilter === "bos") filteredKibAssets = bosAssets;
    else if (activeFundingFilter === "mandiri") filteredKibAssets = mandiriAssets;
    else if (activeFundingFilter === "lainnya") filteredKibAssets = lainnyaAssets;

    const count = filteredKibAssets.length;
    const totalValue = filteredKibAssets.reduce((sum, a) => sum + (Number(a.harga) || 0), 0);
    const countBaik = filteredKibAssets.filter(a => a.kondisi === "Baik").length;
    const countRusak = filteredKibAssets.filter(a => a.kondisi !== "Baik").length;

    return {
      code: def.code,
      name: def.name,
      category: def.category,
      deskripsi: def.deskripsi,
      iconName: def.iconName,
      count,
      totalValue,
      countBaik,
      countRusak,
      countBos: bosAssets.length,
      valBos,
      countMandiri: mandiriAssets.length,
      valMandiri,
      countLainnya: lainnyaAssets.length,
      valLainnya
    };
  });

  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);

  const totalBosCount = items.reduce((sum, item) => sum + item.countBos, 0);
  const totalBosValue = items.reduce((sum, item) => sum + item.valBos, 0);

  const totalMandiriCount = items.reduce((sum, item) => sum + item.countMandiri, 0);
  const totalMandiriValue = items.reduce((sum, item) => sum + item.valMandiri, 0);

  const totalLainnyaCount = items.reduce((sum, item) => sum + item.countLainnya, 0);
  const totalLainnyaValue = items.reduce((sum, item) => sum + item.valLainnya, 0);

  const totalBaikCount = items.reduce((sum, item) => sum + item.countBaik, 0);
  const totalRusakCount = items.reduce((sum, item) => sum + item.countRusak, 0);

  return {
    items,
    totalCount,
    totalValue,
    totalBosCount,
    totalBosValue,
    totalMandiriCount,
    totalMandiriValue,
    totalLainnyaCount,
    totalLainnyaValue,
    totalBaikCount,
    totalRusakCount
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount || 0);
}
