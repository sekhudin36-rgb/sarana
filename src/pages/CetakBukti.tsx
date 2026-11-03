import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Package } from 'lucide-react';

export default function CetakBukti() {
  const { id } = useParams();
  const { borrowings, assets, schoolProfile } = useData();
  const navigate = useNavigate();

  const borrow = borrowings.find(b => b.id === id);
  const asset = borrow ? assets.find(a => a.id === borrow.assetId) : null;

  useEffect(() => {
    if (borrow) {
      // Set document title for PDF saving name
      const originalTitle = document.title;
      document.title = `Surat_Pengajuan_Peminjaman_${borrow.peminjam.replace(/\s+/g, '_')}`;
      
      // Tunggu render selesai baru memanggil print
      let printed = false;
      const timer = setTimeout(() => {
        if (!printed) {
          printed = true;
          window.print();
        }
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        document.title = originalTitle;
      };
    }
  }, [borrow]);

  if (!borrow) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-50 flex items-center justify-center flex-col">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Data Pengajuan Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-6">Mungkin ID pengajuan salah atau data telah dihapus.</p>
          <button onClick={() => navigate('/portal-peminjaman')} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl shadow-sm hover:bg-primary-700 transition-all">Kembali ke Portal</button>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  const tglPinjam = new Date(borrow.tanggalPinjam).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  const tglKembali = borrow.rencanaTanggalKembali ? new Date(borrow.rencanaTanggalKembali).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-";

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 1.5cm 2cm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div className="bg-white min-h-screen text-slate-900 font-serif p-8 print:p-0 max-w-4xl mx-auto text-[12pt] leading-relaxed">
        {/* Header Kop Surat */}
        <div className="flex items-center justify-between mb-2">
          {/* Logo Kiri */}
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
            {schoolProfile.logoDinas ? (
              <img src={schoolProfile.logoDinas} alt="Logo Dinas" className="max-w-full max-h-full object-contain" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-slate-800" fill="currentColor">
                <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M40 50 L60 50 M50 40 L50 60" stroke="currentColor" strokeWidth="3"/>
              </svg>
            )}
          </div>
          
          {/* Teks Tengah */}
          <div className="flex-1 text-center px-4">
            <h1 className="text-xl font-bold uppercase tracking-wide text-black leading-tight">Pemerintah Daerah</h1>
            <h2 className="text-lg font-bold uppercase tracking-wide text-black leading-tight">{schoolProfile.kementerian}</h2>
            <h1 className="text-2xl font-black uppercase tracking-widest text-black mt-1 mb-1">{schoolProfile.nama}</h1>
            <p className="text-sm text-black">{schoolProfile.alamat}, Kode Pos: {schoolProfile.kodePos}</p>
            <p className="text-xs text-black mt-0.5">Website: {schoolProfile.website} | Email: {schoolProfile.email} | Telp: {schoolProfile.telepon}</p>
          </div>

          {/* Logo Kanan */}
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
            {schoolProfile.logoSekolah ? (
              <img src={schoolProfile.logoSekolah} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-slate-800" fill="currentColor">
                <path d="M10 50 C 10 20, 90 20, 90 50 C 90 80, 10 80, 10 50 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M30 45 L50 25 L70 45" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M40 75 L50 55 L60 75" fill="none" stroke="currentColor" strokeWidth="3"/>
              </svg>
            )}
          </div>
        </div>
        
        {/* Garis Bawah Kop (Garis Ganda) */}
        <div className="border-b-[4px] border-black mb-1"></div>
        <div className="border-b-[1px] border-black mb-6"></div>

        {/* Tanggal & Tujuan */}
        <div className="flex justify-between mb-8 text-black">
          <div>
            <table className="text-black">
              <tbody>
                <tr><td className="pr-4 align-top">Nomor</td><td className="pr-2">:</td><td>{borrow.id.substring(0,8).toUpperCase()}/INV/{new Date().getFullYear()}</td></tr>
                <tr><td className="pr-4 align-top">Lampiran</td><td className="pr-2">:</td><td>-</td></tr>
                <tr><td className="pr-4 align-top">Perihal</td><td className="pr-2">:</td><td className="font-bold">Permohonan Peminjaman Barang/Aset</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <p>Kota Belajar, {currentDate}</p>
          </div>
        </div>

        <div className="mb-6 text-black">
          <p>Kepada Yth.,</p>
          <p className="font-bold">Kepala Urusan Sarana dan Prasarana / Petugas Inventaris</p>
          <p>SMP Negeri 1 Belajar</p>
          <p>di Tempat</p>
        </div>

        <div className="mb-6 text-black text-justify">
          <p className="mb-4">Dengan hormat,</p>
          <p className="mb-4">Yang bertanda tangan di bawah ini:</p>
          
          <table className="w-full mb-4 ml-8 text-black">
            <tbody>
              <tr><td className="w-48 py-1 align-top">Nama Lengkap</td><td className="w-4 align-top">:</td><td className="font-bold">{borrow.peminjam}</td></tr>
              <tr><td className="py-1 align-top">NIP / NIS / NISN</td><td className="align-top">:</td><td>{borrow.nipPeminjam || '-'}</td></tr>
              <tr><td className="py-1 align-top">Jabatan / Status</td><td className="align-top">:</td><td>{borrow.jabatan || '-'}</td></tr>
              <tr><td className="py-1 align-top">Unit Kerja / Kelas</td><td className="align-top">:</td><td>{borrow.unitKerja}</td></tr>
              <tr><td className="py-1 align-top">Alamat Lengkap</td><td className="align-top">:</td><td>{borrow.alamat || '-'}</td></tr>
              <tr><td className="py-1 align-top">Nomor HP/WA</td><td className="align-top">:</td><td>{borrow.kontakPeminjam}</td></tr>
            </tbody>
          </table>

          <p className="mb-4">Bermaksud untuk mengajukan permohonan peminjaman barang inventaris sekolah dengan rincian sebagai berikut:</p>
          
          <table className="w-full mb-4 text-sm border-collapse border border-black text-black">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent">
                <th className="border border-black px-4 py-2 text-center font-bold w-12">No</th>
                <th className="border border-black px-4 py-2 text-left font-bold">Nama Barang</th>
                <th className="border border-black px-4 py-2 text-center font-bold">Kode Barang</th>
                <th className="border border-black px-4 py-2 text-center font-bold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-4 py-2 text-center">1</td>
                <td className="border border-black px-4 py-2">{asset ? asset.nama : 'Aset tidak ditemukan'}</td>
                <td className="border border-black px-4 py-2 text-center">{asset ? asset.kodeBarang : '-'}</td>
                <td className="border border-black px-4 py-2 text-center">{borrow.jumlah || 1} unit</td>
              </tr>
            </tbody>
          </table>

          <p className="mb-4 leading-relaxed">
            Barang tersebut akan dipergunakan untuk keperluan <strong>{borrow.keperluan}</strong>, 
            dan akan ditempatkan/digunakan di lokasi <strong>{borrow.lokasiPenggunaan || '-'}</strong>. 
            Direncanakan akan dipinjam selama <strong>{borrow.durasi ? `${borrow.durasi} hari` : '-'}</strong>, 
            mulai tanggal <strong>{tglPinjam}</strong> sampai dengan tanggal <strong>{tglKembali}</strong>.
            {borrow.penanggungJawab && (
              <span> Penanggung jawab atas kegiatan/penggunaan ini adalah <strong>{borrow.penanggungJawab}</strong>.</span>
            )}
          </p>

          <p className="mb-4">
            Saya berjanji akan menjaga, merawat, dan mengembalikan barang tersebut sesuai dengan waktu yang telah disepakati dan dalam kondisi yang sama seperti saat dipinjam.
          </p>

          <p>Demikian surat permohonan ini saya buat dengan sebenar-benarnya. Atas perhatian dan izin yang diberikan, saya ucapkan terima kasih.</p>
        </div>
        
        <div className="flex justify-between mt-12 text-black text-center">
          <div className="w-64">
            <p className="mb-24">Mengetahui/Menyetujui,<br/>Petugas Inventaris</p>
            <p className="font-bold underline underline-offset-2">( ........................................ )</p>
            <p className="mt-1">NIP.</p>
          </div>
          <div className="w-64">
            <p className="mb-24"><br/>Pemohon,</p>
            <p className="font-bold underline underline-offset-2">( {borrow.peminjam} )</p>
            <p className="mt-1">{borrow.nipPeminjam ? `NIP/NIS. ${borrow.nipPeminjam}` : 'NIP/NIS. ............................'}</p>
          </div>
        </div>
        
        <div className="mt-12 flex gap-4 no-print justify-center border-t border-slate-200 pt-8 font-sans">
           <button onClick={() => window.print()} className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2">
             Cetak / Simpan PDF
           </button>
           <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-all border border-slate-200">
             Kembali
           </button>
        </div>
      </div>
    </>
  );
}
