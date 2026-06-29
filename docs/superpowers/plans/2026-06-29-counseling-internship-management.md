# MDC Counseling & Internship Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 (Pages Router) app to manage students, classes, academic years, and student internships (with a public PIC grading form), backed by Firestore via server-side API routes, with Excel student import/export.

**Architecture:** Next.js 14 **Pages Router** + React 18 + Mantine v7 UI + TanStack Query. All Firestore access is server-side through `pages/api/*` routes using the Firebase Admin SDK. A single admin authenticates with Firebase Auth; the only public route is the token-guarded PIC grading endpoint. Grade computation and import matching live in pure, unit-tested modules.

**Tech Stack:** Next.js 14 (Pages Router), React 18, TypeScript, Mantine v7, TanStack Query v5, Firebase Admin SDK (firebase-admin), Firebase Auth (client), xlsx (SheetJS), Vitest.

## Global Constraints

- React **18** only (no React 19 APIs). Next.js **14** **Pages Router** (`pages/` directory, NOT `app/`).
- UI library: **Mantine v7**. Use Mantine components, not hand-rolled HTML/CSS.
- All UI copy in **Indonesian**.
- Client code **never** imports `firebase-admin` or queries Firestore directly. All data access via `pages/api/*` routes consumed through TanStack Query.
- Client HTTP uses the shared **axios** instance `http` from `lib/api/http.ts` (and the `getJson<T>(url)` helper). Do NOT use `fetch` in client code. Axios rejects on non-2xx, so handle errors via `try/catch` and `error.response?.status` rather than `res.ok`. (`lib/api/http.ts` already exists.)
- API routes use `NextApiRequest`/`NextApiResponse`; dynamic params come from `req.query`. Handlers run on the default Node runtime.
- Filters do **not** query live — results load only on explicit **Search** button click.
- Gender stored as `"L"` or `"P"`.
- Student import/match key is **`nisn`** (create-or-update).
- Grade scoring: A=98, B=90, C=82; `nilaiAkhir` = average of 7; kategori ≥94.5 "sangat baik", ≥86.5 "baik", else "cukup baik".
- App name: package `mdc-counseling-management`; UI title "MDC Management".
- Stay on free tiers (Firestore Spark, Vercel free). `.env.local` already exists with Firebase credentials — do NOT overwrite or commit it.

---

### Task 1: Project scaffold (Pages Router) + Mantine + TanStack Query + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.cjs`, `vitest.config.ts`
- Create: `pages/_app.tsx`, `pages/_document.tsx`, `pages/index.tsx`
- Create: `components/AppLayout.tsx`
- Create: `lib/test/sanity.test.ts`

**Interfaces:**
- Produces: a running Next 14 Pages Router app with Mantine `MantineProvider` + Notifications + TanStack `QueryClientProvider` in `pages/_app.tsx`, Mantine SSR via `pages/_document.tsx`, a shared `AppLayout` (default layout via the `getLayout` pattern), exported type `NextPageWithLayout`, and Vitest runnable via `npm test`.

- [ ] **Step 1: Initialize the project (Pages Router)**

```bash
npx create-next-app@14 . --typescript --no-app --no-tailwind --no-src-dir --eslint --import-alias "@/*" --use-npm
```
`--no-app` selects the **Pages Router**. The directory already contains `docs/`, `.env.local`, `.gitignore`, `.superpowers/`. If create-next-app refuses the non-empty dir or prompts interactively (interactive prompts are unsupported here), scaffold into a temp dir and copy generated files in WITHOUT clobbering or deleting `docs/`, `.env.local`, `.gitignore`, `.git/`, `.superpowers/`. After scaffolding, verify `react`/`react-dom` are `^18` and `next` is `14.x`; if create-next-app pulled newer, pin them down and reinstall.

- [ ] **Step 2: Install dependencies**

```bash
npm install @mantine/core@^7 @mantine/hooks@^7 @mantine/notifications@^7 @mantine/dates@^7 @tanstack/react-query@^5 axios firebase firebase-admin xlsx dayjs
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom postcss postcss-preset-mantine postcss-simple-vars
```

- [ ] **Step 3: Configure PostCSS for Mantine**

Create `postcss.config.cjs`:
```js
module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

- [ ] **Step 4: Configure Vitest**

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
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`. Ensure `package.json` `"name"` is `"mdc-counseling-management"`.

- [ ] **Step 5: Write a sanity test**

Create `lib/test/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("sanity", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 6: Run the test to verify the toolchain**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 7: Mantine SSR document**

Create `pages/_document.tsx`:
```tsx
import { Html, Head, Main, NextScript } from "next/document";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";

export default function Document() {
  return (
    <Html lang="id" {...mantineHtmlProps}>
      <Head><ColorSchemeScript /></Head>
      <body><Main /><NextScript /></body>
    </Html>
  );
}
```

- [ ] **Step 8: Shared app layout**

Create `components/AppLayout.tsx`:
```tsx
import { AppShell, NavLink, Title, Group } from "@mantine/core";
import Link from "next/link";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShell.Header><Group h="100%" px="md"><Title order={4}>MDC Management</Title></Group></AppShell.Header>
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

- [ ] **Step 9: App providers + getLayout pattern**

Create `pages/_app.tsx`:
```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";

export type NextPageWithLayout<P = {}> = NextPage<P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function App({ Component, pageProps }: AppProps & { Component: NextPageWithLayout }) {
  const [qc] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => <AppLayout>{page}</AppLayout>);
  return (
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={qc}>
        {getLayout(<Component {...pageProps} />)}
      </QueryClientProvider>
    </MantineProvider>
  );
}
```

Create `pages/index.tsx`:
```tsx
import { Title } from "@mantine/core";
export default function Home() {
  return <Title order={1}>MDC Management</Title>;
}
```

- [ ] **Step 10: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next 14 Pages Router + Mantine + TanStack Query + Vitest"
```

---

### Task 2: Firebase Admin SDK + Firestore helper

**Files:**
- Create: `lib/firebase/admin.ts`, `lib/firebase/client.ts`
- Create: `.env.local.example`
- Test: `lib/firebase/admin.test.ts`

**Interfaces:**
- Produces:
  - `getDb(): Firestore` (from `lib/firebase/admin.ts`) — singleton Admin Firestore instance.
  - `getClientAuth()` (from `lib/firebase/client.ts`) — browser Firebase Auth instance.

- [ ] **Step 1: Document env vars (example only — real `.env.local` already exists)**

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

### Task 3: Shared API utilities (ApiError + method router) + Firestore repository

**Files:**
- Create: `lib/api/respond.ts`, `lib/db/repo.ts`
- Test: `lib/api/respond.test.ts`

**Interfaces:**
- Consumes: `getDb` (Task 2).
- Produces:
  - `class ApiError extends Error { status: number }` (from `lib/api/respond.ts`) — thrown by handlers/guards to produce a specific HTTP status.
  - `methods(map): NextApiHandler` (from `lib/api/respond.ts`) — `map` is `{ GET?, POST?, PUT?, DELETE? }` where each value is `(req: NextApiRequest, res: NextApiResponse) => Promise<unknown>`. Returns a handler that: dispatches by `req.method`; 405 if method absent; sends the resolved value as JSON 200; catches `ApiError` → `{ error }` with its status; catches everything else → 500. If a handler already sent a response (e.g. set a cookie + `res.json`), `methods` does not double-send (checks `res.headersSent`).
  - `repo` (from `lib/db/repo.ts`): `list(col, filters?)`, `get(col, id)`, `create(col, data)`, `update(col, id, data)`, `remove(col, id)` — Admin Firestore wrappers returning plain objects with `id`.

- [ ] **Step 1: Write tests for ApiError + methods**

Create `lib/api/respond.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import { methods, ApiError } from "./respond";

function mockRes() {
  const res = { headersSent: false, statusCode: 200 } as unknown as NextApiResponse & { body?: unknown };
  res.status = vi.fn((c: number) => { (res as any).statusCode = c; return res; }) as any;
  res.json = vi.fn((b: unknown) => { (res as any).body = b; (res as any).headersSent = true; return res; }) as any;
  return res as NextApiResponse & { statusCode: number; body?: unknown };
}
const req = (method: string) => ({ method } as NextApiRequest);

describe("methods", () => {
  it("dispatches to the matching method and sends JSON 200", async () => {
    const res = mockRes();
    await methods({ GET: async () => ({ ok: true }) })(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ ok: true });
  });
  it("returns 405 for an unmapped method", async () => {
    const res = mockRes();
    await methods({ GET: async () => ({}) })(req("POST"), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
  it("maps a thrown ApiError to its status", async () => {
    const res = mockRes();
    await methods({ GET: async () => { throw new ApiError(401, "no"); } })(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: "no" });
  });
  it("maps an unexpected error to 500", async () => {
    const res = mockRes();
    await methods({ GET: async () => { throw new Error("boom"); } })(req("GET"), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it("does not double-send when handler already responded", async () => {
    const res = mockRes();
    await methods({ GET: async (_r, r) => { r.status(204).json({ done: true }); } })(req("GET"), res);
    expect(res.body).toEqual({ done: true });
    expect((res.status as any).mock.calls.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- respond.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement respond + repo**

Create `lib/api/respond.ts`:
```ts
import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;

export function methods(map: Partial<Record<Method, Handler>>): NextApiHandler {
  return async (req, res) => {
    const fn = map[(req.method ?? "GET") as Method];
    if (!fn) { res.status(405).json({ error: "method not allowed" }); return; }
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.status(200).json(result ?? { ok: true });
    } catch (e) {
      if (res.headersSent) return;
      if (e instanceof ApiError) { res.status(e.status).json({ error: e.message }); return; }
      console.error(e);
      res.status(500).json({ error: "internal error" });
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- respond.test.ts`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: shared API method router + ApiError + Firestore repo"
```

---

### Task 4: Admin auth — login page + session cookie + API guard

**Files:**
- Create: `lib/auth/session.ts`, `pages/api/auth/login.ts`, `pages/api/auth/logout.ts`
- Create: `pages/login.tsx`, `middleware.ts`
- Test: `lib/auth/session.test.ts`

**Interfaces:**
- Consumes: `getDb` (Task 2), `ApiError` (Task 3), `getClientAuth` (Task 2).
- Produces:
  - `requireAdmin(req: NextApiRequest): Promise<DecodedIdToken>` (from `lib/auth/session.ts`) — reads `req.cookies.session`; throws `ApiError(401)` if missing/invalid. Used by every protected API route.
  - `createSessionCookie(idToken: string): Promise<string>`.
  - `pages/api/auth/login` (POST) sets an httpOnly `session` cookie; `pages/api/auth/logout` (POST) clears it.

- [ ] **Step 1: Write test for requireAdmin**

Create `lib/auth/session.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest } from "next";

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
import { ApiError } from "../api/respond";

const reqWithCookie = (session?: string) =>
  ({ cookies: session ? { session } : {} } as unknown as NextApiRequest);

describe("requireAdmin", () => {
  it("throws ApiError 401 when cookie missing", async () => {
    await expect(requireAdmin(reqWithCookie())).rejects.toMatchObject({ status: 401 });
    await expect(requireAdmin(reqWithCookie())).rejects.toBeInstanceOf(ApiError);
  });
  it("throws ApiError 401 when cookie invalid", async () => {
    await expect(requireAdmin(reqWithCookie("bad"))).rejects.toMatchObject({ status: 401 });
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
import type { NextApiRequest } from "next";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../firebase/admin";
import { ApiError } from "../api/respond";

export async function requireAdmin(req: NextApiRequest) {
  getDb(); // ensure admin app initialized
  const cookie = req.cookies.session;
  if (!cookie) throw new ApiError(401, "Unauthorized");
  try {
    return await getAuth().verifySessionCookie(cookie, true);
  } catch {
    throw new ApiError(401, "Unauthorized");
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
Expected: PASS (3 cases).

- [ ] **Step 5: Implement login/logout API routes**

Create `pages/api/auth/login.ts`:
```ts
import { serialize } from "cookie";
import { methods, ApiError } from "@/lib/api/respond";
import { createSessionCookie } from "@/lib/auth/session";

export default methods({
  POST: async (req, res) => {
    const { idToken } = req.body ?? {};
    if (!idToken) throw new ApiError(400, "missing token");
    try {
      const cookie = await createSessionCookie(idToken);
      res.setHeader("Set-Cookie", serialize("session", cookie, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 5,
      }));
      res.status(200).json({ ok: true });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(401, "invalid token");
    }
  },
});
```

Create `pages/api/auth/logout.ts`:
```ts
import { serialize } from "cookie";
import { methods } from "@/lib/api/respond";

export default methods({
  POST: async (_req, res) => {
    res.setHeader("Set-Cookie", serialize("session", "", { path: "/", maxAge: 0 }));
    res.status(200).json({ ok: true });
  },
});
```
Note: `cookie` ships as a transitive dependency of Next.js. If the import or its types fail to resolve, run `npm install cookie && npm install -D @types/cookie`.

- [ ] **Step 6: Implement the login page**

Create `pages/login.tsx`:
```tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { http } from "@/lib/api/http";
import { Button, Card, PasswordInput, TextInput, Title, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { NextPageWithLayout } from "@/pages/_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const idToken = await cred.user.getIdToken();
      await http.post("/api/auth/login", { idToken });
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
};

LoginPage.getLayout = (page) => page; // no app shell on the login page
export default LoginPage;
```

- [ ] **Step 7: Add route protection middleware**

Create `middleware.ts` (project root):
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
Middleware only checks cookie presence (Edge can't verify); API routes call `requireAdmin` for real verification.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: admin login with Firebase session cookie + route guard"
```

---

### Task 5: Shared types + Academic Years (API + UI)

**Files:**
- Create: `lib/types.ts`
- Create: `pages/api/academic-years/index.ts`, `pages/api/academic-years/[id].ts`
- Create: `lib/hooks/useAcademicYears.ts`
- Create: `pages/academic-years/index.tsx`

**Interfaces:**
- Consumes: `methods`, `repo`, `requireAdmin`.
- Produces:
  - Types in `lib/types.ts` (see Step 1).
  - REST: `GET/POST /api/academic-years`, `PUT/DELETE /api/academic-years/[id]`.
  - Hook `useAcademicYears()` → `{ data, create, update, remove }`.

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

- [ ] **Step 2: Implement API routes**

Create `pages/api/academic-years/index.ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    return repo.list("academicYears");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("academicYears", { year: b.year, semester: b.semester, isActive: !!b.isActive });
  },
});
```

Create `pages/api/academic-years/[id].ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const id = req.query.id as string;
    const b = req.body ?? {};
    return repo.update("academicYears", id, { year: b.year, semester: b.semester, isActive: !!b.isActive });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("academicYears", req.query.id as string);
  },
});
```

- [ ] **Step 3: Implement the data hook**

Create `lib/hooks/useAcademicYears.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AcademicYear } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

const KEY = ["academic-years"];

export function useAcademicYears() {
  const qc = useQueryClient();
  const data = useQuery<AcademicYear[]>({ queryKey: KEY, queryFn: () => getJson<AcademicYear[]>("/api/academic-years") });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({
    mutationFn: (b: Partial<AcademicYear>) => http.post("/api/academic-years", b).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (b: AcademicYear) => http.put(`/api/academic-years/${b.id}`, b).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => http.delete(`/api/academic-years/${id}`).then((r) => r.data),
    onSuccess: invalidate,
  });
  return { data, create, update, remove };
}
```

- [ ] **Step 4: Build the page**

Create `pages/academic-years/index.tsx`:
```tsx
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

- [ ] **Step 5: Manual verification**

Run `npm run dev`, log in, visit `/academic-years`, add a year, confirm it persists on refresh, then delete it.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: shared types + academic years CRUD (API + UI)"
```

---

### Task 6: Classes — API + UI

**Files:**
- Create: `pages/api/classes/index.ts`, `pages/api/classes/[id].ts`
- Create: `lib/hooks/useClasses.ts`
- Create: `pages/classes/index.tsx`

**Interfaces:**
- Consumes: `methods`, `repo`, `requireAdmin`, `SchoolClass`, `useAcademicYears`.
- Produces:
  - REST `/api/classes` (GET supports `?academicYearId=`), `/api/classes/[id]`.
  - Hook `useClasses(academicYearId?)` → `{ data, create, update, remove }`.

- [ ] **Step 1: Implement routes**

Create `pages/api/classes/index.ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const yearId = req.query.academicYearId as string | undefined;
    return repo.list("classes", yearId ? [["academicYearId", yearId]] : []);
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("classes", { name: b.name, academicYearId: b.academicYearId, waliKelas: b.waliKelas ?? "" });
  },
});
```

Create `pages/api/classes/[id].ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("classes", req.query.id as string, { name: b.name, academicYearId: b.academicYearId, waliKelas: b.waliKelas ?? "" });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("classes", req.query.id as string);
  },
});
```

- [ ] **Step 2: Implement the hook**

Create `lib/hooks/useClasses.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SchoolClass } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useClasses(academicYearId?: string) {
  const qc = useQueryClient();
  const key = ["classes", academicYearId ?? "all"];
  const url = academicYearId ? `/api/classes?academicYearId=${academicYearId}` : "/api/classes";
  const data = useQuery<SchoolClass[]>({ queryKey: key, queryFn: () => getJson<SchoolClass[]>(url) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["classes"] });
  const create = useMutation({ mutationFn: (b: Partial<SchoolClass>) => http.post("/api/classes", b).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: SchoolClass) => http.put(`/api/classes/${b.id}`, b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/classes/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, update, remove };
}
```

- [ ] **Step 3: Build the page**

Create `pages/classes/index.tsx`:
```tsx
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

Run dev, create a class under a year, confirm filtering by year works.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: classes CRUD (API + UI) scoped by academic year"
```

---

### Task 7: Students — API + list with Search button

**Files:**
- Create: `pages/api/students/index.ts`, `pages/api/students/[id].ts`
- Create: `lib/hooks/useStudents.ts`
- Create: `pages/students/index.tsx`

**Interfaces:**
- Consumes: `methods`, `repo`, `requireAdmin`, `Student`, `enrollments`/`students` collections.
- Produces:
  - REST `/api/students`: `GET` supports `?classId=` and `?academicYearId=` (joins via `enrollments`), `POST` creates a student.
  - `/api/students/[id]` `PUT`/`DELETE`.
  - Hook `useStudents(filters)` → `{ query, create, update, remove }` where `query` is a **manually triggered** query (`enabled: false`; call `query.refetch()` on Search).

- [ ] **Step 1: Implement student routes (with enrollment-based filter)**

Create `pages/api/students/index.ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const classId = req.query.classId as string | undefined;
    const academicYearId = req.query.academicYearId as string | undefined;
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
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("students", {
      namaSiswa: b.namaSiswa, namaBesar: b.namaBesar ?? b.namaSiswa?.toUpperCase() ?? "",
      namaPendek: b.namaPendek ?? "", nis: b.nis ?? "", nisn: b.nisn ?? "", gender: b.gender === "P" ? "P" : "L",
    });
  },
});
```

Create `pages/api/students/[id].ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("students", req.query.id as string, {
      namaSiswa: b.namaSiswa, namaBesar: b.namaBesar, namaPendek: b.namaPendek,
      nis: b.nis, nisn: b.nisn, gender: b.gender === "P" ? "P" : "L",
    });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("students", req.query.id as string);
  },
});
```

- [ ] **Step 2: Implement the hook with manual search**

Create `lib/hooks/useStudents.ts`:
```ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { Student } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useStudents(filters: { classId?: string; academicYearId?: string }) {
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
  const query = useQuery<Student[]>({
    queryKey: ["students", filters],
    queryFn: () => getJson<Student[]>(`/api/students?${params.toString()}`),
    enabled: false, // manual: only runs on refetch() (Search button)
  });
  const create = useMutation({ mutationFn: (b: Partial<Student>) => http.post("/api/students", b).then((r) => r.data), onSuccess: () => query.refetch() });
  const update = useMutation({ mutationFn: (b: Student) => http.put(`/api/students/${b.id}`, b).then((r) => r.data), onSuccess: () => query.refetch() });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/students/${id}`).then((r) => r.data), onSuccess: () => query.refetch() });
  return { query, create, update, remove };
}
```

- [ ] **Step 3: Build the students page (filters + explicit Search)**

Create `pages/students/index.tsx`:
```tsx
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
- Create: `pages/api/students/import.ts`
- Test: `lib/excel/parseStudents.test.ts`

**Interfaces:**
- Consumes: `methods`, `repo`, `requireAdmin`, `ApiError`, `Student`, `Gender`.
- Produces:
  - `parseStudentRows(rows: Record<string, unknown>[]): ParsedStudent[]` (pure) — normalizes raw worksheet rows. Recognizes Indonesian headers (`Nama Siswa`, `Nama Besar`, `Nama Pendek`, `Nomor Induk Sekolah`/`NIS`, `NISN`, `Gender`/`L/P`/`Jenis Kelamin`). Defaults: `namaBesar` = uppercase `namaSiswa` if blank; `gender` parsed from L/P/Laki/Perempuan, default `"L"`.
  - `ParsedStudent` interface (exported).
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

Create `pages/api/students/import.ts`:
```ts
import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { ParsedStudent } from "@/lib/excel/parseStudents";

export default methods({
  POST: async (req) => {
    await requireAdmin(req);
    const { academicYearId, classId, students } = (req.body ?? {}) as {
      academicYearId?: string; classId?: string; students?: ParsedStudent[];
    };
    if (!academicYearId || !classId) throw new ApiError(400, "academicYearId and classId required");
    const list = students ?? [];

    const existing = await repo.list("students");
    const byNisn = new Map(existing.map((s) => [String(s.nisn), s.id as string]));
    const existingEnroll = await repo.list("enrollments", [["classId", classId], ["academicYearId", academicYearId]]);
    const enrolledStudentIds = new Set(existingEnroll.map((e) => e.studentId as string));

    let created = 0, updated = 0;
    for (const s of list) {
      let id = s.nisn ? byNisn.get(String(s.nisn)) : undefined;
      if (id) { await repo.update("students", id, { ...s }); updated++; }
      else { const r = await repo.create("students", { ...s }); id = r.id; created++; }
      if (!enrolledStudentIds.has(id)) {
        await repo.create("enrollments", { studentId: id, classId, academicYearId });
        enrolledStudentIds.add(id);
      }
    }
    return { created, updated };
  },
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
- Create: `pages/students/import.tsx`
- Create: `lib/excel/exportRoster.ts`
- Modify: `pages/students/index.tsx` (add Import + Export buttons)
- Test: `lib/excel/exportRoster.test.ts`

**Interfaces:**
- Consumes: `parseStudentRows`, `useAcademicYears`, `useClasses`, `Student`, `xlsx`.
- Produces:
  - `buildRosterWorkbook(students: Student[]): import("xlsx").WorkBook` (pure) — one sheet with Indonesian headers matching the import format.
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

Create `pages/students/import.tsx`:
```tsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Select, Stack, Table, Title, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { http } from "@/lib/api/http";
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
      const res = await http.post("/api/students/import", { academicYearId: yearId, classId, students: parsed });
      const { created, updated } = res.data;
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

In `pages/students/index.tsx`, add imports at top:
```tsx
import Link from "next/link";
import * as XLSX from "xlsx";
import { buildRosterWorkbook } from "@/lib/excel/exportRoster";
```
Add this group just below the `<Title>` (uses the already-loaded `query.data`):
```tsx
<Group>
  <Button component={Link} href="/students/import" variant="light">Impor Excel</Button>
  <Button variant="light" disabled={!(query.data?.length)} onClick={() => XLSX.writeFile(buildRosterWorkbook(query.data ?? []), "daftar-siswa.xlsx")}>Ekspor Excel</Button>
</Group>
```

- [ ] **Step 7: Manual verification**

Run dev. Import: select year+class, upload `/Users/ferdylim/Downloads/Master Magang 12 2526 RUMUS TERBARU.xlsx`, confirm preview shows ~63 students, confirm import; then on `/students` search that class and click Export → file downloads.

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
  it("six A and one B → ~96.86 sangat baik (> 94.5)", () => {
    const g = computeGrade({ kedisiplinan: "A", kerjasama: "A", inisiatif: "A", tanggungJawab: "A", adaptasi: "B", memberiMasukan: "A", pengumpulanLaporan: "A" });
    expect(g.nilaiAkhir).toBeCloseTo(96.8571, 3);
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
- Create: `pages/api/internships/index.ts`, `pages/api/internships/[id].ts`
- Create: `pages/api/grade/[token].ts` (public)
- Create: `lib/internship/token.ts`
- Test: `lib/internship/token.test.ts`

**Interfaces:**
- Consumes: `methods`, `ApiError`, `repo`, `requireAdmin`, `computeGrade`, `getDb`, `Internship`, `InternshipRatings`.
- Produces:
  - `newToken(): string` (from `lib/internship/token.ts`) — URL-safe random 24+ char token.
  - `GET/POST /api/internships` (admin): GET supports `?academicYearId=`; POST creates placement with `token`, `status:"pending"`, empty ratings.
  - `GET/PUT/DELETE /api/internships/[id]` (admin).
  - `GET /api/grade/[token]` (public): returns `{ studentName, lokasiMagang, posisi, pembimbing, status }`; 404 if no match.
  - `POST /api/grade/[token]` (public): body `{ ratings: InternshipRatings }`; 409 if already `graded`; computes grade, saves, sets `status:"graded"`.

- [ ] **Step 1: Write test for newToken**

Create `lib/internship/token.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { newToken } from "./token";

describe("newToken", () => {
  it("is URL-safe and long enough", () => {
    expect(newToken()).toMatch(/^[A-Za-z0-9_-]{24,}$/);
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

Create `pages/api/internships/index.ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { newToken } from "@/lib/internship/token";

const EMPTY_RATINGS = {
  kedisiplinan: null, kerjasama: null, inisiatif: null, tanggungJawab: null,
  adaptasi: null, memberiMasukan: null, pengumpulanLaporan: null,
};

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const yearId = req.query.academicYearId as string | undefined;
    return repo.list("internships", yearId ? [["academicYearId", yearId]] : []);
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("internships", {
      studentId: b.studentId, academicYearId: b.academicYearId,
      lokasiMagang: b.lokasiMagang ?? "", posisi: b.posisi ?? "", pembimbing: b.pembimbing ?? "",
      token: newToken(), status: "pending",
      ratings: EMPTY_RATINGS, nilaiAkhir: null, kategori: null, tanggal: b.tanggal ?? "",
    });
  },
});
```

Create `pages/api/internships/[id].ts`:
```ts
import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const it = await repo.get("internships", req.query.id as string);
    if (!it) throw new ApiError(404, "not found");
    return it;
  },
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("internships", req.query.id as string, {
      lokasiMagang: b.lokasiMagang, posisi: b.posisi, pembimbing: b.pembimbing, tanggal: b.tanggal,
    });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("internships", req.query.id as string);
  },
});
```

- [ ] **Step 6: Implement the public grading route**

Create `pages/api/grade/[token].ts`:
```ts
import { methods, ApiError } from "@/lib/api/respond";
import { getDb } from "@/lib/firebase/admin";
import { repo } from "@/lib/db/repo";
import { computeGrade } from "@/lib/internship/grade";
import { InternshipRatings } from "@/lib/types";

async function findByToken(token: string) {
  const snap = await getDb().collection("internships").where("token", "==", token).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Record<string, unknown>) };
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
    const { ratings } = (req.body ?? {}) as { ratings: InternshipRatings };
    let grade;
    try {
      grade = computeGrade(ratings); // throws if incomplete
    } catch {
      throw new ApiError(400, "ratings incomplete");
    }
    await repo.update("internships", it.id as string, { ratings, nilaiAkhir: grade.nilaiAkhir, kategori: grade.kategori, status: "graded" });
    return { ok: true, nilaiAkhir: grade.nilaiAkhir, kategori: grade.kategori };
  },
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
- Create: `pages/internships/index.tsx`
- Create: `pages/grade/[token].tsx` (public — sets `getLayout = (page) => page`)

**Interfaces:**
- Consumes: `useStudents`, `useAcademicYears`, `CRITERIA`, `Internship`, `InternshipRatings`, `Rating`, `NextPageWithLayout`, internship API routes.
- Produces: admin internships page (create placement, copy `/grade/[token]` link, show results) and the public grading form.

- [ ] **Step 1: Implement the internships hook**

Create `lib/hooks/useInternships.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Internship } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useInternships(academicYearId?: string) {
  const qc = useQueryClient();
  const url = academicYearId ? `/api/internships?academicYearId=${academicYearId}` : "/api/internships";
  const data = useQuery<Internship[]>({ queryKey: ["internships", academicYearId ?? "all"], queryFn: () => getJson<Internship[]>(url) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["internships"] });
  const create = useMutation({ mutationFn: (b: Partial<Internship>) => http.post("/api/internships", b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/internships/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, remove };
}
```

- [ ] **Step 2: Build the admin internships page**

Create `pages/internships/index.tsx`:
```tsx
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

Create `pages/grade/[token].tsx`:
```tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Button, Card, Group, Select, Stack, Title, Text, Alert } from "@mantine/core";
import { http } from "@/lib/api/http";
import { CRITERIA } from "@/lib/internship/grade";
import { InternshipRatings, Rating } from "@/lib/types";
import type { NextPageWithLayout } from "@/pages/_app";

const RATING_OPTIONS = [
  { value: "A", label: "A (Sangat Baik)" },
  { value: "B", label: "B (Baik)" },
  { value: "C", label: "C (Cukup)" },
];

const GradePage: NextPageWithLayout = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const [info, setInfo] = useState<{ studentName: string; lokasiMagang: string; posisi: string; status: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ratings, setRatings] = useState<Partial<InternshipRatings>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    http.get(`/api/grade/${token}`)
      .then((r) => {
        setInfo(r.data);
        if (r.data.status === "graded") setDone(true);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  async function submit() {
    if (CRITERIA.some((c) => !ratings[c.key])) { setError("Mohon isi semua kriteria"); return; }
    setSaving(true); setError("");
    try {
      await http.post(`/api/grade/${token}`, { ratings });
      setDone(true);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        setError("Penilaian sudah dikirim sebelumnya"); setDone(true);
      } else {
        setError("Gagal mengirim penilaian");
      }
    } finally { setSaving(false); }
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
};

GradePage.getLayout = (page) => page; // public page — no app shell
export default GradePage;
```

- [ ] **Step 4: Manual verification (end-to-end)**

Run dev. On `/internships`: select year, click "Muat Siswa", pick a student, add a placement. Copy the PIC link, open it in an incognito window (no login — middleware allows `/grade`). Fill all 7 criteria, submit → success. Reopen the link → shows "already graded". Back on `/internships`, confirm Status=Dinilai, Nilai and Kategori populated.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: internships admin UI + public PIC grading form"
```

---

## Self-Review

**Spec coverage:**
- Single admin login → Task 4. ✓
- Server-side-only Firestore (quota) → Tasks 2, 3 (repo), all routes use `requireAdmin`. ✓
- Academic years / classes / students / enrollment model → Tasks 5, 6, 7 (+ enrollment created in import Task 8). ✓
- Gender L/P → types Task 5, parse Task 8, UI throughout. ✓
- Explicit Search button (no live query) → Task 7 (`enabled:false` + refetch). ✓
- Mantine UI + Pages Router → all UI tasks; SSR setup Task 1. ✓
- Excel import students (dropdown year/class + preview, match by NISN) → Tasks 8, 9. ✓
- Export roster → Task 9. ✓
- Internship placement + tokenized public PIC form + A/B/C → average → kategori → Tasks 10, 11, 12. ✓
- Token single-use after grading → Task 11 (409 on graded). ✓
- Counseling deferred → not in plan, matches spec. ✓
- Vercel + Firestore free tier, React 18 / Next 14 Pages Router → Task 1, Global Constraints. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `Student`, `AcademicYear`, `SchoolClass`, `Internship`, `InternshipRatings`, `Rating`, `Gender`, `ParsedStudent`, `NextPageWithLayout` defined once and reused; `CRITERIA` keys match `InternshipRatings` keys; `methods`/`ApiError`/`requireAdmin`/`repo`/`computeGrade`/`newToken` signatures consistent across consumers. ✓

**Note for executor:** Firestore may prompt for a composite index on the multi-field `enrollments` query (`classId` + `academicYearId`) used by the import route — create it via the link Firestore logs. `.env.local` already holds real credentials; never overwrite or commit it.

---

### Task 13: Master Magang — company master data + WhatsApp + Excel export

**Files:**
- Modify: `lib/types.ts` (add `Company`)
- Create: `lib/contact/waLink.ts`, test `lib/contact/waLink.test.ts`
- Create: `lib/excel/exportCompanies.ts`, test `lib/excel/exportCompanies.test.ts`
- Create: `pages/api/companies/index.ts`, `pages/api/companies/[id].ts`
- Create: `lib/hooks/useCompanies.ts`
- Create: `pages/master-magang/index.tsx`
- Modify: `components/AppLayout.tsx` (add nav link)

**Interfaces:**
- Consumes: `methods`, `requireAdmin`, `repo`, `http`/`getJson`, `xlsx`.
- Produces:
  - `Company = { id, perusahaan, pic, phone, alamat }`.
  - `waLink(phone): string | null` — Indonesian phone → `https://wa.me/<digits>` (or null if no digits).
  - `buildCompaniesWorkbook(companies): WorkBook`.
  - REST `/api/companies` (GET/POST) + `/api/companies/[id]` (PUT/DELETE), admin-guarded.
  - Hook `useCompanies()` → `{ data, create, remove }`.
  - Page `/master-magang`.

- [ ] **Step 1: Add the Company type**

In `lib/types.ts` add:
```ts
export interface Company { id: string; perusahaan: string; pic: string; phone: string; alamat: string; }
```

- [ ] **Step 2: Write waLink tests**

Create `lib/contact/waLink.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { waLink } from "./waLink";

describe("waLink", () => {
  it("converts a leading-0 Indonesian number to 62", () => {
    expect(waLink("081234567890")).toBe("https://wa.me/6281234567890");
  });
  it("strips spaces, dashes and + and keeps 62 prefix", () => {
    expect(waLink("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
  });
  it("keeps an already-62 number", () => {
    expect(waLink("6281234567890")).toBe("https://wa.me/6281234567890");
  });
  it("prepends 62 to a bare 8-number", () => {
    expect(waLink("8123456789")).toBe("https://wa.me/628123456789");
  });
  it("returns null when there are no digits", () => {
    expect(waLink("")).toBeNull();
    expect(waLink("-")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test (RED)**

Run: `npm test -- waLink.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement waLink**

Create `lib/contact/waLink.ts`:
```ts
/** Normalize an Indonesian phone number to a wa.me chat URL, or null if it has no digits. */
export function waLink(phone: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("0")) normalized = "62" + normalized.slice(1);
  else if (!normalized.startsWith("62")) normalized = "62" + normalized;
  return `https://wa.me/${normalized}`;
}
```

- [ ] **Step 5: Run test (GREEN)**

Run: `npm test -- waLink.test.ts`
Expected: PASS (5 cases).

- [ ] **Step 6: Write exportCompanies test**

Create `lib/excel/exportCompanies.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildCompaniesWorkbook } from "./exportCompanies";
import { Company } from "@/lib/types";

const c: Company = { id: "1", perusahaan: "T4U Graha Famili", pic: "Wenly", phone: "081234567890", alamat: "Surabaya" };

describe("buildCompaniesWorkbook", () => {
  it("round-trips company fields under Indonesian headers", () => {
    const wb = buildCompaniesWorkbook([c]);
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]]);
    expect(rows[0]["Perusahaan"]).toBe("T4U Graha Famili");
    expect(rows[0]["PIC"]).toBe("Wenly");
    expect(rows[0]["No. Telepon"]).toBe("081234567890");
    expect(rows[0]["Alamat"]).toBe("Surabaya");
  });
});
```

- [ ] **Step 7: Run test (RED)**

Run: `npm test -- exportCompanies.test.ts`
Expected: FAIL.

- [ ] **Step 8: Implement buildCompaniesWorkbook**

Create `lib/excel/exportCompanies.ts`:
```ts
import * as XLSX from "xlsx";
import { Company } from "@/lib/types";

export function buildCompaniesWorkbook(companies: Company[]): XLSX.WorkBook {
  const rows = companies.map((c) => ({
    "Perusahaan": c.perusahaan, "PIC": c.pic, "No. Telepon": c.phone, "Alamat": c.alamat,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Master Magang");
  return wb;
}
```

- [ ] **Step 9: Run test (GREEN)**

Run: `npm test -- exportCompanies.test.ts`
Expected: PASS.

- [ ] **Step 10: API routes**

Create `pages/api/companies/index.ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    return repo.list("companies");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.create("companies", { perusahaan: b.perusahaan ?? "", pic: b.pic ?? "", phone: b.phone ?? "", alamat: b.alamat ?? "" });
  },
});
```

Create `pages/api/companies/[id].ts`:
```ts
import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

export default methods({
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("companies", req.query.id as string, { perusahaan: b.perusahaan, pic: b.pic, phone: b.phone, alamat: b.alamat });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("companies", req.query.id as string);
  },
});
```

- [ ] **Step 11: Hook**

Create `lib/hooks/useCompanies.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Company } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

const KEY = ["companies"];

export function useCompanies() {
  const qc = useQueryClient();
  const data = useQuery<Company[]>({ queryKey: KEY, queryFn: () => getJson<Company[]>("/api/companies") });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({ mutationFn: (b: Partial<Company>) => http.post("/api/companies", b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/companies/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, remove };
}
```

- [ ] **Step 12: Page**

Create `pages/master-magang/index.tsx`:
```tsx
import { useState } from "react";
import * as XLSX from "xlsx";
import { ActionIcon, Button, Group, Stack, Table, TextInput, Title, Tooltip } from "@mantine/core";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { buildCompaniesWorkbook } from "@/lib/excel/exportCompanies";
import { waLink } from "@/lib/contact/waLink";

export default function MasterMagangPage() {
  const { data, create, remove } = useCompanies();
  const [perusahaan, setPerusahaan] = useState("");
  const [pic, setPic] = useState("");
  const [phone, setPhone] = useState("");
  const [alamat, setAlamat] = useState("");
  const companies = data.data ?? [];

  function add() {
    if (!perusahaan) return;
    create.mutate({ perusahaan, pic, phone, alamat });
    setPerusahaan(""); setPic(""); setPhone(""); setAlamat("");
  }

  return (
    <Stack>
      <Title order={2}>Master Magang</Title>
      <Group>
        <Button variant="light" disabled={!companies.length} onClick={() => XLSX.writeFile(buildCompaniesWorkbook(companies), "master-magang.xlsx")}>Ekspor Excel</Button>
      </Group>
      <Group align="end">
        <TextInput label="Perusahaan" value={perusahaan} onChange={(e) => setPerusahaan(e.currentTarget.value)} />
        <TextInput label="PIC" value={pic} onChange={(e) => setPic(e.currentTarget.value)} />
        <TextInput label="No. Telepon" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
        <TextInput label="Alamat" value={alamat} onChange={(e) => setAlamat(e.currentTarget.value)} />
        <Button disabled={!perusahaan} onClick={add}>Tambah</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Perusahaan</Table.Th><Table.Th>PIC</Table.Th><Table.Th>No. Telepon</Table.Th><Table.Th>Alamat</Table.Th><Table.Th>WhatsApp</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {companies.map((c) => {
            const wa = waLink(c.phone);
            return (
              <Table.Tr key={c.id}>
                <Table.Td>{c.perusahaan}</Table.Td><Table.Td>{c.pic}</Table.Td><Table.Td>{c.phone}</Table.Td><Table.Td>{c.alamat}</Table.Td>
                <Table.Td>
                  <Tooltip label={wa ? "Chat WhatsApp" : "Nomor tidak valid"}>
                    <ActionIcon color="green" variant="light" disabled={!wa} component="a" href={wa ?? undefined} target="_blank" rel="noopener noreferrer">WA</ActionIcon>
                  </Tooltip>
                </Table.Td>
                <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(c.id)}>Hapus</Button></Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
```

- [ ] **Step 13: Nav link**

In `components/AppLayout.tsx` add, after the Magang NavLink:
```tsx
<NavLink component={Link} href="/master-magang" label="Master Magang" />
```

- [ ] **Step 14: Full suite + build**

Run: `npm test` (waLink + exportCompanies pass; suite green) and `npm run build` (typechecks routes/hook/page).

- [ ] **Step 15: Commit**

```bash
git add -A && git commit -m "feat: Master Magang company master + WhatsApp link + Excel export"
```

---

## Backlog — v1.1 enhancements (requested 2026-06-29)

Each becomes its own implement→review task. Decisions already made noted inline.

- **Task 14 — Active/inactive filtering.** Hide inactive academic years from all selection dropdowns (show active-only by default; management page still lists all to toggle). Don't surface data tied to inactive years in pickers.
- **Task 15 — Student status.** Add `status: "aktif" | "lulus" | "pindah"` to `Student` (default `"aktif"`; import sets `"aktif"`). Filter students by status (default shows `aktif`), so graduated/moved students can be hidden. Status editable per student.
- **Task 16 — Create-form modal.** A reusable "Tambah/Create" button that opens a Mantine modal form (replacing inline field rows) across CRUD pages.
- **Task 17 — PIC fills placement + grade.** Expand the public token form so the PIC fills lokasi magang / posisi / pembimbing (placement details) in addition to the 7 criteria. Public token endpoint accepts placement fields on submit. (Decision: PIC fills placement details themselves.)
- **Task 18 — WhatsApp message template manager.** Settings page to edit ONE global message template with placeholders `{pic} {siswa} {perusahaan} {link}` (link = PIC grading URL). Stored in Firestore (`settings/whatsapp`). WhatsApp buttons open `wa.me/<number>?text=<filled template>`. (Decision: global template w/ placeholders.)
- **Task 19 — Route titles + details.** Centralized route metadata (a `routes` config): per-route browser `<title>` (next/head) + page heading/description, managed in one place.
- **Task 20 — Export/Import + Zod validation.** Add Zod schemas validating all create/edit forms (and import rows); extend Excel export/import coverage where missing.

**Hard gate:** All of the above are buildable as code, but NONE can be seeded or live-tested until the Firestore `(default)` database exists (currently the project has zero databases — see "create data" blocker). Live verification of every task above is deferred until then.
