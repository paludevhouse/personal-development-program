export interface RouteMeta {
  title: string;
  description?: string;
}

export const ROUTES: Record<string, RouteMeta> = {
  "/": { title: "Dasbor", description: "Ringkasan data manajemen" },
  "/students": { title: "Siswa", description: "Kelola data siswa dan status" },
  "/students/[id]": { title: "Detail Siswa", description: "Riwayat kelas, magang, konseling, wawancara" },
  "/classes": { title: "Kelas", description: "Kelola kelas per tahun ajaran" },
  "/classes/[id]": { title: "Detail Kelas", description: "Kelola siswa dalam kelas" },
  "/classes/promote": { title: "Naik Kelas", description: "Promosikan kelas ke tahun ajaran berikutnya" },
  "/academic-years": { title: "Tahun Ajaran", description: "Kelola tahun ajaran" },
  "/internships": { title: "Magang", description: "Penempatan dan penilaian magang siswa" },
  "/master-magang": { title: "Master Magang", description: "Data perusahaan, PIC, dan kontak" },
  "/counseling": { title: "Konseling", description: "Riwayat dan catatan konseling siswa" },
  "/wawancara": { title: "Wawancara Penjurusan", description: "Wawancara penjurusan siswa" },
  "/settings": { title: "Pengaturan", description: "Template pesan WhatsApp" },
  "/account": { title: "Akun", description: "Kelola akun dan kata sandi" },
  "/laporan-magang": { title: "Laporan Magang", description: "Ringkasan dan ekspor nilai magang" },
  "/login": { title: "Masuk" },
};

export const APP_NAME = "Personal Development Program (Pedevpro)";

/** Look up meta for a pathname, with a fallback. */
export function routeMeta(pathname: string): RouteMeta {
  return ROUTES[pathname] ?? { title: APP_NAME };
}
