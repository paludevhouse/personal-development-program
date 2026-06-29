export interface RouteMeta {
  title: string;
  description?: string;
}

export const ROUTES: Record<string, RouteMeta> = {
  "/": { title: "Dasbor", description: "Ringkasan data manajemen" },
  "/students": { title: "Siswa", description: "Kelola data siswa dan status" },
  "/classes": { title: "Kelas", description: "Kelola kelas per tahun ajaran" },
  "/academic-years": { title: "Tahun Ajaran", description: "Kelola tahun ajaran" },
  "/internships": { title: "Magang", description: "Penempatan dan penilaian magang siswa" },
  "/master-magang": { title: "Master Magang", description: "Data perusahaan, PIC, dan kontak" },
  "/settings": { title: "Pengaturan", description: "Template pesan WhatsApp" },
  "/login": { title: "Masuk" },
};

export const APP_NAME = "MDC Management";

/** Look up meta for a pathname, with a fallback. */
export function routeMeta(pathname: string): RouteMeta {
  return ROUTES[pathname] ?? { title: APP_NAME };
}
