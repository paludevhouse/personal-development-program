import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    return repo.list("companies");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("companies", { perusahaan: b.perusahaan ?? "", pic: b.pic ?? "", phone: b.phone ?? "", alamat: b.alamat ?? "" });
  },
});
