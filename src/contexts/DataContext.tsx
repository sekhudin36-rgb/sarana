import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  mockAssets, mockRooms, mockConsumables, mockProcurements, 
  mockBorrowings, mockMutations, mockMaintenance, mockStocktakes, mockDisposals,
  mockSchoolMap
} from '../data/mockData';
import { 
  SystemLogEntry, Asset, Room, AssetState, AssetAuditLog, AssetLiveStatus, 
  Borrowing, MaintenanceRecord, Disposal, Mutation, Stocktake,
  SchoolMapElement, AssetUsageRecord, AssetUsageCategory,
  getAssetConditionBreakdown
} from '../types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface SchoolProfile {
  kementerian: string;
  nama: string;
  npsn: string;
  alamat: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  nipKepsek: string;
  operator: string;
  nipOperator: string;
  logoDinas?: string;
  logoSekolah?: string;
  logoAplikasi?: string;
  adminPin?: string;
  adminUsername?: string;
  adminPassword?: string;
}

export const defaultProfile: SchoolProfile = {
  kementerian: "Kementerian Pendidikan dan Kebudayaan",
  nama: "SMP Negeri 3 Kras",
  npsn: "20202020",
  alamat: "Jl. Pendidikan No. 123, Kota Pelajar, Provinsi Ilmu Pengetahuan",
  kodePos: "40123",
  telepon: "(021) 1234567",
  email: "info@smpbelajar.id",
  website: "www.smpbelajar.id",
  kepalaSekolah: "Bpk. H. Ahmad Sudirman, S.Pd., M.Si.",
  nipKepsek: "19780101 200501 1 001",
  operator: "Ibu Mahani",
  nipOperator: "19850101 201001 2 002",
  logoDinas: "",
  logoSekolah: "",
  logoAplikasi: "/icon.svg",
  adminPin: "123456",
  adminUsername: "admin",
  adminPassword: "admin123"
};

export interface ServerInfo {
  port: number;
  connectedClients: number;
  localIps: Array<{
    interface: string;
    ip: string;
    label?: string;
    url: string;
    portalUrl: string;
  }>;
}

export interface ClientSession {
  id: string;
  ip: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  page: string;
  path: string;
  role: string;
  userName: string;
  isHost?: boolean;
  connectedAt: string;
  lastSeen: string;
  isOnline: boolean;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  sender: string;
  level: 'info' | 'warning' | 'success';
  timestamp: string;
}

interface DataContextType {
  schoolProfile: SchoolProfile;
  setSchoolProfile: React.Dispatch<React.SetStateAction<SchoolProfile>>;
  assets: typeof mockAssets;
  setAssets: React.Dispatch<React.SetStateAction<typeof mockAssets>>;
  rooms: typeof mockRooms;
  setRooms: React.Dispatch<React.SetStateAction<typeof mockRooms>>;
  consumables: typeof mockConsumables;
  setConsumables: React.Dispatch<React.SetStateAction<typeof mockConsumables>>;
  procurements: typeof mockProcurements;
  setProcurements: React.Dispatch<React.SetStateAction<typeof mockProcurements>>;
  borrowings: typeof mockBorrowings;
  setBorrowings: React.Dispatch<React.SetStateAction<typeof mockBorrowings>>;
  mutations: typeof mockMutations;
  setMutations: React.Dispatch<React.SetStateAction<typeof mockMutations>>;
  maintenances: typeof mockMaintenance;
  setMaintenances: React.Dispatch<React.SetStateAction<typeof mockMaintenance>>;
  stocktakes: typeof mockStocktakes;
  setStocktakes: React.Dispatch<React.SetStateAction<typeof mockStocktakes>>;
  disposals: typeof mockDisposals;
  setDisposals: React.Dispatch<React.SetStateAction<typeof mockDisposals>>;
  getFullDatabase: () => Record<string, any>;
  importFullDatabase: (data: any) => Promise<void>;
  resetToInitialData: () => Promise<void>;
  realtimeStatus: 'connected' | 'connecting' | 'offline';
  isLiveRealtime: boolean;
  pingLatency: number | null;
  serverInfo: ServerInfo | null;
  lastSyncTime: Date | null;
  clientId: string;
  activeClients: ClientSession[];
  sessionHistory: ClientSession[];
  refreshActiveClients: () => Promise<void>;
  broadcastAlert: (title: string, message: string, level?: 'info' | 'warning' | 'success') => Promise<boolean>;
  activeBroadcast: BroadcastNotification | null;
  dismissBroadcast: () => void;
  systemLogs: SystemLogEntry[];
  addSystemLog: (entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) => void;
  clearSystemLogs: () => void;
  // Data Integrity, State Machine & Audit
  getAssetLiveStatus: (assetId: string) => AssetLiveStatus;
  updateAssetWithAudit: (
    assetId: string, 
    updates: Partial<Asset>, 
    actorName?: string, 
    reason?: string
  ) => { success: boolean; error?: string };
  deleteRoomSafe: (roomId: string) => { success: boolean; message: string; assetCount: number };
  deleteAssetSafe: (assetId: string) => { success: boolean; message: string };
  approveDisposalAndArchive: (disposalId: string, actorName?: string) => void;
  completeMutation: (mutationId: string, actorName?: string) => void;
  applyStocktakeReconciliation: (
    stocktakeId: string, 
    reconciliations: Array<{ assetId: string; kondisiBaru?: AssetState; ruanganIdBaru?: string }>, 
    actorName?: string
  ) => { updatedCount: number };
  isNibarUnique: (nibar: string, excludeAssetId?: string) => boolean;
  isRegisterUnique: (kodeBarang: string, register: string, excludeAssetId?: string) => boolean;
  validateDatabaseBackup: (jsonContent: string) => { valid: boolean; summary?: any; error?: string };
  // Denah Sekolah (School Map)
  schoolMap: SchoolMapElement[];
  setSchoolMap: React.Dispatch<React.SetStateAction<SchoolMapElement[]>>;
  resetSchoolMapToDefault: () => void;
  // Status Penggunaan Aset (Asset Usage Status)
  getAssetUsageRecord: (assetId: string) => AssetUsageRecord;
  allAssetUsageRecords: AssetUsageRecord[];
  updateAssetUsageStatus: (
    assetId: string, 
    status: AssetUsageCategory, 
    skNomor?: string, 
    tglSk?: string, 
    actorName?: string
  ) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Generate unique client ID to prevent duplicate echoes
const CLIENT_ID = typeof window !== 'undefined'
  ? (window.sessionStorage.getItem('sarpras_client_id') || (() => {
      const id = 'client_' + Math.random().toString(36).substring(2, 10);
      window.sessionStorage.setItem('sarpras_client_id', id);
      return id;
    })())
  : 'client_server';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, adminUser } = useAuth();
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeClients, setActiveClients] = useState<ClientSession[]>([]);
  const [sessionHistory, setSessionHistory] = useState<ClientSession[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastNotification | null>(null);

  const isLiveRealtime = realtimeStatus === 'connected';

  // Initial State Helper with localStorage fallback
  const getInitial = <T,>(key: string, fallback: T): T => {
    try {
      const saved = window.localStorage.getItem(`sarpras_${key}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return fallback;
  };

  const defaultSystemLogs: SystemLogEntry[] = [
    {
      id: "log_init_01",
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      level: "INFO",
      category: "NETWORK",
      action: "HEARTBEAT_SYNC",
      actor: "System Engine",
      ip: "127.0.0.1 (Server)",
      description: "Sinkronisasi telemetry server port 3030 aktif & melayani klien intranet.",
      details: { port: 3030, mode: "realtime" }
    },
    {
      id: "log_init_02",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      level: "SUCCESS",
      category: "AUTH",
      action: "ADMIN_LOGIN",
      actor: "admin (Ibu Mahani)",
      ip: "127.0.0.1 (Server)",
      description: "Administrator berhasil masuk ke dashboard kontrol Sarpras SMP.",
      details: { username: "admin", authMethod: "password" }
    },
    {
      id: "log_init_03",
      timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      level: "SUCCESS",
      category: "CIRCULATION",
      action: "BORROW_REQUEST",
      actor: "Ahmad Faiz (Kelas 8B)",
      ip: "192.168.1.104",
      description: "Pengajuan peminjaman baru via Portal Peminjaman: Proyektor LCD Epson EB-X05.",
      details: { barang: "Proyektor LCD Epson EB-X05", durasi: 2, status: "Menunggu Persetujuan" }
    },
    {
      id: "log_init_04",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      level: "INFO",
      category: "DATABASE",
      action: "GDRIVE_CLOUD_SYNC",
      actor: "admin",
      ip: "127.0.0.1 (Server)",
      description: "Pemeriksaan cadangan Master Database Google Drive terverifikasi aman.",
      details: { cloudStorage: "Google Drive OAuth 2.0", status: "Ready" }
    },
    {
      id: "log_init_05",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      level: "WARNING",
      category: "ASSET",
      action: "STOCK_THRESHOLD_ALERT",
      actor: "Inventaris Bot",
      ip: "127.0.0.1 (Server)",
      description: "Peringatan stok minimum: Tinta Printer Epson 003 Hitam tersisa 2 botol (batas aman: 5 botol).",
      details: { item: "Tinta Printer Epson 003 Hitam", sisa: 2, batas: 5 }
    },
    {
      id: "log_init_06",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      level: "INFO",
      category: "MAINTENANCE",
      action: "MAINTENANCE_UPDATE",
      actor: "Bpk. Adi Gunawan",
      ip: "192.168.1.112",
      description: "Pembaruan status pemeliharaan AC Split 2 PK (Lab Komputer): Sedang dalam proses perbaikan.",
      details: { assetId: "a6", teknisi: "Pak Marno", status: "Proses Perbaikan" }
    }
  ];

  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(() => getInitial('system_logs', defaultSystemLogs));

  const addSystemLog = useCallback((entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: SystemLogEntry = {
      ...entry,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString()
    };
    setSystemLogs(prev => {
      const next = [newEntry, ...prev].slice(0, 500);
      try {
        window.localStorage.setItem('sarpras_system_logs', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearSystemLogs = useCallback(() => {
    setSystemLogs([]);
    try {
      window.localStorage.removeItem('sarpras_system_logs');
    } catch {}
  }, []);

  const [schoolProfile, setSchoolProfileState] = useState<SchoolProfile>(() => getInitial('schoolProfile', defaultProfile));
  const [assets, setAssetsState] = useState(() => getInitial('assets', mockAssets));
  const [rooms, setRoomsState] = useState(() => getInitial('rooms', mockRooms));
  const [consumables, setConsumablesState] = useState(() => getInitial('consumables', mockConsumables));
  const [procurements, setProcurementsState] = useState(() => getInitial('procurements', mockProcurements));
  const [borrowings, setBorrowingsState] = useState(() => getInitial('borrowings', mockBorrowings));
  const [mutations, setMutationsState] = useState(() => getInitial('mutations', mockMutations));
  const [maintenances, setMaintenancesState] = useState(() => getInitial('maintenances', mockMaintenance));
  const [stocktakes, setStocktakesState] = useState(() => getInitial('stocktakes', mockStocktakes));
  const [disposals, setDisposalsState] = useState(() => getInitial('disposals', mockDisposals));
  const [schoolMap, setSchoolMapState] = useState<SchoolMapElement[]>(() => getInitial('schoolMap', mockSchoolMap));

  // Reference to current state for stable callbacks
  const stateRef = useRef({
    schoolProfile, assets, rooms, consumables, procurements,
    borrowings, mutations, maintenances, stocktakes, disposals, schoolMap
  });
  stateRef.current = {
    schoolProfile, assets, rooms, consumables, procurements,
    borrowings, mutations, maintenances, stocktakes, disposals, schoolMap
  };

  // Helper to push update to Central Server API
  const pushToServer = useCallback(async (key: string, value: any) => {
    try {
      await fetch(`/api/data/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CLIENT_ID
        },
        body: JSON.stringify({ value, clientId: CLIENT_ID })
      });
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn(`[SYNC] Gagal mengirim ${key} ke server lokal:`, err);
    }

    // Optional Firestore backup if logged in
    if (isAuthenticated) {
      try {
        const docRef = doc(db, 'appData', key);
        setDoc(docRef, { value });
      } catch {}
    }
  }, [isAuthenticated]);

  // Generic state setter with optimistic update, local persistence, and central server push
  const createSetter = <T,>(key: string, setLocalState: React.Dispatch<React.SetStateAction<T>>) => {
    return (updater: React.SetStateAction<T>) => {
      setLocalState((prev) => {
        const nextValue = updater instanceof Function ? updater(prev) : updater;
        try {
          window.localStorage.setItem(`sarpras_${key}`, JSON.stringify(nextValue));
        } catch {}
        pushToServer(key, nextValue);
        return nextValue;
      });
    };
  };

  const setSchoolProfile = createSetter('schoolProfile', setSchoolProfileState);
  const setAssets = createSetter('assets', setAssetsState);
  const setRooms = createSetter('rooms', setRoomsState);
  const setConsumables = createSetter('consumables', setConsumablesState);
  const setProcurements = createSetter('procurements', setProcurementsState);
  const setBorrowings = createSetter('borrowings', setBorrowingsState);
  const setMutations = createSetter('mutations', setMutationsState);
  const setMaintenances = createSetter('maintenances', setMaintenancesState);
  const setStocktakes = createSetter('stocktakes', setStocktakesState);
  const setDisposals = createSetter('disposals', setDisposalsState);
  const setSchoolMap = createSetter('schoolMap', setSchoolMapState);

  // Apply incoming update from Server without re-triggering pushToServer
  const applyRemoteUpdate = useCallback((key: string, value: any) => {
    try {
      window.localStorage.setItem(`sarpras_${key}`, JSON.stringify(value));
    } catch {}

    switch (key) {
      case 'schoolProfile': setSchoolProfileState(value); break;
      case 'assets': setAssetsState(value); break;
      case 'rooms': setRoomsState(value); break;
      case 'consumables': setConsumablesState(value); break;
      case 'procurements': setProcurementsState(value); break;
      case 'borrowings': setBorrowingsState(value); break;
      case 'mutations': setMutationsState(value); break;
      case 'maintenances': setMaintenancesState(value); break;
      case 'stocktakes': setStocktakesState(value); break;
      case 'disposals': setDisposalsState(value); break;
      case 'schoolMap': setSchoolMapState(value); break;
    }
    setLastSyncTime(new Date());
  }, []);

  // 1. Initial Load from Central Server API
  useEffect(() => {
    let isMounted = true;
    const loadCentralData = async () => {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('API Data unavailable');
        const json = await res.json();
        if (json.success && json.data && isMounted) {
          const d = json.data;
          if (d.schoolProfile) applyRemoteUpdate('schoolProfile', d.schoolProfile);
          if (Array.isArray(d.assets)) applyRemoteUpdate('assets', d.assets);
          if (Array.isArray(d.rooms)) applyRemoteUpdate('rooms', d.rooms);
          if (Array.isArray(d.consumables)) applyRemoteUpdate('consumables', d.consumables);
          if (Array.isArray(d.procurements)) applyRemoteUpdate('procurements', d.procurements);
          if (Array.isArray(d.borrowings)) applyRemoteUpdate('borrowings', d.borrowings);
          if (Array.isArray(d.mutations)) applyRemoteUpdate('mutations', d.mutations);
          if (Array.isArray(d.maintenances)) applyRemoteUpdate('maintenances', d.maintenances);
          if (Array.isArray(d.stocktakes)) applyRemoteUpdate('stocktakes', d.stocktakes);
          if (Array.isArray(d.disposals)) applyRemoteUpdate('disposals', d.disposals);
          if (Array.isArray(d.schoolMap)) applyRemoteUpdate('schoolMap', d.schoolMap);
          setRealtimeStatus('connected');
          setLastSyncTime(new Date());
        }
      } catch (err) {
        console.info('[INFO] Berjalan dalam mode mandiri/offline.');
      }

      // Fetch server info (IPs, port, connected clients)
      try {
        const infoRes = await fetch('/api/server-info');
        if (infoRes.ok && isMounted) {
          const infoJson = await infoRes.json();
          setServerInfo(infoJson);
        }
      } catch {}
    };

    loadCentralData();
    return () => { isMounted = false; };
  }, [applyRemoteUpdate]);

  // 2. Realtime Server-Sent Events (SSE) Stream & Presence Reporter
  const refreshActiveClients = useCallback(async () => {
    try {
      const res = await fetch('/api/active-clients');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.activeClients)) {
          setActiveClients(json.activeClients);
          if (Array.isArray(json.recentHistory)) setSessionHistory(json.recentHistory);
          return;
        }
      }
    } catch {}
    // Fallback if standalone/preview
    setActiveClients((prev) => prev.length > 0 ? prev : [
      {
        id: CLIENT_ID,
        ip: '127.0.0.1 (Server)',
        deviceName: 'Komputer Server (Host Ini)',
        deviceType: 'desktop',
        os: 'Windows 11',
        browser: 'Google Chrome',
        page: 'Dashboard & Monitor Jaringan',
        path: '/',
        role: 'Administrator',
        userName: adminUser?.username || 'admin',
        isHost: true,
        connectedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true
      },
      {
        id: 'client_siswa_01',
        ip: '192.168.1.104',
        deviceName: 'Samsung Galaxy A54 (HP Siswa)',
        deviceType: 'mobile',
        os: 'Android 14',
        browser: 'Chrome Mobile',
        page: 'Portal Peminjaman - Form Pengajuan',
        path: '/#/portal-peminjaman',
        role: 'Siswa / Peminjam',
        userName: 'Ahmad Faiz (Kelas 8B)',
        isHost: false,
        connectedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 15).toISOString(),
        isOnline: true
      },
      {
        id: 'client_guru_02',
        ip: '192.168.1.112',
        deviceName: 'Lenovo ThinkPad (Laptop Guru)',
        deviceType: 'desktop',
        os: 'Windows 11',
        browser: 'Microsoft Edge',
        page: 'Portal Peminjaman - Katalog Sarpras',
        path: '/#/portal-peminjaman',
        role: 'Guru / Peminjam',
        userName: 'Bpk. Hendro, S.Pd',
        isHost: false,
        connectedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 32).toISOString(),
        isOnline: true
      }
    ]);
  }, [adminUser]);

  // Presence heartbeat reporter (runs every 4 seconds and triggers immediately on route navigation or tab focus)
  useEffect(() => {
    // Cross-tab broadcast channel
    let presenceChannel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        presenceChannel = new BroadcastChannel('sarpras_presence_sync');
        presenceChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_CLIENTS' && Array.isArray(event.data.clients)) {
            setActiveClients(event.data.clients);
            if (Array.isArray(event.data.history)) setSessionHistory(event.data.history);
          }
        };
      }
    } catch {}

    const sendHeartbeat = async () => {
      try {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
          deviceType = 'tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua)) {
          deviceType = 'mobile';
        }

        let os = 'Windows';
        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Mac/i.test(ua)) os = 'macOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        let browser = 'Chrome';
        if (/Edg/i.test(ua)) browser = 'Edge';
        else if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua)) browser = 'Safari';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';

        const deviceName = deviceType === 'mobile'
          ? (os === 'iOS' ? 'iPhone' : `${os} Smartphone`)
          : deviceType === 'tablet'
          ? (os === 'iOS' ? 'iPad' : `${os} Tablet`)
          : `${os} PC/Laptop`;

        const currentHash = typeof window !== 'undefined' ? (window.location.hash || window.location.pathname) : '/';
        let pageTitle = 'Dashboard Admin';
        let userRole = isAuthenticated ? 'Administrator' : 'Siswa / Peminjam';

        if (currentHash.includes('portal')) {
          pageTitle = 'Portal Peminjaman Siswa';
          userRole = 'Siswa / Peminjam';
        } else if (currentHash.includes('assets')) {
          pageTitle = 'Master Aset Tetap (KIB)';
        } else if (currentHash.includes('rooms')) {
          pageTitle = 'Ruangan (KIR)';
        } else if (currentHash.includes('borrowing')) {
          pageTitle = 'Sirkulasi Peminjaman';
        } else if (currentHash.includes('mutation')) {
          pageTitle = 'Mutasi Aset';
        } else if (currentHash.includes('maintenance')) {
          pageTitle = 'Pemeliharaan & Servis';
        } else if (currentHash.includes('stocktake')) {
          pageTitle = 'Stok Opname';
        } else if (currentHash.includes('reports')) {
          pageTitle = 'Laporan Sarpras';
        } else if (currentHash.includes('active-sessions')) {
          pageTitle = 'Monitoring Perangkat Terhubung';
        }

        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: CLIENT_ID,
            deviceName,
            deviceType,
            os,
            browser,
            page: pageTitle,
            path: currentHash,
            role: userRole,
            userName: isAuthenticated ? (adminUser?.username || 'admin') : 'Pengguna Portal'
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.activeClients)) {
            setActiveClients(json.activeClients);
            presenceChannel?.postMessage({
              type: 'SYNC_CLIENTS',
              clients: json.activeClients
            });
          }
        }
      } catch {}
    };

    // Heartbeat segera saat komponen dimuat
    sendHeartbeat();

    // Heartbeat berkala setiap 4 detik untuk latensi rendah
    const interval = setInterval(sendHeartbeat, 4000);

    // Kirim heartbeat seketika saat pengguna berpindah tab/halaman atau kembali fokus
    const handleNavigation = () => sendHeartbeat();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    document.addEventListener('visibilitychange', handleVisibility);

    // Pengiriman sinyal pelepasan (leave) saat browser/tab ditutup
    const handleUnload = () => {
      const leaveUrl = `/api/presence/leave?clientId=${CLIENT_ID}`;
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(leaveUrl, JSON.stringify({ clientId: CLIENT_ID }));
      } else {
        fetch(leaveUrl, { method: 'POST', keepalive: true }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      presenceChannel?.close();
    };
  }, [isAuthenticated, adminUser]);

  // Real-time Ping Latency Monitor
  useEffect(() => {
    let timer: any = null;
    const checkPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/presence/ping', { cache: 'no-store' });
        if (res.ok) {
          const elapsed = Math.round(performance.now() - start);
          setPingLatency(Math.max(1, elapsed));
        } else {
          setPingLatency(null);
        }
      } catch {
        setPingLatency(null);
      }
    };

    checkPing();
    timer = setInterval(checkPing, 8000);
    return () => clearInterval(timer);
  }, []);

  // Realtime Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      try {
        setRealtimeStatus('connecting');
        eventSource = new EventSource('/api/realtime');

        eventSource.onopen = () => {
          setRealtimeStatus('connected');
          refreshActiveClients();
        };

        eventSource.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.type === 'CONNECTED') {
              setRealtimeStatus('connected');
              if (Array.isArray(payload.activeClients)) {
                setActiveClients(payload.activeClients);
              }
              if (Array.isArray(payload.recentHistory)) {
                setSessionHistory(payload.recentHistory);
              }
              if (payload.clientCount) {
                setServerInfo(prev => prev ? { ...prev, connectedClients: payload.clientCount } : null);
              }
            } else if (payload.type === 'DATA_UPDATE') {
              if (payload.senderId !== CLIENT_ID && payload.key) {
                applyRemoteUpdate(payload.key, payload.value);
              }
            } else if (payload.type === 'FULL_SYNC' && payload.data) {
              if (payload.senderId !== CLIENT_ID) {
                const d = payload.data;
                Object.keys(d).forEach(k => applyRemoteUpdate(k, d[k]));
              }
            } else if (payload.type === 'PRESENCE_CHANGE' || payload.type === 'CLIENT_JOINED') {
              if (Array.isArray(payload.activeClients)) {
                setActiveClients(payload.activeClients);
              } else {
                refreshActiveClients();
              }
              if (Array.isArray(payload.recentHistory)) {
                setSessionHistory(payload.recentHistory);
              }
              if (payload.activeCount !== undefined) {
                setServerInfo(prev => prev ? { ...prev, connectedClients: payload.activeCount } : null);
              }
            } else if (payload.type === 'BROADCAST_ALERT') {
              setActiveBroadcast({
                id: 'bc_' + Date.now(),
                title: payload.title || 'Pengumuman Sarpras',
                message: payload.message,
                sender: payload.sender || 'Administrator',
                level: payload.level || 'info',
                timestamp: payload.timestamp || new Date().toISOString()
              });
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        eventSource.onerror = () => {
          setRealtimeStatus('offline');
          eventSource?.close();
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectSSE, 2500);
        };
      } catch (e) {
        setRealtimeStatus('offline');
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSSE, 2500);
      }
    };

    connectSSE();
    refreshActiveClients();

    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [applyRemoteUpdate, refreshActiveClients]);

  const broadcastAlert = useCallback(async (title: string, message: string, level: 'info' | 'warning' | 'success' = 'info') => {
    try {
      await fetch('/api/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          sender: adminUser?.username || 'Administrator',
          level
        })
      });
      return true;
    } catch {
      setActiveBroadcast({
        id: 'bc_' + Date.now(),
        title,
        message,
        sender: adminUser?.username || 'Administrator',
        level,
        timestamp: new Date().toISOString()
      });
      return true;
    }
  }, [adminUser]);

  const dismissBroadcast = useCallback(() => {
    setActiveBroadcast(null);
  }, []);

  // --- Data Integrity, State Machine & Audit Implementations ---

  // Live status machine with transaction locking checks
  const getAssetLiveStatus = useCallback((assetId: string): AssetLiveStatus => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) {
      return {
        status: "Tersedia",
        keterangan: "Data aset tidak ditemukan",
        canBorrow: false,
        canMutate: false,
        canMaintain: false
      };
    }

    // 1. Check Disposal / Pemusnahan
    const activeDisposal = disposals.find(d => d.assetId === assetId && (d.status === "Disetujui" || d.status === "Selesai"));
    if (activeDisposal || asset.statusOperasional === "Dihapus / Dimusnahkan") {
      return {
        status: "Dihapus",
        keterangan: `Aset telah dihapuskan dari pembukuan inventaris (Surat: ${activeDisposal?.nomorSurat || 'BAST'})`,
        canBorrow: false,
        canMutate: false,
        canMaintain: false,
        lockReason: "Aset berstatus Dihapus/Dimusnahkan (Arsip Non-Aktif)",
        activeDisposal
      };
    }

    // 2. Check Active Borrowing (Dipinjam / Menunggu)
    const activeBorrow = borrowings.find(b => b.assetId === assetId && (b.status === "Dipinjam" || b.status === "Menunggu Persetujuan"));
    if (activeBorrow) {
      return {
        status: "Dipinjam",
        keterangan: `Sedang dipinjam oleh: ${activeBorrow.peminjam} (${activeBorrow.status})`,
        canBorrow: false,
        canMutate: false,
        canMaintain: true,
        lockReason: `Aset sedang dipinjam oleh ${activeBorrow.peminjam}`,
        activeBorrowing: activeBorrow
      };
    }

    // 3. Check Active Maintenance
    const activeMnt = maintenances.find(m => m.assetId === assetId && (m.status === "Menunggu" || m.status === "Proses Perbaikan"));
    if (activeMnt) {
      return {
        status: "Dalam Perbaikan",
        keterangan: `Sedang perbaikan teknisi: ${activeMnt.deskripsiKerusakan}`,
        canBorrow: false,
        canMutate: false,
        canMaintain: false,
        lockReason: "Aset dalam proses servis/reparasi",
        activeMaintenance: activeMnt
      };
    }

    // 4. Physical condition guard based on exact condition breakdown
    const bd = getAssetConditionBreakdown(asset);
    if (bd.baik === 0 && bd.rusakBerat > 0) {
      return {
        status: "Dalam Perbaikan",
        keterangan: `Semua ${bd.total} unit berstatus Rusak Berat - Memerlukan servis atau usulan penghapusan`,
        canBorrow: false,
        canMutate: true,
        canMaintain: true,
        lockReason: "Semua unit kondisi rusak berat, tidak laik untuk sirkulasi pinjam"
      };
    }
    if (bd.baik === 0 && bd.hilang > 0 && bd.rusakRingan === 0) {
      return {
        status: "Hilang" as any,
        keterangan: `Semua ${bd.total} unit berstatus Hilang - Barang tidak ditemukan dalam fisik inventaris`,
        canBorrow: false,
        canMutate: false,
        canMaintain: false,
        lockReason: "Semua unit berstatus hilang, tidak dapat dipinjamkan atau dimutasi"
      };
    }
    if (bd.baik === 0 && bd.tidakDiketahui > 0 && bd.rusakRingan === 0) {
      return {
        status: "Tidak Diketahui" as any,
        keterangan: "Kondisi Tidak Diketahui - Keberadaan fisik belum terverifikasi di lokasi",
        canBorrow: false,
        canMutate: false,
        canMaintain: true,
        lockReason: "Keberadaan fisik barang belum dipastikan saat inventarisasi"
      };
    }

    const mixedDetail = bd.isMixed 
      ? ` (Tersedia ${bd.baik} ${bd.satuan} Kondisi Baik dari total ${bd.total})` 
      : "";

    return {
      status: "Tersedia",
      keterangan: `Aset tersedia & siap digunakan${mixedDetail}`,
      canBorrow: bd.baik > 0,
      canMutate: true,
      canMaintain: true
    };
  }, [assets, disposals, borrowings, maintenances]);

  // Field-level Audit Trail tracking
  const updateAssetWithAudit = useCallback((
    assetId: string, 
    updates: Partial<Asset>, 
    actorName: string = "Admin Sarpras", 
    reason: string = "Pembaruan inventaris"
  ) => {
    const currentAsset = assets.find(a => a.id === assetId);
    if (!currentAsset) return { success: false, error: "Aset tidak ditemukan" };

    const trackedFields: Array<{ key: keyof Asset; label: string }> = [
      { key: "nama", label: "Nama Barang" },
      { key: "harga", label: "Harga Perolehan" },
      { key: "kondisi", label: "Kondisi Fisik" },
      { key: "ruanganId", label: "Ruangan Lokasi" },
      { key: "sumberDana", label: "Sumber Dana" },
      { key: "nomorRegister", label: "Nomor Register" },
      { key: "nibar", label: "NIBAR" },
      { key: "kategori", label: "Kategori KIB" },
      { key: "tahunPerolehan", label: "Tahun Perolehan" },
      { key: "statusOperasional", label: "Status Operasional" }
    ];

    const auditLogs: AssetAuditLog[] = [];
    trackedFields.forEach(({ key, label }) => {
      if (updates[key] !== undefined && String(updates[key]) !== String(currentAsset[key])) {
        let oldVal: any = currentAsset[key];
        let newVal: any = updates[key];
        if (key === "ruanganId") {
          oldVal = rooms.find(r => r.id === oldVal)?.nama || String(oldVal);
          newVal = rooms.find(r => r.id === newVal)?.nama || String(newVal);
        }
        auditLogs.push({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          actor: actorName,
          field: String(key),
          label,
          oldValue: oldVal ?? "-",
          newValue: newVal ?? "-",
          reason
        });
      }
    });

    const existingAudit = currentAsset.auditHistory || [];
    const mergedAudit = [...auditLogs, ...existingAudit].slice(0, 50);

    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updates, auditHistory: mergedAudit } : a));

    if (auditLogs.length > 0) {
      addSystemLog({
        level: "INFO",
        category: "ASSET",
        action: "ASSET_FIELD_UPDATE",
        actor: actorName,
        ip: "127.0.0.1",
        description: `Perubahan data aset "${currentAsset.nama}": ${auditLogs.map(l => `${l.label} (${l.oldValue} -> ${l.newValue})`).join(', ')}`,
        details: { assetId, auditLogs, reason }
      });
    }

    return { success: true };
  }, [assets, rooms, addSystemLog, setAssets]);

  // Safe delete room (prevents orphan records)
  const deleteRoomSafe = useCallback((roomId: string) => {
    const assetsInRoom = assets.filter(a => a.ruanganId === roomId);
    if (assetsInRoom.length > 0) {
      return {
        success: false,
        message: `Ruangan tidak dapat dihapus karena masih terdapat ${assetsInRoom.length} barang inventaris aktif di dalamnya. Pindahkan atau mutasikan barang tersebut terlebih dahulu.`,
        assetCount: assetsInRoom.length
      };
    }
    setRooms(prev => prev.filter(r => r.id !== roomId));
    addSystemLog({
      level: "INFO",
      category: "DATABASE",
      action: "ROOM_DELETED",
      actor: "Admin Sarpras",
      ip: "127.0.0.1",
      description: `Ruangan ID "${roomId}" berhasil dihapus dari master sistem setelah lolos verifikasi relasi aset.`,
    });
    return { success: true, message: "Ruangan berhasil dihapus", assetCount: 0 };
  }, [assets, setRooms, addSystemLog]);

  // Safe delete asset (checks for active borrowings / maintenance)
  const deleteAssetSafe = useCallback((assetId: string) => {
    const activeBorrow = borrowings.find(b => b.assetId === assetId && (b.status === "Dipinjam" || b.status === "Menunggu Persetujuan"));
    if (activeBorrow) {
      return {
        success: false,
        message: `Aset tidak dapat dihapus karena sedang dalam status peminjaman aktif oleh "${activeBorrow.peminjam}". Harap selesaikan pengembalian barang terlebih dahulu.`
      };
    }
    const activeMnt = maintenances.find(m => m.assetId === assetId && (m.status === "Menunggu" || m.status === "Proses Perbaikan"));
    if (activeMnt) {
      return {
        success: false,
        message: `Aset tidak dapat dihapus karena sedang menjalani proses pemeliharaan teknisi. Harap selesaikan pemeliharaan terlebih dahulu.`
      };
    }
    setAssets(prev => prev.filter(a => a.id !== assetId));
    addSystemLog({
      level: "WARNING",
      category: "ASSET",
      action: "ASSET_DELETED",
      actor: "Admin Sarpras",
      ip: "127.0.0.1",
      description: `Aset ID "${assetId}" dihapus dari master data setelah lolos validasi proteksi sirkulasi.`,
    });
    return { success: true, message: "Aset berhasil dihapus" };
  }, [borrowings, maintenances, setAssets, addSystemLog]);

  // Disposal Approval with auto-archiving state transition
  const approveDisposalAndArchive = useCallback((disposalId: string, actorName: string = "Admin Sarpras") => {
    const targetDisposal = disposals.find(d => d.id === disposalId);
    if (!targetDisposal) return;

    setDisposals(prev => prev.map(d => d.id === disposalId ? { ...d, status: "Disetujui" } : d));
    
    // Automatically archive the asset in Master Data
    const targetAsset = assets.find(a => a.id === targetDisposal.assetId);
    if (targetAsset) {
      updateAssetWithAudit(
        targetAsset.id, 
        { statusOperasional: "Dihapus / Dimusnahkan", kondisi: "Rusak Berat" },
        actorName,
        `Penghapusan aset disetujui resmi (Nomor Surat: ${targetDisposal.nomorSurat || 'BAST'})`
      );
    }

    addSystemLog({
      level: "SUCCESS",
      category: "ASSET",
      action: "DISPOSAL_APPROVED_AND_ARCHIVED",
      actor: actorName,
      ip: "127.0.0.1",
      description: `Penghapusan aset "${targetAsset?.nama || targetDisposal.assetId}" disetujui. Status operasional aset otomatis diarsipkan ke "Dihapus / Dimusnahkan".`,
      details: { disposalId, assetId: targetDisposal.assetId }
    });
  }, [disposals, assets, updateAssetWithAudit, setDisposals, addSystemLog]);

  // Complete mutation and auto-update asset room in Master Data
  const completeMutation = useCallback((mutationId: string, actorName: string = "Admin Sarpras") => {
    const targetMutation = mutations.find(m => m.id === mutationId);
    if (!targetMutation) return;

    setMutations(prev => prev.map(m => m.id === mutationId ? { ...m, status: "Selesai" } : m));
    
    const targetAsset = assets.find(a => a.id === targetMutation.assetId);
    const destRoom = rooms.find(r => r.id === targetMutation.keRuanganId);
    if (targetAsset) {
      updateAssetWithAudit(
        targetAsset.id,
        { ruanganId: targetMutation.keRuanganId },
        actorName,
        `Mutasi ruangan selesai ke: ${destRoom?.nama || targetMutation.keRuanganId}`
      );
    }

    addSystemLog({
      level: "SUCCESS",
      category: "ASSET",
      action: "MUTATION_COMPLETED_ROOM_UPDATED",
      actor: actorName,
      ip: "127.0.0.1",
      description: `Mutasi aset "${targetAsset?.nama || targetMutation.assetId}" selesai. Lokasi ruangan otomatis diperbarui ke "${destRoom?.nama || targetMutation.keRuanganId}".`,
      details: { mutationId, assetId: targetMutation.assetId, keRuanganId: targetMutation.keRuanganId }
    });
  }, [mutations, assets, rooms, updateAssetWithAudit, setMutations, addSystemLog]);

  // Apply Stocktake Reconciliation to Master Data
  const applyStocktakeReconciliation = useCallback((
    stocktakeId: string, 
    reconciliations: Array<{ assetId: string; kondisiBaru?: AssetState; ruanganIdBaru?: string }>, 
    actorName: string = "Tim Opname Sarpras"
  ) => {
    let count = 0;
    reconciliations.forEach(item => {
      const updates: Partial<Asset> = {};
      if (item.kondisiBaru) updates.kondisi = item.kondisiBaru;
      if (item.ruanganIdBaru) updates.ruanganId = item.ruanganIdBaru;

      if (Object.keys(updates).length > 0) {
        updateAssetWithAudit(item.assetId, updates, actorName, `Rekonsiliasi Berita Acara Stok Opname #${stocktakeId}`);
        count++;
      }
    });

    setStocktakes(prev => prev.map(s => s.id === stocktakeId ? { ...s, status: "Selesai", asetSelisih: 0, asetSesuai: s.totalAsetDiperiksa } : s));

    addSystemLog({
      level: "SUCCESS",
      category: "DATABASE",
      action: "STOCKTAKE_RECONCILIATION_APPLIED",
      actor: actorName,
      ip: "127.0.0.1",
      description: `Rekonsiliasi hasil stok opname fisik berhasil diterapkan. Sebanyak ${count} aset master disinkronisasi ke kondisi riil.`,
      details: { stocktakeId, updatedCount: count }
    });

    return { updatedCount: count };
  }, [updateAssetWithAudit, setStocktakes, addSystemLog]);

  // NIBAR & Register Uniqueness Check
  const isNibarUnique = useCallback((nibar: string, excludeAssetId?: string) => {
    if (!nibar || !nibar.trim()) return true;
    return !assets.some(a => a.id !== excludeAssetId && a.nibar && a.nibar.trim() === nibar.trim());
  }, [assets]);

  const isRegisterUnique = useCallback((kodeBarang: string, register: string, excludeAssetId?: string) => {
    if (!kodeBarang || !register) return true;
    return !assets.some(a => a.id !== excludeAssetId && a.kodeBarang === kodeBarang && a.nomorRegister === register);
  }, [assets]);

  // Backup file validation guard
  const validateDatabaseBackup = useCallback((jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: "File cadangan bukan objek JSON yang valid." };
      }
      const hasAssets = Array.isArray(parsed.assets);
      const hasRooms = Array.isArray(parsed.rooms);
      if (!hasAssets && !hasRooms) {
        return { valid: false, error: "File cadangan tidak memuat tabel penting (assets/rooms)." };
      }
      return {
        valid: true,
        summary: {
          assetCount: parsed.assets?.length || 0,
          roomCount: parsed.rooms?.length || 0,
          borrowingCount: parsed.borrowings?.length || 0,
          disposalCount: parsed.disposals?.length || 0,
          timestamp: parsed.exportTimestamp || new Date().toISOString()
        }
      };
    } catch (e: any) {
      return { valid: false, error: `Gagal membaca format JSON: ${e.message}` };
    }
  }, []);

  // Reset school map to initial default layout
  const resetSchoolMapToDefault = useCallback(() => {
    setSchoolMap(mockSchoolMap);
    addSystemLog({
      level: "INFO",
      category: "DATABASE",
      action: "MAP_RESET_DEFAULT",
      actor: "Admin Sarpras",
      ip: "127.0.0.1",
      description: "Denah sekolah telah dikembalikan ke tata letak standar SMPN 3 Kras."
    });
  }, [setSchoolMap, addSystemLog]);

  // Asset Usage Status Calculation & Governance (Permendagri 19/2016 BMD)
  const getAssetUsageRecord = useCallback((assetId: string): AssetUsageRecord => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) {
      return {
        asset: { id: assetId } as Asset,
        computedStatus: "Digunakan Sendiri (Operasional)",
        isAutomatic: true,
        keterangan: "Data aset tidak ditemukan"
      };
    }

    const room = rooms.find(r => r.id === asset.ruanganId || (asset.ruanganId && asset.ruanganId.includes(r.id)));
    const roomName = room ? `${room.nama} (${room.kodeRuangan})` : "Lokasi Belum Ditentukan";
    const buildingName = room?.bangunan || "Gedung Utama";

    // 1. Check Disposal / Penghapusan
    const activeDisposal = disposals.find(d => d.assetId === assetId && (d.status === "Diajukan" || d.status === "Disetujui" || d.status === "Selesai"));
    if (activeDisposal || asset.statusOperasional === "Dihapus / Dimusnahkan") {
      return {
        asset,
        computedStatus: "Proses Penghapusan",
        isAutomatic: true,
        keterangan: `Dalam proses penghapusan / pemusnahan (Surat: ${activeDisposal?.nomorSurat || 'BAST'})`,
        roomName,
        buildingName,
        activeEntityName: activeDisposal?.penanggungJawab || "Tim Penghapusan",
        sinceDate: activeDisposal?.tanggalPengajuan || activeDisposal?.tanggalEksekusi
      };
    }

    // 2. Check Active Borrowing / Peminjaman
    const activeBorrowing = borrowings.find(b => b.assetId === assetId && b.status === "Dipinjam");
    if (activeBorrowing || asset.statusOperasional === "Dipinjam") {
      return {
        asset,
        computedStatus: "Sedang Dipinjamkan",
        isAutomatic: true,
        keterangan: `Sedang dipinjam oleh ${activeBorrowing?.peminjam || 'Peminjam'} sejak ${activeBorrowing?.tanggalPinjam ? new Date(activeBorrowing.tanggalPinjam).toLocaleDateString("id-ID") : '-'}`,
        roomName,
        buildingName,
        activeEntityName: activeBorrowing?.peminjam,
        sinceDate: activeBorrowing?.tanggalPinjam
      };
    }

    // 3. Check Active Maintenance / Pemeliharaan
    const activeMaintenance = maintenances.find(m => m.assetId === assetId && (m.status === "Proses Perbaikan" || m.status === "Menunggu"));
    if (activeMaintenance || asset.statusOperasional === "Dalam Perbaikan") {
      return {
        asset,
        computedStatus: "Dalam Pemeliharaan",
        isAutomatic: true,
        keterangan: `Dalam perbaikan (${activeMaintenance?.teknisi || 'Teknisi Luar'}): ${activeMaintenance?.deskripsiKerusakan || 'Pemeriksaan fisik'}`,
        roomName,
        buildingName,
        activeEntityName: activeMaintenance?.teknisi || activeMaintenance?.pelapor,
        sinceDate: activeMaintenance?.tanggalLapor
      };
    }

    // 4. Check Active Mutation / Mutasi
    const activeMutation = mutations.find(mu => mu.assetId === assetId && mu.status === "Proses");
    if (activeMutation) {
      return {
        asset,
        computedStatus: "Proses Mutasi",
        isAutomatic: true,
        keterangan: `Sedang dalam proses mutasi antar ruangan: ${activeMutation.alasan || 'Relokasi'}`,
        roomName,
        buildingName,
        sinceDate: activeMutation.tanggalMutasi
      };
    }

    // 5. Check Condition: Rusak Berat, Hilang, Tidak Diketahui
    if (asset.kondisi === "Rusak Berat") {
      return {
        asset,
        computedStatus: "Rusak / Tidak Digunakan",
        isAutomatic: true,
        keterangan: "Kondisi fisik rusak berat, tidak dapat difungsikan untuk operasional pembelajaran (rekomendasi usul penghapusan)",
        roomName,
        buildingName
      };
    }

    if (asset.kondisi === "Hilang") {
      return {
        asset,
        computedStatus: "Hilang / Tidak Ditemukan",
        isAutomatic: true,
        keterangan: "Barang dinyatakan hilang dalam inventarisasi fisik sekolah (perlu proses BAP Kehilangan / ganti rugi)",
        roomName,
        buildingName
      };
    }

    if (asset.kondisi === "Tidak Diketahui") {
      return {
        asset,
        computedStatus: "Tidak Diketahui Keberadaannya",
        isAutomatic: true,
        keterangan: "Keberadaan fisik barang belum dapat dipastikan / belum terlacak pada lokasi ruangan",
        roomName,
        buildingName
      };
    }

    // 6. Check Warehouse / Gudang
    if (room && (room.jenis === "Gudang" || room.nama.toLowerCase().includes("gudang") || room.nama.toLowerCase().includes("transit"))) {
      return {
        asset,
        computedStatus: "Cadangan di Gudang",
        isAutomatic: true,
        keterangan: `Tersimpan di ${room.nama} sebagai persediaan cadangan / buffer sarpras`,
        roomName,
        buildingName
      };
    }

    // 7. Check Manual Override / Penetapan Status Penggunaan (PSP)
    if (asset.statusPenggunaanManual) {
      return {
        asset,
        computedStatus: asset.statusPenggunaanManual,
        isAutomatic: false,
        keterangan: asset.skPenetapanPenggunaan 
          ? `Ditetapkan melalui SK No. ${asset.skPenetapanPenggunaan} (${asset.tanggalPenetapanPenggunaan || '-'})`
          : `Penetapan status penggunaan pengurus barang`,
        roomName,
        buildingName,
        skNomor: asset.skPenetapanPenggunaan,
        tglSk: asset.tanggalPenetapanPenggunaan
      };
    }

    // 8. Default: Active Operational
    return {
      asset,
      computedStatus: "Digunakan Sendiri (Operasional)",
      isAutomatic: true,
      keterangan: `Aktif digunakan untuk operasional tupoksi sekolah di ${roomName}`,
      roomName,
      buildingName,
      skNomor: asset.skPenetapanPenggunaan,
      tglSk: asset.tanggalPenetapanPenggunaan
    };
  }, [assets, rooms, borrowings, maintenances, mutations, disposals]);

  const allAssetUsageRecords = useMemo(() => {
    return assets.map(a => getAssetUsageRecord(a.id));
  }, [assets, getAssetUsageRecord]);

  const updateAssetUsageStatus = useCallback((
    assetId: string, 
    status: AssetUsageCategory, 
    skNomor?: string, 
    tglSk?: string, 
    actorName: string = "Admin Sarpras"
  ) => {
    updateAssetWithAudit(assetId, {
      statusPenggunaanManual: status,
      skPenetapanPenggunaan: skNomor,
      tanggalPenetapanPenggunaan: tglSk || new Date().toISOString().split('T')[0]
    }, actorName, `Pembaruan status penetapan penggunaan barang aset: ${status}`);
  }, [updateAssetWithAudit]);

  const getFullDatabase = () => ({
    schoolProfile,
    assets,
    rooms,
    consumables,
    procurements,
    borrowings,
    mutations,
    maintenances,
    stocktakes,
    disposals,
    schoolMap,
    exportTimestamp: new Date().toISOString()
  });

  const importFullDatabase = async (data: any) => {
    if (!data || typeof data !== 'object') return;
    if (data.schoolProfile) setSchoolProfile(data.schoolProfile);
    if (Array.isArray(data.assets)) setAssets(data.assets);
    if (Array.isArray(data.rooms)) setRooms(data.rooms);
    if (Array.isArray(data.consumables)) setConsumables(data.consumables);
    if (Array.isArray(data.procurements)) setProcurements(data.procurements);
    if (Array.isArray(data.borrowings)) setBorrowings(data.borrowings);
    if (Array.isArray(data.mutations)) setMutations(data.mutations);
    if (Array.isArray(data.maintenances)) setMaintenances(data.maintenances);
    if (Array.isArray(data.stocktakes)) setStocktakes(data.stocktakes);
    if (Array.isArray(data.disposals)) setDisposals(data.disposals);
    if (Array.isArray(data.schoolMap)) setSchoolMap(data.schoolMap);

    addSystemLog({
      level: "WARNING",
      category: "DATABASE",
      action: "DATABASE_RESTORE_FULL",
      actor: "Admin Sarpras",
      ip: "127.0.0.1",
      description: `Database penuh berhasil dipulihkan dari cadangan eksternal (${data.assets?.length || 0} aset, ${data.rooms?.length || 0} ruangan).`
    });

    try {
      await fetch('/api/data-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': CLIENT_ID },
        body: JSON.stringify({ data, clientId: CLIENT_ID })
      });
    } catch {}
  };

  const resetToInitialData = async () => {
    setSchoolProfile(defaultProfile);
    setAssets(mockAssets);
    setRooms(mockRooms);
    setConsumables(mockConsumables);
    setProcurements(mockProcurements);
    setBorrowings(mockBorrowings);
    setMutations(mockMutations);
    setMaintenances(mockMaintenance);
    setStocktakes(mockStocktakes);
    setDisposals(mockDisposals);
    setSchoolMap(mockSchoolMap);

    try {
      await fetch('/api/data-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': CLIENT_ID },
        body: JSON.stringify({ clientId: CLIENT_ID })
      });
    } catch {}
  };

  return (
    <DataContext.Provider value={{
      schoolProfile, setSchoolProfile,
      assets, setAssets,
      rooms, setRooms,
      consumables, setConsumables,
      procurements, setProcurements,
      borrowings, setBorrowings,
      mutations, setMutations,
      maintenances, setMaintenances,
      stocktakes, setStocktakes,
      disposals, setDisposals,
      schoolMap, setSchoolMap,
      resetSchoolMapToDefault,
      getAssetUsageRecord,
      allAssetUsageRecords,
      updateAssetUsageStatus,
      getFullDatabase,
      importFullDatabase,
      resetToInitialData,
      realtimeStatus,
      isLiveRealtime,
      pingLatency,
      serverInfo,
      lastSyncTime,
      clientId: CLIENT_ID,
      activeClients,
      sessionHistory,
      refreshActiveClients,
      broadcastAlert,
      activeBroadcast,
      dismissBroadcast,
      systemLogs,
      addSystemLog,
      clearSystemLogs,
      // Data Integrity, State Machine & Audit
      getAssetLiveStatus,
      updateAssetWithAudit,
      deleteRoomSafe,
      deleteAssetSafe,
      approveDisposalAndArchive,
      completeMutation,
      applyStocktakeReconciliation,
      isNibarUnique,
      isRegisterUnique,
      validateDatabaseBackup
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
