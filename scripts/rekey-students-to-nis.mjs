// One-way migration: make each student's Firestore doc ID equal its NIS,
// then rewrite studentId foreign keys across enrollments/internships/counseling/wawancara.
//
// Run (do NOT run until reviewed):
//   node --env-file=.env.local scripts/rekey-students-to-nis.mjs
//
// Safety contract:
//   - Skips + reports students with empty NIS (missing[])
//   - Skips + reports NIS values shared by >1 student (duplicates{})
//   - Idempotent: skips any student whose doc id already equals its NIS
//   - Does NOT abort on a single failure — reports and continues
//   - Does NOT run automatically; the operator must execute this script manually after review

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

const FK_COLLECTIONS = ["enrollments", "internships", "counseling", "wawancara"];

async function main() {
  // 1. Load all students
  const studentsSnap = await db.collection("students").get();
  const students = studentsSnap.docs.map((d) => ({ docId: d.id, ...d.data() }));
  console.log(`Loaded ${students.length} student documents.`);

  // 2. Group by NIS
  const missing = []; // doc ids with empty/absent NIS
  const byNis = new Map(); // nis -> [{ docId, ...data }]

  for (const s of students) {
    const nis = s.nis !== undefined && s.nis !== null ? String(s.nis).trim() : "";
    if (!nis) {
      missing.push(s.docId);
      continue;
    }
    if (!byNis.has(nis)) byNis.set(nis, []);
    byNis.get(nis).push(s);
  }

  // 3. Identify duplicates (NIS shared by >1 student)
  const duplicates = {}; // nis -> [docId, ...]
  const uniqueCandidates = []; // { nis, student }

  for (const [nis, group] of byNis.entries()) {
    if (group.length > 1) {
      duplicates[nis] = group.map((s) => s.docId);
    } else {
      uniqueCandidates.push({ nis, student: group[0] });
    }
  }

  // 4. Re-key each unique-NIS student whose docId !== NIS
  let rekeyed = 0;
  const conflicts = []; // students that already had a different doc at students/{nis}

  for (const { nis, student } of uniqueCandidates) {
    const oldId = student.docId;

    if (oldId === nis) {
      // Already keyed correctly — idempotent skip
      continue;
    }

    // Check if students/{nis} already exists (may be a legacy conflict)
    const targetRef = db.collection("students").doc(nis);
    const targetSnap = await targetRef.get();
    if (targetSnap.exists) {
      conflicts.push({ nis, oldId, existingId: nis });
      console.warn(`  CONFLICT: students/${nis} already exists (old doc: ${oldId}) — skipping`);
      continue;
    }

    // Build data without the synthetic docId field
    const { docId: _drop, ...data } = student;

    try {
      // Use a batch: set new doc, update all FK collections, delete old doc
      const batch = db.batch();

      // Write new student doc
      batch.set(targetRef, data);

      // Collect FK references to rewrite
      const fkUpdates = [];
      for (const col of FK_COLLECTIONS) {
        const snap = await db.collection(col).where("studentId", "==", oldId).get();
        for (const fkDoc of snap.docs) {
          fkUpdates.push(db.collection(col).doc(fkDoc.id));
        }
      }

      // Firestore batch limit is 500 writes; we include 1 set + N updates + 1 delete.
      // For the typical case (a few FK docs per student) this is well under the limit.
      // If a school has >498 FK docs for one student, split into multiple batches.
      if (fkUpdates.length > 497) {
        // Flush the set first, then handle FKs in chunks, then delete
        console.warn(`  LARGE FK SET for ${nis} (${fkUpdates.length} docs) — using chunked batches`);
        await batch.commit(); // commits the new student doc only

        const CHUNK = 498;
        for (let i = 0; i < fkUpdates.length; i += CHUNK) {
          const b2 = db.batch();
          for (const ref of fkUpdates.slice(i, i + CHUNK)) b2.update(ref, { studentId: nis });
          await b2.commit();
        }

        await db.collection("students").doc(oldId).delete();
      } else {
        for (const ref of fkUpdates) batch.update(ref, { studentId: nis });
        batch.delete(db.collection("students").doc(oldId));
        await batch.commit();
      }

      console.log(`  re-keyed: ${oldId} → ${nis} (${fkUpdates.length} FK docs updated)`);
      rekeyed++;
    } catch (err) {
      console.error(`  ERROR re-keying ${oldId} → ${nis}: ${err.message}`);
    }
  }

  // 5. Summary report
  console.log("\n========== MIGRATION SUMMARY ==========");
  console.log(`Re-keyed:   ${rekeyed}`);
  console.log(`Skipped (already correct): ${uniqueCandidates.filter(({ nis, student }) => student.docId === nis).length}`);

  if (missing.length) {
    console.log(`\nMISSING NIS (${missing.length}) — left untouched:`);
    for (const id of missing) console.log(`  students/${id}`);
  } else {
    console.log("\nNo students with missing NIS.");
  }

  if (Object.keys(duplicates).length) {
    console.log(`\nDUPLICATE NIS (${Object.keys(duplicates).length} NIS values) — left untouched:`);
    for (const [nis, ids] of Object.entries(duplicates)) {
      console.log(`  NIS ${nis}: [${ids.join(", ")}]`);
    }
  } else {
    console.log("No duplicate NIS values.");
  }

  if (conflicts.length) {
    console.log(`\nCONFLICTS (${conflicts.length}) — target doc already existed, old doc left in place:`);
    for (const c of conflicts) console.log(`  NIS ${c.nis}: old=${c.oldId}`);
  }

  console.log("=======================================");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
