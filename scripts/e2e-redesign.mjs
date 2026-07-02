// End-to-end test for the class-assignment + status redesign endpoints.
// Reuses the smoke-test login bootstrap (Admin custom token -> idToken -> /api/auth/login),
// then exercises the NEW endpoints against the running server + live (staging) Firestore.
// EVERY mutation is reversible and restored in a finally block.
//   node --env-file=.env.local scripts/e2e-redesign.mjs
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const BASE = process.env.SMOKE_BASE || "http://localhost:3000";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const results = [];
function check(cond, label, extra = "") {
  results.push({ ok: !!cond, label });
  console.log(`${cond ? "✓" : "✗"} ${label}  ${extra}`);
}

// --- login ---
let uid = "e2e-admin";
try { const u = await getAuth().listUsers(1); if (u.users[0]) uid = u.users[0].uid; } catch {}
const customToken = await getAuth().createCustomToken(uid);
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const exch = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: customToken, returnSecureToken: true }),
});
const idToken = (await exch.json()).idToken;
if (!idToken) { console.error("no idToken"); process.exit(1); }
const loginRes = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
const session = (loginRes.headers.get("set-cookie") || "").split(";")[0];
const H = { cookie: session, "Content-Type": "application/json" };
check(loginRes.status === 200, "login");

const get = async (p) => { const r = await fetch(`${BASE}${p}`, { headers: H }); return { status: r.status, body: await r.json().catch(() => null) }; };
const post = async (p, b) => { const r = await fetch(`${BASE}${p}`, { method: "POST", headers: H, body: JSON.stringify(b) }); return { status: r.status, body: await r.json().catch(() => null) }; };
const del = async (p) => { const r = await fetch(`${BASE}${p}`, { method: "DELETE", headers: H }); return { status: r.status, body: await r.json().catch(() => null) }; };

// --- context ---
const years = (await get("/api/academic-years")).body || [];
const activeYear = years.find((y) => y.isActive) || years[0];
check(!!activeYear, "found active academic year", activeYear?.year || "");

const classes = (await get(`/api/classes?academicYearId=${activeYear.id}`)).body || [];
check(classes.length > 0, "found classes for active year", `(${classes.length})`);

// pick a class that has a roster
let C1, roster = [];
for (const c of classes) {
  const r = (await get(`/api/students?classId=${c.id}`)).body || [];
  if (r.length > 0) { C1 = c; roster = r; break; }
}
check(!!C1, "found a class with students", C1 ? `${C1.name} (${roster.length})` : "");

const S = roster[0];
check(!!S, "picked a test student", S ? `${S.namaSiswa} / ${S.nis}` : "");

// GET /api/classes/[id]
const clsDetail = await get(`/api/classes/${C1.id}`);
check(clsDetail.status === 200 && clsDetail.body?.name === C1.name, "GET /api/classes/[id] returns the class", clsDetail.body?.name);

const origStatus = S.status || "aktif";
let removedFromClass = false, statusChanged = false;

try {
  // --- roster remove + re-add (reversible) ---
  const rem = await del(`/api/enrollments?studentId=${S.id}&classId=${C1.id}`);
  check(rem.status === 200, "DELETE /api/enrollments (keluarkan)");
  removedFromClass = true;
  const afterRem = (await get(`/api/students?classId=${C1.id}`)).body || [];
  check(!afterRem.some((x) => x.id === S.id), "student removed from class roster");

  const readd = await post("/api/enrollments/bulk", { academicYearId: activeYear.id, classId: C1.id, studentIds: [S.id] });
  check(readd.status === 200, "POST /api/enrollments/bulk (re-assign)");
  const afterAdd = (await get(`/api/students?classId=${C1.id}`)).body || [];
  check(afterAdd.some((x) => x.id === S.id), "student back in class roster");
  removedFromClass = false;

  // --- bulk status (reversible) ---
  const newStatus = origStatus === "pindah" ? "lulus" : "pindah";
  const bs = await post("/api/students/bulk-status", { studentIds: [S.id], status: newStatus });
  check(bs.status === 200, "POST /api/students/bulk-status");
  statusChanged = true;
  const sAfter = (await get(`/api/students/${S.id}`)).body;
  check(sAfter?.status === newStatus, `status changed to ${newStatus}`, sAfter?.status);

  const restore = await post("/api/students/bulk-status", { studentIds: [S.id], status: origStatus });
  check(restore.status === 200, `status restored to ${origStatus}`);
  statusChanged = false;

  // --- promote validation (NON-destructive: must reject, no mutation) ---
  const badEmpty = await post("/api/enrollments/promote", {});
  check(badEmpty.status === 400, "promote rejects empty body (400)", String(badEmpty.status));
  const badSame = await post("/api/enrollments/promote", { sourceYearId: activeYear.id, targetYearId: activeYear.id, mappings: [{ sourceClassId: C1.id, action: "graduate" }] });
  check(badSame.status === 400, "promote rejects same source/target year (400)", String(badSame.status));
} finally {
  // safety net: restore state if a check threw mid-way
  if (removedFromClass) {
    await post("/api/enrollments/bulk", { academicYearId: activeYear.id, classId: C1.id, studentIds: [S.id] });
    console.log("  (restored class enrollment)");
  }
  if (statusChanged) {
    await post("/api/students/bulk-status", { studentIds: [S.id], status: origStatus });
    console.log("  (restored status)");
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${failed.length === 0 ? "ALL PASS" : failed.length + " FAILED"} — ${results.length} checks`);
process.exit(failed.length === 0 ? 0 : 1);
