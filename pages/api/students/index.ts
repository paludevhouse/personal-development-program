import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const classId = req.query.classId as string | undefined;
    const academicYearId = req.query.academicYearId as string | undefined;

    if (classId || academicYearId) {
      // Try direct query on denormalized fields first (O(1) reads)
      const filters: [string, unknown][] = [];
      if (classId) filters.push(["classId", classId]);
      if (academicYearId) filters.push(["academicYearId", academicYearId]);
      const direct = await repo.list("students", filters);
      if (direct.length > 0) return direct;

      // Fallback: enrollment-join path for students not yet backfilled
      const enrollmentFilters: [string, unknown][] = [];
      if (classId) enrollmentFilters.push(["classId", classId]);
      if (academicYearId) enrollmentFilters.push(["academicYearId", academicYearId]);
      const enrollments = await repo.list("enrollments", enrollmentFilters);
      const ids = Array.from(new Set(enrollments.map((e) => e.studentId as string)));
      const students = await Promise.all(ids.map((id) => repo.get("students", id)));
      return students.filter(Boolean);
    }

    return repo.list("students");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    const nis = String(b.nis ?? "").trim();
    if (!nis) throw new ApiError(400, "NIS wajib diisi");
    const data: Record<string, unknown> = {
      namaSiswa: b.namaSiswa, namaBesar: b.namaBesar ?? b.namaSiswa?.toUpperCase() ?? "",
      namaPendek: b.namaPendek ?? "", nis, nisn: b.nisn ?? "", gender: b.gender === "P" ? "P" : "L",
      status: b.status ?? "aktif",
    };
    if (b.classId !== undefined) data.classId = b.classId;
    if (b.className !== undefined) data.className = b.className;
    if (b.academicYearId !== undefined) data.academicYearId = b.academicYearId;
    try {
      return await repo.createWithId("students", nis, data);
    } catch (e) {
      if (e instanceof Error && e.message === "exists") throw new ApiError(409, "NIS sudah terdaftar");
      throw e;
    }
  },
});
