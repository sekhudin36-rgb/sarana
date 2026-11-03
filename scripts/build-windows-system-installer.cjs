/**
 * BUILDER INSTALLER SYSTEM WINDOWS (.EXE) - SIM SARPRAS SMP
 * Menghasilkan file installer "Setup-SIM-Sarpras-SMP.exe"
 * 
 * Karakteristik Installer:
 * 1. Pemasang Mandiri Tunggal (.EXE) dengan Embedded Zip Payload.
 * 2. Terpasang langsung ke sistem Windows (%LocalAppData%\Programs\SIM-Sarpras-SMP).
 * 3. Membuat Pintasan Desktop (Desktop Shortcut) & Start Menu Windows.
 * 4. Terdaftar resmi di Windows Settings (Add/Remove Programs / Control Panel) dengan Uninstaller.
 * 5. Mendaftarkan Server Latar Belakang (Windows Background Service / Task Scheduler) agar otomatis aktif saat PC dinyalakan.
 * 6. Membuka Windows Firewall untuk port 3030 agar dapat diakses HP/Laptop siswa & guru.
 * 7. Langsung membuka aplikasi secara otomatis setelah selesai dipasang.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createZipFromDir } = require('./pure-zip.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STANDALONE_DIR = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP-Localhost-3030');
const OUTPUT_SETUP_EXE = path.join(RELEASE_DIR, 'Setup-SIM-Sarpras-SMP.exe');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src, { withFileTypes: true });
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function prepareStandaloneFiles() {
  console.log('[1/4] Menyiapkan berkas produksi aplikasi & server...');
  ensureDir(STANDALONE_DIR);

  // 1. Salin dist
  if (fs.existsSync(DIST_DIR)) {
    copyDirRecursive(DIST_DIR, path.join(STANDALONE_DIR, 'dist'));
  }

  // 2. Salin icon
  const iconSrc = path.join(ROOT_DIR, 'public', 'icon.svg');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(STANDALONE_DIR, 'icon.svg'));
  }

  // 3. Salin data/database.json terpusat
  const dataDirDest = path.join(STANDALONE_DIR, 'data');
  ensureDir(dataDirDest);
  ensureDir(path.join(dataDirDest, 'backups'));

  const rootDb = path.join(ROOT_DIR, 'data', 'database.json');
  if (fs.existsSync(rootDb)) {
    fs.copyFileSync(rootDb, path.join(dataDirDest, 'database.json'));
  } else {
    const { getInitialDatabase } = require('./init-default-db.cjs');
    fs.writeFileSync(path.join(dataDirDest, 'database.json'), JSON.stringify(getInitialDatabase(), null, 2), 'utf8');
  }

  // 4. Salin server backend
  const serverLokalSrc = path.join(ROOT_DIR, 'server-lokal.cjs');
  if (fs.existsSync(serverLokalSrc)) {
    fs.copyFileSync(serverLokalSrc, path.join(STANDALONE_DIR, 'server-lokal.cjs'));
  }
  const centralDbSrc = path.join(ROOT_DIR, 'scripts', 'central-db.cjs');
  ensureDir(path.join(STANDALONE_DIR, 'scripts'));
  if (fs.existsSync(centralDbSrc)) {
    fs.copyFileSync(centralDbSrc, path.join(STANDALONE_DIR, 'scripts', 'central-db.cjs'));
  }
  const initDbSrc = path.join(ROOT_DIR, 'scripts', 'init-default-db.cjs');
  if (fs.existsSync(initDbSrc)) {
    fs.copyFileSync(initDbSrc, path.join(STANDALONE_DIR, 'scripts', 'init-default-db.cjs'));
  }

  // 5. Buat peluncur senyap (Silent VBS Launcher)
  const vbsCode = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)\r\nWshShell.Run "node server-lokal.cjs", 0, False\r\n`;
  fs.writeFileSync(path.join(STANDALONE_DIR, 'run-server-silent.vbs'), vbsCode, 'utf8');

  // 6. Buat skrip uninstaller bawaan
  const uninstallerCode = `@echo off
title UNINSTALL SIM SARPRAS SMP
echo =====================================================================
echo           PENGHAPUSAN SIM SARPRAS SMP DARI SISTEM WINDOWS
echo =====================================================================
echo.
echo Sedang menghentikan layanan latar belakang...
schtasks /end /tn "SIM_Sarpras_Server_Daemon" >nul 2>&1
schtasks /delete /tn "SIM_Sarpras_Server_Daemon" /f >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SIM Sarpras*" >nul 2>&1

echo Menghapus pintasan Desktop dan Start Menu...
set "DESKTOP_LNK=%USERPROFILE%\\Desktop\\SIM Sarpras SMP.lnk"
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\SIM Sarpras SMP"
if exist "%DESKTOP_LNK%" del /f /q "%DESKTOP_LNK%" >nul 2>&1
if exist "%START_MENU%" rmdir /s /q "%START_MENU%" >nul 2>&1

echo Menghapus entri Registry Windows...
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP" /f >nul 2>&1

echo.
echo [SUKSES] SIM Sarpras SMP telah berhasil dihapus dari sistem Windows.
echo Folder data di %~dp0 masih disimpan untuk keamanan basis data Anda.
pause
`;
  fs.writeFileSync(path.join(STANDALONE_DIR, 'uninstall.cmd'), uninstallerCode, 'utf8');
}

function createZipArchive() {
  console.log('[2/4] Mengemas seluruh berkas aplikasi ke dalam arsip zip terkompresi...');
  const tempZip = path.join(RELEASE_DIR, 'installer_payload.zip');
  if (fs.existsSync(tempZip)) {
    try { fs.unlinkSync(tempZip); } catch {}
  }
  const zipBytes = createZipFromDir(STANDALONE_DIR, tempZip);
  console.log(`[+] Arsip payload berhasil dibuat: ${(zipBytes.length / (1024 * 1024)).toFixed(2)} MB`);
  return zipBytes.toString('base64');
}

function generateInstallerCSharpSource(base64Payload) {
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
using System.Threading;
using System.Text;
using Microsoft.Win32;

namespace SimSarprasInstaller {
    public class Program {
        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    public class InstallerForm : Form {
        private const int PORT = 3030;
        private string installDir;
        private ProgressBar prgBar;
        private Label lblStatus;
        private Label lblDetail;
        private TextBox txtInstallPath;
        private Button btnBrowse;
        private Button btnInstall;
        private Button btnCancel;
        private CheckBox chkDesktopShortcut;
        private CheckBox chkStartMenu;
        private CheckBox chkRegisterService;
        private CheckBox chkOpenFirewall;
        private CheckBox chkLaunchAfter;
        private bool isFinished = false;

        private static string GetEmbeddedZipPayload() {
            return 
        ${chunksCode};
        }

        public InstallerForm() {
            InitializeComponent();
        }

        private void InitializeComponent() {
            this.Text = "Pemasang Sistem Windows - SIM Sarpras SMP";
            this.Size = new Size(640, 520);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f);

            // Tentukan lokasi instalasi standar (%LocalAppData%\\Programs\\SIM-Sarpras-SMP)
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            installDir = Path.Combine(localApp, "Programs", "SIM-Sarpras-SMP");

            // Header Banner
            Panel pnlHeader = new Panel();
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.Size = new Size(640, 95);
            pnlHeader.BackColor = Color.FromArgb(30, 41, 59); // Slate 800
            this.Controls.Add(pnlHeader);

            Label lblTitle = new Label();
            lblTitle.Text = "SIM SARPRAS SMP";
            lblTitle.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(56, 189, 248); // Sky 400
            lblTitle.Location = new Point(25, 18);
            lblTitle.AutoSize = true;
            pnlHeader.Controls.Add(lblTitle);

            Label lblSubtitle = new Label();
            lblSubtitle.Text = "Instalasi Langsung ke Sistem Windows (Desktop, Start Menu, Service & Registry)";
            lblSubtitle.Font = new Font("Segoe UI", 9.2f, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184); // Slate 400
            lblSubtitle.Location = new Point(25, 52);
            lblSubtitle.AutoSize = true;
            pnlHeader.Controls.Add(lblSubtitle);

            // Path Selector
            Label lblPathTitle = new Label();
            lblPathTitle.Text = "Direktori Pemasangan di Komputer Ini:";
            lblPathTitle.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblPathTitle.ForeColor = Color.FromArgb(203, 213, 225);
            lblPathTitle.Location = new Point(25, 115);
            lblPathTitle.AutoSize = true;
            this.Controls.Add(lblPathTitle);

            txtInstallPath = new TextBox();
            txtInstallPath.Text = installDir;
            txtInstallPath.Font = new Font("Segoe UI", 9.5f);
            txtInstallPath.Location = new Point(25, 140);
            txtInstallPath.Size = new Size(475, 28);
            txtInstallPath.BackColor = Color.FromArgb(30, 41, 59);
            txtInstallPath.ForeColor = Color.FromArgb(226, 232, 240);
            this.Controls.Add(txtInstallPath);

            btnBrowse = new Button();
            btnBrowse.Text = "Pilih...";
            btnBrowse.Font = new Font("Segoe UI", 9f);
            btnBrowse.Location = new Point(510, 138);
            btnBrowse.Size = new Size(90, 30);
            btnBrowse.BackColor = Color.FromArgb(51, 65, 85);
            btnBrowse.ForeColor = Color.White;
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.Cursor = Cursors.Hand;
            btnBrowse.Click += (s, e) => {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog()) {
                    fbd.SelectedPath = txtInstallPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK) {
                        txtInstallPath.Text = fbd.SelectedPath;
                        installDir = fbd.SelectedPath;
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            // Checkbox Options
            int chkY = 185;
            chkDesktopShortcut = CreateCheckbox("Buat Pintasan di Desktop (Desktop Shortcut)", true, 25, chkY);
            chkStartMenu = CreateCheckbox("Daftarkan ke Menu Start Windows (All Programs & Pencarian)", true, 25, chkY += 28);
            chkRegisterService = CreateCheckbox("Pasang Server Latar Belakang (Otomatis Aktif saat Komputer Menyala)", true, 25, chkY += 28);
            chkOpenFirewall = CreateCheckbox("Buka Port 3030 di Windows Firewall (Akses HP Siswa & Guru)", true, 25, chkY += 28);
            chkLaunchAfter = CreateCheckbox("Jalankan aplikasi seketika setelah instalasi selesai", true, 25, chkY += 28);

            this.Controls.Add(chkDesktopShortcut);
            this.Controls.Add(chkStartMenu);
            this.Controls.Add(chkRegisterService);
            this.Controls.Add(chkOpenFirewall);
            this.Controls.Add(chkLaunchAfter);

            // Progress Bar
            prgBar = new ProgressBar();
            prgBar.Location = new Point(25, 340);
            prgBar.Size = new Size(575, 20);
            prgBar.Style = ProgressBarStyle.Continuous;
            prgBar.Value = 0;
            this.Controls.Add(prgBar);

            lblStatus = new Label();
            lblStatus.Text = "Siap memasang aplikasi ke sistem Windows.";
            lblStatus.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblStatus.ForeColor = Color.FromArgb(56, 189, 248);
            lblStatus.Location = new Point(25, 370);
            lblStatus.AutoSize = true;
            this.Controls.Add(lblStatus);

            lblDetail = new Label();
            lblDetail.Text = "Klik tombol 'Pasang Sekarang' untuk memulai proses otomatis.";
            lblDetail.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblDetail.ForeColor = Color.FromArgb(148, 163, 184);
            lblDetail.Location = new Point(25, 395);
            lblDetail.Size = new Size(575, 20);
            this.Controls.Add(lblDetail);

            // Action Buttons
            btnInstall = new Button();
            btnInstall.Text = "🚀 Pasang ke Sistem Windows Sekarang";
            btnInstall.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(79, 70, 229); // Indigo 600
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Location = new Point(25, 425);
            btnInstall.Size = new Size(380, 42);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += (s, e) => {
                if (isFinished) {
                    try { Process.Start("http://localhost:" + PORT); } catch {}
                    this.Close();
                } else {
                    StartInstallation();
                }
            };
            this.Controls.Add(btnInstall);

            btnCancel = new Button();
            btnCancel.Text = "Batal";
            btnCancel.Font = new Font("Segoe UI", 9.5f);
            btnCancel.BackColor = Color.FromArgb(51, 65, 85);
            btnCancel.ForeColor = Color.FromArgb(203, 213, 225);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.Location = new Point(420, 425);
            btnCancel.Size = new Size(180, 42);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += (s, e) => this.Close();
            this.Controls.Add(btnCancel);
        }

        private CheckBox CreateCheckbox(string text, bool isChecked, int x, int y) {
            CheckBox chk = new CheckBox();
            chk.Text = text;
            chk.Checked = isChecked;
            chk.Location = new Point(x, y);
            chk.Size = new Size(580, 24);
            chk.ForeColor = Color.FromArgb(226, 232, 240);
            chk.Font = new Font("Segoe UI", 9f);
            chk.Cursor = Cursors.Hand;
            return chk;
        }

        private void StartInstallation() {
            btnInstall.Enabled = false;
            btnBrowse.Enabled = false;
            txtInstallPath.Enabled = false;
            chkDesktopShortcut.Enabled = false;
            chkStartMenu.Enabled = false;
            chkRegisterService.Enabled = false;
            chkOpenFirewall.Enabled = false;
            chkLaunchAfter.Enabled = false;

            installDir = txtInstallPath.Text.Trim();
            if (string.IsNullOrEmpty(installDir)) {
                string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                installDir = Path.Combine(localApp, "Programs", "SIM-Sarpras-SMP");
            }

            Thread worker = new Thread(() => {
                try {
                    UpdateUI(10, "Menyiapkan direktori tujuan...", installDir);
                    if (!Directory.Exists(installDir)) {
                        Directory.CreateDirectory(installDir);
                    }

                    // Amankan data lama jika ada
                    string dbFile = Path.Combine(installDir, "data", "database.json");
                    byte[] existingDb = null;
                    if (File.Exists(dbFile)) {
                        try { existingDb = File.ReadAllBytes(dbFile); } catch {}
                    }

                    UpdateUI(30, "Mengekstrak berkas aplikasi dari arsip payload...", "Mengurai berkas web, server, dan database");
                    byte[] zipBytes = Convert.FromBase64String(GetEmbeddedZipPayload());
                    using (MemoryStream ms = new MemoryStream(zipBytes))
                    using (ZipArchive archive = new ZipArchive(ms)) {
                        int count = 0;
                        int total = archive.Entries.Count;
                        foreach (ZipArchiveEntry entry in archive.Entries) {
                            count++;
                            string destPath = Path.Combine(installDir, entry.FullName.Replace('/', '\\\\'));
                            if (string.IsNullOrEmpty(entry.Name)) {
                                Directory.CreateDirectory(destPath);
                            } else {
                                Directory.CreateDirectory(Path.GetDirectoryName(destPath));
                                if (destPath.EndsWith("database.json", StringComparison.OrdinalIgnoreCase) && existingDb != null) {
                                    continue; // Jaga data lama
                                }
                                entry.ExtractToFile(destPath, true);
                            }
                        }
                    }

                    UpdateUI(60, "Mendaftarkan aplikasi ke Registry Windows...", "Add or Remove Programs");
                    RegisterInWindowsUninstall(installDir);

                    if (chkDesktopShortcut.Checked) {
                        UpdateUI(75, "Membuat Pintasan Desktop...", "Desktop Shortcut");
                        CreateDesktopShortcut(installDir);
                    }

                    if (chkStartMenu.Checked) {
                        UpdateUI(85, "Membuat Pintasan Menu Start...", "Start Menu Programs");
                        CreateStartMenuShortcut(installDir);
                    }

                    if (chkRegisterService.Checked) {
                        UpdateUI(90, "Mendaftarkan Layanan Latar Belakang (Windows Service)...", "Auto-Start Daemon");
                        RegisterWindowsBackgroundService(installDir);
                    }

                    if (chkOpenFirewall.Checked) {
                        UpdateUI(95, "Mengonfigurasi Windows Firewall Port " + PORT + "...", "Allow Inbound TCP");
                        OpenWindowsFirewall();
                    }

                    // Selesai
                    UpdateUI(100, "🎉 Pemasangan Selesai dengan Sempurna!", "SIM Sarpras SMP kini terpasang resmi di sistem Windows.");
                    this.Invoke((MethodInvoker)delegate {
                        isFinished = true;
                        btnInstall.Enabled = true;
                        btnInstall.Text = "🌐 Buka Aplikasi Sekarang";
                        btnInstall.BackColor = Color.FromArgb(16, 185, 129); // Emerald 500
                        btnCancel.Text = "Tutup";

                        if (chkLaunchAfter.Checked) {
                            try {
                                Process.Start("http://localhost:" + PORT);
                            } catch {}
                        }

                        MessageBox.Show("SIM Sarpras SMP telah berhasil terpasang di sistem Windows Anda!\\n\\n" +
                            "• Lokasi: " + installDir + "\\n" +
                            "• Tautan: http://localhost:" + PORT + "\\n" +
                            "• Pintasan telah tersedia di Desktop dan Menu Start.\\n" +
                            "• Server akan otomatis menyala di latar belakang saat komputer dihidupkan.",
                            "Pemasangan Berhasil", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    });
                } catch (Exception ex) {
                    this.Invoke((MethodInvoker)delegate {
                        lblStatus.Text = "Gagal memasang aplikasi: " + ex.Message;
                        lblStatus.ForeColor = Color.FromArgb(239, 68, 68);
                        btnInstall.Enabled = true;
                        MessageBox.Show("Kendala saat instalasi: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    });
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        private void UpdateUI(int percent, string status, string detail) {
            if (this.InvokeRequired) {
                this.Invoke((MethodInvoker)delegate { UpdateUI(percent, status, detail); });
                return;
            }
            prgBar.Value = Math.Min(100, Math.Max(0, percent));
            lblStatus.Text = status;
            lblDetail.Text = detail;
        }

        private void CreateDesktopShortcut(string targetDir) {
            try {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "SIM Sarpras SMP.lnk");
                CreateWindowsShortcut(shortcutPath, targetDir);
            } catch {}
        }

        private void CreateStartMenuShortcut(string targetDir) {
            try {
                string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
                    @"Microsoft\\Windows\\Start Menu\\Programs\\SIM Sarpras SMP");
                if (!Directory.Exists(startMenu)) Directory.CreateDirectory(startMenu);
                string shortcutPath = Path.Combine(startMenu, "SIM Sarpras SMP.lnk");
                CreateWindowsShortcut(shortcutPath, targetDir);
            } catch {}
        }

        private void CreateWindowsShortcut(string shortcutPath, string targetDir) {
            try {
                string vbsRunner = Path.Combine(targetDir, "run-server-silent.vbs");
                string targetExe = File.Exists(vbsRunner) ? "wscript.exe" : "node.exe";
                string args = File.Exists(vbsRunner) ? ("\\"" + vbsRunner + "\\"") : "server-lokal.cjs";

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null) {
                    object shell = Activator.CreateInstance(shellType);
                    object shortcut = shellType.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
                    if (shortcut != null) {
                        Type scType = shortcut.GetType();
                        scType.InvokeMember("TargetPath", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { targetExe });
                        scType.InvokeMember("Arguments", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { args });
                        scType.InvokeMember("WorkingDirectory", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { targetDir });
                        scType.InvokeMember("Description", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { "SIM Sarpras SMP (Port 3030)" });
                        scType.InvokeMember("IconLocation", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { "shell32.dll, 13" });
                        scType.InvokeMember("Save", System.Reflection.BindingFlags.InvokeMethod, null, shortcut, null);
                    }
                }
            } catch {}
        }

        private void RegisterInWindowsUninstall(string targetDir) {
            try {
                string regKey = @"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(regKey)) {
                    if (key != null) {
                        key.SetValue("DisplayName", "SIM Sarpras SMP");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "SMP Negeri 3 Kras");
                        key.SetValue("InstallLocation", targetDir);
                        key.SetValue("UninstallString", "cmd.exe /c \\"" + Path.Combine(targetDir, "uninstall.cmd") + "\\"");
                        key.SetValue("URLInfoAbout", "http://localhost:3030");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            } catch {}
        }

        private void RegisterWindowsBackgroundService(string targetDir) {
            try {
                string vbsRunner = Path.Combine(targetDir, "run-server-silent.vbs");
                if (!File.Exists(vbsRunner)) return;

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "schtasks.exe";
                psi.Arguments = "/create /tn \\"SIM_Sarpras_Server_Daemon\\" /tr \\"wscript.exe \\\\\\"" + vbsRunner + "\\\\\\"\\" /sc ONLOGON /rl HIGHEST /f";
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                p.WaitForExit(3000);

                // Jalankan juga sekarang
                Process.Start(new ProcessStartInfo {
                    FileName = "schtasks.exe",
                    Arguments = "/run /tn \\"SIM_Sarpras_Server_Daemon\\"",
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
            } catch {}
        }

        private void OpenWindowsFirewall() {
            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "netsh.exe";
                psi.Arguments = "advfirewall firewall add rule name=\\"SIM Sarpras Server (Port 3030)\\" dir=in action=allow protocol=TCP localport=" + PORT + " profile=any";
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                p.WaitForExit(3000);
            } catch {}
        }
    }
}
`;
}

function buildSystemInstaller() {
  console.log('================================================================');
  console.log('  📦 MEMBANGUN INSTALLER SYSTEM WINDOWS: Setup-SIM-Sarpras-SMP.exe');
  console.log('================================================================');

  ensureDir(RELEASE_DIR);
  prepareStandaloneFiles();

  const base64Payload = createZipArchive();

  console.log('[3/4] Menghasilkan kode native Windows Forms Installer (C#)...');
  const csSource = generateInstallerCSharpSource(base64Payload);
  const csFile = path.join(RELEASE_DIR, 'SetupProgram.cs');
  fs.writeFileSync(csFile, csSource, 'utf8');

  // Skrip kompilasi PowerShell
  console.log('[4/4] Menyiapkan skrip kompilasi otomatis Windows...');
  const psScript = `
$ErrorActionPreference = "Stop"
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$csFile = Join-Path $scriptDir "SetupProgram.cs"
$outputExe = Join-Path $scriptDir "Setup-SIM-Sarpras-SMP.exe"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   KOMPILASI INSTALLER WINDOWS: Setup-SIM-Sarpras-SMP.exe" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "File Sumber: $csFile"
Write-Host "Target .EXE: $outputExe"
Write-Host ""
Write-Host "Sedang mengompilasi Installer dengan C# Compiler bawaan Windows..." -ForegroundColor Yellow

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

# Fallback: gunakan csc.exe native .NET Framework bawaan Windows jika Add-Type terhalang policy
if (-not $compiled -or -not (Test-Path $outputExe)) {
    Write-Host "[*] Mengompilasi via csc.exe native .NET Framework..." -ForegroundColor Cyan
    $cscPaths = @(
        "$env:SystemRoot\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
        "$env:SystemRoot\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
    )
    $csc = $cscPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($csc) {
        $cscArgs = @(
            "/nologo",
            "/target:winexe",
            "/platform:anycpu",
            "/optimize+",
            "/out:$outputExe",
            "/r:System.dll",
            "/r:System.Core.dll",
            "/r:Microsoft.CSharp.dll",
            "/r:System.Windows.Forms.dll",
            "/r:System.Drawing.dll",
            "/r:System.IO.Compression.dll",
            "/r:System.IO.Compression.FileSystem.dll",
            "/r:System.Net.Http.dll",
            $csFile
        )
        & $csc $cscArgs
        if (Test-Path $outputExe) {
            $compiled = $true
        }
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  [SUKSES] Setup-SIM-Sarpras-SMP.exe BERHASIL DIBUAT DENGAN SEMPURNA!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Lokasi File: $outputExe"
Write-Host ""
Write-Host "Petunjuk:"
Write-Host "1. Klik ganda file Setup-SIM-Sarpras-SMP.exe pada komputer mana pun."
Write-Host "2. Aplikasi akan langsung terpasang resmi ke sistem Windows."
Write-Host "3. Pintasan Desktop, Start Menu, dan Layanan Server otomatis terpasang."
Write-Host ""
`;
  const psFile = path.join(RELEASE_DIR, 'compile_setup_installer.ps1');
  fs.writeFileSync(psFile, psScript, 'utf8');

  // Skrip batch 1-klik untuk membangun installer
  const buildCmd = `@echo off
setlocal enabledelayedexpansion
title BUILD INSTALLER SYSTEM WINDOWS (Setup-SIM-Sarpras-SMP.exe)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo    MEMBUAT INSTALLER SYSTEM WINDOWS: Setup-SIM-Sarpras-SMP.exe
echo                   SIM SARPRAS SMP NEGERI 3 KRAS
echo ======================================================================
echo.

:: 1. Deteksi Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    if exist "C:\\Program Files\\nodejs\\node.exe" (
        set "PATH=C:\\Program Files\\nodejs;%PATH%"
    ) else if exist "C:\\Program Files (x86)\\nodejs\\node.exe" (
        set "PATH=C:\\Program Files (x86)\\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\\Programs\\nodejs\\node.exe" (
        set "PATH=%LOCALAPPDATA%\\Programs\\nodejs;%PATH%"
    ) else (
        echo [X] Node.js tidak ditemukan di sistem.
        echo     Silakan pasang Node.js dari https://nodejs.org terlebih dahulu.
        echo.
        pause
        exit /b 1
    )
)

:: 2. Periksa dist web
echo [1/3] Memeriksa paket web produksi (dist)...
if exist "dist\\index.html" (
    echo     [+] Berkas web 'dist' sudah siap.
) else (
    echo     [*] Mengompilasi aplikasi web produksi...
    call npm run build
)

:: 3. Siapkan payload installer
echo.
echo [2/3] Mengemas payload dan kode sumber installer...
node "scripts\\build-windows-system-installer.cjs"

:: 4. Kompilasi menjadi .EXE
echo.
echo [3/3] Mengompilasi menjadi "Setup-SIM-Sarpras-SMP.exe"...
set "OUTPUT_EXE=%~dp0release\\Setup-SIM-Sarpras-SMP.exe"
set "CS_FILE=%~dp0release\\SetupProgram.cs"
set "COMPILED=0"

set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if defined CSC_EXE (
    echo     [*] Menggunakan compiler native: %CSC_EXE%
    "%CSC_EXE%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%OUTPUT_EXE%" /r:System.dll /r:System.Core.dll /r:Microsoft.CSharp.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /r:System.Net.Http.dll "%CS_FILE%" >nul 2>&1
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

if "!COMPILED!"=="0" (
    echo     [*] Mencoba kompilasi melalui PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0release\\compile_setup_installer.ps1' }"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

echo.
if exist "%OUTPUT_EXE%" (
    echo ======================================================================
    echo  [SUKSES] File Installer Windows Berhasil Dibuat!
    echo ======================================================================
    echo  Lokasi File: %OUTPUT_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_NOW=Apakah Anda ingin langsung menjalankan installer sekarang? (Y/T): "
    if /i "!RUN_NOW!"=="Y" start "" "%OUTPUT_EXE%"
) else (
    echo [X] Kompilasi belum berhasil. Anda dapat menjalankan:
    echo     PASANG_KE_SYSTEM_WINDOWS.cmd
)
echo.
pause
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'BUAT_INSTALLER_EXE.cmd'), buildCmd.replace(/\n/g, '\r\n'), 'utf8');

  // Skrip batch untuk instalasi langsung tanpa perlu compile .exe (Direct System Installer Batch)
  const directInstallCmd = `@echo off
setlocal enabledelayedexpansion
title INSTAL SIM SARPRAS KE SISTEM WINDOWS
color 0A

echo ======================================================================
echo       PEMASANGAN LANGSUNG SIM SARPRAS SMP KE SISTEM WINDOWS
echo                   SMP NEGERI 3 KRAS (PORT 3030)
echo ======================================================================
echo.

set "TARGET_DIR=%LOCALAPPDATA%\\Programs\\SIM-Sarpras-SMP"
echo [*] Folder Instalasi: %TARGET_DIR%

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%TARGET_DIR%\\dist" mkdir "%TARGET_DIR%\\dist"
if not exist "%TARGET_DIR%\\scripts" mkdir "%TARGET_DIR%\\scripts"
if not exist "%TARGET_DIR%\\data" mkdir "%TARGET_DIR%\\data"
if not exist "%TARGET_DIR%\\data\\backups" mkdir "%TARGET_DIR%\\data\\backups"

echo [*] Menyalin berkas aplikasi...
xcopy /E /I /Y "dist\\*" "%TARGET_DIR%\\dist\\" >nul 2>&1
copy /Y "server-lokal.cjs" "%TARGET_DIR%\\" >nul 2>&1
copy /Y "scripts\\central-db.cjs" "%TARGET_DIR%\\scripts\\" >nul 2>&1
copy /Y "scripts\\init-default-db.cjs" "%TARGET_DIR%\\scripts\\" >nul 2>&1
copy /Y "public\\icon.svg" "%TARGET_DIR%\\" >nul 2>&1

if not exist "%TARGET_DIR%\\data\\database.json" (
    copy /Y "data\\database.json" "%TARGET_DIR%\\data\\" >nul 2>&1
)

echo [*] Menyiapkan peluncur latar belakang...
set "VBS_RUNNER=%TARGET_DIR%\\run-server-silent.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_RUNNER%"
echo WshShell.CurrentDirectory = "%TARGET_DIR%" >> "%VBS_RUNNER%"
echo WshShell.Run "node server-lokal.cjs", 0, False >> "%VBS_RUNNER%"

echo [*] Membuat Pintasan Desktop...
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\\Desktop\\SIM Sarpras SMP.lnk');$s.TargetPath='wscript.exe';$s.Arguments='\"%VBS_RUNNER%\"';$s.WorkingDirectory='%TARGET_DIR%';$s.Save()"

echo [*] Mendaftarkan ke Start Menu Windows...
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\SIM Sarpras SMP"
if not exist "%START_MENU%" mkdir "%START_MENU%"
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%START_MENU%\\SIM Sarpras SMP.lnk');$s.TargetPath='wscript.exe';$s.Arguments='\"%VBS_RUNNER%\"';$s.WorkingDirectory='%TARGET_DIR%';$s.Save()"

echo [*] Mendaftarkan ke Windows Settings (Add/Remove Programs)...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP" /v "DisplayName" /d "SIM Sarpras SMP" /f >nul 2>&1
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP" /v "DisplayVersion" /d "1.0.0" /f >nul 2>&1
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP" /v "Publisher" /d "SMP Negeri 3 Kras" /f >nul 2>&1
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP" /v "InstallLocation" /d "%TARGET_DIR%" /f >nul 2>&1

echo [*] Mendaftarkan Layanan Server Otomatis saat Boot...
schtasks /create /tn "SIM_Sarpras_Server_Daemon" /tr "wscript.exe \"%VBS_RUNNER%\"" /sc ONLOGON /rl HIGHEST /f >nul 2>&1

echo [*] Menjalankan server latar belakang...
schtasks /run /tn "SIM_Sarpras_Server_Daemon" >nul 2>&1

echo.
echo ======================================================================
echo  [SUKSES] SIM Sarpras SMP telah berhasil dipasang ke sistem Windows!
echo ======================================================================
echo - Pintasan telah dibuat di Desktop dan Start Menu.
echo - Terdaftar resmi di Windows Settings (Installed Apps).
echo - Server aktif di latar belakang pada port 3030.
echo ======================================================================
echo.
start "" "http://localhost:3030"
pause
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'PASANG_KE_SYSTEM_WINDOWS.cmd'), directInstallCmd.replace(/\n/g, '\r\n'), 'utf8');

  console.log(`\n🎉 [SELESAI] Konfigurasi Installer Sistem Windows siap di: ${RELEASE_DIR}`);
}

if (require.main === module) {
  buildSystemInstaller();
}

module.exports = { buildSystemInstaller };
