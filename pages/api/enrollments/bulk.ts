import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    const { academicYearId, classId, studentIds } = b as {
      academicYearId?: string;
      classId?: string;
      studentIds?: string[];
    };

    if (!academicYearId || !classId || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, "academicYearId, classId, dan studentIds diperlukan");
    }

    // Read the class ONCE to get className
    const cls = await repo.get("classes", classId);
    if (!cls) throw new ApiError(404, "Kelas tidak ditemukan");
    const className = cls.name as string;

    await Promise.all(
      studentIds.map(async (studentId: string) => {
        // Upsert enrollment
        const existing = await repo.list("enrollments", [
          ["studentId", studentId],
          ["academicYearId", academicYearId],
        ]);
        if (existing.length > 0) {
          await repo.update("enrollments", existing[0].id, { classId, className, academicYearId });
        } else {
          await repo.create("enrollments", { studentId, classId, className, academicYearId });
        }
        // Denormalize onto student document
        await repo.update("students", studentId, { classId, className, academicYearId });
      })
    );

    return { count: studentIds.length };
  },
});
