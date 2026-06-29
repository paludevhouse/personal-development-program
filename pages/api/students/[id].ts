import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("students", req.query.id as string, {
      namaSiswa: b.namaSiswa, namaBesar: b.namaBesar, namaPendek: b.namaPendek,
      nis: b.nis, nisn: b.nisn, gender: b.gender === "P" ? "P" : "L",
    });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("students", req.query.id as string);
  },
});
