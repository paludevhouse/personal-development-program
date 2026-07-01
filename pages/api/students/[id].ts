import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const s = await repo.get("students", req.query.id as string);
    if (!s) throw new ApiError(404, "not found");
    return s;
  },
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    const id = req.query.id as string;
    const allowed = ["aktif", "lulus", "pindah"];
    // NIS is the doc id — it cannot be changed via PUT; normalise it back to the param
    return repo.update("students", id, {
      namaSiswa: b.namaSiswa, namaBesar: b.namaBesar, namaPendek: b.namaPendek,
      nis: id, nisn: b.nisn, gender: b.gender === "P" ? "P" : "L",
      status: allowed.includes(b.status) ? b.status : "aktif",
    });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("students", req.query.id as string);
  },
});
