export type Gender = "L" | "P";

export interface Company { id: string; perusahaan: string; pic: string; phone: string; alamat: string; }

export interface AcademicYear { id: string; year: string; semester: string; isActive: boolean; }
export interface SchoolClass { id: string; name: string; academicYearId: string; waliKelas: string; }
export interface Student { id: string; namaSiswa: string; namaBesar: string; namaPendek: string; nis: string; nisn: string; gender: Gender; }
export interface Enrollment { id: string; studentId: string; classId: string; academicYearId: string; }

export type Rating = "A" | "B" | "C";
export interface InternshipRatings {
  kedisiplinan: Rating | null; kerjasama: Rating | null; inisiatif: Rating | null;
  tanggungJawab: Rating | null; adaptasi: Rating | null; memberiMasukan: Rating | null;
  pengumpulanLaporan: Rating | null;
}
export interface Internship {
  id: string; studentId: string; academicYearId: string;
  lokasiMagang: string; posisi: string; pembimbing: string;
  token: string; status: "pending" | "graded";
  ratings: InternshipRatings; nilaiAkhir: number | null; kategori: string | null; tanggal: string;
}
