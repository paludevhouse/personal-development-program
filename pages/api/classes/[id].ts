import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("classes", req.query.id as string, { name: b.name, academicYearId: b.academicYearId, waliKelas: b.waliKelas ?? "" });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("classes", req.query.id as string);
  },
});
