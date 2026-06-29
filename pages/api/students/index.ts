import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const classId = req.query.classId as string | undefined;
    const academicYearId = req.query.academicYearId as string | undefined;
    if (classId || academicYearId) {
      const filters: [string, unknown][] = [];
      if (classId) filters.push(["classId", classId]);
      if (academicYearId) filters.push(["academicYearId", academicYearId]);
      const enrollments = await repo.list("enrollments", filters);
      const ids = Array.from(new Set(enrollments.map((e) => e.studentId as string)));
      const students = await Promise.all(ids.map((id) => repo.get("students", id)));
      return students.filter(Boolean);
    }
    return repo.list("students");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("students", {
      namaSiswa: b.namaSiswa, namaBesar: b.namaBesar ?? b.namaSiswa?.toUpperCase() ?? "",
      namaPendek: b.namaPendek ?? "", nis: b.nis ?? "", nisn: b.nisn ?? "", gender: b.gender === "P" ? "P" : "L",
    });
  },
});
