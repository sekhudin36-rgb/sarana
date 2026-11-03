import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Asset } from '../../types';

interface SchoolLabelDisplayProps {
  asset: Asset;
  roomName?: string;
}

export function SchoolLabelDisplay({ asset, roomName }: SchoolLabelDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { schoolProfile } = useData();

  if (!asset) return null;

  return (
    <div className="flex flex-col relative group h-full">
      <div 
        ref={containerRef} 
        className="flex flex-col bg-white border border-slate-800 w-full p-2.5 h-full gap-2 rounded-md"
        style={{ width: '100%', minHeight: '180px' }}
      >
        {/* Header Label */}
        <div className="flex items-center pb-2.5 border-b border-slate-800">
          {(schoolProfile?.logoSekolah || (schoolProfile as any)?.logo) ? (
            <img src={schoolProfile?.logoSekolah || (schoolProfile as any)?.logo} alt="Logo" className="w-10 h-10 object-contain mr-3" />
          ) : (
            <div className="w-10 h-10 bg-slate-100 border border-slate-300 rounded mr-3 flex items-center justify-center text-[8px] text-slate-500 text-center leading-tight">
              NO<br/>LOGO
            </div>
          )}
          <div className="flex flex-col flex-1 justify-center align-middle">
             <div className="text-[11px] sm:text-xs font-bold font-sans text-left text-slate-900 tracking-wide uppercase leading-tight">
               INVENTARIS BARANG
             </div>
             <div className="text-[10px] sm:text-[11px] font-bold font-sans text-left text-slate-700 uppercase leading-snug">
               {schoolProfile?.nama || "NAMA SEKOLAH"}
             </div>
          </div>
        </div>

        {/* Content Label */}
        <div className="flex flex-1 gap-3 items-stretch">
           <div className="flex-1 flex flex-col justify-start text-[10px] sm:text-[11px] gap-1.5 pt-1 text-slate-900 leading-tight">
             <div className="grid grid-cols-[60px_10px_1fr] items-start">
               <span className="font-semibold text-slate-700">Kode</span>
               <span>:</span>
               <span className="font-mono font-medium">{asset.kodeBarang}</span>
             </div>
             <div className="grid grid-cols-[60px_10px_1fr] items-start">
               <span className="font-semibold text-slate-700">No. Reg</span>
               <span>:</span>
               <span className="font-mono font-medium">{asset.nomorRegister || '-'}</span>
             </div>
             {asset.nibar && (
               <div className="grid grid-cols-[60px_10px_1fr] items-start">
                 <span className="font-semibold text-slate-700">NIBAR</span>
                 <span>:</span>
                 <span className="font-mono text-[9px] font-bold text-sky-900 break-all leading-tight">{asset.nibar}</span>
               </div>
             )}
             <div className="grid grid-cols-[60px_10px_1fr] items-start">
               <span className="font-semibold text-slate-700">Nama</span>
               <span>:</span>
               <span className="font-medium line-clamp-2" title={asset.nama}>{asset.nama}</span>
             </div>
             <div className="grid grid-cols-[60px_10px_1fr] items-start">
               <span className="font-semibold text-slate-700">Tahun</span>
               <span>:</span>
               <span className="font-medium">{asset.tahunPerolehan}</span>
             </div>
             {roomName && (
               <div className="grid grid-cols-[60px_10px_1fr] items-start mt-auto pt-1">
                 <span className="font-semibold text-slate-700">Ruangan</span>
                 <span>:</span>
                 <span className="font-medium line-clamp-1" title={roomName}>{roomName}</span>
               </div>
             )}
           </div>
           
           <div className="w-[72px] flex flex-col items-center justify-center shrink-0 border border-slate-300 p-1.5 rounded bg-slate-50 self-start mt-1">
             <QRCode value={asset.nibar || asset.kodeBarang || 'NA'} size={60} className="w-full h-auto object-contain" />
           </div>
        </div>
      </div>
    </div>
  );
}
