import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { deactivateOthers } from "@/lib/db/academicYears";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const id = req.query.id as string;
    const b = req.body ?? {};
    const isActive = !!b.isActive;
    const updated = await repo.update("academicYears", id, { year: b.year, isActive });
    if (isActive) await deactivateOthers(id);
    return updated;
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("academicYears", req.query.id as string);
  },
});
