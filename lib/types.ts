export type Gender = "L" | "P";
export type StudentStatus = "aktif" | "lulus" | "pindah";

export interface Company { id: string; perusahaan: string; pic: string; phone: string; alamat: string; idempotencyKey?: string; }

export interface AcademicYear { id: string; year: string; semester: string; isActive: boolean; idempotencyKey?: string; }
export interface SchoolClass { id: string; name: string; academicYearId: string; waliKelas: string; idempotencyKey?: string; }
export interface Student { id: string; namaSiswa: string; nis: string; gender: Gender; status: StudentStatus; }
export interface Enrollment { id: string; studentId: string; classId: string; academicYearId: string; }

export type CounselingCategory = "Akademik" | "Pribadi" | "Sosial" | "Karir";
export interface Counseling {
  id: string;
  studentId: string;
  studentName: string;   // denormalized at write time
  date: string;          // YYYY-MM-DD
  category: CounselingCategory;
  notes: string;
  followUp: string;
  status: "open" | "selesai";
  counselor: string;
  idempotencyKey?: string;
}

export type Rating = "A" | "B" | "C";
export interface InternshipRatings {
  kedisiplinan: Rating | null; kerjasama: Rating | null; inisiatif: Rating | null;
  tanggungJawab: Rating | null; adaptasi: Rating | null; memberiMasukan: Rating | null;
  pengumpulanLaporan: Rating | null;
}
export interface Internship {
  id: string; studentId: string; academicYearId: string;
  lokasiMagang: string; posisi: string; pembimbing: string; phone: string;
  token: string; status: "pending" | "graded";
  ratings: InternshipRatings; nilaiAkhir: number | null; kategori: string | null; tanggal: string;
  idempotencyKey?: string;
}
