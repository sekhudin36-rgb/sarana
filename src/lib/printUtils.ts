import { SchoolProfile } from "../contexts/DataContext"; // Need school profile

export function printHtml(htmlContent: string, schoolProfile: SchoolProfile, title: string) {
  const logoHtml = schoolProfile.logoDinas 
    ? `<img src="${schoolProfile.logoDinas}" alt="Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px; position: absolute; left: 0; top: 0;" />` 
    : '';

  const kopHtml = `
    <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; position: relative; min-height: 70px;">
      ${logoHtml}
      <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${schoolProfile.kementerian || 'PEMERINTAH DAERAH'}</h3>
      <h2 style="margin: 5px 0; font-size: 20px; font-weight: bold;">${schoolProfile.nama || 'NAMA INSTANSI'}</h2>
      <p style="margin: 0; font-size: 12px;">${schoolProfile.alamat || ''} ${schoolProfile.kodePos || ''}</p>
      <p style="margin: 0; font-size: 12px;">Telp: ${schoolProfile.telepon || '-'} | Email: ${schoolProfile.email || '-'} | Website: ${schoolProfile.website || '-'}</p>
    </div>
    <h3 style="text-align: center; text-transform: uppercase;">${title}</h3>
  `;

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            font-family: 'Times New Roman', Times, serif; 
            background: #ffffff;
            color: #000000; 
            padding: 20px; 
            font-size: 12px; 
          }
          .document-content { margin-top: 20px; }
          .signature-area { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-box { width: 200px; text-align: center; }
          .sig-name { font-weight: bold; text-decoration: underline; margin-top: 60px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #000000; padding: 6px; text-align: left; }
          
          @media print {
            body { background: #fff !important; color: #000 !important; }
            th, td { border-color: #000 !important; }
          }
        </style>
      </head>
      <body>
        ${kopHtml}
        <div class="document-content">
          ${htmlContent}
        </div>
        <div class="signature-area">
          <div class="sig-box">
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <p class="sig-name">${schoolProfile.kepalaSekolah || '(_____________________)'}</p>
            <p>NIP. ${schoolProfile.nipKepsek || '...................'}</p>
          </div>
          <div class="sig-box">
            <p><br/></p>
            <p>Pengelola Sarpras / Penanggung Jawab</p>
            <p class="sig-name">${schoolProfile.operator || '(_____________________)'}</p>
            <p>NIP. ${schoolProfile.nipOperator || '...................'}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
  
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  
  if (!printWindow) {
    alert("Pop-up blocker mungkin mencegah pencetakan. Harap izinkan pop-up untuk situs ini.");
    return;
  }
}

export function printRawHtml(htmlContent: string, title: string = "Cetak Dokumen") {
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            background: #ffffff;
            color: #000000; 
          }
          table th, table td { border-color: #000000 !important; }
          
          @media print {
            body { background: #fff !important; color: #000 !important; }
            table th, table td { border-color: #000 !important; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
  
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  
  if (!printWindow) {
    alert("Pop-up blocker mungkin mencegah pencetakan. Harap izinkan pop-up untuk situs ini.");
    return;
  }
}
