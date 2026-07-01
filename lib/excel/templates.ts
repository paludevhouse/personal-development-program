import * as XLSX from "xlsx";

type TemplateType = 
  | "academic-years" 
  | "classes" 
  | "students" 
  | "master-magang" 
  | "internships" 
  | "counseling";

export const TEMPLATE_HEADERS: Record<TemplateType, string[]> = {
  "academic-years": ["year", "isActive"],
  "classes": ["name", "waliKelas"],
  "students": ["namaSiswa", "nis", "gender", "status", "kelas"],
  "master-magang": ["perusahaan", "pic", "phone", "alamat"],
  "internships": ["studentId", "lokasiMagang", "posisi", "pembimbing", "phone"],
  "counseling": ["studentId", "date", "category", "notes", "followUp", "status", "counselor"],
};

export const FIELD_LABELS: Record<string, string> = {
  "year": "Tahun",
  "isActive": "Status Aktif",
  "name": "Nama Kelas",
  "waliKelas": "Wali Kelas",
  "namaSiswa": "Nama Lengkap",
  "nis": "NIS",
  "gender": "Jenis Kelamin (L/P)",
  "status": "Status Siswa",
  "kelas": "Kelas",
  "perusahaan": "Nama Perusahaan",
  "pic": "Nama PIC",
  "phone": "No Telepon",
  "alamat": "Alamat",
  "studentId": "NIS",
  "lokasiMagang": "Lokasi Magang",
  "posisi": "Posisi",
  "pembimbing": "Pembimbing",
  "date": "Tanggal",
  "category": "Kategori",
  "notes": "Catatan",
  "followUp": "Tindak Lanjut",
  "counselor": "Konselor",
};

export function downloadTemplate(type: TemplateType, selectedFields?: string[]) {
  const headers = selectedFields && selectedFields.length > 0 
    ? selectedFields 
    : TEMPLATE_HEADERS[type];
    
  if (!headers || headers.length === 0) return;

  const indoHeaders = headers.map(h => FIELD_LABELS[h] || h);
  
  const wsEmpty = XLSX.utils.json_to_sheet([], { header: indoHeaders });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsEmpty, "Template");
  
  XLSX.writeFile(wb, `template-${type}.xlsx`);
}

export function parseIndonesianRow(row: Record<string, unknown>): Record<string, unknown> {
  const reversed: Record<string, unknown> = {};
  // Create a reverse mapping from Label to Key
  const labelsToKeys = Object.fromEntries(Object.entries(FIELD_LABELS).map(([k, v]) => [v, k]));
  
  for (const [k, v] of Object.entries(row)) {
    const originalKey = labelsToKeys[k] || k;
    reversed[originalKey] = v;
  }
  return reversed;
}
