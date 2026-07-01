import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const studentId = req.query.studentId as string | undefined;
    if (!studentId) throw new ApiError(400, "studentId required");
    const enr = await repo.list("enrollments", [["studentId", studentId]]);
    const rows = await Promise.all(
      enr.map(async (e) => {
        const cls = await repo.get("classes", e.classId as string);
        const ay = await repo.get("academicYears", e.academicYearId as string);
        return {
          id: e.id,
          classId: e.classId,
          className: (cls?.name as string) ?? "",
          academicYearId: e.academicYearId,
          academicYear: (ay?.year as string) ?? "",
          waliKelas: (cls?.waliKelas as string) ?? "",
        };
      })
    );
    return rows;
  },
});
