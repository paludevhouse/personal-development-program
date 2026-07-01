// Backfill: denormalize className onto enrollments + current class onto student documents.
// Run with credentials loaded from .env.local:
//   node --env-file=.env.local scripts/backfill-student-class.mjs
//
// Idempotent — re-running is safe; already-correct documents are overwritten with the same values.
// DO NOT run this script automatically — review and run manually after deployment.

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

async function main() {
  // 1) Find the active academic year
  const aySnap = await db.collection("academicYears").where("isActive", "==", true).limit(1).get();
  const activeAyId = aySnap.empty ? null : aySnap.docs[0].id;
  console.log(`Active academicYearId: ${activeAyId ?? "(none)"}`);

  // 2) Load all classes into a Map (classId → {name, academicYearId, waliKelas})
  const classSnap = await db.collection("classes").get();
  const classMap = new Map();
  for (const d of classSnap.docs) classMap.set(d.id, { id: d.id, ...d.data() });
  console.log(`Loaded ${classMap.size} classes`);

  // 3) Load all enrollments
  const enrSnap = await db.collection("enrollments").get();
  console.log(`Processing ${enrSnap.docs.length} enrollments`);

  // 4) For each student, collect enrollments to pick the best "current" binding
  // best = enrollment in active year; fallback = enrollment with most recent academicYear by string sort
  const studentEnrollments = new Map(); // studentId → [{...enrollment, academicYear}]

  // Load academicYears to know which is most recent by year string
  const allAySnap = await db.collection("academicYears").get();
  const ayMap = new Map();
  for (const d of allAySnap.docs) ayMap.set(d.id, d.data().year);

  let enrPatched = 0;
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchCount = 0;

  async function flushBatch() {
    if (batchCount > 0) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  for (const d of enrSnap.docs) {
    const e = { id: d.id, ...d.data() };
    const cls = classMap.get(e.classId);
    const className = cls?.name ?? "";

    // Patch enrollment with className if missing or stale
    if (e.className !== className) {
      batch.set(d.ref, { className }, { merge: true });
      batchCount++;
      enrPatched++;
      if (batchCount >= BATCH_SIZE) await flushBatch();
    }

    // Track for student binding selection
    if (!studentEnrollments.has(e.studentId)) {
      studentEnrollments.set(e.studentId, []);
    }
    studentEnrollments.get(e.studentId).push({ ...e, className, cls });
  }
  await flushBatch();
  console.log(`  enrollments patched: ${enrPatched}`);

  // 5) For each student, determine current binding and patch student document
  let studentPatched = 0;
  batch = db.batch();
  batchCount = 0;

  for (const [studentId, enrollments] of studentEnrollments.entries()) {
    // Pick the enrollment for the active year first; else most recent by year string
    let chosen = enrollments.find((e) => e.academicYearId === activeAyId);
    if (!chosen) {
      enrollments.sort((a, b) => {
        const ya = ayMap.get(a.academicYearId) ?? "";
        const yb = ayMap.get(b.academicYearId) ?? "";
        return yb.localeCompare(ya); // descending: most recent first
      });
      chosen = enrollments[0];
    }
    if (!chosen) continue;

    const patch = {
      classId: chosen.classId,
      className: chosen.className,
      academicYearId: chosen.academicYearId,
    };

    const sRef = db.collection("students").doc(studentId);
    batch.set(sRef, patch, { merge: true });
    batchCount++;
    studentPatched++;
    if (batchCount >= BATCH_SIZE) await flushBatch();
  }
  await flushBatch();
  console.log(`  students patched:    ${studentPatched}`);

  console.log("\nBackfill complete.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
