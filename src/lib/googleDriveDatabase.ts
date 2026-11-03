// Google Drive REST API v3 Client for SIM Sarpras SMP Master Database

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink: string;
  description?: string;
}

export interface DriveSnapshotInfo {
  id: string;
  name: string;
  timestamp: string;
  sizeBytes: number;
  webViewLink: string;
  note?: string;
}

export interface MasterDatabasePayload {
  version: string;
  appName: string;
  npsn: string;
  lastUpdated: string;
  exportedBy?: string;
  schoolProfile: any;
  assets: any[];
  rooms: any[];
  consumables: any[];
  procurements: any[];
  borrowings: any[];
  mutations: any[];
  maintenances: any[];
  stocktakes: any[];
  disposals: any[];
}

export const DEFAULT_TARGET_FOLDER_ID = "1fqjFnsuAU4WH7I5AkEomZ6JA-a3Fi_5d";
export const DEFAULT_TARGET_FOLDER_URL = "https://drive.google.com/drive/folders/1fqjFnsuAU4WH7I5AkEomZ6JA-a3Fi_5d?usp=drive_link";

const ROOT_FOLDER_NAME = "SIM Sarpras SMP - Database & Arsip";
const DB_FILE_NAME = "sim_sarpras_db.json";
const MULTIPART_BOUNDARY = "SIM_SARPRAS_DRIVE_BOUNDARY_v1";

/**
 * Extract Google Drive Folder ID from a raw ID or full Google Drive URL
 */
export function extractDriveFolderId(input?: string): string {
  if (!input || !input.trim()) return DEFAULT_TARGET_FOLDER_ID;
  const trimmed = input.trim();

  // Match /folders/FOLDER_ID (including ?usp=drive_link or other params)
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // Match ?id=FOLDER_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // If provided directly as an alphanumeric ID
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return DEFAULT_TARGET_FOLDER_ID;
}

/**
 * Helper to execute authorized requests with error handling
 */
async function driveFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED_TOKEN_EXPIRED");
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let cleanMsg = "";
    try {
      const errObj = JSON.parse(errorText);
      if (errObj?.error?.message) {
        cleanMsg = errObj.error.message;
      }
    } catch {
      // not json
    }

    if (
      cleanMsg.includes("Google Drive API has not been used") ||
      cleanMsg.includes("SERVICE_DISABLED") ||
      cleanMsg.includes("accessNotConfigured")
    ) {
      throw new Error(
        "Layanan Google Drive API sedang dalam proses propagasi izin di Google Cloud Console. Silakan tunggu 1-2 menit lalu coba kembali."
      );
    }

    if (cleanMsg.includes("Insufficient permissions for the specified parent")) {
      throw new Error(
        "Folder target Google Drive memerlukan izin akses tulis dari akun Google Anda. Pastikan akun Google yang Anda hubungkan memiliki akses Editor pada folder ini, atau klik Hubungkan Google Drive ulang untuk memperbarui otorisasi."
      );
    }

    throw new Error(cleanMsg || `Google Drive API Error (${response.status}): ${errorText || response.statusText}`);
  }

  return response;
}

/**
 * Get or verify the designated folder in Google Drive (Defaults to the user's specified folder)
 */
export async function getOrCreateDatabaseFolder(
  token: string,
  preferredFolderIdOrUrl?: string
): Promise<DriveFolderInfo> {
  const targetId = extractDriveFolderId(preferredFolderIdOrUrl || DEFAULT_TARGET_FOLDER_ID);

  // 1. Try to fetch metadata of the designated folder directly by ID
  if (targetId) {
    try {
      const getUrl = `https://www.googleapis.com/drive/v3/files/${targetId}?fields=id,name,webViewLink,trashed`;
      const getRes = await driveFetch(getUrl, token);
      const folderData = await getRes.json();

      if (folderData && folderData.id && !folderData.trashed) {
        return {
          id: folderData.id,
          name: folderData.name || "Master Database Sarpras",
          webViewLink:
            folderData.webViewLink ||
            `https://drive.google.com/drive/folders/${folderData.id}?usp=drive_link`,
        };
      }
    } catch (fetchErr: any) {
      // If fetching folder metadata returns 404 or permission limitation (e.g. drive.file scope),
      // we still know the folder ID and can write/create files with parents: [targetId]!
      console.warn("Designated folder metadata query notice (using targetId directly):", fetchErr?.message);
      return {
        id: targetId,
        name: targetId === DEFAULT_TARGET_FOLDER_ID ? "Folder Database Sekolah (Khusus)" : "Folder Target Sarpras",
        webViewLink: `https://drive.google.com/drive/folders/${targetId}?usp=drive_link`,
      };
    }
  }

  // 2. Fallback: Search for named folder if no specific folder ID given
  const query = `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;

  try {
    const searchRes = await driveFetch(searchUrl, token);
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      const folder = searchData.files[0];
      return {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      };
    }
  } catch (err) {
    console.warn("Fallback search folder error:", err);
  }

  // 3. Create folder if not existing
  const createUrl = "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink";
  const createRes = await driveFetch(createUrl, token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: ROOT_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      description: "Folder database master, cadangan otomatis, dan arsip sistem SIM Sarpras SMP",
    }),
  });

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    name: newFolder.name,
    webViewLink: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
  };
}

/**
 * Find the primary database file (sim_sarpras_db.json) inside the database folder
 */
export async function findDatabaseFile(token: string, folderId: string): Promise<DriveFileInfo | null> {
  const query = `'${folderId}' in parents and name = '${DB_FILE_NAME}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,modifiedTime,createdTime,webViewLink,description,parents)&spaces=drive`;

  try {
    const res = await driveFetch(searchUrl, token);
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        description: file.description,
      };
    }
  } catch (err) {
    console.warn("Query database file by parent error:", err);
  }

  // Secondary search: by name if parent filter fails due to permission hierarchy
  try {
    const fallbackQuery = `name = '${DB_FILE_NAME}' and trashed = false`;
    const fallbackUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fallbackQuery)}&fields=files(id,name,size,modifiedTime,createdTime,webViewLink,description,parents)&spaces=drive`;
    const res = await driveFetch(fallbackUrl, token);
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      // Find matching parent if possible
      const match = data.files.find((f: any) => f.parents && f.parents.includes(folderId)) || data.files[0];
      return {
        id: match.id,
        name: match.name,
        size: match.size,
        createdTime: match.createdTime,
        modifiedTime: match.modifiedTime,
        webViewLink: match.webViewLink || `https://drive.google.com/file/d/${match.id}/view`,
        description: match.description,
      };
    }
  } catch (err) {
    console.warn("Secondary search error:", err);
  }

  return null;
}

/**
 * Read and parse the database JSON file from Google Drive
 */
export async function readDatabaseFromGoogleDrive(token: string, fileId: string): Promise<MasterDatabasePayload> {
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await driveFetch(downloadUrl, token);
  const json = await res.json();
  return json as MasterDatabasePayload;
}

/**
 * Save / update the live database JSON file in Google Drive
 */
export async function saveDatabaseToGoogleDrive(
  token: string,
  fullData: any,
  folderId: string,
  existingFileId?: string
): Promise<DriveFileInfo> {
  const payload: MasterDatabasePayload = {
    version: "2.0.0",
    appName: "SIM Sarpras SMP",
    npsn: fullData.schoolProfile?.npsn || "20202020",
    lastUpdated: new Date().toISOString(),
    exportedBy: fullData.schoolProfile?.operator || "Operator Sarpras",
    schoolProfile: fullData.schoolProfile || {},
    assets: fullData.assets || [],
    rooms: fullData.rooms || [],
    consumables: fullData.consumables || [],
    procurements: fullData.procurements || [],
    borrowings: fullData.borrowings || [],
    mutations: fullData.mutations || [],
    maintenances: fullData.maintenances || [],
    stocktakes: fullData.stocktakes || [],
    disposals: fullData.disposals || [],
  };

  const jsonString = JSON.stringify(payload, null, 2);

  // If existing file ID is provided or exists, update it via PATCH
  let targetFileId = existingFileId;
  if (!targetFileId) {
    const existing = await findDatabaseFile(token, folderId);
    if (existing) {
      targetFileId = existing.id;
    }
  }

  if (targetFileId) {
    // Update existing file content
    const patchUrl = `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=media&fields=id,name,size,modifiedTime,webViewLink`;
    const patchRes = await driveFetch(patchUrl, token, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
    });

    const updated = await patchRes.json();
    return {
      id: updated.id,
      name: updated.name,
      size: updated.size,
      modifiedTime: updated.modifiedTime,
      webViewLink: updated.webViewLink || `https://drive.google.com/file/d/${updated.id}/view`,
    };
  } else {
    // Create new file via multipart upload
    const metadata = {
      name: DB_FILE_NAME,
      parents: [folderId],
      description: "Master Database JSON SIM Sarpras SMP",
      mimeType: "application/json",
    };

    const multipartBody =
      `--${MULTIPART_BOUNDARY}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${MULTIPART_BOUNDARY}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${jsonString}\r\n` +
      `--${MULTIPART_BOUNDARY}--`;

    const createUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,modifiedTime,webViewLink`;
    try {
      const createRes = await driveFetch(createUrl, token, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
        },
        body: multipartBody,
      });

      const created = await createRes.json();
      return {
        id: created.id,
        name: created.name,
        size: created.size,
        modifiedTime: created.modifiedTime,
        webViewLink: created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
      };
    } catch (parentErr: any) {
      if (
        parentErr?.message?.includes("Insufficient permissions for the specified parent") ||
        parentErr?.message?.includes("akses Editor pada folder ini")
      ) {
        // Fallback: If the user's Google account has read-only or no edit rights in this specific shared folder,
        // create the master file in the user's own root Google Drive / app folder and warn them gracefully
        console.warn("Parent folder lacks write permission. Creating database in personal Drive space...");
        const fallbackMetadata = {
          name: DB_FILE_NAME,
          description: "Master Database JSON SIM Sarpras SMP (Disimpan di My Drive)",
          mimeType: "application/json",
        };
        const fallbackMultipartBody =
          `--${MULTIPART_BOUNDARY}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          `${JSON.stringify(fallbackMetadata)}\r\n` +
          `--${MULTIPART_BOUNDARY}\r\n` +
          `Content-Type: application/json\r\n\r\n` +
          `${jsonString}\r\n` +
          `--${MULTIPART_BOUNDARY}--`;

        const fallbackRes = await driveFetch(createUrl, token, {
          method: "POST",
          headers: {
            "Content-Type": `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
          },
          body: fallbackMultipartBody,
        });

        const created = await fallbackRes.json();
        return {
          id: created.id,
          name: created.name,
          size: created.size,
          modifiedTime: created.modifiedTime,
          webViewLink: created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
        };
      }
      throw parentErr;
    }
  }
}

/**
 * Create a timestamped backup snapshot in Google Drive (e.g. backup_sarpras_2026-09-21_120000.json)
 */
export async function createDriveSnapshot(
  token: string,
  fullData: any,
  folderId: string,
  customNote?: string
): Promise<DriveFileInfo> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const snapshotFileName = `backup_sarpras_${dateStr}.json`;

  const payload: MasterDatabasePayload = {
    version: "2.0.0",
    appName: "SIM Sarpras SMP",
    npsn: fullData.schoolProfile?.npsn || "20202020",
    lastUpdated: now.toISOString(),
    exportedBy: fullData.schoolProfile?.operator || "Operator Sarpras",
    schoolProfile: fullData.schoolProfile || {},
    assets: fullData.assets || [],
    rooms: fullData.rooms || [],
    consumables: fullData.consumables || [],
    procurements: fullData.procurements || [],
    borrowings: fullData.borrowings || [],
    mutations: fullData.mutations || [],
    maintenances: fullData.maintenances || [],
    stocktakes: fullData.stocktakes || [],
    disposals: fullData.disposals || [],
  };

  const jsonString = JSON.stringify(payload, null, 2);

  const metadata = {
    name: snapshotFileName,
    parents: [folderId],
    description: customNote ? `Snapshot Cadangan: ${customNote}` : "Snapshot Cadangan Database Sarpras",
    mimeType: "application/json",
  };

  const multipartBody =
    `--${MULTIPART_BOUNDARY}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${MULTIPART_BOUNDARY}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonString}\r\n` +
    `--${MULTIPART_BOUNDARY}--`;

  const createUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,modifiedTime,createdTime,webViewLink,description`;
  try {
    const createRes = await driveFetch(createUrl, token, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
      },
      body: multipartBody,
    });

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name,
      size: created.size,
      createdTime: created.createdTime,
      modifiedTime: created.modifiedTime,
      webViewLink: created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
      description: created.description,
    };
  } catch (parentErr: any) {
    if (
      parentErr?.message?.includes("Insufficient permissions for the specified parent") ||
      parentErr?.message?.includes("akses Editor pada folder ini")
    ) {
      console.warn("Parent folder lacks write permission for snapshot. Creating snapshot in personal Drive space...");
      const fallbackMetadata = {
        name: snapshotFileName,
        description: customNote ? `Snapshot Cadangan: ${customNote}` : "Snapshot Cadangan Database Sarpras",
        mimeType: "application/json",
      };
      const fallbackMultipartBody =
        `--${MULTIPART_BOUNDARY}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(fallbackMetadata)}\r\n` +
        `--${MULTIPART_BOUNDARY}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${jsonString}\r\n` +
        `--${MULTIPART_BOUNDARY}--`;

      const fallbackRes = await driveFetch(createUrl, token, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
        },
        body: fallbackMultipartBody,
      });

      const created = await fallbackRes.json();
      return {
        id: created.id,
        name: created.name,
        size: created.size,
        createdTime: created.createdTime,
        modifiedTime: created.modifiedTime,
        webViewLink: created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
        description: created.description,
      };
    }
    throw parentErr;
  }
}

/**
 * List all backup snapshots stored in the Google Drive folder
 */
export async function listDriveSnapshots(token: string, folderId: string): Promise<DriveSnapshotInfo[]> {
  const query = `'${folderId}' in parents and name contains 'backup_sarpras_' and trashed = false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=30&fields=files(id,name,size,createdTime,modifiedTime,webViewLink,description)&spaces=drive`;

  const res = await driveFetch(listUrl, token);
  const data = await res.json();

  if (!data.files) return [];

  return data.files.map((f: any) => ({
    id: f.id,
    name: f.name,
    timestamp: f.createdTime || f.modifiedTime || new Date().toISOString(),
    sizeBytes: parseInt(f.size || "0", 10),
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    note: f.description || "",
  }));
}
