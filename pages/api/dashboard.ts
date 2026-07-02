import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import type { AcademicYear, Student, SchoolClass, Internship, Counseling, Wawancara } from "@/lib/types";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);

    const years = (await repo.list("academicYears")) as unknown as AcademicYear[];
    const activeYear = years.find((y) => y.isActive) ?? null;
    const yearId = activeYear?.id;

    const [students, classes, internships, counseling, wawancara] = await Promise.all([
      repo.list("students") as unknown as Promise<Student[]>,
      repo.list("classes", yearId ? [["academicYearId", yearId]] : []) as unknown as Promise<SchoolClass[]>,
      repo.list("internships", yearId ? [["academicYearId", yearId]] : []) as unknown as Promise<Internship[]>,
      repo.list("counseling") as unknown as Promise<Counseling[]>,
      repo.list("wawancara") as unknown as Promise<Wawancara[]>,
    ]);

    const totalSiswa = students.length;
    const aktif = students.filter((s) => (s.status ?? "aktif") === "aktif").length;
    const nonaktif = totalSiswa - aktif;

    const magangTotal = internships.length;
    const dinilai = internships.filter((i) => i.status === "graded").length;
    const gradedScores = internships
      .filter((i) => i.status === "graded" && i.nilaiAkhir != null)
      .map((i) => i.nilaiAkhir as number);
    const avgNilai = gradedScores.length ? gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length : null;

    const konselingOpen = counseling.filter((c) => c.status === "open").length;
    const wawancaraDijadwalkan = wawancara.filter((w) => w.status === "dijadwalkan").length;

    return {
      activeYear: activeYear ? { id: activeYear.id, year: activeYear.year } : null,
      siswa: { aktif, nonaktif, total: totalSiswa },
      kelas: classes.length,
      magang: { total: magangTotal, dinilai, avgNilai },
      konseling: { total: counseling.length, open: konselingOpen },
      wawancara: { total: wawancara.length, dijadwalkan: wawancaraDijadwalkan },
    };
  },
}, { etag: { GET: ["students", "classes", "internships", "counseling", "wawancara", "academicYears"] } });
