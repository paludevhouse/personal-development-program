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
    const byNis = new Map(existing.map((s) => [String(s.nis), s.id as string]));
    const existingEnroll = await repo.list("enrollments", [["classId", classId], ["academicYearId", academicYearId]]);
    const enrolledStudentIds = new Set(existingEnroll.map((e) => e.studentId as string));

    let created = 0, updated = 0;
    const success: ParsedStudent[] = [];
    const failed: { row: ParsedStudent; error: string }[] = [];

    for (const s of list) {
      try {
        let id: string | undefined = s.nis ? byNis.get(String(s.nis)) : undefined;
        if (id) { await repo.update("students", id, { ...s }); updated++; }
        else { const r = await repo.create("students", { ...s, status: "aktif" }); id = r.id as string; created++; }
        if (id && !enrolledStudentIds.has(id)) {
          await repo.create("enrollments", { studentId: id, classId, academicYearId });
          enrolledStudentIds.add(id);
        }
        success.push(s);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Gagal mengimpor";
        failed.push({ row: s, error: message });
      }
    }
    return { created, updated, success, failed };
  },
});
