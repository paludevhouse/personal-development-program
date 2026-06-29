import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { ParsedStudent } from "@/lib/excel/parseStudents";

export default methods({
  POST: async (req) => {
    await requireAdmin(req);
    const { academicYearId, classId, students } = (req.body ?? {}) as {
      academicYearId?: string; classId?: string; students?: ParsedStudent[];
    };
    if (!academicYearId || !classId) throw new ApiError(400, "academicYearId and classId required");
    const list = students ?? [];

    const existing = await repo.list("students");
    const byNisn = new Map(existing.map((s) => [String(s.nisn), s.id as string]));
    const existingEnroll = await repo.list("enrollments", [["classId", classId], ["academicYearId", academicYearId]]);
    const enrolledStudentIds = new Set(existingEnroll.map((e) => e.studentId as string));

    let created = 0, updated = 0;
    for (const s of list) {
      let id = s.nisn ? byNisn.get(String(s.nisn)) : undefined;
      if (id) { await repo.update("students", id, { ...s }); updated++; }
      else { const r = await repo.create("students", { ...s }); id = r.id; created++; }
      if (!enrolledStudentIds.has(id)) {
        await repo.create("enrollments", { studentId: id, classId, academicYearId });
        enrolledStudentIds.add(id);
      }
    }
    return { created, updated };
  },
});
