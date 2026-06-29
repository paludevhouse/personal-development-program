import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("companies", req.query.id as string, { perusahaan: b.perusahaan, pic: b.pic, phone: b.phone, alamat: b.alamat });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("companies", req.query.id as string);
  },
});
