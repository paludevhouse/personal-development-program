import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const id = req.query.id as string;
    const b = req.body ?? {};
    return repo.update("academicYears", id, { year: b.year, semester: b.semester, isActive: !!b.isActive });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("academicYears", req.query.id as string);
  },
});
