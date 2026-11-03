import React, { useState } from 'react';
import { Asset, Room, getAssetConditionBreakdown } from '../../types';
import { Button } from '../ui/Button';
import { Printer, QrCode, Grid, List, ChevronDown } from 'lucide-react';
import { printHtml } from '../../lib/printUtils';
import { useData } from '../../contexts/DataContext';
import { PrintBarcodesModal } from './PrintBarcodesModal';
import { PrintSchoolLabelsModal } from './PrintSchoolLabelsModal';
import { BarcodeDisplay } from './BarcodeDisplay';

interface RoomAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  assets: Asset[];
}

export function RoomAssetsModal({ isOpen, onClose, room, assets }: RoomAssetsModalProps) {
  const { schoolProfile } = useData();
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
  const [isPrintSchoolLabelsOpen, setIsPrintSchoolLabelsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  if (!isOpen || !room) return null;

  const handlePrintKIR = () => {
    let tbody = '';
    let grandTotal = 0;
    
    if (assets.length === 0) {
      tbody = '<tr><td colspan="9" style="text-align: center; padding: 10px;">Tidak ada aset di ruangan ini.</td></tr>';
    } else {
      // Group assets
      const groupedAssets: Record<string, any> = {};
      assets.forEach(a => {
        const bd = getAssetConditionBreakdown(a);
        const key = `${a.kodeBarang}_${a.nama}_${a.merk}_${a.tahunPerolehan}`;
        if (!groupedAssets[key]) {
          groupedAssets[key] = {
            ...a,
            jumlah: 0,
            kondisiBaik: 0,
            kondisiRusakRingan: 0,
            kondisiRusakBerat: 0,
            kondisiHilang: 0,
            satuan: bd.satuan,
            totalHarga: 0,
            registers: []
          };
        }
        groupedAssets[key].jumlah += bd.total;
        groupedAssets[key].kondisiBaik += bd.baik;
        groupedAssets[key].kondisiRusakRingan += bd.rusakRingan;
        groupedAssets[key].kondisiRusakBerat += bd.rusakBerat;
        groupedAssets[key].kondisiHilang += bd.hilang;
        groupedAssets[key].totalHarga += (a.harga * bd.total);
        if (a.nomorRegister) groupedAssets[key].registers.push(a.nomorRegister);
      });

      const groupedArray = Object.values(groupedAssets);

      groupedArray.forEach((a, i) => {
        grandTotal += a.totalHarga;
        // Format registers to avoid too long strings if many
        let regDisplay = '';
        if (a.registers.length > 3) {
          regDisplay = `${a.registers[0]}, ..., ${a.registers[a.registers.length - 1]}`;
        } else {
          regDisplay = a.registers.join(', ') || a.nomorRegister || '-';
        }

        const conditionParts: string[] = [];
        if (a.kondisiBaik > 0) conditionParts.push(`${a.kondisiBaik} Baik`);
        if (a.kondisiRusakRingan > 0) conditionParts.push(`${a.kondisiRusakRingan} Rusak Ringan`);
        if (a.kondisiRusakBerat > 0) conditionParts.push(`${a.kondisiRusakBerat} Rusak Berat`);
        if (a.kondisiHilang > 0) conditionParts.push(`${a.kondisiHilang} Hilang`);
        const kondisiDisplay = conditionParts.length > 0 ? conditionParts.join(', ') : (a.kondisi || 'Baik');

        tbody += `
          <tr>
            <td style="text-align: center; padding: 6px;">${i + 1}</td>
            <td style="padding: 6px;">${a.kodeBarang}</td>
            <td style="padding: 6px;">${a.nama}</td>
            <td style="padding: 6px;">${regDisplay}</td>
            <td style="padding: 6px;">${a.merk || '-'}</td>
            <td style="padding: 6px;">${a.tahunPerolehan}</td>
            <td style="padding: 6px;">${kondisiDisplay}</td>
            <td style="text-align: right; padding: 6px;">${a.jumlah} ${a.satuan || 'Unit'}</td>
            <td style="text-align: right; padding: 6px;">Rp${a.totalHarga.toLocaleString('id-ID')}</td>
          </tr>
        `;
      });
      tbody += `
        <tr>
          <td colspan="8" style="text-align: right; font-weight: bold; border-right: none; padding: 6px;">Total Nilai Aset</td>
          <td style="text-align: right; font-weight: bold; padding: 6px;">Rp${grandTotal.toLocaleString('id-ID')}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <div style="margin-bottom: 15px; display: flex; justify-content: space-between; font-size: 13px;">
        <table style="width: 420px; border: none; margin: 0;">
          <tr><td style="border: none; padding: 2px; width: 130px;">Nama Ruangan</td><td style="border: none; padding: 2px;">: <strong>${room.nama}</strong></td></tr>
          <tr><td style="border: none; padding: 2px;">Kode Ruangan</td><td style="border: none; padding: 2px;">: ${room.kodeRuangan}</td></tr>
          <tr><td style="border: none; padding: 2px;">Bangunan / Gedung</td><td style="border: none; padding: 2px;">: <strong>${room.bangunan || '-'}</strong> ${room.lantai ? `(${room.lantai})` : ''}</td></tr>
          <tr><td style="border: none; padding: 2px;">Jenis Ruangan</td><td style="border: none; padding: 2px;">: ${room.jenis}</td></tr>
        </table>
        <table style="width: 320px; border: none; margin: 0;">
          <tr><td style="border: none; padding: 2px; width: 130px;">Tahun Bangunan</td><td style="border: none; padding: 2px;">: ${room.tahunBangunan || '-'}</td></tr>
          <tr><td style="border: none; padding: 2px;">Dimensi / Luas</td><td style="border: none; padding: 2px;">: ${room.panjang || 0}m × ${room.lebar || 0}m (${room.luas || 0} m²)</td></tr>
          <tr><td style="border: none; padding: 2px;">Penanggung Jawab</td><td style="border: none; padding: 2px;">: ${room.penanggungJawab}</td></tr>
          <tr><td style="border: none; padding: 2px;">NIP</td><td style="border: none; padding: 2px;">: ${room.nipPenanggungJawab || '-'}</td></tr>
        </table>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;" border="1">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #000;">No</th>
            <th style="padding: 8px; border: 1px solid #000;">Kode Barang</th>
            <th style="padding: 8px; border: 1px solid #000;">Nama Barang</th>
            <th style="padding: 8px; border: 1px solid #000;">No. Reg</th>
            <th style="padding: 8px; border: 1px solid #000;">Merk/Tipe</th>
            <th style="padding: 8px; border: 1px solid #000;">Tahun</th>
            <th style="padding: 8px; border: 1px solid #000;">Kondisi Fisik</th>
            <th style="padding: 8px; border: 1px solid #000;">Jumlah Fisik</th>
            <th style="padding: 8px; border: 1px solid #000;">Total Harga</th>
          </tr>
        </thead>
        <tbody>
          ${tbody}
        </tbody>
      </table>
    `;

    printHtml(htmlContent, schoolProfile, "KARTU INVENTARIS RUANGAN (KIR)");
  };

  const groupedAssets: Record<string, any> = {};
  assets.forEach(a => {
    const bd = getAssetConditionBreakdown(a);
    const key = `${a.kodeBarang}_${a.nama}_${a.merk}_${a.tahunPerolehan}`;
    if (!groupedAssets[key]) {
      groupedAssets[key] = {
        ...a,
        jumlah: 0,
        kondisiBaik: 0,
        kondisiRusakRingan: 0,
        kondisiRusakBerat: 0,
        kondisiHilang: 0,
        satuan: bd.satuan,
        totalHarga: 0,
        registers: []
      };
    }
    groupedAssets[key].jumlah += bd.total;
    groupedAssets[key].kondisiBaik += bd.baik;
    groupedAssets[key].kondisiRusakRingan += bd.rusakRingan;
    groupedAssets[key].kondisiRusakBerat += bd.rusakBerat;
    groupedAssets[key].kondisiHilang += bd.hilang;
    groupedAssets[key].totalHarga += (a.harga * bd.total);
    if (a.nomorRegister) groupedAssets[key].registers.push(a.nomorRegister);
  });

  const groupedArray = Object.values(groupedAssets);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Detail Aset Ruangan</h3>
            <p className="text-sm text-slate-700">KIR - {room.nama}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="bg-white" onClick={handlePrintKIR}>
              <Printer className="w-4 h-4 mr-2 text-slate-700" />
              Cetak Dokumen KIR
            </Button>
            <div className="relative group">
              <Button variant="outline" className="bg-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-700" />
                <span>Cetak Label</span>
                <ChevronDown className="w-3 h-3 text-slate-700" />
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-300 shadow-lg rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-1">
                <button 
                  onClick={() => setIsPrintLabelsOpen(true)}
                  className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full border-b border-slate-300"
                >
                  Label QR Code
                </button>
                <button 
                  onClick={() => setIsPrintSchoolLabelsOpen(true)}
                  className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full"
                >
                  Label Identitas Sekolah
                </button>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors ml-4"
              title="Keluar"
            >
              Keluar
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
              <p className="text-xs text-slate-700 mb-1">Kode Ruangan</p>
              <p className="font-semibold text-slate-900">{room.kodeRuangan}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
              <p className="text-xs text-slate-700 mb-1">Jenis / P.Jawab</p>
              <p className="font-semibold text-slate-900">{room.jenis}</p>
              <p className="text-xs text-slate-700 mt-1">{room.penanggungJawab}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
              <p className="text-xs text-slate-700 mb-1">Bangunan / Gedung</p>
              <p className="font-semibold text-slate-900 truncate" title={room.bangunan || '-'}>{room.bangunan || 'Belum diisi'}</p>
              <p className="text-xs text-primary-700 font-medium mt-1">{room.lantai || 'Lantai 1'} • Thn {room.tahunBangunan || '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
              <p className="text-xs text-slate-700 mb-1">Dimensi (P/L)</p>
              <p className="font-semibold text-slate-900">{room.panjang || 0}m / {room.lebar || 0}m</p>
              <p className="text-xs text-slate-700 mt-1">Luas: {room.luas || 0}m²</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm hidden lg:block">
               <p className="text-xs text-slate-700 mb-1">Kapasitas</p>
               <p className="font-semibold text-slate-900">{room.kapasitas} Orang</p>
               <p className="text-xs text-slate-700 mt-1">Kondisi: {room.kondisi || '-'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-slate-900">Daftar Aset ({groupedArray.length} items)</h4>
            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-primary-600" : "text-slate-600 hover:text-slate-700"}`}
                title="Tampilan Tabel"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-primary-600" : "text-slate-600 hover:text-slate-700"}`}
                title="Tampilan Grid"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {viewMode === "list" ? (
          <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">No</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">Kode Barang</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">Nama Barang</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">No Reg</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">Merk/Tipe</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">Tahun</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Jumlah Fisik</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">Rincian Kondisi</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Total Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedArray.length > 0 ? (
                    groupedArray.map((asset, index) => {
                      let regDisplay = '';
                      if (asset.registers.length > 3) {
                        regDisplay = `${asset.registers[0]}, ..., ${asset.registers[asset.registers.length - 1]}`;
                      } else {
                        regDisplay = asset.registers.join(', ') || asset.nomorRegister || '-';
                      }
                      
                      return (
                      <tr key={asset.id || index} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-700">{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-primary-700">{asset.kodeBarang}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{asset.nama}</td>
                        <td className="py-3 px-4 text-slate-700">{regDisplay}</td>
                        <td className="py-3 px-4 text-slate-700">{asset.merk || '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{asset.tahunPerolehan}</td>
                        <td className="py-3 px-4 text-slate-900 font-semibold text-right">{asset.jumlah} {asset.satuan || 'Unit'}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {asset.kondisiBaik > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                {asset.kondisiBaik} Baik
                              </span>
                            )}
                            {asset.kondisiRusakRingan > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                                {asset.kondisiRusakRingan} RR
                              </span>
                            )}
                            {asset.kondisiRusakBerat > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                                {asset.kondisiRusakBerat} RB
                              </span>
                            )}
                            {asset.kondisiHilang > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
                                {asset.kondisiHilang} Hilang
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium text-right">Rp{asset.totalHarga.toLocaleString('id-ID')}</td>
                      </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-700">
                        Tidak ada aset di ruangan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupedArray.length > 0 ? (
                groupedArray.map((asset, index) => {
                  let regDisplay = '';
                  if (asset.registers.length > 3) {
                    regDisplay = `${asset.registers[0]}, ..., ${asset.registers[asset.registers.length - 1]}`;
                  } else {
                    regDisplay = asset.registers.join(', ') || asset.nomorRegister || '-';
                  }
                  
                  return (
                     <div key={asset.id || index} className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md">
                       <div className="flex justify-between items-start gap-4">
                         <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 truncate" title={asset.nama}>{asset.nama}</div>
                            <div className="text-xs font-mono text-slate-700 mt-1">{asset.kodeBarang}</div>
                         </div>
                         <div className="bg-primary-50 text-primary-700 text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap shrink-0">{asset.jumlah} {asset.satuan || 'Unit'}</div>
                       </div>

                       <div className="flex flex-wrap gap-1.5 pt-1">
                          {asset.kondisiBaik > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                              {asset.kondisiBaik} Baik
                            </span>
                          )}
                          {asset.kondisiRusakRingan > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              {asset.kondisiRusakRingan} Rusak Ringan
                            </span>
                          )}
                          {asset.kondisiRusakBerat > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                              {asset.kondisiRusakBerat} Rusak Berat
                            </span>
                          )}
                          {asset.kondisiHilang > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                              {asset.kondisiHilang} Hilang
                            </span>
                          )}
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 text-sm mt-1 pt-3 border-t border-slate-300">
                         <div>
                           <p className="text-xs text-slate-600 mb-0.5">No. Register</p>
                           <p className="font-medium text-slate-700 truncate" title={regDisplay}>{regDisplay}</p>
                         </div>
                         <div>
                           <p className="text-xs text-slate-600 mb-0.5">Merk/Tipe</p>
                           <p className="font-medium text-slate-700 truncate" title={asset.merk || '-'}>{asset.merk || '-'}</p>
                         </div>
                         <div>
                           <p className="text-xs text-slate-600 mb-0.5">Tahun</p>
                           <p className="font-medium text-slate-700">{asset.tahunPerolehan}</p>
                         </div>
                         <div>
                           <p className="text-xs text-slate-600 mb-0.5">Total Harga</p>
                           <p className="font-medium text-slate-700 truncate" title={`Rp${asset.totalHarga.toLocaleString('id-ID')}`}>Rp{asset.totalHarga.toLocaleString('id-ID')}</p>
                         </div>
                       </div>
                     </div>
                  );
                })
              ) : (
                 <div className="col-span-full py-12 text-center text-slate-700 bg-white border border-slate-300 rounded-xl">
                    Tidak ada aset di ruangan ini.
                 </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-300 bg-slate-50 flex justify-end shrink-0">
          <Button type="button" variant="outline" className="bg-white text-slate-700" onClick={onClose}>Keluar</Button>
        </div>
      </div>
      
      <PrintBarcodesModal 
        isOpen={isPrintLabelsOpen} 
        onClose={() => setIsPrintLabelsOpen(false)} 
        assets={assets} 
        roomName={room.nama}
      />
      <PrintSchoolLabelsModal
        isOpen={isPrintSchoolLabelsOpen}
        onClose={() => setIsPrintSchoolLabelsOpen(false)}
        assets={assets}
        roomName={room.nama}
      />
    </div>
  );
}
