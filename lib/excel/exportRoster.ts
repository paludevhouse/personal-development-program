import * as XLSX from "xlsx";
import { Student } from "@/lib/types";

export function buildRosterWorkbook(students: Student[]): XLSX.WorkBook {
  const rows = students.map((s) => ({
    "Nama Siswa": s.namaSiswa, "Nama Besar": s.namaBesar, "Nama Pendek": s.namaPendek,
    "Nomor Induk Sekolah": s.nis, "NISN": s.nisn, "Jenis Kelamin": s.gender,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Siswa");
  return wb;
}
