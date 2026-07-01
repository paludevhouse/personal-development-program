import { Gender } from "@/lib/types";

export interface ParsedStudent {
  namaSiswa: string;
  nis: string;
  gender: Gender;
  kelas?: string;
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
    const namaSiswa = pick(row, ["Nama Lengkap", "Nama Siswa", "Nama", "Name"]);
    if (!namaSiswa) continue;
    const kelasRaw = pick(row, ["Kelas", "Class"]);
    out.push({
      namaSiswa,
      nis: pick(row, ["NIS", "Nomor Induk Sekolah"]),
      gender: parseGender(pick(row, ["Jenis Kelamin", "Gender", "L/P"])),
      ...(kelasRaw ? { kelas: kelasRaw } : {}),
    });
  }
  return out;
}
