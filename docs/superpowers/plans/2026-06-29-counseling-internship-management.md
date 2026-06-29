# MBC Counseling & Internship Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 app to manage students, classes, academic years, and student internships (with a public PIC grading form), backed by Firestore via server-side API routes, with Excel student import/export.

**Architecture:** Next.js 14 App Router + React 18 + Mantine v7 UI + TanStack Query. All Firestore access is server-side through `/app/api/*` routes using the Firebase Admin SDK. A single admin authenticates with Firebase Auth; the only public route is the token-guarded PIC grading endpoint. Grade computation and import matching live in pure, unit-tested modules.

**Tech Stack:** Next.js 14, React 18, TypeScript, Mantine v7, TanStack Query v5, Firebase Admin SDK (firebase-admin), Firebase Auth (client), xlsx (SheetJS), Vitest.

## Global Constraints

- React **18** only (no React 19 APIs). Next.js **14** App Router.
- UI library: **Mantine v7**. Use Mantine components, not hand-rolled HTML/CSS.
- All UI copy in **Indonesian**.
- Client code **never** imports `firebase-admin` or queries Firestore directly. All data access via `/app/api/*` routes consumed through TanStack Query.
- Firestore Admin SDK is server-only (Node runtime route handlers, not Edge).
- Filters do **not** query live — results load only on explicit **Search** button click.
- Gender stored as `"L"` or `"P"`.
- Student import/match key is **`nisn`** (create-or-update).
- Grade scoring: A=98, B=90, C=82; `nilaiAkhir` = average of 7; kategori ≥94.5 "sangat baik", ≥86.5 "baik", else "cukup baik".
- Stay on free tiers (Firestore Spark, Vercel free).

---

### Task 1: Project scaffold + Mantine + TanStack Query + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/providers.tsx`
- Create: `lib/test/sanity.test.ts`

**Interfaces:**
- Produces: a running Next 14 app with Mantine `MantineProvider` and TanStack `QueryClientProvider` wired in `app/providers.tsx`; Vitest runnable via `npm test`.

- [ ] **Step 1: Initialize the project**

```bash
npx create-next-app@14 . --typescript --app --no-tailwind --no-src-dir --eslint --import-alias "@/*" --use-npm
```
When prompted to overwrite the non-empty directory, accept (the only existing files are `docs/` and `.git`, which create-next-app preserves).

- [ ] **Step 2: Install dependencies**

```bash
npm install @mantine/core@^7 @mantine/hooks@^7 @mantine/notifications@^7 @mantine/dates@^7 @tanstack/react-query@^5 firebase firebase-admin xlsx dayjs
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Write a sanity test**

Create `lib/test/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("sanity", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: Run the test to verify the toolchain**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Wire Mantine + TanStack providers**

Create `app/providers.tsx`:
```tsx
"use client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}
```

Replace `app/layout.tsx`:
```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import { ColorSchemeScript } from "@mantine/core";
import { Providers } from "./providers";

export const metadata = { title: "MBC Management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head><ColorSchemeScript /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
```

Replace `app/page.tsx`:
```tsx
import { Title } from "@mantine/core";
export default function Home() {
  return <Title order={1}>MBC Management</Title>;
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next 14 + Mantine + TanStack Query + Vitest"
```

---

### Task 2: Firebase Admin SDK + Firestore helper + env

**Files:**
- Create: `lib/firebase/admin.ts`, `lib/firebase/client.ts`
- Create: `.env.local.example`
- Test: `lib/firebase/admin.test.ts`

**Interfaces:**
- Produces:
  - `getDb(): Firestore` (from `lib/firebase/admin.ts`) — singleton Admin Firestore instance.
  - `getClientAuth()` (from `lib/firebase/client.ts`) — browser Firebase Auth instance.

- [ ] **Step 1: Document env vars**

Create `.env.local.example`:
```
# Firebase Admin (server) — from service account JSON
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
# Firebase Web (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```
Copy to `.env.local` and fill in real values before running.

- [ ] **Step 2: Write a test for the admin singleton shape**

Create `lib/firebase/admin.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [],
  initializeApp: vi.fn(() => ({})),
  cert: vi.fn(() => ({})),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => ({ collection: vi.fn() })),
}));

describe("getDb", () => {
  it("returns a Firestore-like object with collection()", async () => {
    process.env.FIREBASE_PROJECT_ID = "p";
    process.env.FIREBASE_CLIENT_EMAIL = "e";
    process.env.FIREBASE_PRIVATE_KEY = "k";
    const { getDb } = await import("./admin");
    expect(typeof getDb().collection).toBe("function");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- admin.test.ts`
Expected: FAIL ("Cannot find module './admin'").

- [ ] **Step 4: Implement the admin singleton**

Create `lib/firebase/admin.ts`:
```ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (db) return db;
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  db = getFirestore();
  return db;
}
```

Create `lib/firebase/client.ts`:
```ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function getClientAuth() {
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getAuth(app);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- admin.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Firebase admin + client helpers"
```

---

### Task 3: Admin auth — login page + session cookie + API guard

**Files:**
- Create: `lib/auth/session.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`
- Create: `app/login/page.tsx`, `middleware.ts`
- Test: `lib/auth/session.test.ts`

**Interfaces:**
- Consumes: `getDb`/admin app from Task 2; `getClientAuth` for client sign-in.
- Produces:
  - `requireAdmin(req: Request): Promise<DecodedIdToken>` (from `lib/auth/session.ts`) — throws `Response` 401 if no valid session cookie. Used by every protected API route.
  - Session cookie named `session` set by `/api/auth/login`.

- [ ] **Step 1: Write test for requireAdmin rejecting missing cookie**

Create `lib/auth/session.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    verifySessionCookie: vi.fn(async (c: string) =>
      c === "good" ? { uid: "admin" } : Promise.reject(new Error("bad")),
    ),
    createSessionCookie: vi.fn(async () => "cookie"),
  }),
}));
vi.mock("../firebase/admin", () => ({ getDb: vi.fn() }));

import { requireAdmin } from "./session";

function reqWithCookie(value?: string): Request {
  const headers = new Headers();
  if (value) headers.set("cookie", `session=${value}`);
  return new Request("http://x", { headers });
}

describe("requireAdmin", () => {
  it("throws 401 when cookie missing", async () => {
    await expect(requireAdmin(reqWithCookie())).rejects.toMatchObject({ status: 401 });
  });
  it("returns decoded token when cookie valid", async () => {
    const t = await requireAdmin(reqWithCookie("good"));
    expect(t.uid).toBe("admin");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- session.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement session helpers**

Create `lib/auth/session.ts`:
```ts
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../firebase/admin";

function parseCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function requireAdmin(req: Request) {
  getDb(); // ensure admin app initialized
  const cookie = parseCookie(req, "session");
  if (!cookie) throw new Response("Unauthorized", { status: 401 });
  try {
    return await getAuth().verifySessionCookie(cookie, true);
  } catch {
    throw new Response("Unauthorized", { status: 401 });
  }
}

export async function createSessionCookie(idToken: string) {
  getDb();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  return getAuth().createSessionCookie(idToken, { expiresIn });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- session.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Implement login/logout API routes**

Create `app/api/auth/login/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: "missing token" }, { status: 400 });
  try {
    const cookie = await createSessionCookie(idToken);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", cookie, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/",
      maxAge: 60 * 60 * 24 * 5,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
}
```

Create `app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 6: Implement the login page**

Create `app/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { Button, Card, PasswordInput, TextInput, Title, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("login gagal");
      router.push("/");
    } catch {
      notifications.show({ color: "red", message: "Email atau kata sandi salah" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card maw={400} mx="auto" mt={120} withBorder padding="lg">
      <Stack>
        <Title order={2}>Masuk</Title>
        <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        <PasswordInput label="Kata Sandi" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
        <Button loading={loading} onClick={submit}>Masuk</Button>
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 7: Add route protection middleware**

Create `middleware.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/login", "/grade"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const session = req.cookies.get("session");
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```
Note: middleware only checks cookie presence (Edge runtime can't verify). API routes call `requireAdmin` for real verification.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: admin login with Firebase session cookie + route guard"
```

---

### Task 4: Shared API utilities + Firestore repository helper

**Files:**
- Create: `lib/api/respond.ts`, `lib/db/repo.ts`
- Test: `lib/api/respond.test.ts`

**Interfaces:**
- Consumes: `getDb` (Task 2), `requireAdmin` (Task 3).
- Produces:
  - `handle(fn): (req) => Promise<Response>` (from `lib/api/respond.ts`) — wraps a handler, catches thrown `Response` objects (e.g. from `requireAdmin`) and returns them, otherwise 500.
  - `repo` (from `lib/db/repo.ts`) with: `list(col, filters?)`, `get(col, id)`, `create(col, data)`, `update(col, id, data)`, `remove(col, id)` — thin Admin Firestore wrappers returning plain objects with `id`.

- [ ] **Step 1: Write test for handle() catching thrown Response**

Create `lib/api/respond.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { handle } from "./respond";

describe("handle", () => {
  it("returns a thrown Response untouched", async () => {
    const h = handle(async () => { throw new Response("nope", { status: 401 }); });
    const res = await h(new Request("http://x"));
    expect(res.status).toBe(401);
  });
  it("wraps a returned value as JSON 200", async () => {
    const h = handle(async () => ({ ok: true }));
    const res = await h(new Request("http://x"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
  it("returns 500 on unexpected error", async () => {
    const h = handle(async () => { throw new Error("boom"); });
    const res = await h(new Request("http://x"));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- respond.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement respond + repo**

Create `lib/api/respond.ts`:
```ts
import { NextResponse } from "next/server";

export function handle(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    try {
      const result = await fn(req);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof Response) return e;
      console.error(e);
      return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
  };
}
```

Create `lib/db/repo.ts`:
```ts
import { getDb } from "../firebase/admin";

type Filter = [field: string, value: unknown];

function doc(d: FirebaseFirestore.DocumentSnapshot) {
  return { id: d.id, ...d.data() } as Record<string, unknown> & { id: string };
}

export const repo = {
  async list(col: string, filters: Filter[] = []) {
    let q: FirebaseFirestore.Query = getDb().collection(col);
    for (const [field, value] of filters) q = q.where(field, "==", value);
    const snap = await q.get();
    return snap.docs.map(doc);
  },
  async get(col: string, id: string) {
    const d = await getDb().collection(col).doc(id).get();
    return d.exists ? doc(d) : null;
  },
  async create(col: string, data: Record<string, unknown>) {
    const ref = await getDb().collection(col).add(data);
    return { id: ref.id, ...data };
  },
  async update(col: string, id: string, data: Record<string, unknown>) {
    await getDb().collection(col).doc(id).set(data, { merge: true });
    return { id, ...data };
  },
  async remove(col: string, id: string) {
    await getDb().collection(col).doc(id).delete();
    return { ok: true };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- respond.test.ts`
Expected: PASS (3 cases).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: shared API handler + Firestore repo helper"
```

---

### Task 5: Academic Years — API + UI

**Files:**
- Create: `app/api/academic-years/route.ts`, `app/api/academic-years/[id]/route.ts`
- Create: `lib/types.ts`
- Create: `app/(app)/academic-years/page.tsx`
- Create: `lib/hooks/useAcademicYears.ts`

**Interfaces:**
- Consumes: `handle`, `repo`, `requireAdmin`.
- Produces:
  - Type `AcademicYear = { id: string; year: string; semester: string; isActive: boolean }` (in `lib/types.ts`).
  - REST: `GET/POST /api/academic-years`, `PUT/DELETE /api/academic-years/[id]`.
  - Hook `useAcademicYears()` returning `{ data, create, update, remove }`.

- [ ] **Step 1: Define shared types**

Create `lib/types.ts`:
```ts
export type Gender = "L" | "P";

export interface AcademicYear { id: string; year: string; semester: string; isActive: boolean; }
export interface SchoolClass { id: string; name: string; academicYearId: string; waliKelas: string; }
export interface Student { id: string; namaSiswa: string; namaBesar: string; namaPendek: string; nis: string; nisn: string; gender: Gender; }
export interface Enrollment { id: string; studentId: string; classId: string; academicYearId: string; }

export type Rating = "A" | "B" | "C";
export interface InternshipRatings {
  kedisiplinan: Rating | null; kerjasama: Rating | null; inisiatif: Rating | null;
  tanggungJawab: Rating | null; adaptasi: Rating | null; memberiMasukan: Rating | null;
  pengumpulanLaporan: Rating | null;
}
export interface Internship {
  id: string; studentId: string; academicYearId: string;
  lokasiMagang: string; posisi: string; pembimbing: string;
  token: string; status: "pending" | "graded";
  ratings: InternshipRatings; nilaiAkhir: number | null; kategori: string | null; tanggal: string;
}
```

- [ ] **Step 2: Implement collection route**

Create `app/api/academic-years/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  return repo.list("academicYears");
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const body = await req.json();
  return repo.create("academicYears", {
    year: body.year, semester: body.semester, isActive: !!body.isActive,
  });
});
```

- [ ] **Step 3: Implement item route**

Create `app/api/academic-years/[id]/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  const body = await req.json();
  return repo.update("academicYears", id, {
    year: body.year, semester: body.semester, isActive: !!body.isActive,
  });
});

export const DELETE = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  return repo.remove("academicYears", id);
});
```

- [ ] **Step 4: Implement the data hook**

Create `lib/hooks/useAcademicYears.ts`:
```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AcademicYear } from "@/lib/types";

const KEY = ["academic-years"];
async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useAcademicYears() {
  const qc = useQueryClient();
  const data = useQuery<AcademicYear[]>({ queryKey: KEY, queryFn: () => jsonFetch("/api/academic-years") });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({
    mutationFn: (b: Partial<AcademicYear>) =>
      jsonFetch("/api/academic-years", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (b: AcademicYear) =>
      jsonFetch(`/api/academic-years/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/academic-years/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  return { data, create, update, remove };
}
```

- [ ] **Step 5: Build the page (with shared app shell)**

Create `app/(app)/layout.tsx` (shared nav shell for all protected pages):
```tsx
import { AppShell, NavLink, Title, Group } from "@mantine/core";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShell.Header><Group h="100%" px="md"><Title order={4}>MBC Management</Title></Group></AppShell.Header>
      <AppShell.Navbar p="xs">
        <NavLink component={Link} href="/" label="Dasbor" />
        <NavLink component={Link} href="/students" label="Siswa" />
        <NavLink component={Link} href="/classes" label="Kelas" />
        <NavLink component={Link} href="/academic-years" label="Tahun Ajaran" />
        <NavLink component={Link} href="/internships" label="Magang" />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
```

Move `app/page.tsx` to `app/(app)/page.tsx` (dashboard, keep simple title).

Create `app/(app)/academic-years/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Button, Group, Table, TextInput, Switch, Title, Stack } from "@mantine/core";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";

export default function AcademicYearsPage() {
  const { data, create, remove } = useAcademicYears();
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("1 (Satu)");
  const [isActive, setIsActive] = useState(false);

  return (
    <Stack>
      <Title order={2}>Tahun Ajaran</Title>
      <Group align="end">
        <TextInput label="Tahun" placeholder="2025/2026" value={year} onChange={(e) => setYear(e.currentTarget.value)} />
        <TextInput label="Semester" value={semester} onChange={(e) => setSemester(e.currentTarget.value)} />
        <Switch label="Aktif" checked={isActive} onChange={(e) => setIsActive(e.currentTarget.checked)} />
        <Button onClick={() => create.mutate({ year, semester, isActive })}>Tambah</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Tahun</Table.Th><Table.Th>Semester</Table.Th><Table.Th>Aktif</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(data.data ?? []).map((y) => (
            <Table.Tr key={y.id}>
              <Table.Td>{y.year}</Table.Td><Table.Td>{y.semester}</Table.Td><Table.Td>{y.isActive ? "Ya" : "Tidak"}</Table.Td>
              <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(y.id)}>Hapus</Button></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, log in, visit `/academic-years`, add a year, confirm it appears and persists on refresh, then delete it.
Expected: CRUD works against Firestore.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: academic years CRUD (API + UI) + app shell + shared types"
```

---

### Task 6: Classes — API + UI

**Files:**
- Create: `app/api/classes/route.ts`, `app/api/classes/[id]/route.ts`
- Create: `lib/hooks/useClasses.ts`
- Create: `app/(app)/classes/page.tsx`

**Interfaces:**
- Consumes: `handle`, `repo`, `requireAdmin`, `AcademicYear`, `useAcademicYears`.
- Produces:
  - REST `/api/classes` (GET supports `?academicYearId=`), `/api/classes/[id]`.
  - Hook `useClasses(academicYearId?)` → `{ data, create, update, remove }`.

- [ ] **Step 1: Implement routes**

Create `app/api/classes/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const yearId = new URL(req.url).searchParams.get("academicYearId");
  return repo.list("classes", yearId ? [["academicYearId", yearId]] : []);
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const b = await req.json();
  return repo.create("classes", { name: b.name, academicYearId: b.academicYearId, waliKelas: b.waliKelas ?? "" });
});
```

Create `app/api/classes/[id]/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  const b = await req.json();
  return repo.update("classes", id, { name: b.name, academicYearId: b.academicYearId, waliKelas: b.waliKelas ?? "" });
});

export const DELETE = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  return repo.remove("classes", id);
});
```

- [ ] **Step 2: Implement the hook**

Create `lib/hooks/useClasses.ts`:
```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SchoolClass } from "@/lib/types";

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useClasses(academicYearId?: string) {
  const qc = useQueryClient();
  const key = ["classes", academicYearId ?? "all"];
  const url = academicYearId ? `/api/classes?academicYearId=${academicYearId}` : "/api/classes";
  const data = useQuery<SchoolClass[]>({ queryKey: key, queryFn: () => jsonFetch(url) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["classes"] });
  const create = useMutation({ mutationFn: (b: Partial<SchoolClass>) => jsonFetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: SchoolClass) => jsonFetch(`/api/classes/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => jsonFetch(`/api/classes/${id}`, { method: "DELETE" }), onSuccess: invalidate });
  return { data, create, update, remove };
}
```

- [ ] **Step 3: Build the page**

Create `app/(app)/classes/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Button, Group, Select, Stack, Table, TextInput, Title } from "@mantine/core";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";

export default function ClassesPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const { data, create, remove } = useClasses(yearId ?? undefined);
  const [name, setName] = useState("");
  const [wali, setWali] = useState("");
  const yearOptions = (years.data.data ?? []).map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));

  return (
    <Stack>
      <Title order={2}>Kelas</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <TextInput label="Nama Kelas" placeholder="XII.1" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput label="Wali Kelas" value={wali} onChange={(e) => setWali(e.currentTarget.value)} />
        <Button disabled={!yearId} onClick={() => create.mutate({ name, academicYearId: yearId!, waliKelas: wali })}>Tambah</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Kelas</Table.Th><Table.Th>Wali Kelas</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(data.data ?? []).map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td>{c.name}</Table.Td><Table.Td>{c.waliKelas}</Table.Td>
              <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(c.id)}>Hapus</Button></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`, create a class under a year, confirm filtering by year works.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: classes CRUD (API + UI) scoped by academic year"
```

---

### Task 7: Students — API + list with Search button

**Files:**
- Create: `app/api/students/route.ts`, `app/api/students/[id]/route.ts`
- Create: `lib/hooks/useStudents.ts`
- Create: `app/(app)/students/page.tsx`

**Interfaces:**
- Consumes: `handle`, `repo`, `requireAdmin`, `Student`, `enrollments`/`classes` collections.
- Produces:
  - REST `/api/students`: `GET` supports `?classId=` and `?academicYearId=` (joins via `enrollments`), `POST` creates a student.
  - `/api/students/[id]` `PUT`/`DELETE`.
  - Hook `useStudents()` exposing a **manually triggered** query (`enabled: false`, call `refetch()` on Search).

- [ ] **Step 1: Implement student routes (with enrollment-based filter)**

Create `app/api/students/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const params = new URL(req.url).searchParams;
  const classId = params.get("classId");
  const academicYearId = params.get("academicYearId");

  if (classId || academicYearId) {
    const filters: [string, unknown][] = [];
    if (classId) filters.push(["classId", classId]);
    if (academicYearId) filters.push(["academicYearId", academicYearId]);
    const enrollments = await repo.list("enrollments", filters);
    const ids = [...new Set(enrollments.map((e) => e.studentId as string))];
    const students = await Promise.all(ids.map((id) => repo.get("students", id)));
    return students.filter(Boolean);
  }
  return repo.list("students");
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const b = await req.json();
  return repo.create("students", {
    namaSiswa: b.namaSiswa, namaBesar: b.namaBesar ?? b.namaSiswa?.toUpperCase() ?? "",
    namaPendek: b.namaPendek ?? "", nis: b.nis ?? "", nisn: b.nisn ?? "", gender: b.gender === "P" ? "P" : "L",
  });
});
```

Create `app/api/students/[id]/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  const b = await req.json();
  return repo.update("students", id, {
    namaSiswa: b.namaSiswa, namaBesar: b.namaBesar, namaPendek: b.namaPendek,
    nis: b.nis, nisn: b.nisn, gender: b.gender === "P" ? "P" : "L",
  });
});

export const DELETE = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  return repo.remove("students", id);
});
```

- [ ] **Step 2: Implement the hook with manual search**

Create `lib/hooks/useStudents.ts`:
```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Student } from "@/lib/types";

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useStudents(filters: { classId?: string; academicYearId?: string }) {
  const qc = useQueryClient();
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
  const query = useQuery<Student[]>({
    queryKey: ["students", filters],
    queryFn: () => jsonFetch(`/api/students?${params.toString()}`),
    enabled: false, // manual: only runs on refetch() (Search button)
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["students"] });
  const create = useMutation({ mutationFn: (b: Partial<Student>) => jsonFetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }), onSuccess: () => query.refetch() });
  const update = useMutation({ mutationFn: (b: Student) => jsonFetch(`/api/students/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }), onSuccess: () => query.refetch() });
  const remove = useMutation({ mutationFn: (id: string) => jsonFetch(`/api/students/${id}`, { method: "DELETE" }), onSuccess: () => query.refetch() });
  return { query, create, update, remove, invalidate };
}
```

- [ ] **Step 3: Build the students page (filters + explicit Search)**

Create `app/(app)/students/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Button, Group, Select, Stack, Table, Title } from "@mantine/core";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";

export default function StudentsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const { query } = useStudents({ academicYearId: yearId ?? undefined, classId: classId ?? undefined });

  const yearOptions = (years.data.data ?? []).map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const classOptions = (classes.data.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <Stack>
      <Title order={2}>Siswa</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={(v) => { setYearId(v); setClassId(null); }} clearable />
        <Select label="Kelas" data={classOptions} value={classId} onChange={setClassId} clearable />
        <Button onClick={() => query.refetch()} loading={query.isFetching}>Cari</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nama</Table.Th><Table.Th>NIS</Table.Th><Table.Th>NISN</Table.Th><Table.Th>L/P</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(query.data ?? []).map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>{s.namaSiswa}</Table.Td><Table.Td>{s.nis}</Table.Td><Table.Td>{s.nisn}</Table.Td><Table.Td>{s.gender}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
```

- [ ] **Step 4: Manual verification**

Run dev, visit `/students`, confirm the table is empty until **Cari** is clicked, then loads results.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: students API + list page with explicit Search"
```

---

### Task 8: Excel student import (parse + match-by-NISN) — pure logic first

**Files:**
- Create: `lib/excel/parseStudents.ts`
- Create: `app/api/students/import/route.ts`
- Test: `lib/excel/parseStudents.test.ts`

**Interfaces:**
- Consumes: `repo`, `requireAdmin`, `Student`, `Gender`.
- Produces:
  - `parseStudentRows(rows: Record<string, unknown>[]): ParsedStudent[]` (pure) — normalizes raw worksheet rows to `{ namaSiswa, namaBesar, namaPendek, nis, nisn, gender }`. Recognizes Indonesian headers (`Nama Siswa`, `Nama Besar`, `Nama Pendek`, `Nomor Induk Sekolah`/`NIS`, `NISN`, `Gender`/`L/P`/`Jenis Kelamin`). Defaults: `namaBesar` = uppercase `namaSiswa` if blank; `gender` parsed from L/P/Laki/Perempuan, default `"L"`.
  - `POST /api/students/import` body `{ academicYearId, classId, students: ParsedStudent[] }` → create-or-update each by `nisn`, then create enrollment if missing. Returns `{ created, updated }`.

- [ ] **Step 1: Write tests for parseStudentRows**

Create `lib/excel/parseStudents.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseStudentRows } from "./parseStudents";

describe("parseStudentRows", () => {
  it("maps Indonesian headers to fields", () => {
    const out = parseStudentRows([
      { "Nama Siswa": "Aaron Oen", "Nama Besar": "AARON OEN", "Nama Pendek": "Aaron",
        "Nomor Induk Sekolah": "00909", "NISN": "0082013006", "Jenis Kelamin": "L" },
    ]);
    expect(out[0]).toEqual({
      namaSiswa: "Aaron Oen", namaBesar: "AARON OEN", namaPendek: "Aaron",
      nis: "00909", nisn: "0082013006", gender: "L",
    });
  });

  it("defaults namaBesar to uppercase name and gender to L", () => {
    const out = parseStudentRows([{ "Nama Siswa": "Budi", "NISN": "1" }]);
    expect(out[0].namaBesar).toBe("BUDI");
    expect(out[0].gender).toBe("L");
  });

  it("parses Perempuan / P to gender P", () => {
    expect(parseStudentRows([{ "Nama Siswa": "Sari", "NISN": "2", "Jenis Kelamin": "Perempuan" }])[0].gender).toBe("P");
    expect(parseStudentRows([{ "Nama Siswa": "Sari", "NISN": "3", "Gender": "P" }])[0].gender).toBe("P");
  });

  it("skips rows without a name", () => {
    expect(parseStudentRows([{ "NISN": "9" }, { "Nama Siswa": "Ada", "NISN": "10" }])).toHaveLength(1);
  });

  it("coerces numeric NIS/NISN to string", () => {
    expect(parseStudentRows([{ "Nama Siswa": "X", "NISN": 12345 }])[0].nisn).toBe("12345");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- parseStudents.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement parseStudentRows**

Create `lib/excel/parseStudents.ts`:
```ts
import { Gender } from "@/lib/types";

export interface ParsedStudent {
  namaSiswa: string; namaBesar: string; namaPendek: string;
  nis: string; nisn: string; gender: Gender;
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.some((want) => k.trim().toLowerCase() === want.toLowerCase())) {
      const v = row[k];
      return v === null || v === undefined ? "" : String(v).trim();
    }
  }
  return "";
}

function parseGender(raw: string): Gender {
  const v = raw.trim().toUpperCase();
  if (v === "P" || v.startsWith("PEREMPUAN") || v === "F") return "P";
  return "L";
}

export function parseStudentRows(rows: Record<string, unknown>[]): ParsedStudent[] {
  const out: ParsedStudent[] = [];
  for (const row of rows) {
    const namaSiswa = pick(row, ["Nama Siswa", "Nama", "Name"]);
    if (!namaSiswa) continue;
    const namaBesar = pick(row, ["Nama Besar"]) || namaSiswa.toUpperCase();
    out.push({
      namaSiswa,
      namaBesar,
      namaPendek: pick(row, ["Nama Pendek"]),
      nis: pick(row, ["Nomor Induk Sekolah", "NIS"]),
      nisn: pick(row, ["NISN"]),
      gender: parseGender(pick(row, ["Jenis Kelamin", "Gender", "L/P"])),
    });
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- parseStudents.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the import API route**

Create `app/api/students/import/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { ParsedStudent } from "@/lib/excel/parseStudents";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const { academicYearId, classId, students } = await req.json() as {
    academicYearId: string; classId: string; students: ParsedStudent[];
  };
  if (!academicYearId || !classId) throw new Response("academicYearId and classId required", { status: 400 });

  const existing = await repo.list("students");
  const byNisn = new Map(existing.map((s) => [String(s.nisn), s.id as string]));
  const existingEnroll = await repo.list("enrollments", [["classId", classId], ["academicYearId", academicYearId]]);
  const enrolledStudentIds = new Set(existingEnroll.map((e) => e.studentId as string));

  let created = 0, updated = 0;
  for (const s of students) {
    let id = s.nisn ? byNisn.get(String(s.nisn)) : undefined;
    if (id) { await repo.update("students", id, { ...s }); updated++; }
    else { const r = await repo.create("students", { ...s }); id = r.id; created++; }
    if (!enrolledStudentIds.has(id)) {
      await repo.create("enrollments", { studentId: id, classId, academicYearId });
      enrolledStudentIds.add(id);
    }
  }
  return { created, updated };
});
```

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: excel student import parser + create-or-update-by-NISN API"
```

---

### Task 9: Excel import UI (dropdowns + preview) + roster export

**Files:**
- Create: `app/(app)/students/import/page.tsx`
- Create: `lib/excel/exportRoster.ts`
- Modify: `app/(app)/students/page.tsx` (add Import + Export buttons)
- Test: `lib/excel/exportRoster.test.ts`

**Interfaces:**
- Consumes: `parseStudentRows`, `useAcademicYears`, `useClasses`, `Student`, `xlsx`.
- Produces:
  - `buildRosterWorkbook(students: Student[]): import("xlsx").WorkBook` (pure) — one sheet with Indonesian headers matching import format.
  - Import page: select year + class → upload .xlsx → preview table → confirm POST to `/api/students/import`.

- [ ] **Step 1: Write test for buildRosterWorkbook**

Create `lib/excel/exportRoster.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildRosterWorkbook } from "./exportRoster";
import { Student } from "@/lib/types";

const s: Student = { id: "1", namaSiswa: "Aaron Oen", namaBesar: "AARON OEN", namaPendek: "Aaron", nis: "00909", nisn: "008", gender: "L" };

describe("buildRosterWorkbook", () => {
  it("produces a sheet whose rows round-trip the student fields", () => {
    const wb = buildRosterWorkbook([s]);
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]]);
    expect(rows[0]["Nama Siswa"]).toBe("Aaron Oen");
    expect(rows[0]["NISN"]).toBe("008");
    expect(rows[0]["Jenis Kelamin"]).toBe("L");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- exportRoster.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement buildRosterWorkbook**

Create `lib/excel/exportRoster.ts`:
```ts
import * as XLSX from "xlsx";
import { Student } from "@/lib/types";

export function buildRosterWorkbook(students: Student[]): XLSX.WorkBook {
  const rows = students.map((s) => ({
    "Nama Siswa": s.namaSiswa, "Nama Besar": s.namaBesar, "Nama Pendek": s.namaPendek,
    "Nomor Induk Sekolah": s.nis, "NISN": s.nisn, "Jenis Kelamin": s.gender,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Siswa");
  return wb;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- exportRoster.test.ts`
Expected: PASS.

- [ ] **Step 5: Build the import page**

Create `app/(app)/students/import/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Select, Stack, Table, Title, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useClasses } from "@/lib/hooks/useClasses";
import { parseStudentRows, ParsedStudent } from "@/lib/excel/parseStudents";

export default function ImportPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStudent[]>([]);
  const [saving, setSaving] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    setParsed(parseStudentRows(rows));
  }

  async function confirm() {
    if (!yearId || !classId) { notifications.show({ color: "red", message: "Pilih tahun ajaran dan kelas" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYearId: yearId, classId, students: parsed }),
      });
      if (!res.ok) throw new Error();
      const { created, updated } = await res.json();
      notifications.show({ color: "green", message: `Berhasil: ${created} baru, ${updated} diperbarui` });
      setParsed([]);
    } catch {
      notifications.show({ color: "red", message: "Impor gagal" });
    } finally { setSaving(false); }
  }

  const yearOptions = (years.data.data ?? []).map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const classOptions = (classes.data.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <Stack>
      <Title order={2}>Impor Siswa</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={(v) => { setYearId(v); setClassId(null); }} />
        <Select label="Kelas" data={classOptions} value={classId} onChange={setClassId} />
        <FileInput label="File Excel (.xlsx)" accept=".xlsx" onChange={onFile} />
      </Group>
      {parsed.length > 0 && (
        <>
          <Text>Pratinjau {parsed.length} siswa:</Text>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Nama</Table.Th><Table.Th>NIS</Table.Th><Table.Th>NISN</Table.Th><Table.Th>L/P</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{parsed.map((s, i) => (<Table.Tr key={i}><Table.Td>{s.namaSiswa}</Table.Td><Table.Td>{s.nis}</Table.Td><Table.Td>{s.nisn}</Table.Td><Table.Td>{s.gender}</Table.Td></Table.Tr>))}</Table.Tbody>
          </Table>
          <Button loading={saving} onClick={confirm} disabled={!yearId || !classId}>Konfirmasi Impor</Button>
        </>
      )}
    </Stack>
  );
}
```

- [ ] **Step 6: Add Import + Export buttons to students page**

In `app/(app)/students/page.tsx`, add imports at top:
```tsx
import Link from "next/link";
import * as XLSX from "xlsx";
import { buildRosterWorkbook } from "@/lib/excel/exportRoster";
```
Add this group below the `<Title>` (uses the already-loaded `query.data`):
```tsx
<Group>
  <Button component={Link} href="/students/import" variant="light">Impor Excel</Button>
  <Button variant="light" disabled={!(query.data?.length)} onClick={() => XLSX.writeFile(buildRosterWorkbook(query.data ?? []), "daftar-siswa.xlsx")}>Ekspor Excel</Button>
</Group>
```

- [ ] **Step 7: Manual verification**

Run dev. Import: select year+class, upload `Master Magang 12 2526 RUMUS TERBARU.xlsx`, confirm preview shows ~63 students, confirm import, then on `/students` search that class and click Export → file downloads.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: excel import UI (dropdowns + preview) + roster export"
```

---

### Task 10: Internship grade computation (pure module)

**Files:**
- Create: `lib/internship/grade.ts`
- Test: `lib/internship/grade.test.ts`

**Interfaces:**
- Consumes: `Rating`, `InternshipRatings` (Task 5 types).
- Produces:
  - `ratingToScore(r: Rating): number` — A→98, B→90, C→82.
  - `computeGrade(ratings: InternshipRatings): { nilaiAkhir: number; kategori: string }` — average of the 7 scores; throws if any rating is null.
  - `CRITERIA: { key: keyof InternshipRatings; label: string }[]` — ordered list with Indonesian labels for the form.

- [ ] **Step 1: Write tests for grade computation**

Create `lib/internship/grade.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ratingToScore, computeGrade, CRITERIA } from "./grade";
import { InternshipRatings } from "@/lib/types";

const all = (r: "A" | "B" | "C"): InternshipRatings => ({
  kedisiplinan: r, kerjasama: r, inisiatif: r, tanggungJawab: r,
  adaptasi: r, memberiMasukan: r, pengumpulanLaporan: r,
});

describe("ratingToScore", () => {
  it("maps A/B/C to 98/90/82", () => {
    expect(ratingToScore("A")).toBe(98);
    expect(ratingToScore("B")).toBe(90);
    expect(ratingToScore("C")).toBe(82);
  });
});

describe("computeGrade", () => {
  it("all A → 98, sangat baik", () => {
    expect(computeGrade(all("A"))).toEqual({ nilaiAkhir: 98, kategori: "sangat baik" });
  });
  it("all B → 90, baik", () => {
    expect(computeGrade(all("B"))).toEqual({ nilaiAkhir: 90, kategori: "baik" });
  });
  it("all C → 82, cukup baik", () => {
    expect(computeGrade(all("C"))).toEqual({ nilaiAkhir: 82, kategori: "cukup baik" });
  });
  it("matches spreadsheet row: A,B,A,B,B,C,A → ~92.29 baik", () => {
    const g = computeGrade({ kedisiplinan: "A", kerjasama: "B", inisiatif: "A", tanggungJawab: "B", adaptasi: "B", memberiMasukan: "C", pengumpulanLaporan: "A" });
    expect(g.nilaiAkhir).toBeCloseTo(92.2857, 3);
    expect(g.kategori).toBe("baik");
  });
  it("boundary 94.5 → sangat baik", () => {
    // scores averaging exactly 94.5 → sangat baik
    const g = computeGrade({ kedisiplinan: "A", kerjasama: "A", inisiatif: "A", tanggungJawab: "A", adaptasi: "B", memberiMasukan: "B", pengumpulanLaporan: "A" });
    expect(g.nilaiAkhir).toBeCloseTo(95.4286, 3); // sanity: >94.5
    expect(g.kategori).toBe("sangat baik");
  });
  it("throws if a rating is missing", () => {
    expect(() => computeGrade({ ...all("A"), kerjasama: null })).toThrow();
  });
});

describe("CRITERIA", () => {
  it("lists all 7 criteria in order", () => {
    expect(CRITERIA.map((c) => c.key)).toEqual([
      "kedisiplinan", "kerjasama", "inisiatif", "tanggungJawab", "adaptasi", "memberiMasukan", "pengumpulanLaporan",
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- grade.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement grade.ts**

Create `lib/internship/grade.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- grade.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: internship grade computation module"
```

---

### Task 11: Internships API — placement, token, list, public grading

**Files:**
- Create: `app/api/internships/route.ts`, `app/api/internships/[id]/route.ts`
- Create: `app/api/grade/[token]/route.ts` (public)
- Test: `lib/internship/token.test.ts`
- Create: `lib/internship/token.ts`

**Interfaces:**
- Consumes: `handle`, `repo`, `requireAdmin`, `computeGrade`, `getDb`, `Internship`, `InternshipRatings`.
- Produces:
  - `newToken(): string` (from `lib/internship/token.ts`) — URL-safe random 24+ char token.
  - `GET/POST /api/internships` (admin): POST creates placement with `token`, `status:"pending"`, empty ratings.
  - `GET/PUT/DELETE /api/internships/[id]` (admin).
  - `GET /api/grade/[token]` (public): returns `{ studentName, lokasiMagang, posisi, status }` for the form; 404 if no match.
  - `POST /api/grade/[token]` (public): body `{ ratings: InternshipRatings }`; rejects if already `graded`; computes grade, saves, sets `status:"graded"`.

- [ ] **Step 1: Write test for newToken**

Create `lib/internship/token.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { newToken } from "./token";

describe("newToken", () => {
  it("is URL-safe and long enough", () => {
    const t = newToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{24,}$/);
  });
  it("is unique across calls", () => {
    expect(newToken()).not.toBe(newToken());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- token.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement token.ts**

Create `lib/internship/token.ts`:
```ts
import { randomBytes } from "crypto";

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- token.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement admin internship routes**

Create `app/api/internships/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { newToken } from "@/lib/internship/token";

export const runtime = "nodejs";

const EMPTY_RATINGS = {
  kedisiplinan: null, kerjasama: null, inisiatif: null, tanggungJawab: null,
  adaptasi: null, memberiMasukan: null, pengumpulanLaporan: null,
};

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const yearId = new URL(req.url).searchParams.get("academicYearId");
  return repo.list("internships", yearId ? [["academicYearId", yearId]] : []);
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const b = await req.json();
  return repo.create("internships", {
    studentId: b.studentId, academicYearId: b.academicYearId,
    lokasiMagang: b.lokasiMagang ?? "", posisi: b.posisi ?? "", pembimbing: b.pembimbing ?? "",
    token: newToken(), status: "pending",
    ratings: EMPTY_RATINGS, nilaiAkhir: null, kategori: null, tanggal: b.tanggal ?? "",
  });
});
```

Create `app/api/internships/[id]/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  return (await repo.get("internships", id)) ?? new Response("not found", { status: 404 });
});

export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  const b = await req.json();
  return repo.update("internships", id, {
    lokasiMagang: b.lokasiMagang, posisi: b.posisi, pembimbing: b.pembimbing, tanggal: b.tanggal,
  });
});

export const DELETE = handle(async (req) => {
  await requireAdmin(req);
  const id = req.url.split("/").pop()!;
  return repo.remove("internships", id);
});
```

- [ ] **Step 6: Implement the public grading route**

Create `app/api/grade/[token]/route.ts`:
```ts
import { handle } from "@/lib/api/respond";
import { getDb } from "@/lib/firebase/admin";
import { repo } from "@/lib/db/repo";
import { computeGrade } from "@/lib/internship/grade";
import { InternshipRatings } from "@/lib/types";

export const runtime = "nodejs";

async function findByToken(token: string) {
  const snap = await getDb().collection("internships").where("token", "==", token).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Record<string, unknown>) };
}

export const GET = handle(async (req) => {
  const token = decodeURIComponent(req.url.split("/").pop()!);
  const it = await findByToken(token);
  if (!it) return new Response("not found", { status: 404 });
  const student = await repo.get("students", it.studentId as string);
  return {
    studentName: student?.namaSiswa ?? "",
    lokasiMagang: it.lokasiMagang, posisi: it.posisi, pembimbing: it.pembimbing,
    status: it.status,
  };
});

export const POST = handle(async (req) => {
  const token = decodeURIComponent(req.url.split("/").pop()!);
  const it = await findByToken(token);
  if (!it) return new Response("not found", { status: 404 });
  if (it.status === "graded") return new Response("already graded", { status: 409 });
  const { ratings } = (await req.json()) as { ratings: InternshipRatings };
  const { nilaiAkhir, kategori } = computeGrade(ratings); // throws → 500 if incomplete
  await repo.update("internships", it.id as string, { ratings, nilaiAkhir, kategori, status: "graded" });
  return { ok: true, nilaiAkhir, kategori };
});
```

- [ ] **Step 7: Run full test suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: internships API (placement + token) + public grading endpoint"
```

---

### Task 12: Internships admin UI + public PIC grading form

**Files:**
- Create: `lib/hooks/useInternships.ts`
- Create: `app/(app)/internships/page.tsx`
- Create: `app/grade/[token]/page.tsx` (public, outside `(app)`)

**Interfaces:**
- Consumes: `useStudents`, `useAcademicYears`, `CRITERIA`, `Internship`, internship API routes.
- Produces: admin internships page (create placement, copy `/grade/[token]` link, show results) and the public grading form.

- [ ] **Step 1: Implement the internships hook**

Create `lib/hooks/useInternships.ts`:
```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Internship } from "@/lib/types";

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useInternships(academicYearId?: string) {
  const qc = useQueryClient();
  const url = academicYearId ? `/api/internships?academicYearId=${academicYearId}` : "/api/internships";
  const data = useQuery<Internship[]>({ queryKey: ["internships", academicYearId ?? "all"], queryFn: () => jsonFetch(url) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["internships"] });
  const create = useMutation({ mutationFn: (b: Partial<Internship>) => jsonFetch("/api/internships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => jsonFetch(`/api/internships/${id}`, { method: "DELETE" }), onSuccess: invalidate });
  return { data, create, remove };
}
```

- [ ] **Step 2: Build the admin internships page**

Create `app/(app)/internships/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Button, CopyButton, Group, Select, Stack, Table, TextInput, Title, Badge } from "@mantine/core";
import { useInternships } from "@/lib/hooks/useInternships";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useStudents } from "@/lib/hooks/useStudents";

export default function InternshipsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const { data, create, remove } = useInternships(yearId ?? undefined);
  const studentsHook = useStudents({ academicYearId: yearId ?? undefined });
  const [studentId, setStudentId] = useState<string | null>(null);
  const [lokasi, setLokasi] = useState(""); const [posisi, setPosisi] = useState(""); const [pembimbing, setPembimbing] = useState("");

  const yearOptions = (years.data.data ?? []).map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const studentOptions = (studentsHook.query.data ?? []).map((s) => ({ value: s.id, label: s.namaSiswa }));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Stack>
      <Title order={2}>Magang</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <Button variant="light" onClick={() => studentsHook.query.refetch()}>Muat Siswa</Button>
        <Select label="Siswa" data={studentOptions} value={studentId} onChange={setStudentId} searchable />
        <TextInput label="Lokasi Magang" value={lokasi} onChange={(e) => setLokasi(e.currentTarget.value)} />
        <TextInput label="Posisi" value={posisi} onChange={(e) => setPosisi(e.currentTarget.value)} />
        <TextInput label="Pembimbing" value={pembimbing} onChange={(e) => setPembimbing(e.currentTarget.value)} />
        <Button disabled={!yearId || !studentId} onClick={() => create.mutate({ academicYearId: yearId!, studentId: studentId!, lokasiMagang: lokasi, posisi, pembimbing })}>Tambah Penempatan</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Lokasi</Table.Th><Table.Th>Posisi</Table.Th><Table.Th>Status</Table.Th><Table.Th>Nilai</Table.Th><Table.Th>Kategori</Table.Th><Table.Th>Link PIC</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(data.data ?? []).map((it) => {
            const link = `${origin}/grade/${it.token}`;
            return (
              <Table.Tr key={it.id}>
                <Table.Td>{it.lokasiMagang}</Table.Td><Table.Td>{it.posisi}</Table.Td>
                <Table.Td><Badge color={it.status === "graded" ? "green" : "gray"}>{it.status === "graded" ? "Dinilai" : "Menunggu"}</Badge></Table.Td>
                <Table.Td>{it.nilaiAkhir != null ? it.nilaiAkhir.toFixed(2) : "-"}</Table.Td>
                <Table.Td>{it.kategori ?? "-"}</Table.Td>
                <Table.Td><CopyButton value={link}>{({ copied, copy }) => <Button size="xs" variant="light" onClick={copy}>{copied ? "Tersalin" : "Salin Link"}</Button>}</CopyButton></Table.Td>
                <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(it.id)}>Hapus</Button></Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
```

- [ ] **Step 3: Build the public PIC grading form**

Create `app/grade/[token]/page.tsx`:
```tsx
"use client";
import { use, useEffect, useState } from "react";
import { Button, Card, Group, Select, Stack, Title, Text, Alert } from "@mantine/core";
import { CRITERIA } from "@/lib/internship/grade";
import { InternshipRatings, Rating } from "@/lib/types";

const RATING_OPTIONS = [
  { value: "A", label: "A (Sangat Baik)" },
  { value: "B", label: "B (Baik)" },
  { value: "C", label: "C (Cukup)" },
];

export default function GradePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<{ studentName: string; lokasiMagang: string; posisi: string; status: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ratings, setRatings] = useState<Partial<InternshipRatings>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/grade/${token}`).then(async (r) => {
      if (!r.ok) { setNotFound(true); return; }
      const data = await r.json();
      setInfo(data);
      if (data.status === "graded") setDone(true);
    });
  }, [token]);

  async function submit() {
    if (CRITERIA.some((c) => !ratings[c.key])) { setError("Mohon isi semua kriteria"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/grade/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings }),
      });
      if (res.status === 409) { setError("Penilaian sudah dikirim sebelumnya"); setDone(true); return; }
      if (!res.ok) throw new Error();
      setDone(true);
    } catch { setError("Gagal mengirim penilaian"); }
    finally { setSaving(false); }
  }

  if (notFound) return <Alert color="red" maw={500} mx="auto" mt={80}>Link tidak valid.</Alert>;
  if (!info) return <Text ta="center" mt={80}>Memuat...</Text>;

  return (
    <Card maw={560} mx="auto" mt={60} withBorder padding="lg">
      <Stack>
        <Title order={3}>Penilaian Magang</Title>
        <Text><b>Siswa:</b> {info.studentName}</Text>
        <Text><b>Lokasi:</b> {info.lokasiMagang} — {info.posisi}</Text>
        {done ? (
          <Alert color="green">Terima kasih. Penilaian telah dikirim.</Alert>
        ) : (
          <>
            {CRITERIA.map((c) => (
              <Select key={c.key} label={c.label} data={RATING_OPTIONS}
                value={ratings[c.key] ?? null}
                onChange={(v) => setRatings((p) => ({ ...p, [c.key]: v as Rating }))} />
            ))}
            {error && <Text c="red">{error}</Text>}
            <Group justify="flex-end"><Button loading={saving} onClick={submit}>Kirim Penilaian</Button></Group>
          </>
        )}
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 4: Manual verification (end-to-end)**

Run dev. On `/internships`: select year, click "Muat Siswa", pick a student, add a placement. Copy the PIC link, open it in an incognito window (no login). Fill all 7 criteria, submit → success. Reopen the link → shows "already graded". Back on `/internships`, confirm Status=Dinilai, Nilai and Kategori populated.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: internships admin UI + public PIC grading form"
```

---

## Self-Review

**Spec coverage:**
- Single admin login → Task 3. ✓
- Server-side-only Firestore (quota) → Tasks 2, 4 (repo), all routes use `requireAdmin`. ✓
- Academic years / classes / students / enrollment model → Tasks 5, 6, 7 (+ enrollment created in import Task 8). ✓
- Gender L/P → types Task 5, parse Task 8, UI throughout. ✓
- Explicit Search button (no live query) → Task 7 (`enabled:false` + refetch). ✓
- Mantine UI → all UI tasks. ✓
- Excel import students (dropdown year/class + preview, match by NISN) → Tasks 8, 9. ✓
- Export roster → Task 9. ✓
- Internship placement + tokenized public PIC form + A/B/C → average → kategori → Tasks 10, 11, 12. ✓
- Token single-use after grading → Task 11 (409 on graded). ✓
- Counseling deferred → not in plan, matches spec. ✓
- Vercel + Firestore free tier, React 18 / Next 14 → Task 1, Global Constraints. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `Student`, `AcademicYear`, `SchoolClass`, `Internship`, `InternshipRatings`, `Rating`, `Gender`, `ParsedStudent` defined once (Tasks 5, 8) and reused; `CRITERIA` keys match `InternshipRatings` keys; `computeGrade` / `ratingToScore` / `newToken` / `requireAdmin` / `handle` / `repo` signatures consistent across consumers. ✓

**Note for executor:** Before Task 1, create a Firebase project, enable Firestore (Native mode) + Email/Password auth, create the single admin user, and a service account; fill `.env.local`. Composite indexes may be prompted by Firestore for multi-field enrollment queries — create them via the link Firestore logs.
