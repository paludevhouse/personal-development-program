import * as XLSX from "xlsx";
import { Student } from "@/lib/types";

export function buildRosterWorkbook(students: Student[]): XLSX.WorkBook {
  const rows = students.map((s) => ({
    "Nama Lengkap": s.namaSiswa,
    "NIS": s.nis,
    "Jenis Kelamin": s.gender,
    "Status": s.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Siswa");
  return wb;
}
