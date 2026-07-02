import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Internship } from "@/lib/types";
import { CRITERIA } from "@/lib/internship/grade";
import { formatIndonesianName } from "@/lib/utils/nameFormat";

const PERFORMANCE_EN: Record<string, string> = {
  "sangat baik": "Very Good",
  "baik": "Good",
  "cukup baik": "Fair",
};

function buildCertificateText(pronoun: string, place: string, position: string, academicYear: string): string {
  return `For successfully completing ${pronoun} internship at ${place} as a ${position}, in fulfillment of the Personal Development Program at Masa Depan Cerah Senior High School for the ${academicYear} academic year`;
}

export function buildGradesWorkbook(
  internships: Internship[],
  opts: {
    academicYear: string;
    nisById?: Record<string, string>;
    kelasById?: Record<string, string>;
    genderById?: Record<string, "L" | "P">;
  },
): XLSX.WorkBook {
  const rows = internships.map((it) => {
    const row: Record<string, string | number> = {
      "Nama Siswa": it.studentName ?? "",
      "NIS": opts.nisById?.[it.studentId] ?? "",
      "Kelas": opts.kelasById?.[it.studentId] ?? "",
      "Lokasi Magang": it.lokasiMagang ?? "",
      "Posisi": it.posisi ?? "",
      "Pembimbing": it.pembimbing ?? "",
    };
    for (const c of CRITERIA) row[c.label] = it.ratings?.[c.key] ?? "";
    row["Nilai"] = it.nilaiAkhir ?? "";
    row["Kategori"] = it.kategori ?? "";
    row["Tanggal"] = it.tanggal ?? "";
    return row;
  });
  const ws = XLSX.utils.aoa_to_sheet([
    ["LAPORAN NILAI MAGANG"],
    [`Tahun Ajaran: ${opts.academicYear}`],
    [`Tanggal Cetak: ${dayjs().format("D MMMM YYYY")}`],
    [],
  ]);
  XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });

  const canvaRows = internships.map((it) => {
    const pronoun = opts.genderById?.[it.studentId] === "P" ? "her" : "his";
    const place = it.lokasiMagang ?? "";
    const position = it.posisi ?? "";
    return {
      "Full Name": it.studentName ?? "",
      "Name": formatIndonesianName(it.studentName ?? ""),
      "Class": opts.kelasById?.[it.studentId] ?? "",
      "Student Number": opts.nisById?.[it.studentId] ?? "",
      "Place": place,
      "Position": position,
      "Supervisor": formatIndonesianName(it.pembimbing ?? ""),
      "Internship Dates": it.tanggal ?? "",
      "Discipline": it.ratings?.kedisiplinan ?? "",
      "Cooperation": it.ratings?.kerjasama ?? "",
      "Initiative": it.ratings?.inisiatif ?? "",
      "Responsibility": it.ratings?.tanggungJawab ?? "",
      "Adaptability": it.ratings?.adaptasi ?? "",
      "Ability to Give Input": it.ratings?.memberiMasukan ?? "",
      "Internship Personal Report": it.ratings?.pengumpulanLaporan ?? "",
      "Overall Performance": PERFORMANCE_EN[it.kategori ?? ""] ?? (it.kategori ?? ""),
      "Score": it.nilaiAkhir ?? "",
      "Pronoun": pronoun,
      "Certificate Text": buildCertificateText(pronoun, place, position, opts.academicYear),
    };
  });
  const canvaWs = XLSX.utils.json_to_sheet(canvaRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nilai Magang");
  XLSX.utils.book_append_sheet(wb, canvaWs, "Canva");
  return wb;
}
