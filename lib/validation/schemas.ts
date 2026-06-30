import { z } from "zod";

/** A required string field that gives a custom error even when missing/undefined. */
function requiredStr(msg: string) {
  return z.preprocess((v) => v ?? "", z.string().trim().min(1, msg));
}

export const academicYearSchema = z.object({
  year: requiredStr("Tahun wajib diisi"),
  isActive: z.boolean().default(false),
});

export const classSchema = z.object({
  name: requiredStr("Nama kelas wajib diisi"),
  academicYearId: requiredStr("Tahun ajaran wajib dipilih"),
  waliKelas: z.string().trim().default(""),
});

export const companySchema = z.object({
  perusahaan: requiredStr("Nama perusahaan wajib diisi"),
  pic: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  alamat: z.string().trim().default(""),
});

export const internshipSchema = z.object({
  studentId: requiredStr("Siswa wajib dipilih"),
  academicYearId: requiredStr("Tahun ajaran wajib dipilih"),
  lokasiMagang: z.string().trim().default(""),
  posisi: z.string().trim().default(""),
  pembimbing: z.string().trim().default(""),
  phone: z.string().trim().default(""),
});

export const counselingSchema = z.object({
  studentId: z.string().trim().min(1, "Siswa wajib dipilih"),
  studentName: z.string().trim().default(""),
  date: z.string().trim().min(1, "Tanggal wajib diisi"),
  category: z.enum(["Akademik", "Pribadi", "Sosial", "Karir"]),
  notes: z.string().trim().default(""),
  followUp: z.string().trim().default(""),
  status: z.enum(["open", "selesai"]).default("open"),
  counselor: z.string().trim().default(""),
});

/** Parse with a schema; throw the first issue message as an Error on failure. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(r.error.issues[0]?.message ?? "Data tidak valid");
  return r.data;
}
