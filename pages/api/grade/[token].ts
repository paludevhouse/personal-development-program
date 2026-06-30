import { methods, ApiError } from "@/lib/api/respond";
import { getDb } from "@/lib/firebase/admin";
import { repo } from "@/lib/db/repo";
import { computeGrade } from "@/lib/internship/grade";
import { InternshipRatings, Internship } from "@/lib/types";

async function findByToken(token: string): Promise<Internship | null> {
  const snap = await getDb().collection("internships").where("token", "==", token).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Internship, "id">) } as Internship;
}

export default methods({
  // PUBLIC — no requireAdmin. The token is the only credential.
  GET: async (req) => {
    const token = req.query.token as string;
    const it = await findByToken(token);
    if (!it) throw new ApiError(404, "not found");

    const key = { lokasiMagang: it.lokasiMagang, pembimbing: it.pembimbing, academicYearId: it.academicYearId };

    // Single-field query (no composite index) + in-memory filter
    const all = await repo.list("internships", [["pembimbing", key.pembimbing]]);
    const group = all.filter(
      (i) => i.lokasiMagang === key.lokasiMagang && i.academicYearId === key.academicYearId
    ) as unknown as Internship[];

    // Resolve display names
    const items = await Promise.all(
      group.map(async (item) => {
        const studentName =
          item.studentName ||
          ((await repo.get("students", item.studentId as string))?.namaSiswa as string | undefined) ||
          "";
        return {
          id: item.id,
          studentName,
          posisi: item.posisi ?? "",
          lokasiMagang: item.lokasiMagang ?? "",
          pembimbing: item.pembimbing ?? "",
          phone: item.phone ?? "",
          tanggal: item.tanggal ?? "",
          ratings: item.ratings ?? null,
          nilaiAkhir: item.nilaiAkhir ?? null,
          kategori: item.kategori ?? null,
          status: item.status ?? "pending",
        };
      })
    );

    return {
      perusahaan: it.lokasiMagang ?? "",
      pic: it.pembimbing ?? "",
      items,
    };
  },

  POST: async (req) => {
    const token = req.query.token as string;
    const it = await findByToken(token);
    if (!it) throw new ApiError(404, "not found");

    const key = { lokasiMagang: it.lokasiMagang, pembimbing: it.pembimbing, academicYearId: it.academicYearId };

    const { internshipId, ratings, studentName, lokasiMagang, posisi, pembimbing, phone, tanggal } = (req.body ?? {}) as {
      internshipId: string;
      ratings: InternshipRatings;
      studentName?: string;
      lokasiMagang?: string;
      posisi?: string;
      pembimbing?: string;
      phone?: string;
      tanggal?: string;
    };

    if (!internshipId) throw new ApiError(400, "internshipId required");
    const target = await repo.get("internships", internshipId);
    if (!target) throw new ApiError(404, "internship not found");

    // Authorize: target must be in the same group
    if (
      target.pembimbing !== key.pembimbing ||
      target.lokasiMagang !== key.lokasiMagang ||
      target.academicYearId !== key.academicYearId
    ) {
      throw new ApiError(403, "not in this group");
    }

    if (target.status === "graded") throw new ApiError(409, "already graded");

    let grade;
    try {
      grade = computeGrade(ratings); // throws if incomplete
    } catch {
      throw new ApiError(400, "ratings incomplete");
    }

    await repo.update("internships", internshipId, {
      studentName: studentName ?? target.studentName ?? "",
      lokasiMagang: lokasiMagang ?? target.lokasiMagang ?? "",
      posisi: posisi ?? target.posisi ?? "",
      pembimbing: pembimbing ?? target.pembimbing ?? "",
      phone: phone ?? target.phone ?? "",
      tanggal: tanggal ?? target.tanggal ?? "",
      ratings,
      nilaiAkhir: grade.nilaiAkhir,
      kategori: grade.kategori,
      status: "graded",
    });

    return { ok: true, nilaiAkhir: grade.nilaiAkhir, kategori: grade.kategori };
  },
});
