import React, { useState, useRef, useMemo, useEffect } from "react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../contexts/ToastContext";
import { SchoolMapElement, Room } from "../types";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { FormModal } from "../components/shared/FormModal";
import { RoomAssetsModal } from "../components/shared/RoomAssetsModal";
import { printHtml } from "../lib/printUtils";
import { 
  Map, Move, ZoomIn, ZoomOut, RotateCcw, Printer, Plus, 
  Trash2, Edit, Check, X, DoorClosed, Building2, Trees, 
  Flag, Car, Shield, Compass, Sparkles, Layers, Maximize2, 
  Eye, LayoutGrid, ChevronRight, Info, AlertCircle, ArrowUpRight
} from "lucide-react";

export default function SchoolMap() {
  const { schoolMap, setSchoolMap, resetSchoolMapToDefault, rooms, assets, schoolProfile } = useData();
  const toast = useToast();

  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Inspector drawer / modal
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectedElement, setInspectedElement] = useState<SchoolMapElement | null>(null);
  const [isRoomAssetsModalOpen, setIsRoomAssetsModalOpen] = useState<boolean>(false);
  const [inspectedRoomId, setInspectedRoomId] = useState<string | null>(null);

  // Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // Zoom / View controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [gridSnap, setGridSnap] = useState<boolean>(true);

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragElementId, setDragElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeElementId, setResizeElementId] = useState<string | null>(null);

  // Filter elements by floor
  const displayedElements = useMemo(() => {
    if (selectedFloor === "all") return schoolMap;
    return schoolMap.filter(el => el.lantai === selectedFloor);
  }, [schoolMap, selectedFloor]);

  // Unmapped rooms (rooms that have not yet been placed on the denah)
  const unmappedRooms = useMemo(() => {
    const mappedRoomIds = new Set(schoolMap.map(el => el.ruanganId).filter(Boolean));
    return rooms.filter(r => !mappedRoomIds.has(r.id));
  }, [rooms, schoolMap]);

  // Total summary of mapped facilities
  const mapStats = useMemo(() => {
    const totalFacilities = schoolMap.length;
    const mappedRoomsCount = schoolMap.filter(e => e.tipe === "ruangan").length;
    
    // Find all assets in mapped rooms
    const mappedRoomIds = schoolMap.map(e => e.ruanganId).filter(Boolean) as string[];
    const assetsInMap = assets.filter(a => a.ruanganId && mappedRoomIds.some(id => a.ruanganId?.includes(id)));
    const totalAssetsValue = assetsInMap.reduce((sum, a) => sum + (a.harga || 0), 0);

    return { totalFacilities, mappedRoomsCount, totalAssetsInMap: assetsInMap.length, totalAssetsValue };
  }, [schoolMap, assets]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const el = schoolMap.find(item => item.id === id);
    if (!el) return;

    // Element pixel positions
    const elLeftPx = (el.x / 100) * rect.width;
    const elTopPx = (el.y / 100) * rect.height;

    setIsDragging(true);
    setDragElementId(id);
    setSelectedElementId(id);
    setDragOffset({
      x: e.clientX - elLeftPx,
      y: e.clientY - elTopPx
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeElementId(id);
    setSelectedElementId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDragging && dragElementId) {
      let newX = ((e.clientX - dragOffset.x) / rect.width) * 100;
      let newY = ((e.clientY - dragOffset.y) / rect.height) * 100;

      // Bound checks
      const el = schoolMap.find(item => item.id === dragElementId);
      const w = el?.width || 10;
      const h = el?.height || 10;

      newX = Math.max(0, Math.min(100 - w, newX));
      newY = Math.max(0, Math.min(100 - h, newY));

      if (gridSnap) {
        newX = Math.round(newX / 2) * 2;
        newY = Math.round(newY / 2) * 2;
      }

      setSchoolMap(prev => prev.map(item => {
        if (item.id === dragElementId) {
          return { ...item, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
        }
        return item;
      }));
    } else if (isResizing && resizeElementId) {
      const el = schoolMap.find(item => item.id === resizeElementId);
      if (!el) return;

      const elLeftPx = (el.x / 100) * rect.width;
      const elTopPx = (el.y / 100) * rect.height;

      let newWidth = ((e.clientX - elLeftPx) / rect.width) * 100;
      let newHeight = ((e.clientY - elTopPx) / rect.height) * 100;

      newWidth = Math.max(4, Math.min(100 - el.x, newWidth));
      newHeight = Math.max(4, Math.min(100 - el.y, newHeight));

      if (gridSnap) {
        newWidth = Math.round(newWidth / 2) * 2;
        newHeight = Math.round(newHeight / 2) * 2;
      }

      setSchoolMap(prev => prev.map(item => {
        if (item.id === resizeElementId) {
          return { ...item, width: Math.round(newWidth * 10) / 10, height: Math.round(newHeight * 10) / 10 };
        }
        return item;
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setDragElementId(null);
      setIsResizing(false);
      setResizeElementId(null);
    }
  };

  // Click on an element
  const handleElementClick = (e: React.MouseEvent, el: SchoolMapElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    setInspectedElement(el);
    setIsInspectorOpen(true);
  };

  // Add a new element to the map
  const openAddModal = (presetRoom?: Room) => {
    setEditingElementId(null);
    if (presetRoom) {
      // Find default building / floor
      const roomFloor = presetRoom.lantai?.toLowerCase().includes("2") ? 2 : 1;
      setFormValues({
        nama: presetRoom.nama,
        kode: presetRoom.kodeRuangan,
        tipe: "ruangan",
        ruanganId: presetRoom.id,
        bangunan: presetRoom.bangunan || "Gedung Utama",
        lantai: roomFloor,
        warna: "#2563eb",
        keterangan: `Ruangan pembelajaran ${presetRoom.nama} (${presetRoom.jenis})`,
        kapasitas: presetRoom.kapasitas || 32,
        width: 26,
        height: 22,
        x: 10,
        y: 10
      });
    } else {
      setFormValues({
        nama: "",
        kode: "",
        tipe: "ruangan",
        ruanganId: "",
        bangunan: "Gedung Utama",
        lantai: selectedFloor === 2 ? 2 : 1,
        warna: "#2563eb",
        keterangan: "",
        kapasitas: 30,
        width: 24,
        height: 20,
        x: 20,
        y: 20
      });
    }
    setIsFormModalOpen(true);
  };

  const openEditModal = (el: SchoolMapElement) => {
    setEditingElementId(el.id);
    setFormValues({
      nama: el.nama,
      kode: el.kode || "",
      tipe: el.tipe,
      ruanganId: el.ruanganId || "",
      bangunan: el.bangunan || "",
      lantai: el.lantai,
      warna: el.warna || "#2563eb",
      keterangan: el.keterangan || "",
      kapasitas: el.kapasitas || 0,
      width: el.width,
      height: el.height,
      x: el.x,
      y: el.y
    });
    setIsFormModalOpen(true);
  };

  const [formValues, setFormValues] = useState<{
    nama: string;
    kode: string;
    tipe: "ruangan" | "gedung" | "lapangan" | "taman" | "fasilitas" | "gerbang";
    ruanganId: string;
    bangunan: string;
    lantai: number;
    warna: string;
    keterangan: string;
    kapasitas: number;
    width: number;
    height: number;
    x: number;
    y: number;
  }>({
    nama: "",
    kode: "",
    tipe: "ruangan",
    ruanganId: "",
    bangunan: "Gedung Utama",
    lantai: 1,
    warna: "#2563eb",
    keterangan: "",
    kapasitas: 30,
    width: 24,
    height: 20,
    x: 20,
    y: 20
  });

  const handleRoomSelectChange = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const roomFloor = room.lantai?.toLowerCase().includes("2") ? 2 : 1;
      setFormValues(prev => ({
        ...prev,
        ruanganId: room.id,
        nama: room.nama,
        kode: room.kodeRuangan,
        bangunan: room.bangunan || prev.bangunan,
        lantai: roomFloor,
        kapasitas: room.kapasitas || 32,
        warna: room.jenis === "Laboratorium" ? "#7c3aed" : room.jenis === "Perpustakaan" ? "#d97706" : room.jenis === "Kantor" ? "#0369a1" : "#2563eb"
      }));
    } else {
      setFormValues(prev => ({ ...prev, ruanganId: "" }));
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.nama.trim()) {
      toast("Nama elemen denah wajib diisi", "error");
      return;
    }

    if (editingElementId) {
      setSchoolMap(prev => prev.map(item => {
        if (item.id === editingElementId) {
          return {
            ...item,
            ...formValues,
            ruanganId: formValues.ruanganId || undefined
          };
        }
        return item;
      }));
      toast("Elemen denah berhasil diperbarui", "success");
    } else {
      const newEl: SchoolMapElement = {
        id: `map-${Date.now()}`,
        ...formValues,
        ruanganId: formValues.ruanganId || undefined
      };
      setSchoolMap(prev => [...prev, newEl]);
      toast("Elemen baru berhasil ditambahkan ke denah", "success");
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteElement = (id: string, name: string) => {
    setSchoolMap(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
    if (inspectedElement?.id === id) setIsInspectorOpen(false);
    toast(`Elemen "${name}" berhasil dihapus dari denah`, "info");
  };

  // Cetak Dokumen Denah Sekolah
  const handlePrintMap = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 10px;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h2 style="margin: 0; text-transform: uppercase;">DENAH & TATA RUANG FASILITAS SEKOLAH</h2>
          <h3 style="margin: 4px 0 0 0; color: #1e293b;">${schoolProfile.nama || "SMP NEGERI 3 KRAS"}</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${schoolProfile.alamat || "Kabupaten Kediri, Jawa Timur"} | Tahun Ajaran 2025/2026</p>
        </div>

        <div style="margin-bottom: 16px; font-size: 12px; display: flex; justify-content: space-between;">
          <div><strong>Tingkat Lantai:</strong> ${selectedFloor === "all" ? "Seluruh Kompleks Kampus (Lantai 1 & 2)" : `Lantai ${selectedFloor}`}</div>
          <div><strong>Total Elemen:</strong> ${displayedElements.length} Fasilitas / Ruangan</div>
          <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <!-- Visual Mini Representation -->
        <div style="position: relative; width: 100%; height: 480px; border: 2px solid #334155; background: #f8fafc; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
          ${displayedElements.map(el => `
            <div style="
              position: absolute;
              left: ${el.x}%;
              top: ${el.y}%;
              width: ${el.width}%;
              height: ${el.height}%;
              background: ${el.warna || '#3b82f6'};
              color: white;
              border: 1px solid rgba(0,0,0,0.25);
              border-radius: 4px;
              padding: 4px;
              box-sizing: border-box;
              font-size: 10px;
              overflow: hidden;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            ">
              <strong style="display: block; font-size: 11px; line-height: 1.1;">${el.nama}</strong>
              <span style="font-size: 9px; opacity: 0.9;">${el.kode || ''} ${el.lantai > 1 ? `(Lt. ${el.lantai})` : ''}</span>
            </div>
          `).join('')}
        </div>

        <!-- Tabel Rekapitulasi Denah -->
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">Tabel Daftar Ruang & Fasilitas Terpetakan</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;" border="1" cellpadding="6">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="width: 35px; text-align: center;">No</th>
              <th>Kode</th>
              <th>Nama Ruangan / Fasilitas</th>
              <th>Tipe</th>
              <th>Gedung Induk</th>
              <th>Lantai</th>
              <th>Kapasitas</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${displayedElements.map((el, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td style="font-family: monospace; font-weight: bold;">${el.kode || '-'}</td>
                <td><strong>${el.nama}</strong></td>
                <td>${el.tipe.toUpperCase()}</td>
                <td>${el.bangunan || '-'}</td>
                <td style="text-align: center;">Lantai ${el.lantai}</td>
                <td style="text-align: center;">${el.kapasitas ? `${el.kapasitas} Orang` : '-'}</td>
                <td>${el.keterangan || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Tanda Tangan -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; page-break-inside: avoid;">
          <div style="text-align: center; width: 220px;">
            <p style="margin-bottom: 60px;">Mengetahui,<br/>Kepala ${schoolProfile.nama || "SMPN 3 Kras"}</p>
            <p><strong><u>${schoolProfile.kepalaSekolah || "Drs. H. Purnomo, M.Pd"}</u></strong><br/>NIP. ${schoolProfile.nipKepsek || "19720512 199802 1 002"}</p>
          </div>
          <div style="text-align: center; width: 220px;">
            <p style="margin-bottom: 60px;">Kras, ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pengurus Barang / Sarpras</p>
            <p><strong><u>${schoolProfile.operator || "Budi Santoso, S.Kom"}</u></strong><br/>NIP. ${schoolProfile.nipOperator || "19850614 201101 1 007"}</p>
          </div>
        </div>
      </div>
    `;

    printHtml(printContent, schoolProfile, "DENAH TATA RUANG FASILITAS SEKOLAH");
  };

  const getTipeIcon = (tipe: SchoolMapElement["tipe"]) => {
    switch (tipe) {
      case "ruangan": return <DoorClosed className="w-3.5 h-3.5" />;
      case "gedung": return <Building2 className="w-3.5 h-3.5" />;
      case "lapangan": return <Flag className="w-3.5 h-3.5" />;
      case "taman": return <Trees className="w-3.5 h-3.5" />;
      case "fasilitas": return <Car className="w-3.5 h-3.5" />;
      case "gerbang": return <Shield className="w-3.5 h-3.5" />;
      default: return <LayoutGrid className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Denah & Tata Ruang Sekolah</h2>
            <span className="bg-primary-100 text-primary-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary-600" />
              Interaktif & Edit Drag-Drop
            </span>
          </div>
          <p className="text-slate-700 text-sm mt-0.5">
            Pemetaan visual tata letak gedung, ruang kelas, laboratorium, dan fasilitas sekolah terhubung dengan KIR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => {
              setIsEditMode(!isEditMode);
              if (!isEditMode) {
                toast("Mode Edit Denah diaktifkan: Geser kotak untuk memindahkan posisi, tarik sudut kanan-bawah untuk mengubah ukuran.", "info");
              } else {
                toast("Mode Lihat Denah diaktifkan.", "info");
              }
            }}
            className="flex items-center gap-2 font-semibold"
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Selesai Mengedit</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>Edit Denah</span>
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handlePrintMap} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Cetak Denah</span>
          </Button>

          {isEditMode && (
            <>
              <Button onClick={() => openAddModal()} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Tambah Elemen</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={resetSchoolMapToDefault} 
                title="Kembalikan denah ke tata letak awal"
                className="text-slate-600 hover:text-rose-600"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Standar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 text-primary-600 rounded-lg">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Terpetakan</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{mapStats.totalFacilities} Fasilitas</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DoorClosed className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Ruangan Terpetakan</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">
              {mapStats.mappedRoomsCount} / {rooms.length} Ruang
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Aset di Area Denah</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{mapStats.totalAssetsInMap} Item</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Estimasi Nilai Aset</p>
            <p className="text-base sm:text-lg font-bold text-blue-700 truncate max-w-[150px]">
              Rp {mapStats.totalAssetsValue.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Floor & Canvas Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Floor Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Tingkat:
          </span>
          <button
            onClick={() => setSelectedFloor("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFloor === "all"
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua Lantai (Master Plan)
          </button>
          <button
            onClick={() => setSelectedFloor(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFloor === 1
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Lantai 1 & Lapangan
          </button>
          <button
            onClick={() => setSelectedFloor(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFloor === 2
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Lantai 2 (Gedung Bertingkat)
          </button>
        </div>

        {/* Zoom & Editing Helper */}
        <div className="flex items-center gap-2 justify-end">
          {isEditMode && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mr-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gridSnap}
                onChange={(e) => setGridSnap(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
              />
              Snap Grid (2%)
            </label>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setZoomLevel(prev => Math.max(70, prev - 15))}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-semibold px-1 text-slate-700">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-1.5 py-0.5 hover:bg-white rounded text-[10px] text-slate-500 font-medium"
              title="Reset Zoom"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas Display (3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-2xl p-2 sm:p-4 shadow-inner overflow-auto border border-slate-800">
            {/* Blueprint container */}
            <div 
              className="w-full min-w-[700px] h-[580px] relative rounded-xl overflow-hidden border-2 border-sky-900/60 shadow-2xl select-none"
              style={{
                width: "100%",
                minWidth: "750px",
                height: "580px",
                backgroundColor: "#0f172a",
                backgroundImage: isEditMode 
                  ? "radial-gradient(#1e293b 1.5px, transparent 1.5px), radial-gradient(#1e293b 1.5px, #0f172a 1.5px)"
                  : "linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)",
                backgroundSize: isEditMode ? "24px 24px" : "32px 32px",
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top left",
                transition: "transform 0.15s ease-out"
              }}
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Compass Direction (North) */}
              <div className="absolute top-3 right-3 z-20 flex flex-col items-center bg-slate-950/80 backdrop-blur-xs border border-sky-500/30 px-2 py-1.5 rounded-lg shadow-md pointer-events-none">
                <Compass className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] font-bold text-sky-400 tracking-wider">UTARA</span>
              </div>

              {/* Campus Boundary Outline */}
              <div className="absolute inset-2 border border-dashed border-sky-500/20 rounded-xl pointer-events-none flex items-end justify-start p-2">
                <span className="text-[10px] font-mono text-sky-400/50 uppercase tracking-widest">
                  KOMPLEKS KAMPUS SMP NEGERI 3 KRAS • KAB. KEDIRI
                </span>
              </div>

              {/* Render Map Elements */}
              {displayedElements.map((el) => {
                const isSelected = selectedElementId === el.id;
                const isHovered = hoveredElementId === el.id;
                const linkedRoom = el.ruanganId ? rooms.find(r => r.id === el.ruanganId) : null;
                const roomAssets = el.ruanganId ? assets.filter(a => a.ruanganId && a.ruanganId.includes(el.ruanganId!)) : [];

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => handleElementClick(e, el)}
                    onMouseEnter={() => setHoveredElementId(el.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      backgroundColor: el.warna || "#2563eb",
                    }}
                    className={`absolute rounded-xl transition-shadow cursor-pointer flex flex-col justify-between p-2.5 box-border overflow-hidden text-white shadow-md ${
                      isSelected 
                        ? "ring-3 ring-amber-400 ring-offset-2 ring-offset-slate-900 z-30 shadow-xl" 
                        : isHovered 
                        ? "ring-2 ring-white/80 z-20 shadow-lg brightness-110" 
                        : "z-10 hover:brightness-105"
                    }`}
                  >
                    {/* Header: Icon, Code & Floor */}
                    <div className="flex items-center justify-between gap-1 w-full pointer-events-none">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="p-1 bg-black/25 rounded-md shrink-0">
                          {getTipeIcon(el.tipe)}
                        </span>
                        <span className="font-mono text-[10px] font-bold tracking-tight bg-black/20 px-1.5 py-0.5 rounded truncate">
                          {el.kode || el.tipe.toUpperCase()}
                        </span>
                      </div>
                      {el.lantai > 1 && (
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-full shrink-0 shadow-xs">
                          Lt. {el.lantai}
                        </span>
                      )}
                    </div>

                    {/* Middle: Name */}
                    <div className="pointer-events-none my-auto">
                      <p className="font-extrabold text-xs sm:text-sm leading-tight drop-shadow-xs line-clamp-2">
                        {el.nama}
                      </p>
                      {el.bangunan && (
                        <p className="text-[10px] text-white/80 truncate mt-0.5 font-medium">
                          {el.bangunan}
                        </p>
                      )}
                    </div>

                    {/* Footer: Live asset info badge or capacity */}
                    <div className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-white/20 pointer-events-none">
                      {el.ruanganId ? (
                        <span className="font-bold text-amber-200 truncate">
                          {roomAssets.length} Aset
                        </span>
                      ) : (
                        <span className="text-white/80 truncate">
                          {el.kapasitas ? `${el.kapasitas} org` : el.tipe}
                        </span>
                      )}

                      <span className="text-[9px] text-white/70">
                        {el.width}×{el.height}%
                      </span>
                    </div>

                    {/* Resize Handle (visible only in Edit Mode) */}
                    {isEditMode && (
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                        title="Tarik sudut untuk mengubah ukuran"
                        className="absolute bottom-0 right-0 w-4 h-4 bg-amber-400 hover:bg-amber-300 rounded-tl-md cursor-nwse-resize flex items-center justify-center z-40"
                      >
                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Mode Instruction Bar */}
          {isEditMode && (
            <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Mode Edit Denah Aktif:</strong> Klik dan geser kotak untuk memindahkan lokasi, atau tarik titik kuning di sudut kanan-bawah kotak untuk mengatur panjang/lebar.
                </span>
              </div>
              <Button size="sm" onClick={() => setIsEditMode(false)} className="h-7 text-xs bg-amber-600 hover:bg-amber-700">
                Selesai
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar: Inspector & Legend (1 col) */}
        <div className="space-y-4">
          {/* Selected Facility Inspector */}
          {inspectedElement ? (
            <Card className="border-primary-200 shadow-sm animate-in fade-in duration-200">
              <CardContent className="p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {inspectedElement.kode || "FASILITAS"}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1 leading-snug">
                      {inspectedElement.nama}
                    </h3>
                    <p className="text-xs text-slate-500">{inspectedElement.bangunan || "Area Terbuka"}</p>
                  </div>
                  <div 
                    className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white" 
                    style={{ backgroundColor: inspectedElement.warna || "#2563eb" }} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 text-[10px] block">Lantai</span>
                    <span className="font-bold text-slate-900">Lantai {inspectedElement.lantai}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 text-[10px] block">Kapasitas</span>
                    <span className="font-bold text-slate-900">{inspectedElement.kapasitas || 0} Orang</span>
                  </div>
                </div>

                {inspectedElement.ruanganId && (
                  <div className="bg-primary-50/70 p-3 rounded-xl border border-primary-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary-900">Aset Inventaris di Ruangan:</span>
                      <span className="font-bold text-primary-700">
                        {assets.filter(a => inspectedElement.ruanganId && a.ruanganId?.includes(inspectedElement.ruanganId)).length} Item
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setInspectedRoomId(inspectedElement.ruanganId!);
                        setIsRoomAssetsModalOpen(true);
                      }}
                      className="w-full text-xs justify-center"
                    >
                      Buka Dokumen KIR Ruangan
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                )}

                {inspectedElement.keterangan && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="block text-[10px] text-slate-500 mb-0.5">Keterangan:</strong>
                    {inspectedElement.keterangan}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(inspectedElement)}
                    className="w-full text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit Data Elemen
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteElement(inspectedElement.id, inspectedElement.nama)}
                    className="text-xs"
                    title="Hapus dari denah"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
              <Map className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Pilih Ruangan di Denah</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Klik salah satu kotak ruangan atau gedung pada denah untuk melihat informasi detail dan inventaris asetnya.
              </p>
            </div>
          )}

          {/* Unmapped Rooms Box */}
          {unmappedRooms.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 shadow-xs">
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Ruangan Belum Dipetakan ({unmappedRooms.length})
                  </h4>
                </div>
                <p className="text-[11px] text-amber-800">
                  Ruangan berikut ada di data sistem tetapi belum ditaruh di denah:
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {unmappedRooms.map(rm => (
                    <div 
                      key={rm.id}
                      className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between gap-1 text-xs"
                    >
                      <div className="truncate">
                        <strong className="text-slate-800 truncate block">{rm.nama}</strong>
                        <span className="text-[10px] text-slate-500">{rm.kodeRuangan} • {rm.bangunan || "Gedung Utama"}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-[11px] px-2 text-primary-600 border-primary-200 hover:bg-primary-50 shrink-0"
                        onClick={() => openAddModal(rm)}
                      >
                        + Taruh
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Color Legend Card */}
          <Card>
            <CardContent className="p-3.5 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary-600" />
                Legenda Kategori Denah
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                  <span className="text-slate-700">Ruang Kelas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-purple-600 shrink-0" />
                  <span className="text-slate-700">Laboratorium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-sky-700 shrink-0" />
                  <span className="text-slate-700">Kantor & TU</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-600 shrink-0" />
                  <span className="text-slate-700">Perpustakaan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-pink-600 shrink-0" />
                  <span className="text-slate-700">Aula / Serbaguna</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                  <span className="text-slate-700">Taman / Terbuka</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-cyan-600 shrink-0" />
                  <span className="text-slate-700">Lapangan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-500 shrink-0" />
                  <span className="text-slate-700">Gerbang & Parkir</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Modal: Add / Edit Denah Element */}
      <FormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingElementId ? "Edit Elemen Tata Letak Denah" : "Tambah Ruangan / Fasilitas ke Denah"}
        onSubmit={handleSaveForm}
      >
        <div className="grid gap-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Hubungkan ke Master Ruangan */}
          <div className="bg-primary-50/60 p-3 rounded-xl border border-primary-200">
            <label className="text-xs font-bold text-primary-950 uppercase tracking-wider block mb-1.5">
              Hubungkan ke Master Ruangan (KIR)
            </label>
            <select
              value={formValues.ruanganId}
              onChange={(e) => handleRoomSelectChange(e.target.value)}
              className="w-full border border-primary-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">-- Bukan Ruangan Terdaftar (Fasilitas Bebas / Area Terbuka) --</option>
              {rooms.map(rm => (
                <option key={rm.id} value={rm.id}>
                  🚪 {rm.nama} ({rm.kodeRuangan}) • {rm.bangunan || "Gedung Utama"}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-primary-800 mt-1">
              Memilih master ruangan akan otomatis menghubungkan data aset, kapasitas, dan nama ruangan ke denah.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Nama Fasilitas / Area</label>
              <input
                type="text"
                required
                value={formValues.nama}
                onChange={(e) => setFormValues(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Contoh: Ruang Kelas VII-A"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Kode Elemen</label>
              <input
                type="text"
                value={formValues.kode}
                onChange={(e) => setFormValues(prev => ({ ...prev, kode: e.target.value }))}
                placeholder="Contoh: R-VII-A"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Tipe Fasilitas</label>
              <select
                value={formValues.tipe}
                onChange={(e) => setFormValues(prev => ({ ...prev, tipe: e.target.value as any }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none bg-white"
              >
                <option value="ruangan">Ruangan (Kelas/Lab/Kantor)</option>
                <option value="gedung">Blok Gedung</option>
                <option value="lapangan">Lapangan Olahraga / Upacara</option>
                <option value="taman">Taman / Gazebo / Area Terbuka</option>
                <option value="fasilitas">Fasilitas / Parkir / Toilet / Kantin</option>
                <option value="gerbang">Gerbang / Pos Satpam</option>
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Posisi Lantai</label>
              <select
                value={formValues.lantai}
                onChange={(e) => setFormValues(prev => ({ ...prev, lantai: parseInt(e.target.value) || 1 }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none bg-white"
              >
                <option value={1}>Lantai 1 / Dasar</option>
                <option value={2}>Lantai 2</option>
                <option value={3}>Lantai 3</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Gedung Induk</label>
              <input
                type="text"
                value={formValues.bangunan}
                onChange={(e) => setFormValues(prev => ({ ...prev, bangunan: e.target.value }))}
                placeholder="Contoh: Gedung Ruang Kelas Blok A"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-800">Warna Aksen</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formValues.warna}
                  onChange={(e) => setFormValues(prev => ({ ...prev, warna: e.target.value }))}
                  className="w-10 h-9 p-0 border border-slate-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formValues.warna}
                  onChange={(e) => setFormValues(prev => ({ ...prev, warna: e.target.value }))}
                  className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono w-full"
                />
              </div>
            </div>
          </div>

          {/* Dimensi & Koordinat (%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Ukuran & Koordinat (% dari Area Denah)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">Posisi X (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formValues.x}
                  onChange={(e) => setFormValues(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                  className="border border-slate-300 rounded px-2 py-1 text-xs w-full font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Posisi Y (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formValues.y}
                  onChange={(e) => setFormValues(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                  className="border border-slate-300 rounded px-2 py-1 text-xs w-full font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Lebar (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formValues.width}
                  onChange={(e) => setFormValues(prev => ({ ...prev, width: parseFloat(e.target.value) || 10 }))}
                  className="border border-slate-300 rounded px-2 py-1 text-xs w-full font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Tinggi (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formValues.height}
                  onChange={(e) => setFormValues(prev => ({ ...prev, height: parseFloat(e.target.value) || 10 }))}
                  className="border border-slate-300 rounded px-2 py-1 text-xs w-full font-mono bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-800">Keterangan / Fungsi Khusus</label>
            <textarea
              rows={2}
              value={formValues.keterangan}
              onChange={(e) => setFormValues(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Catatan fasilitas, akses masuk, atau peruntukan ruang..."
              className="border border-slate-300 rounded-lg p-2.5 text-xs outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </FormModal>

      {/* Modal Detail KIR untuk Ruangan Terpilih */}
      <RoomAssetsModal
        isOpen={isRoomAssetsModalOpen}
        onClose={() => setIsRoomAssetsModalOpen(false)}
        room={rooms.find(r => r.id === inspectedRoomId) || null}
        assets={assets.filter(a => inspectedRoomId && a.ruanganId?.includes(inspectedRoomId))}
      />
    </div>
  );
}
