// Direct API smoke test against the running dev server + live (staging) Firestore.
// Auths by minting a real session (Admin custom token -> idToken -> /api/auth/login),
// then hits every endpoint and reports status codes. Run:
//   node --env-file=.env.local scripts/smoke-api.mjs
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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
function log(status, label, extra = "") {
  const ok = status >= 200 && status < 300;
  results.push({ status, label, ok });
  console.log(`${ok ? "✓" : "✗"} ${status}  ${label}  ${extra}`);
}

// 1) mint a session cookie without a password
let uid = "smoke-admin";
try { const u = await getAuth().listUsers(1); if (u.users[0]) uid = u.users[0].uid; } catch {}
const customToken = await getAuth().createCustomToken(uid);
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const exch = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: customToken, returnSecureToken: true }),
});
const exchJson = await exch.json();
const idToken = exchJson.idToken;
if (!idToken) { console.error("Failed to get idToken:", exchJson); process.exit(1); }

const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }),
});
const setCookie = loginRes.headers.get("set-cookie") || "";
const session = setCookie.split(";")[0];
log(loginRes.status, "POST /api/auth/login");
const H = { cookie: session, "Content-Type": "application/json" };

// 2) GET all admin list endpoints
for (const ep of ["/api/academic-years", "/api/classes", "/api/students", "/api/internships", "/api/companies", "/api/counseling"]) {
  const r = await fetch(`${BASE}${ep}`, { headers: H });
  let n = ""; try { const j = await r.json(); n = Array.isArray(j) ? `(${j.length} rows)` : ""; } catch {}
  log(r.status, `GET ${ep}`, n);
}

// 3) auth enforcement: same endpoint without cookie should be 401
const noAuth = await fetch(`${BASE}/api/academic-years`);
log(noAuth.status === 401 ? 200 : noAuth.status, `GET /api/academic-years (no cookie -> expect 401, got ${noAuth.status})`);

// 4) write path: create a company then delete it
const createRes = await fetch(`${BASE}/api/companies`, { method: "POST", headers: H, body: JSON.stringify({ perusahaan: "SMOKE TEST CO", pic: "Tester", phone: "08123", alamat: "X" }) });
const created = await createRes.json().catch(() => ({}));
log(createRes.status, "POST /api/companies");
if (created?.id) {
  const del = await fetch(`${BASE}/api/companies/${created.id}`, { method: "DELETE", headers: H });
  log(del.status, `DELETE /api/companies/${created.id.slice(0, 6)}…`);
}

// 5) public grade endpoint with a seeded token
const snap = await getFirestore().collection("internships").limit(1).get();
const token = snap.empty ? null : snap.docs[0].data().token;
if (token) {
  const g = await fetch(`${BASE}/api/grade/${token}`);
  const body = await g.json().catch(() => ({}));
  log(g.status, `GET /api/grade/<token> (public)`, JSON.stringify(body).slice(0, 70));
}

// summary
const failed = results.filter((r) => !r.ok);
console.log(`\n${failed.length === 0 ? "ALL PASS" : failed.length + " FAILED"} — ${results.length} checks`);
process.exit(failed.length === 0 ? 0 : 1);
