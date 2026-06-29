import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { newToken } from "@/lib/internship/token";
import { internshipSchema, parseOrThrow } from "@/lib/validation/schemas";

const EMPTY_RATINGS = {
  kedisiplinan: null, kerjasama: null, inisiatif: null, tanggungJawab: null,
  adaptasi: null, memberiMasukan: null, pengumpulanLaporan: null,
};

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const yearId = req.query.academicYearId as string | undefined;
    return repo.list("internships", yearId ? [["academicYearId", yearId]] : []);
  },
  POST: async (req) => {
    await requireAdmin(req);
    let input;
    try { input = parseOrThrow(internshipSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    const b = req.body ?? {};
    return repo.create("internships", {
      ...input,
      token: newToken(), status: "pending",
      ratings: EMPTY_RATINGS, nilaiAkhir: null, kategori: null, tanggal: b.tanggal ?? "",
    });
  },
});
