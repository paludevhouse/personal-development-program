import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { StudentStatus } from "@/lib/types";

const VALID_STATUSES: StudentStatus[] = ["aktif", "lulus", "pindah"];

export default methods({
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    const { studentIds, status } = b as {
      studentIds?: string[];
      status?: string;
    };

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ApiError(400, "studentIds diperlukan");
    }
    if (!status || !VALID_STATUSES.includes(status as StudentStatus)) {
      throw new ApiError(400, "status tidak valid");
    }

    await Promise.all(
      studentIds.map((id: string) => repo.update("students", id, { status }))
    );

    return { count: studentIds.length };
  },
});
