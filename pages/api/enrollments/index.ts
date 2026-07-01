import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

/** Read each distinct class at most once. */
async function resolveClass(
  classId: string,
  cache: Map<string, Record<string, unknown> | null>
): Promise<Record<string, unknown> | null> {
  if (cache.has(classId)) return cache.get(classId)!;
  const cls = await repo.get("classes", classId);
  cache.set(classId, cls);
  return cls;
}

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const studentId = req.query.studentId as string | undefined;
    const academicYearId = req.query.academicYearId as string | undefined;

    if (academicYearId) {
      const enr = await repo.list("enrollments", [["academicYearId", academicYearId]]);
      const classCache = new Map<string, Record<string, unknown> | null>();
      const rows = await Promise.all(
        enr.map(async (e) => {
          // Prefer denormalized className; fall back to a single class read (Map-cached)
          const cid = e.classId as string;
          const clsName = e.className as string | undefined;
          const wali = clsName
            ? ((await resolveClass(cid, classCache))?.waliKelas as string | undefined) ?? ""
            : "";
          const cls = clsName ? null : await resolveClass(cid, classCache);
          return {
            id: e.id,
            studentId: e.studentId,
            classId: cid,
            className: clsName ?? (cls?.name as string) ?? "",
            academicYearId: e.academicYearId,
            waliKelas: (wali || (cls?.waliKelas as string)) ?? "",
          };
        })
      );
      return rows;
    }

    if (!studentId) throw new ApiError(400, "studentId required");
    const enr = await repo.list("enrollments", [["studentId", studentId]]);
    const classCache = new Map<string, Record<string, unknown> | null>();
    const ayCache = new Map<string, Record<string, unknown> | null>();
    const rows = await Promise.all(
      enr.map(async (e) => {
        const cid = e.classId as string;
        const ayid = e.academicYearId as string;
        const clsName = e.className as string | undefined;
        const cls = clsName ? null : await resolveClass(cid, classCache);

        // Cache academic year reads too
        if (!ayCache.has(ayid)) {
          const ay = await repo.get("academicYears", ayid);
          ayCache.set(ayid, ay);
        }
        const ay = ayCache.get(ayid)!;
        // Get waliKelas — if we used denormalized className, still need class for waliKelas
        const waliCls = clsName ? await resolveClass(cid, classCache) : cls;

        return {
          id: e.id,
          classId: cid,
          className: clsName ?? (cls?.name as string) ?? "",
          academicYearId: ayid,
          academicYear: (ay?.year as string) ?? "",
          waliKelas: (waliCls?.waliKelas as string) ?? "",
        };
      })
    );
    return rows;
  },
});
