import { Gender } from "@/lib/types";

export interface ParsedStudent {
  namaSiswa: string; namaBesar: string; namaPendek: string;
  nis: string; nisn: string; gender: Gender;
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.some((want) => k.trim().toLowerCase() === want.toLowerCase())) {
      const v = row[k];
      return v === null || v === undefined ? "" : String(v).trim();
    }
  }
  return "";
}

function parseGender(raw: string): Gender {
  const v = raw.trim().toUpperCase();
  if (v === "P" || v.startsWith("PEREMPUAN") || v === "F") return "P";
  return "L";
}

export function parseStudentRows(rows: Record<string, unknown>[]): ParsedStudent[] {
  const out: ParsedStudent[] = [];
  for (const row of rows) {
    const namaSiswa = pick(row, ["Nama Siswa", "Nama", "Name"]);
    if (!namaSiswa) continue;
    const namaBesar = pick(row, ["Nama Besar"]) || namaSiswa.toUpperCase();
    out.push({
      namaSiswa,
      namaBesar,
      namaPendek: pick(row, ["Nama Pendek"]),
      nis: pick(row, ["Nomor Induk Sekolah", "NIS"]),
      nisn: pick(row, ["NISN"]),
      gender: parseGender(pick(row, ["Jenis Kelamin", "Gender", "L/P"])),
    });
  }
  return out;
}
