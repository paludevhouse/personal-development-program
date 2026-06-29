# MBC Counseling & Internship Management — Design (v1)

Date: 2026-06-29
Status: Approved (brainstorming)

## Purpose

A school management web app for an Indonesian high school to manage students,
classes, academic years, and student internships (magang) — including a PIC
(Pembimbing) grading workflow. A counseling module is planned but **deferred**
to a later iteration. UI is fully in Indonesian.

## Constraints

- Stay on **free tiers** (Firestore Spark plan, Vercel free tier).
- Minimize Firestore quota: client never queries Firestore directly; all access
  goes through Next.js API routes. Filters require an explicit **Search** action
  (no live/reactive querying).
- React **18** (so Next.js 14, App Router).
- UI library: **Mantine v7**.

## Tech Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Mantine v7 (UI), TanStack Query (client data fetching/caching)
- Firebase Firestore (DB) via **Firebase Admin SDK** in API routes
- Firebase Auth (email/password) for the single admin user
- `xlsx` (SheetJS) for Excel import/export
- Deploy: Vercel free tier

## Architecture

- **Single admin** logs in via Firebase Auth. API routes verify the session
  before any read/write.
- **All Firestore access is server-side** (Admin SDK) through `/app/api/*`
  routes. The client uses TanStack Query against these routes. This centralizes
  validation, enables batched reads, and protects quota.
- **One public exception:** the PIC grading endpoint, guarded by an unguessable
  per-internship `token` (no login).

## Data Model (Firestore collections)

### academicYears
```
{ year: "2025/2026", semester: "1 (Satu)" | "2 (Dua)", isActive: boolean }
```

### classes
```
{ name: "XII.1", academicYearId, waliKelas: string }
```

### students  (permanent record across years)
```
{ namaSiswa, namaBesar, namaPendek, nis, nisn, gender: "L" | "P" }
```
- `gender` (L = Laki-laki, P = Perempuan) drives title/salutation.
- Uniqueness/match key for import: `nisn`.

### enrollments  (student ↔ class ↔ year)
```
{ studentId, classId, academicYearId }
```

### internships  (placement + grade)
```
{
  studentId, academicYearId,
  lokasiMagang, posisi, pembimbing,
  token,                       // unguessable; powers the public grading link
  status: "pending" | "graded",
  ratings: {                   // each "A" | "B" | "C", null until graded
    kedisiplinan, kerjasama, inisiatif, tanggungJawab,
    adaptasi, memberiMasukan, pengumpulanLaporan
  },
  nilaiAkhir: number,          // computed
  kategori: string,            // computed
  tanggal: string
}
```

### counseling — DEFERRED
Placeholder only. Full design in a later iteration. Purpose: track student
counseling sessions with history per student.

## Internship Grading

7 criteria, each rated A/B/C by the PIC:
1. Kedisiplinan
2. Kerjasama
3. Inisiatif
4. Tanggung Jawab
5. Adaptasi
6. Kemampuan Memberi Masukan
7. Pengumpulan Laporan

Scoring (server-computed on submit):
- A = 98, B = 90, C = 82
- `nilaiAkhir` = AVERAGE of the 7 scores
- `kategori`:
  - `>= 94.5` → "sangat baik"
  - `>= 86.5` → "baik"
  - else → "cukup baik"

### Flow
1. Admin creates an internship placement for a student (lokasi, posisi,
   pembimbing) → system generates a unique `token`, status `pending`.
2. Admin copies the link `/grade/[token]` and sends it to the PIC.
3. PIC opens the public Mantine form, selects A/B/C for each criterion, submits
   → POST to public API route.
4. API validates token + computes `nilaiAkhir` and `kategori`, stores ratings,
   sets status `graded`. After submission the token is read-only (single-use).

## Excel I/O (SheetJS)

### Import students
- Admin opens Import → **selects target Academic Year + Class from dropdowns**
  (no manual year/class entry or matching in the spreadsheet).
- Uploads .xlsx containing student columns only (namaSiswa, namaBesar,
  namaPendek, nis, nisn, gender).
- System shows a **preview table** to validate before committing.
- Confirm → bulk **create-or-update** students (match by `nisn`) and
  auto-create `enrollments` into the selected class/year.

### Export roster
- Download the current student/class roster as .xlsx.

## Pages

- `/login` — admin login
- `/` — dashboard
- `/students` — list + filters (with explicit Search button) + import/export
- `/classes` — manage classes
- `/academic-years` — manage academic years
- `/internships` — list, create placement, copy PIC grading link, view results
- `/grade/[token]` — **public** PIC grading form

## Out of Scope (v1)

- Counseling module (deferred)
- Internship grade Excel export/import (admin enters placements in-app for now)
- Multi-user roles (single admin only)
- File attachments / Firebase Storage
