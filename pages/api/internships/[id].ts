import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const it = await repo.get("internships", req.query.id as string);
    if (!it) throw new ApiError(404, "not found");
    return it;
  },
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("internships", req.query.id as string, {
      lokasiMagang: b.lokasiMagang, posisi: b.posisi, pembimbing: b.pembimbing, phone: b.phone ?? "", tanggal: b.tanggal,
    });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("internships", req.query.id as string);
  },
});
