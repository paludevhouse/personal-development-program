import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { deactivateOthers } from "@/lib/db/academicYears";

interface Mapping {
  sourceClassId: string;
  action: "move" | "graduate";
  targetClassName?: string;
}

export default methods({
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    const { sourceYearId, targetYearId, mappings } = b as {
      sourceYearId?: string;
      targetYearId?: string;
      mappings?: Mapping[];
    };

    if (!sourceYearId || !targetYearId) {
      throw new ApiError(400, "sourceYearId dan targetYearId diperlukan");
    }
    if (sourceYearId === targetYearId) {
      throw new ApiError(400, "Tahun tujuan harus berbeda dari tahun asal");
    }
    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw new ApiError(400, "mappings diperlukan");
    }

    // 1. Load ALL students once, keyed by id, to avoid per-student reads.
    const allStudents = await repo.list("students");
    const studentMap = new Map<string, Record<string, unknown>>(
      allStudents.map((s) => [s.id, s])
    );

    // 2. Build a target-class name -> id/name cache, seeded from existing target-year classes.
    const targetClasses = await repo.list("classes", [["academicYearId", targetYearId]]);
    const classCache = new Map<string, { id: string; name: string }>();
    for (const c of targetClasses) {
      classCache.set((c.name as string).toLowerCase(), { id: c.id, name: c.name as string });
    }
    let classesCreated = 0;

    async function resolveTargetClass(name: string): Promise<{ id: string; name: string }> {
      const key = name.toLowerCase();
      const cached = classCache.get(key);
      if (cached) return cached;
      const created = await repo.create("classes", { name, academicYearId: targetYearId, waliKelas: "" });
      const entry = { id: created.id as string, name };
      classCache.set(key, entry);
      classesCreated++;
      return entry;
    }

    // Track promoted students -> their target class, and graduated count.
    const promotedStudents = new Map<string, { id: string; name: string }>();
    let graduated = 0;

    for (const mapping of mappings) {
      const { sourceClassId, action } = mapping;
      if (!sourceClassId || !action) continue;

      const srcEnr = await repo.list("enrollments", [["classId", sourceClassId]]);

      if (action === "move") {
        if (!mapping.targetClassName || !mapping.targetClassName.trim()) {
          throw new ApiError(400, "targetClassName diperlukan untuk aksi 'move'");
        }
        const tc = await resolveTargetClass(mapping.targetClassName.trim());

        // Existing target enrollments for this year, to avoid duplicates.
        const existingTargetEnr = await repo.list("enrollments", [["academicYearId", targetYearId]]);
        const existingTargetStudentIds = new Set(existingTargetEnr.map((e) => e.studentId as string));

        await Promise.all(
          srcEnr.map(async (e) => {
            const studentId = e.studentId as string;
            const student = studentMap.get(studentId);
            if (!student || student.status !== "aktif") return;
            if (existingTargetStudentIds.has(studentId)) return;

            await repo.create("enrollments", {
              studentId,
              classId: tc.id,
              className: tc.name,
              academicYearId: targetYearId,
            });
            promotedStudents.set(studentId, tc);
          })
        );
      } else if (action === "graduate") {
        await Promise.all(
          srcEnr.map(async (e) => {
            const studentId = e.studentId as string;
            const student = studentMap.get(studentId);
            if (!student || student.status !== "aktif") return;

            await repo.update("students", studentId, { status: "lulus" });
            graduated++;
          })
        );
      } else {
        throw new ApiError(400, `Aksi tidak dikenal: ${action}`);
      }
    }

    // 4. Activate target year, deactivate all others.
    await repo.update("academicYears", targetYearId, { isActive: true });
    await deactivateOthers(targetYearId);

    // 5. Denormalize current class for promoted students.
    await Promise.all(
      Array.from(promotedStudents.entries()).map(([studentId, tc]) =>
        repo.update("students", studentId, {
          classId: tc.id,
          className: tc.name,
          academicYearId: targetYearId,
        })
      )
    );

    return { promoted: promotedStudents.size, graduated, classesCreated };
  },
});
