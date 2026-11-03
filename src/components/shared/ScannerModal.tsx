import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ScanLine, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';

export function ScannerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [errorSearch, setErrorSearch] = useState(false);
  const { assets } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      setManualCode('');
      setErrorSearch(false);
    }
  }, [isOpen]);

  const handleManualSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!manualCode.trim()) return;

    setScanning(false);
    
    // Simulate search
    setTimeout(() => {
      const found = assets.find(a => 
        a.kodeBarang.toLowerCase() === manualCode.toLowerCase() || 
        a.nama.toLowerCase().includes(manualCode.toLowerCase())
      );
      
      if (found) {
        onClose();
        navigate(`/assets?q=${encodeURIComponent(found.kodeBarang)}`);
      } else {
        setErrorSearch(true);
        setScanning(true);
      }
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary-600" />
              Scanner Aset
            </h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="relative mb-6">
              <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center shadow-inner">
                {scanning ? (
                  <>
                    {/* Scanner Guide UI */}
                    <div className="absolute inset-8 border-2 border-dashed border-primary-400 rounded-xl opacity-50 z-10" />
                    
                    {/* Scanning Line Animation */}
                    <motion.div 
                      className="absolute left-8 right-8 h-0.5 bg-primary-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-20"
                      animate={{ top: ['20%', '80%', '20%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <ScanLine className="h-24 w-24 text-slate-300 dark:text-slate-700" />
                    <p className="absolute bottom-4 text-xs font-semibold text-primary-600 animate-pulse bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full">
                      Mencari QR / Barcode...
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-700">Memproses aset...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <span className="text-sm text-slate-700 font-medium">atau masukkan manual</span>
            </div>

            <form onSubmit={handleManualSearch} className="relative">
              <input
                type="text"
                placeholder="Ketikan Kode Barang / Nama..."
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setErrorSearch(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 focus:border-primary-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-primary-500/20"
              >
                <Search className="h-4 w-4" />
                Cari
              </button>
            </form>
            
            <AnimatePresence>
              {errorSearch && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-rose-500 text-sm mt-3 font-medium flex items-center gap-2 justify-center"
                >
                  <X className="h-4 w-4" /> Aset tidak ditemukan. Coba kode lain.
                </motion.p>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
