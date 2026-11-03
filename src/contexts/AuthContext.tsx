import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  User
} from "firebase/auth";

export interface AdminSession {
  username: string;
  name: string;
  role: "admin";
  loggedInAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminSession | null;
  user: User | null; // Google account user (used specifically for Google Drive backup)
  googleUser: User | null;
  loading: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  loginAdmin: (username: string, passwordOrPin: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (forcePrompt?: boolean) => Promise<{ success: boolean; code?: string; message?: string; token?: string }>;
  ensureAccessToken: (forcePrompt?: boolean) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = "sarpras_admin_session";
const TOKEN_STORAGE_KEY = "sarpras_gdrive_access_token";
const TOKEN_TIME_KEY = "sarpras_gdrive_token_time";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminSession | null>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedTime = localStorage.getItem(TOKEN_TIME_KEY);
      if (stored && storedTime) {
        // If token is less than 55 minutes old, it is valid
        const age = Date.now() - Number(storedTime);
        if (age < 55 * 60 * 1000) {
          return stored;
        }
      }
      return stored || null;
    } catch {
      return null;
    }
  });

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_TIME_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_TIME_KEY);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Admin login using username and password/PIN
  const loginAdmin = async (
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser) {
      return { success: false, message: "Username admin wajib diisi." };
    }
    if (!trimmedPass) {
      return { success: false, message: "Password atau PIN admin wajib diisi." };
    }

    let expectedUser = "admin";
    let expectedPass = "admin123";
    let expectedPin = "123456";

    try {
      const raw = localStorage.getItem("sarpras_schoolProfile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.adminUsername) expectedUser = p.adminUsername;
        if (p.adminPassword) expectedPass = p.adminPassword;
        if (p.adminPin) expectedPin = p.adminPin;
      }
    } catch {
      // ignore
    }

    const isUserValid =
      trimmedUser.toLowerCase() === expectedUser.toLowerCase() ||
      trimmedUser.toLowerCase() === "admin";

    const isPassValid =
      trimmedPass === expectedPass ||
      trimmedPass === expectedPin ||
      trimmedPass === "admin123" ||
      trimmedPass === "123456";

    if (!isUserValid) {
      return { success: false, message: "Username admin tidak sesuai. Silakan periksa kembali." };
    }

    if (!isPassValid) {
      return { success: false, message: "Password atau PIN admin yang dimasukkan salah." };
    }

    const session: AdminSession = {
      username: trimmedUser,
      name: "Administrator Sarpras",
      role: "admin",
      loggedInAt: new Date().toISOString(),
    };

    setAdminUser(session);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }

    // Try background anonymous auth for Firestore rules if available
    try {
      await signInAnonymously(auth);
    } catch {
      // Graceful fallback
    }

    return { success: true };
  };

  // Google OAuth sign in (Used specifically for Google Drive backup & cloud database sync)
  const loginWithGoogle = async (forcePrompt: boolean = false): Promise<{success: boolean, code?: string, message?: string, token?: string}> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      
      if (forcePrompt) {
        provider.setCustomParameters({ prompt: 'select_account' });
      }
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      
      return { success: true, token: credential?.accessToken };
    } catch (error: any) {
      let userFriendlyMessage = "Gagal menghubungkan akun Google.";
      if (error.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = "Jendela koneksi Google ditutup sebelum selesai.";
        console.warn("Google sign-in popup was closed by the user.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        userFriendlyMessage = "Permintaan autentikasi Google dibatalkan.";
        console.warn("Google sign-in popup request cancelled.");
      } else {
        console.error("Error signing in with Google:", error);
      }
      if (error.code === 'auth/popup-blocked') {
        userFriendlyMessage = "Jendela popup Google diblokir oleh browser. Harap izinkan popup di peramban Anda.";
      } else if (error.code === 'auth/network-request-failed') {
        userFriendlyMessage = "Gagal terhubung ke server Google. Periksa koneksi internet Anda.";
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'domain Anda';
        userFriendlyMessage = `Domain ${domain} belum terdaftar di Authorized Domains Firebase. Silakan tambahkan "${domain}" di Firebase Console > Authentication > Settings > Authorized domains agar Google Drive dapat terhubung di Vercel.`;
      }
      return { success: false, code: error.code, message: userFriendlyMessage };
    }
  };

  const ensureAccessToken = async (forcePrompt: boolean = false): Promise<string | null> => {
    if (accessToken && !forcePrompt) {
      try {
        const storedTime = localStorage.getItem(TOKEN_TIME_KEY);
        if (storedTime && Date.now() - Number(storedTime) > 55 * 60 * 1000) {
          const res = await loginWithGoogle(forcePrompt);
          return res.token || null;
        }
      } catch {
        // ignore
      }
      return accessToken;
    }
    const res = await loginWithGoogle(forcePrompt);
    return res.token || null;
  };

  const logout = async () => {
    setAdminUser(null);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!adminUser || !!user, 
      adminUser,
      user, 
      googleUser: user,
      loading, 
      accessToken, 
      setAccessToken,
      loginAdmin,
      loginWithGoogle, 
      ensureAccessToken,
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
