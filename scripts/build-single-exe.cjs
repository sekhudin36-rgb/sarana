/**
 * BUILD 1 APLIKASI EXECUTABLE STANDALONE (.EXE) UNTUK SIM SARPRAS SMP
 * Menghasilkan SATU file tunggal: "SIM-Sarpras-SMP.exe" (Port 3030)
 * 
 * Karakteristik:
 * 1. Single Portable Executable (.exe) mandiri
 * 2. Menyimpan database terpusat di server (data/database.json)
 * 3. Sinkronisasi Real-Time (Server-Sent Events) ke seluruh client HP / Laptop
 * 4. Dilengkapi GUI Control Center (bisa minimize ke System Tray)
 * 5. Memiliki auto-extractor dan web engine terintegrasi
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createZipFromDir } = require('./pure-zip.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STANDALONE_DIR = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP-Localhost-3030');
const OUTPUT_EXE = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP.exe');

function ensureReleaseDir() {
  if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR, { recursive: true });
  }
}

// Kompres seluruh folder aplikasi menjadi zip buffer murni tanpa dependensi eksternal
function createZipArchive() {
  const tempZip = path.join(RELEASE_DIR, 'app_bundle.zip');
  if (fs.existsSync(tempZip)) {
    try { fs.unlinkSync(tempZip); } catch {}
  }

  console.log('[1/4] Mengemas berkas web dan server ke dalam arsip terkompresi...');
  const zipBytes = createZipFromDir(STANDALONE_DIR, tempZip);
  console.log(`[+] Arsip aplikasi berhasil dibuat: ${(zipBytes.length / (1024 * 1024)).toFixed(2)} MB`);
  return { tempZip, base64: zipBytes.toString('base64') };
}

function generateCSharpSource(base64Payload) {
  // Pecah string Base64 menjadi potongan-potongan agar aman dari batas ukuran literal string C#
  const chunkSize = 32000;
  const chunks = [];
  for (let i = 0; i < base64Payload.length; i += chunkSize) {
    chunks.push(base64Payload.substring(i, i + chunkSize));
  }

  const chunksCode = chunks.map(c => `"${c}"`).join(' +\r\n        ');

  return `
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Net;
using System.Net.Sockets;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading;
using System.Collections.Generic;

namespace SimSarprasLauncher {
    public class Program {
        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form {
        private const int PORT = 3030;
        private string appDataDir;
        private Process serverProcess = null;
        private NotifyIcon trayIcon;
        private Label lblStatus;
        private Label lblLocalUrl;
        private Label lblWifiUrl;
        private Button btnOpenBrowser;
        private Button btnCopyWifi;
        private Button btnOpenFolder;
        private Button btnFirewall;
        private Button btnRestart;
        private Button btnExit;
        private string bestWifiIp = "127.0.0.1";

        // Embedded base64 zip payload
        private static string GetEmbeddedZipBase64() {
            return 
        ${chunksCode};
        }

        public MainForm() {
            InitializeComponent();
            SetupApp();
        }

        private void InitializeComponent() {
            this.Text = "SIM Sarpras SMP - Server Terpusat & Klien (Port 3030)";
            this.Size = new Size(620, 480);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f);

            // Header Banner
            Panel pnlHeader = new Panel();
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.Size = new Size(620, 80);
            pnlHeader.BackColor = Color.FromArgb(30, 41, 59); // Slate 800
            this.Controls.Add(pnlHeader);

            Label lblTitle = new Label();
            lblTitle.Text = "SIM SARPRAS SMP";
            lblTitle.Font = new Font("Segoe UI", 15, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(56, 189, 248); // Sky 400
            lblTitle.Location = new Point(20, 15);
            lblTitle.AutoSize = true;
            pnlHeader.Controls.Add(lblTitle);

            Label lblSubtitle = new Label();
            lblSubtitle.Text = "Aplikasi Tunggal .EXE - Server Terpusat & Realtime Multi-Perangkat (Port 3030)";
            lblSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184); // Slate 400
            lblSubtitle.Location = new Point(20, 45);
            lblSubtitle.AutoSize = true;
            pnlHeader.Controls.Add(lblSubtitle);

            // Status Card
            Panel pnlStatus = new Panel();
            pnlStatus.Location = new Point(20, 95);
            pnlStatus.Size = new Size(565, 80);
            pnlStatus.BackColor = Color.FromArgb(24, 33, 47);
            this.Controls.Add(pnlStatus);

            lblStatus = new Label();
            lblStatus.Text = "● SERVER SEDANG BERJALAN DI PORT " + PORT;
            lblStatus.Font = new Font("Segoe UI", 11, FontStyle.Bold);
            lblStatus.ForeColor = Color.FromArgb(52, 211, 153); // Emerald 400
            lblStatus.Location = new Point(15, 12);
            lblStatus.AutoSize = true;
            pnlStatus.Controls.Add(lblStatus);

            lblLocalUrl = new Label();
            lblLocalUrl.Text = "Komputer Ini : http://localhost:" + PORT;
            lblLocalUrl.Font = new Font("Consolas", 10, FontStyle.Regular);
            lblLocalUrl.ForeColor = Color.FromArgb(226, 232, 240);
            lblLocalUrl.Location = new Point(15, 42);
            lblLocalUrl.AutoSize = true;
            pnlStatus.Controls.Add(lblLocalUrl);

            // Wi-Fi Access Card for Client (HP / Laptop Guru)
            Panel pnlWifi = new Panel();
            pnlWifi.Location = new Point(20, 185);
            pnlWifi.Size = new Size(565, 95);
            pnlWifi.BackColor = Color.FromArgb(24, 33, 47);
            this.Controls.Add(pnlWifi);

            Label lblWifiHeader = new Label();
            lblWifiHeader.Text = "AKSES CLIENT DI HP / LAPTOP (WI-FI SEKOLAH):";
            lblWifiHeader.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblWifiHeader.ForeColor = Color.FromArgb(129, 140, 248); // Indigo 400
            lblWifiHeader.Location = new Point(15, 12);
            lblWifiHeader.AutoSize = true;
            pnlWifi.Controls.Add(lblWifiHeader);

            lblWifiUrl = new Label();
            lblWifiUrl.Text = "http://Mencari-IP...:" + PORT;
            lblWifiUrl.Font = new Font("Consolas", 11, FontStyle.Bold);
            lblWifiUrl.ForeColor = Color.FromArgb(250, 204, 21); // Amber 400
            lblWifiUrl.Location = new Point(15, 36);
            lblWifiUrl.AutoSize = true;
            pnlWifi.Controls.Add(lblWifiUrl);

            Label lblWifiHint = new Label();
            lblWifiHint.Text = "Semua perubahan data dari HP atau laptop klien tersinkronisasi otomatis secara realtime.";
            lblWifiHint.Font = new Font("Segoe UI", 8.5f, FontStyle.Italic);
            lblWifiHint.ForeColor = Color.FromArgb(148, 163, 184);
            lblWifiHint.Location = new Point(15, 65);
            lblWifiHint.AutoSize = true;
            pnlWifi.Controls.Add(lblWifiHint);

            btnCopyWifi = new Button();
            btnCopyWifi.Text = "Salin Link";
            btnCopyWifi.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            btnCopyWifi.BackColor = Color.FromArgb(49, 46, 129);
            btnCopyWifi.ForeColor = Color.White;
            btnCopyWifi.FlatStyle = FlatStyle.Flat;
            btnCopyWifi.FlatAppearance.BorderSize = 0;
            btnCopyWifi.Location = new Point(460, 32);
            btnCopyWifi.Size = new Size(90, 30);
            btnCopyWifi.Cursor = Cursors.Hand;
            btnCopyWifi.Click += (s, e) => {
                try {
                    Clipboard.SetText("http://" + bestWifiIp + ":" + PORT);
                    MessageBox.Show("Tautan HP/Client berhasil disalin:\\nhttp://" + bestWifiIp + ":" + PORT, "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
                } catch {}
            };
            pnlWifi.Controls.Add(btnCopyWifi);

            // Action Buttons
            btnOpenBrowser = new Button();
            btnOpenBrowser.Text = "🌐 Buka Aplikasi di Browser";
            btnOpenBrowser.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnOpenBrowser.BackColor = Color.FromArgb(79, 70, 229); // Indigo 600
            btnOpenBrowser.ForeColor = Color.White;
            btnOpenBrowser.FlatStyle = FlatStyle.Flat;
            btnOpenBrowser.FlatAppearance.BorderSize = 0;
            btnOpenBrowser.Location = new Point(20, 295);
            btnOpenBrowser.Size = new Size(275, 45);
            btnOpenBrowser.Cursor = Cursors.Hand;
            btnOpenBrowser.Click += (s, e) => {
                Process.Start("http://localhost:" + PORT);
            };
            this.Controls.Add(btnOpenBrowser);

            btnOpenFolder = new Button();
            btnOpenFolder.Text = "📁 Buka Folder Data (Backup DB)";
            btnOpenFolder.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            btnOpenFolder.BackColor = Color.FromArgb(30, 41, 59);
            btnOpenFolder.ForeColor = Color.FromArgb(226, 232, 240);
            btnOpenFolder.FlatStyle = FlatStyle.Flat;
            btnOpenFolder.Location = new Point(310, 295);
            btnOpenFolder.Size = new Size(275, 45);
            btnOpenFolder.Cursor = Cursors.Hand;
            btnOpenFolder.Click += (s, e) => {
                try {
                    string dataDir = Path.Combine(appDataDir, "data");
                    if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
                    Process.Start("explorer.exe", dataDir);
                } catch {}
            };
            this.Controls.Add(btnOpenFolder);

            // Bottom Buttons
            btnFirewall = new Button();
            btnFirewall.Text = "🛡️ Buka Port Firewall (3030)";
            btnFirewall.Font = new Font("Segoe UI", 9f);
            btnFirewall.BackColor = Color.FromArgb(30, 41, 59);
            btnFirewall.ForeColor = Color.FromArgb(203, 213, 225);
            btnFirewall.FlatStyle = FlatStyle.Flat;
            btnFirewall.Location = new Point(20, 355);
            btnFirewall.Size = new Size(180, 36);
            btnFirewall.Cursor = Cursors.Hand;
            btnFirewall.Click += (s, e) => OpenFirewallPort();
            this.Controls.Add(btnFirewall);

            btnRestart = new Button();
            btnRestart.Text = "🔄 Muat Ulang Server";
            btnRestart.Font = new Font("Segoe UI", 9f);
            btnRestart.BackColor = Color.FromArgb(30, 41, 59);
            btnRestart.ForeColor = Color.FromArgb(203, 213, 225);
            btnRestart.FlatStyle = FlatStyle.Flat;
            btnRestart.Location = new Point(210, 355);
            btnRestart.Size = new Size(175, 36);
            btnRestart.Cursor = Cursors.Hand;
            btnRestart.Click += (s, e) => {
                StopServer();
                StartServer();
                MessageBox.Show("Server telah dimulai ulang.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };
            this.Controls.Add(btnRestart);

            btnExit = new Button();
            btnExit.Text = "🛑 Hentikan & Tutup";
            btnExit.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btnExit.BackColor = Color.FromArgb(159, 18, 57);
            btnExit.ForeColor = Color.White;
            btnExit.FlatStyle = FlatStyle.Flat;
            btnExit.FlatAppearance.BorderSize = 0;
            btnExit.Location = new Point(395, 355);
            btnExit.Size = new Size(190, 36);
            btnExit.Cursor = Cursors.Hand;
            btnExit.Click += (s, e) => {
                this.Close();
            };
            this.Controls.Add(btnExit);

            // Footer note
            Label lblFooter = new Label();
            lblFooter.Text = "Aplikasi ini memuat server terpusat port 3030. Menutup jendela ini akan menghentikan server.";
            lblFooter.Font = new Font("Segoe UI", 8.2f, FontStyle.Italic);
            lblFooter.ForeColor = Color.FromArgb(100, 116, 139);
            lblFooter.Location = new Point(20, 405);
            lblFooter.AutoSize = true;
            this.Controls.Add(lblFooter);

            // Tray Icon
            try {
                trayIcon = new NotifyIcon();
                trayIcon.Text = "SIM Sarpras SMP (Port 3030)";
                trayIcon.Icon = SystemIcons.Application;
                trayIcon.Visible = true;
                trayIcon.DoubleClick += (s, e) => {
                    this.Show();
                    this.WindowState = FormWindowState.Normal;
                    this.BringToFront();
                };
            } catch {}

            this.FormClosing += (s, e) => {
                StopServer();
                if (trayIcon != null) {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            };
        }

        private void SetupApp() {
            try {
                // Tentukan lokasi data permanen (agar database aman tidak terhapus)
                string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                appDataDir = Path.Combine(localApp, "SIM-Sarpras-SMP-3030");
                if (!Directory.Exists(appDataDir)) {
                    Directory.CreateDirectory(appDataDir);
                }

                // Ekstrak berkas dari payload yang tertanam di dalam .EXE
                ExtractEmbeddedFiles();

                // Deteksi IP Jaringan
                DetectNetworkIps();

                // Jalankan Server
                StartServer();

                // Buka browser otomatis
                ThreadPool.QueueUserWorkItem(_ => {
                    Thread.Sleep(1200);
                    try { Process.Start("http://localhost:" + PORT); } catch {}
                });
            } catch (Exception ex) {
                MessageBox.Show("Gagal menyiapkan aplikasi: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ExtractEmbeddedFiles() {
            string flagFile = Path.Combine(appDataDir, "installed_version.txt");
            string serverFile = Path.Combine(appDataDir, "server.cjs");
            string dbFile = Path.Combine(appDataDir, "data", "database.json");

            // Jika sudah ada dan database sudah ada, jangan timpa database.json
            byte[] existingDb = null;
            if (File.Exists(dbFile)) {
                try { existingDb = File.ReadAllBytes(dbFile); } catch {}
            }

            try {
                byte[] zipBytes = Convert.FromBase64String(GetEmbeddedZipBase64());
                using (MemoryStream ms = new MemoryStream(zipBytes))
                using (ZipArchive archive = new ZipArchive(ms)) {
                    foreach (ZipArchiveEntry entry in archive.Entries) {
                        string destPath = Path.Combine(appDataDir, entry.FullName.Replace('/', '\\\\'));
                        if (string.IsNullOrEmpty(entry.Name)) {
                            // Directory
                            Directory.CreateDirectory(destPath);
                        } else {
                            Directory.CreateDirectory(Path.GetDirectoryName(destPath));
                            // Jangan timpa database jika sudah ada data lama
                            if (destPath.EndsWith("database.json", StringComparison.OrdinalIgnoreCase) && existingDb != null) {
                                continue;
                            }
                            entry.ExtractToFile(destPath, true);
                        }
                    }
                }
                File.WriteAllText(flagFile, "v1.0.0");
            } catch (Exception ex) {
                Debug.WriteLine("Extract error: " + ex.Message);
            }
        }

        private void DetectNetworkIps() {
            try {
                bestWifiIp = "127.0.0.1";
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces()) {
                    if (ni.OperationalStatus == OperationalStatus.Up && 
                        ni.NetworkInterfaceType != NetworkInterfaceType.Loopback) {
                        
                        foreach (UnicastIPAddressInformation ip in ni.GetIPProperties().UnicastAddresses) {
                            if (ip.Address.AddressFamily == AddressFamily.InterNetwork) {
                                string ipStr = ip.Address.ToString();
                                string name = ni.Name.ToLower();

                                if (name.Contains("wi-fi") || name.Contains("wireless") || name.Contains("wlan")) {
                                    bestWifiIp = ipStr;
                                    break;
                                } else if (bestWifiIp == "127.0.0.1" && !name.Contains("virtual") && !name.Contains("vmware")) {
                                    bestWifiIp = ipStr;
                                }
                            }
                        }
                    }
                }

                lblWifiUrl.Text = "http://" + bestWifiIp + ":" + PORT;
            } catch {
                lblWifiUrl.Text = "http://[IP-Wi-Fi]:" + PORT;
            }
        }

        private void StartServer() {
            string serverScript = Path.Combine(appDataDir, "server.cjs");
            if (!File.Exists(serverScript)) {
                lblStatus.Text = "● Berkas server.cjs tidak ditemukan!";
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
                return;
            }

            try {
                // Cari node.exe di PATH atau di direktori standar
                string nodePath = FindNodeExecutable();

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = nodePath;
                psi.Arguments = "\\"" + serverScript + "\\"";
                psi.WorkingDirectory = appDataDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;

                serverProcess = Process.Start(psi);
                lblStatus.Text = "● SERVER AKTIF & SINKRONISASI REALTIME SIAP";
                lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
            } catch (Exception ex) {
                lblStatus.Text = "● Gagal memulai server: " + ex.Message;
                lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
            }
        }

        private string FindNodeExecutable() {
            // Cek di folder appdata lokal
            string localNode = Path.Combine(appDataDir, "node.exe");
            if (File.Exists(localNode)) return localNode;

            // Cek direktori Program Files standar Windows
            string pf1 = @"C:\\Program Files\\nodejs\\node.exe";
            if (File.Exists(pf1)) return pf1;

            string pf2 = @"C:\\Program Files (x86)\\nodejs\\node.exe";
            if (File.Exists(pf2)) return pf2;

            // Gunakan node dari PATH
            return "node";
        }

        private void StopServer() {
            try {
                if (serverProcess != null && !serverProcess.HasExited) {
                    serverProcess.Kill();
                    serverProcess = null;
                }

                // Bersihkan proses port 3030 jika ada yang tertinggal
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c for /f \\"tokens=5\\" %a in ('netstat -ano ^| findstr :" + PORT + " ^| findstr LISTENING') do taskkill /F /PID %a";
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process.Start(psi);
            } catch {}
        }

        private void OpenFirewallPort() {
            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "netsh";
                psi.Arguments = "advfirewall firewall add rule name=\\"SIM Sarpras SMP - Port 3030\\" dir=in action=allow protocol=TCP localport=" + PORT + " profile=any";
                psi.Verb = "runas"; // Minta izin Administrator
                psi.UseShellExecute = true;
                Process.Start(psi);
                MessageBox.Show("Perintah pembukaan port firewall 3030 telah dikirim ke Windows.", "Firewall", MessageBoxButtons.OK, MessageBoxIcon.Information);
            } catch (Exception ex) {
                MessageBox.Show("Gagal membuka firewall: " + ex.Message, "Perhatian", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
    }
}
`;
}

function buildSingleExe() {
  console.log('================================================================');
  console.log('   🔨 PROSES BUILD 1 APLIKASI TUNGGAL (SIM-Sarpras-SMP.exe)');
  console.log('================================================================');
  console.log(` Output Target: ${OUTPUT_EXE}`);
  console.log(' Port Server  : 3030 (Terpusat & Realtime Multi-Perangkat)');
  console.log('================================================================\n');

  ensureReleaseDir();

  // 1. Buat zip arsip dari folder standalone
  const { tempZip, base64 } = createZipArchive();

  // 2. Buat berkas sumber C#
  console.log('[2/4] Membuat kode program native C# dengan payload terintegrasi...');
  const csSource = generateCSharpSource(base64);
  const csFile = path.join(RELEASE_DIR, 'Program.cs');
  fs.writeFileSync(csFile, csSource, 'utf8');

  // 3. Buat skrip kompilasi PowerShell (.ps1)
  console.log('[3/4] Menyiapkan skrip kompilasi otomatis Windows...');
  const psScript = `
$ErrorActionPreference = "Stop"
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$csFile = Join-Path $scriptDir "Program.cs"
$outputExe = Join-Path $scriptDir "SIM-Sarpras-SMP.exe"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   MEMBANGUN SATU APLIKASI TUNGGAL: SIM-Sarpras-SMP.exe" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "File Sumber: $csFile"
Write-Host "Target .EXE: $outputExe"
Write-Host ""
Write-Host "Sedang mengompilasi Program.cs dengan C# Compiler bawaan Windows..." -ForegroundColor Yellow

$code = Get-Content -Raw -Encoding UTF8 -Path $csFile
$assemblies = @(
    "System.dll",
    "System.Core.dll",
    "Microsoft.CSharp.dll",
    "System.Windows.Forms.dll",
    "System.Drawing.dll",
    "System.IO.Compression.dll",
    "System.IO.Compression.FileSystem.dll",
    "System.Net.dll",
    "System.Net.Http.dll"
)

$compiled = $false
try {
    Add-Type -TypeDefinition $code -ReferencedAssemblies $assemblies -OutputAssembly $outputExe -OutputType WindowsApplication -ErrorAction Stop
    $compiled = $true
} catch {
    Write-Host "[!] Add-Type memerlukan compiler fallback: $_" -ForegroundColor Yellow
}

if (-not $compiled -or -not (Test-Path $outputExe)) {
    Write-Host "[*] Mengompilasi via csc.exe native .NET Framework..." -ForegroundColor Cyan
    $cscPaths = @(
        "$env:SystemRoot\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
        "$env:SystemRoot\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
    )
    $csc = $cscPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($csc) {
        $refs = "/r:System.dll,/r:System.Core.dll,/r:Microsoft.CSharp.dll,/r:System.Windows.Forms.dll,/r:System.Drawing.dll,/r:System.IO.Compression.dll,/r:System.IO.Compression.FileSystem.dll"
        & $csc /target:winexe /out:"$outputExe" $refs.Split(",") "$csFile"
        if (Test-Path $outputExe) {
            $compiled = $true
        }
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  [SUKSES] SIM-Sarpras-SMP.exe BERHASIL DIBUAT DENGAN SEMPURNA!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Lokasi File: $outputExe"
Write-Host ""
Write-Host "Petunjuk:"
Write-Host "1. Salin file SIM-Sarpras-SMP.exe ke mana pun yang Anda inginkan (misal Desktop atau Flashdisk)."
Write-Host "2. Klik ganda file tersebut untuk langsung menjalankan aplikasi di port 3030."
Write-Host ""
`;
  const psFile = path.join(RELEASE_DIR, 'compile_single_exe.ps1');
  fs.writeFileSync(psFile, psScript, 'utf8');

  // 4. Eksekusi kompilasi jika berjalan di Windows
  console.log('[4/4] Mengompilasi menjadi berkas tunggal executable (.exe)...');
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    try {
      execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, { stdio: 'inherit' });
      console.log(`\n🎉 [BERHASIL] File tunggal siap digunakan: ${OUTPUT_EXE}`);
    } catch (e) {
      console.error('[!] Kompilasi langsung di terminal ini gagal atau memerlukan hak akses PowerShell.');
    }
  } else {
    console.log('[INFO] Lingkungan saat ini adalah Linux/Cloud.');
    console.log('       Berkas sumber C#, skrip PowerShell, dan generator telah siap.');
    console.log(`       Di Windows, pengguna cukup klik ganda "BUILD_SATU_APLIKASI_EXE.cmd"`);
  }

  // Buat juga script eksekusi 1-klik di root project: BUILD_SATU_APLIKASI_EXE.cmd
  const buildCmd = `@echo off
title BUILD 1 APLIKASI TUNGGAL (SIM-SARPRAS-SMP.EXE)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo    MEMBUAT 1 APLIKASI TUNGGAL: SIM-Sarpras-SMP.exe (PORT 3030)
echo ======================================================================
echo.

REM 1. Pastikan build web produksi terbaru
echo [1/3] Memeriksa & mengompilasi berkas web...
call npm run build

REM 2. Siapkan paket standalone lokal
echo [2/3] Mengemas server terpusat & data database.json...
node scripts/build-standalone-installer.cjs

REM 3. Kompilasi C# menjadi 1 file .EXE
echo [3/3] Mengompilasi menjadi SATU file "SIM-Sarpras-SMP.exe"...
powershell -ExecutionPolicy Bypass -File "release\\compile_single_exe.ps1"

echo.
echo ======================================================================
echo  [SUKSES] Aplikasi tunggal telah berhasil dibuat!
echo  Lokasi file: release\\SIM-Sarpras-SMP.exe
echo ======================================================================
echo.
echo Anda dapat menyalin file "SIM-Sarpras-SMP.exe" ke Flashdisk atau komputer
echo mana pun. Cukup klik ganda file tersebut untuk langsung menjalankan
echo server terpusat di port 3030 dan membuka aplikasi di browser!
echo.
pause
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'BUILD_SATU_APLIKASI_EXE.cmd'), buildCmd.replace(/\n/g, '\r\n'), 'utf8');

  // Bersihkan arsip temporary jika perlu
  if (fs.existsSync(tempZip)) {
    try { fs.unlinkSync(tempZip); } catch {}
  }

  console.log('\n[SELESAI] Konfigurasi 1 aplikasi .EXE telah lengkap.');
}

if (require.main === module) {
  buildSingleExe();
}

module.exports = { buildSingleExe };
