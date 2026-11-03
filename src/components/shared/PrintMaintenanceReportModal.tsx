import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface PrintMaintenanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  asset: any;
}

export function PrintMaintenanceReportModal({ isOpen, onClose, record, asset }: PrintMaintenanceReportModalProps) {
  const { schoolProfile } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  const [nomorSurat, setNomorSurat] = useState('');

  useEffect(() => {
    if (record) {
      setNomorSurat(`${String(record.id).replace(/\D/g, '').padStart(3, '0') || '001'} / BAP-PM / SMP / ${new Date(record.tanggalLapor).getFullYear()}`);
    }
  }, [record]);

  if (!isOpen || !record || !asset) return null;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak Laporan Pemeliharaan - ${record.id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                font-family: 'Times New Roman', Times, serif; 
                margin: 0;
                padding: 0;
                background: white;
              }
              @media print {
                @page { size: A4 portrait; margin: 20mm; }
                body { -webkit-print-color-adjust: exact; }
              }
              table th, table td { border-color: #000 !important; }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 20px;">
              ${content}
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 1200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const kepsekName = schoolProfile?.kepalaSekolah || "..........................";
  const kepsekNip = "NIP. " + (schoolProfile?.nipKepsek || "..........................");
  const operatorName = schoolProfile?.operator || "..........................";
  const operatorNip = "NIP. " + (schoolProfile?.nipOperator || "..........................");

  const currentLogo = schoolProfile?.logoDinas;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">
            Cetak Surat Laporan Pemeliharaan
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-200 flex flex-col items-center">
          <div className="w-full max-w-[210mm] p-4 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Surat (Dapat diubah)</label>
              <input 
                type="text" 
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </Button>
          </div>
          <div className="bg-white shadow-md my-4" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
            <div ref={printRef} style={{ width: '100%', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', fontSize: '12px' }}>
              <div className="text-center border-b-[3px] border-double border-black pb-3 mb-5" style={{ position: 'relative', minHeight: '80px' }}>
                {currentLogo && (
                  <img src={currentLogo} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', position: 'absolute', left: 0, top: 0 }} />
                )}
                <div>
                  <h3 className="m-0 text-[14pt] font-bold uppercase">{schoolProfile.kementerian || 'KEMENTERIAN PENDIDIKAN'}</h3>
                  <h2 className="mt-[2px] mb-1.5 text-[16pt] font-bold uppercase">{schoolProfile.nama}</h2>
                  <p className="m-0 text-[11pt]">{schoolProfile.alamat} {schoolProfile.kodePos}</p>
                  <p className="m-0 text-[11pt] mb-1">Telp: {schoolProfile.telepon} | Email: {schoolProfile.email} | Website: {schoolProfile.website}</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="m-0 text-[12pt] font-bold uppercase underline">SURAT LAPORAN PEMELIHARAAN BARANG / ASET</h2>
                <p className="m-0 text-[11pt] mt-1">Nomor: {nomorSurat}</p>
              </div>
              
              <p className="mb-4 text-justify leading-relaxed">
                Pada hari ini, <strong>{currentDate}</strong>, telah dibuat laporan kerusakan/pemeliharaan barang dan aset dengan rincian sebagai berikut:
              </p>

              <div className="mb-6">
                <table className="w-full text-xs" cellPadding={4}>
                  <tbody>
                    <tr><td className="w-1/3 py-1 font-bold">I. IDENTITAS ASET</td><td className="w-4 text-center"></td><td></td></tr>
                    <tr><td className="py-1">NIBAR (44 Digit)</td><td className="text-center">:</td><td className="font-mono font-bold">{asset?.nibar || asset?.nomorRegister || '-'}</td></tr>
                    <tr><td className="py-1">Kode Barang</td><td className="text-center">:</td><td className="font-mono">{asset?.kodeBarang || '-'}</td></tr>
                    <tr><td className="py-1">Nama Barang</td><td className="text-center">:</td><td className="font-bold">{asset?.nama || '-'}</td></tr>
                    <tr><td className="py-1">No. Register</td><td className="text-center">:</td><td className="font-mono">{asset?.nomorRegister || '-'}</td></tr>
                    <tr><td className="py-1">Merk / Tipe</td><td className="text-center">:</td><td>{asset?.merk || '-'}</td></tr>
                    <tr><td className="py-1">Lokasi Ruangan</td><td className="text-center">:</td><td>{asset?.ruanganId || '-'}</td></tr>
                    <tr><td className="py-1">Sumber Dana</td><td className="text-center">:</td><td>{asset?.sumberDana || 'BOS'}</td></tr>
                    
                    <tr><td colSpan={3} className="py-2"></td></tr>
                    
                    <tr><td className="py-1 font-bold">II. DETAIL LAPORAN KERUSAKAN</td><td className="text-center"></td><td></td></tr>
                    <tr><td className="py-1">No. Tiket</td><td className="text-center">:</td><td>#{record?.id?.substring(0, 8)}</td></tr>
                    <tr><td className="py-1">Tanggal Laporan</td><td className="text-center">:</td><td>{new Date(record?.tanggalLapor).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                    <tr><td className="py-1">Dilaporkan Oleh</td><td className="text-center">:</td><td>{record?.pelapor || '-'}</td></tr>
                    <tr><td className="py-1">Prioritas Perbaikan</td><td className="text-center">:</td><td className="capitalize">{record?.prioritas || '-'}</td></tr>
                    <tr><td className="py-1 align-top">Deskripsi Kerusakan</td><td className="text-center align-top">:</td><td className="align-top"><div className="border border-black p-2 min-h-[60px]">{record?.deskripsiKerusakan || '-'}</div></td></tr>

                    <tr><td colSpan={3} className="py-2"></td></tr>

                    <tr><td className="py-1 font-bold">III. TINDAK LANJUT (DIISI OLEH TEKNISI)</td><td className="text-center"></td><td></td></tr>
                    <tr><td className="py-1">Nama Teknisi / Bengkel</td><td className="text-center">:</td><td>{record?.teknisi || '.......................................................'}</td></tr>
                    <tr><td className="py-1">Status Perbaikan</td><td className="text-center">:</td><td>{record?.status || '.......................................................'}</td></tr>
                    <tr><td className="py-1">Estimasi Biaya</td><td className="text-center">:</td><td>{record?.biayaEstimasi ? `Rp ${record.biayaEstimasi.toLocaleString('id-ID')}` : '.......................................................'}</td></tr>
                    <tr><td className="py-1 align-top">Catatan Perbaikan / Saran</td><td className="text-center align-top">:</td><td className="align-top"><div className="border border-black p-2 min-h-[60px]">{record?.catatanTeknisi || ''}</div></td></tr>
                  </tbody>
                </table>
              </div>

              <p className="mb-8 text-justify leading-relaxed">
                Surat Laporan Pemeliharaan ini menjadi dasar untuk tindakan perbaikan atau penggantian selanjutnya sesuai dengan prosedur yang berlaku di {schoolProfile.nama}.
              </p>

              <div className="flex justify-between mt-8 text-xs">
                <div className="text-center w-[45%]">
                  <p className="mb-16">Pelapor,</p>
                  <p className="font-bold underline mb-0">
                    {record?.pelapor || '(..............................)'}
                  </p>
                  <p className="mt-1">NIP. .......................</p>
                </div>
                <div className="text-center w-[45%]">
                  <p className="mb-16">Pengurus Barang / Teknisi,</p>
                  <p className="font-bold underline mb-0">
                    {record?.teknisi || operatorName}
                  </p>
                  <p className="mt-1">{record?.teknisi ? "NIP. ......................." : operatorNip}</p>
                </div>
              </div>
              
              <div className="text-center mt-8 text-xs">
                <p className="mb-16">Mengetahui,<br/>Kepala Sekolah</p>
                <p className="font-bold underline mb-0">{kepsekName}</p>
                <p className="mt-1">{kepsekNip}</p>
              </div>

            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-300 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Cetak Laporan
          </Button>
        </div>
      </div>
    </div>
  );
}
