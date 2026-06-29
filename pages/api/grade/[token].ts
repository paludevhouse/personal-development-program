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
    const student = await repo.get("students", it.studentId as string);
    return {
      studentName: student?.namaSiswa ?? "",
      lokasiMagang: it.lokasiMagang, posisi: it.posisi, pembimbing: it.pembimbing,
      status: it.status,
    };
  },
  POST: async (req) => {
    const token = req.query.token as string;
    const it = await findByToken(token);
    if (!it) throw new ApiError(404, "not found");
    if (it.status === "graded") throw new ApiError(409, "already graded");
    const { ratings, lokasiMagang, posisi, pembimbing } = (req.body ?? {}) as {
      ratings: InternshipRatings; lokasiMagang?: string; posisi?: string; pembimbing?: string;
    };
    let grade;
    try {
      grade = computeGrade(ratings); // throws if incomplete
    } catch {
      throw new ApiError(400, "ratings incomplete");
    }
    await repo.update("internships", it.id as string, {
      lokasiMagang: lokasiMagang ?? it.lokasiMagang ?? "",
      posisi: posisi ?? it.posisi ?? "",
      pembimbing: pembimbing ?? it.pembimbing ?? "",
      ratings, nilaiAkhir: grade.nilaiAkhir, kategori: grade.kategori, status: "graded",
    });
    return { ok: true, nilaiAkhir: grade.nilaiAkhir, kategori: grade.kategori };
  },
});
