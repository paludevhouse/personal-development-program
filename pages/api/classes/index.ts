import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const yearId = req.query.academicYearId as string | undefined;
    return repo.list("classes", yearId ? [["academicYearId", yearId]] : []);
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("classes", { name: b.name, academicYearId: b.academicYearId, waliKelas: b.waliKelas ?? "" });
  },
});
