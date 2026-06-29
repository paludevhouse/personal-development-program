import { InternshipRatings, Rating } from "@/lib/types";

export const CRITERIA: { key: keyof InternshipRatings; label: string }[] = [
  { key: "kedisiplinan", label: "Kedisiplinan" },
  { key: "kerjasama", label: "Kerjasama" },
  { key: "inisiatif", label: "Inisiatif" },
  { key: "tanggungJawab", label: "Tanggung Jawab" },
  { key: "adaptasi", label: "Adaptasi" },
  { key: "memberiMasukan", label: "Kemampuan Memberi Masukan" },
  { key: "pengumpulanLaporan", label: "Pengumpulan Laporan" },
];

export function ratingToScore(r: Rating): number {
  return r === "A" ? 98 : r === "B" ? 90 : 82;
}

export function computeGrade(ratings: InternshipRatings): { nilaiAkhir: number; kategori: string } {
  const scores = CRITERIA.map(({ key }) => {
    const r = ratings[key];
    if (r === null || r === undefined) throw new Error(`Missing rating: ${key}`);
    return ratingToScore(r);
  });
  const nilaiAkhir = scores.reduce((a, b) => a + b, 0) / scores.length;
  const kategori = nilaiAkhir >= 94.5 ? "sangat baik" : nilaiAkhir >= 86.5 ? "baik" : "cukup baik";
  return { nilaiAkhir, kategori };
}
