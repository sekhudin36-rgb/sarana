export async function createGoogleSheetsBackup(accessToken: string, data: any, targetFolderId?: string) {
  try {
    // 1. Create a new spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `Backup Database Sarpras - ${new Date().toLocaleString('id-ID')}`
        }
      })
    });
    
    if (!createRes.ok) {
      const errorText = await createRes.text().catch(() => "");
      let errMsg = "";
      try {
        const parsed = JSON.parse(errorText);
        errMsg = parsed?.error?.message;
      } catch {
        // not json
      }
      if (
        errMsg &&
        (errMsg.includes("Google Sheets API has not been used") ||
          errMsg.includes("SERVICE_DISABLED") ||
          errMsg.includes("accessNotConfigured"))
      ) {
        throw new Error(
          "Layanan Google Sheets API sedang dalam proses propagasi izin di Google Cloud Console. Silakan tunggu 1-2 menit lalu coba kembali."
        );
      }
      throw new Error(errMsg ? `Gagal membuat spreadsheet: ${errMsg}` : 'Gagal membuat spreadsheet');
    }
    
    const spreadsheet = await createRes.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // Move to designated folder if specified
    if (targetFolderId) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${targetFolderId}&fields=id,parents`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
      } catch (moveErr) {
        console.warn("Could not move spreadsheet to folder:", moveErr);
      }
    }

    // We will dump the JSON as a string into the first cell, 
    // or we can convert it to tabular format. 
    // For simplicity of a robust backup, we'll store JSON in a specific format 
    // or write a basic key-value dump if tabular is too complex for nested arrays.
    
    // Let's do tabular for the main arrays: assets, rooms.
    const requests = [];
    
    // Sheet 1 is already created (Sheet1). Rename it to Assets.
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: spreadsheet.sheets[0].properties.sheetId,
          title: 'Aset (KIB)'
        },
        fields: 'title'
      }
    });
    
    // Add other sheets
    const collections = [
      { name: 'Ruangan', key: 'rooms' },
      { name: 'BHP', key: 'consumables' },
      { name: 'Peminjaman', key: 'borrowings' }
    ];
    
    collections.forEach((col) => {
      requests.push({
        addSheet: {
          properties: {
            title: col.name
          }
        }
      });
    });

    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
    }

    // Now write data
    const valueRanges = [];
    
    // Format Assets
    if (data.assets && data.assets.length > 0) {
      const headers = ['ID', 'Kode', 'Nama', 'Kategori', 'Ruangan', 'Kondisi', 'Nilai', 'Tanggal Masuk'];
      const rows = data.assets.map((a: any) => [
        a.id, a.kode, a.nama, a.kategori, a.ruangan, a.kondisi, a.nilai, a.tanggalMasuk
      ]);
      valueRanges.push({
        range: "'Aset (KIB)'!A1",
        values: [headers, ...rows]
      });
    }

    // Format Rooms
    if (data.rooms && data.rooms.length > 0) {
      const headers = ['ID', 'Kode', 'Nama', 'Kategori', 'Kapasitas', 'Penanggung Jawab'];
      const rows = data.rooms.map((r: any) => [
        r.id, r.kode, r.nama, r.kategori, r.kapasitas, r.penanggungJawab
      ]);
      valueRanges.push({
        range: "'Ruangan'!A1",
        values: [headers, ...rows]
      });
    }
    
    // Format BHP
    if (data.consumables && data.consumables.length > 0) {
      const headers = ['ID', 'Kode', 'Nama', 'Kategori', 'Stok', 'Satuan'];
      const rows = data.consumables.map((c: any) => [
        c.id, c.kode, c.nama, c.kategori, c.stok, c.satuan
      ]);
      valueRanges.push({
        range: "'BHP'!A1",
        values: [headers, ...rows]
      });
    }

    // Write all values
    if (valueRanges.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data: valueRanges
        })
      });
    }

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  } catch (error) {
    console.error("Error backing up to Google Sheets:", error);
    throw error;
  }
}
