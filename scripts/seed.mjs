// Seed Firestore from the Master Magang xlsx so the app has real test data.
// Run with credentials loaded from .env.local:
//   node --env-file=.env.local scripts/seed.mjs ["/path/to/Master Magang.xlsx"]
// Idempotent: re-running won't duplicate (matches academic year by year+semester,
// class by name+year, student by NISN, internship by studentId+year).

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import * as XLSX from "xlsx";

const XLSX_PATH =
  process.argv[2] ||
  "/Users/ferdylim/Downloads/Master Magang 12 2526 RUMUS TERBARU.xlsx";

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());

async function findOne(col, field, value) {
  const snap = await db.collection(col).where(field, "==", value).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function main() {
  const wb = XLSX.read(readFileSync(XLSX_PATH));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  console.log(`Read ${rows.length} rows from ${wb.SheetNames[0]}`);

  // 1) Academic year (active)
  const year = str(rows[0]["Tahun Ajaran"]) || "2025/2026";
  const semester = str(rows[0]["Semester"]) || "1 (Satu)";
  let ay = await findOne("academicYears", "year", year);
  if (!ay) {
    const ref = await db.collection("academicYears").add({ year, semester, isActive: true });
    ay = { id: ref.id };
    console.log(`+ academicYear ${year} ${semester}`);
  } else {
    console.log(`= academicYear ${year} exists`);
  }

  // 2) Classes (distinct "Kelas") + 3) students + enrollments + 4) internship placements
  const classCache = new Map();
  let cCreated = 0, sCreated = 0, sUpdated = 0, eCreated = 0, iCreated = 0;

  for (const r of rows) {
    const namaSiswa = str(r["Nama Siswa"]);
    if (!namaSiswa) continue;
    const kelas = str(r["Kelas"]) || "XII";
    const wali = str(r["Wali Kelas"]);

    // class
    let classId = classCache.get(kelas);
    if (!classId) {
      const existing = (await db
        .collection("classes")
        .where("academicYearId", "==", ay.id)
        .where("name", "==", kelas)
        .limit(1)
        .get()).docs[0];
      if (existing) classId = existing.id;
      else {
        const ref = await db.collection("classes").add({ name: kelas, academicYearId: ay.id, waliKelas: wali });
        classId = ref.id; cCreated++;
      }
      classCache.set(kelas, classId);
    }

    // student (match by NISN)
    const nisn = str(r["NISN"]);
    const student = {
      namaSiswa,
      namaBesar: str(r["Nama Besar"]) || namaSiswa.toUpperCase(),
      namaPendek: str(r["Nama Pendek"]),
      nis: str(r["Nomor Induk Sekolah"]),
      nisn,
      gender: "L", // source sheet has no gender column; default L
    };
    let studentId = null;
    const exById = nisn ? await findOne("students", "nisn", nisn) : null;
    if (exById) { await db.collection("students").doc(exById.id).set(student, { merge: true }); studentId = exById.id; sUpdated++; }
    else { const ref = await db.collection("students").add(student); studentId = ref.id; sCreated++; }

    // enrollment (dedupe by student+class+year)
    const enr = (await db
      .collection("enrollments")
      .where("studentId", "==", studentId)
      .where("classId", "==", classId)
      .where("academicYearId", "==", ay.id)
      .limit(1)
      .get()).docs[0];
    if (!enr) { await db.collection("enrollments").add({ studentId, classId, academicYearId: ay.id }); eCreated++; }

    // internship placement (pending, so the PIC grading flow is testable)
    const it = (await db
      .collection("internships")
      .where("studentId", "==", studentId)
      .where("academicYearId", "==", ay.id)
      .limit(1)
      .get()).docs[0];
    if (!it) {
      const { randomBytes } = await import("crypto");
      await db.collection("internships").add({
        studentId, academicYearId: ay.id,
        lokasiMagang: str(r["Lokasi Magang"]),
        posisi: str(r["Posisi"]),
        pembimbing: str(r["Pembimbing"]),
        token: randomBytes(24).toString("base64url"),
        status: "pending",
        ratings: { kedisiplinan: null, kerjasama: null, inisiatif: null, tanggungJawab: null, adaptasi: null, memberiMasukan: null, pengumpulanLaporan: null },
        nilaiAkhir: null, kategori: null,
        tanggal: str(r["Tanggal"]),
      });
      iCreated++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  classes:     +${cCreated}`);
  console.log(`  students:    +${sCreated} new, ${sUpdated} updated`);
  console.log(`  enrollments: +${eCreated}`);
  console.log(`  internships: +${iCreated} (pending)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
