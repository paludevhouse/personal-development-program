import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const id = req.query.id as string;
    const cls = await repo.get("classes", id);
    if (!cls) throw new ApiError(404, "Kelas tidak ditemukan");
    return cls;
  },
  PUT: async (req) => {
    await requireAdmin(req);
    const id = req.query.id as string;
    const b = req.body ?? {};

    // Check if name changed so we can propagate to denormalized copies
    const existing = await repo.get("classes", id);
    const oldName = existing?.name as string | undefined;
    const newName = b.name as string | undefined;

    const updated = await repo.update("classes", id, {
      name: newName,
      academicYearId: b.academicYearId,
      waliKelas: b.waliKelas ?? "",
    });

    // Propagate rename to denormalized className on enrollments and students
    if (newName && oldName !== newName) {
      const [affectedEnrollments, affectedStudents] = await Promise.all([
        repo.list("enrollments", [["classId", id]]),
        repo.list("students", [["classId", id]]),
      ]);
      await Promise.all([
        ...affectedEnrollments.map((e) => repo.update("enrollments", e.id, { className: newName })),
        ...affectedStudents.map((s) => repo.update("students", s.id, { className: newName })),
      ]);
    }

    return updated;
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("classes", req.query.id as string);
  },
});
