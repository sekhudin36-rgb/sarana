import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Cloud,
  CheckCircle2,
  KeyRound,
  ArrowLeft
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { motion } from "motion/react";

export default function Login() {
  const { loginAdmin, isAuthenticated } = useAuth();
  const { schoolProfile } = useData();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const appIcon = schoolProfile.logoAplikasi || schoolProfile.logoSekolah || "/icon.svg";

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg("Harap masukkan username admin.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Harap masukkan password atau PIN admin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAdmin(username, password);
      if (result.success) {
        toast("Login berhasil! Selamat datang di SIM Sarpras.", "success");
        navigate("/");
      } else {
        setErrorMsg(result.message || "Username atau password salah.");
        toast(result.message || "Gagal masuk. Periksa username dan password Anda.", "error");
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan saat memverifikasi akun.");
      toast("Terjadi kesalahan saat masuk.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4 selection:bg-primary-500 selection:text-white relative overflow-hidden">
      {/* Futuristic Ambient Glowing Elements */}
      <motion.div 
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-[520px] h-[520px] bg-primary-600/25 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      <motion.div 
        animate={{ 
          rotate: [360, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-[580px] h-[580px] bg-cyan-500/20 rounded-full blur-[140px] translate-x-1/2 translate-y-1/2 pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        {/* Left Side: Futuristic Branding / Graphic Banner */}
        <div className="md:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* App Emblem & Title */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3.5 mb-10"
            >
              <div className="h-12 w-12 flex items-center justify-center shrink-0">
                <img src={appIcon} alt="Logo Aplikasi" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight block">SIM Sarpras SMP</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-200">
                  {schoolProfile.nama || "Sistem Inventaris Sekolah"}
                </span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white">
                Portal Manajemen Sarana & Prasarana
              </h1>
              <p className="text-primary-100/90 text-sm md:text-base leading-relaxed">
                Kelola aset, ruangan, peminjaman barang, serta riwayat mutasi dengan transparan, akurat, dan terstruktur.
              </p>

              {/* Feature Highlights */}
              <div className="pt-4 space-y-2.5 text-xs text-primary-100/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Autentikasi admin mandiri & kontrol akses penuh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-cyan-300 shrink-0" />
                  <span>Pencadangan cloud & database terisolasi Google Drive</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-300 shrink-0" />
                  <span>Pencatatan inventaris KIB (A-F) dan pelabelan QR Code</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="relative z-10 mt-10 pt-6 border-t border-white/10 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] text-primary-200 font-semibold tracking-wider uppercase">Dikembangkan Oleh</p>
              <p className="text-base font-bold text-white tracking-tight">Khabibu Rohman</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
          </motion.div>
        </div>

        {/* Right Side: Admin Username & Password Login Form */}
        <div className="md:w-1/2 p-7 md:p-11 lg:p-14 flex flex-col justify-center bg-white dark:bg-slate-900">
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-sm w-full mx-auto"
          >
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold mb-3">
                <KeyRound className="h-3.5 w-3.5" />
                Login Administrator
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Selamat Datang 👋
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-xs sm:text-sm">
                Masukkan kredensial <strong>username</strong> dan <strong>password</strong> admin untuk masuk ke sistem.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium">{errorMsg}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Username Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="admin"
                    autoFocus
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password / PIN
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Default: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">admin123</code>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-primary-600/25 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isSubmitting ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Cloud Backup Notification Info */}
            <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                Pencadangan Akun Google:
              </div>
              <p className="leading-relaxed">
                Akun Google digunakan khusus untuk fitur pencadangan (backup) dan sinkronisasi Google Drive yang dapat dihubungkan langsung dari dashboard setelah login.
              </p>
            </div>

            {/* Return Link */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/portal-peminjaman")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke Portal Peminjaman
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
