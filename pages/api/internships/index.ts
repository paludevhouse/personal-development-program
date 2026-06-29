import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { newToken } from "@/lib/internship/token";

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
    const b = req.body ?? {};
    return repo.create("internships", {
      studentId: b.studentId, academicYearId: b.academicYearId,
      lokasiMagang: b.lokasiMagang ?? "", posisi: b.posisi ?? "", pembimbing: b.pembimbing ?? "",
      token: newToken(), status: "pending",
      ratings: EMPTY_RATINGS, nilaiAkhir: null, kategori: null, tanggal: b.tanggal ?? "",
    });
  },
});
