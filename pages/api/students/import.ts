import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { ParsedStudent } from "@/lib/excel/parseStudents";

export default methods({
  POST: async (req) => {
    await requireAdmin(req);
    const { academicYearId, classId, students } = (req.body ?? {}) as {
      academicYearId?: string;
      classId?: string;
      students?: ParsedStudent[];
    };
    if (!academicYearId) throw new ApiError(400, "academicYearId diperlukan");
    const list = students ?? [];

    // className→classId cache (case-insensitive key)
    const classCache = new Map<string, { id: string; name: string }>();

    async function resolveClass(kelasName: string): Promise<{ id: string; name: string }> {
      const key = kelasName.trim().toLowerCase();
      if (classCache.has(key)) return classCache.get(key)!;
      const existing = await repo.list("classes", [["academicYearId", academicYearId]]);
      for (const c of existing) {
        const cname = String(c.name ?? "");
        classCache.set(cname.toLowerCase(), { id: c.id, name: cname });
      }
      if (classCache.has(key)) return classCache.get(key)!;
      // Create new class
      const created = await repo.create("classes", { name: kelasName.trim(), academicYearId, waliKelas: "" });
      const entry = { id: created.id as string, name: kelasName.trim() };
      classCache.set(key, entry);
      return entry;
    }

    let created = 0;
    let updated = 0;
    const success: ParsedStudent[] = [];
    const failed: { row: ParsedStudent; error: string }[] = [];

    // Track NIS seen in this import batch (for duplicate detection)
    const seenNis = new Map<string, number>(); // nis -> first row index (1-based)

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const rowNum = i + 1;

      // Require non-empty NIS
      if (!s.nis || !s.nis.trim()) {
        failed.push({ row: s, error: `Baris ${rowNum}: NIS kosong` });
        continue;
      }

      const nis = s.nis.trim();

      // Duplicate NIS check within this import
      if (seenNis.has(nis)) {
        failed.push({ row: s, error: `Baris ${rowNum}: NIS ${nis} duplikat` });
        continue;
      }
      seenNis.set(nis, rowNum);

      try {
        // Resolve target class
        let resolvedClassId: string | undefined;
        let resolvedClassName: string | undefined;

        if (s.kelas && s.kelas.trim()) {
          const cls = await resolveClass(s.kelas.trim());
          resolvedClassId = cls.id;
          resolvedClassName = cls.name;
        } else if (classId) {
          // Use request-level classId; look up its name if not cached
          if (!classCache.has(`__id__${classId}`)) {
            const cls = await repo.get("classes", classId);
            if (cls) {
              const entry = { id: classId, name: String(cls.name ?? "") };
              classCache.set(`__id__${classId}`, entry);
            }
          }
          const cached = classCache.get(`__id__${classId}`);
          resolvedClassId = cached?.id ?? classId;
          resolvedClassName = cached?.name;
        }

        if (!resolvedClassId) {
          failed.push({ row: s, error: `Baris ${rowNum}: Kelas tidak ditentukan` });
          continue;
        }

        // Build student data (exclude kelas from student doc)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { kelas: _kelas, ...studentFields } = s;
        const studentData: Record<string, unknown> = {
          ...studentFields,
          nis,
          status: "aktif",
          classId: resolvedClassId,
          className: resolvedClassName ?? "",
          academicYearId,
        };

        // Create or update student keyed by NIS (doc ID = NIS per Task 57)
        const existingDoc = await repo.get("students", nis);
        if (existingDoc) {
          await repo.update("students", nis, studentData);
          updated++;
        } else {
          await repo.createWithId("students", nis, studentData);
          created++;
        }

        // Upsert enrollment
        const existingEnroll = await repo.list("enrollments", [
          ["studentId", nis],
          ["academicYearId", academicYearId],
        ]);
        if (existingEnroll.length > 0) {
          await repo.update("enrollments", existingEnroll[0].id, {
            classId: resolvedClassId,
            className: resolvedClassName ?? "",
            academicYearId,
          });
        } else {
          await repo.create("enrollments", {
            studentId: nis,
            classId: resolvedClassId,
            className: resolvedClassName ?? "",
            academicYearId,
          });
        }

        success.push(s);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Gagal mengimpor";
        failed.push({ row: s, error: `Baris ${rowNum}: ${message}` });
      }
    }

    return { created, updated, success, failed };
  },
});
