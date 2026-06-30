import * as fs from "fs";
import * as path from "path";
import { getDb } from "../lib/firebase/admin";
import { repo } from "../lib/db/repo";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

async function seed() {
  loadEnv();
  const db = getDb();
  console.log("Seeding staging database...");

  // 1. Create Academic Year
  const yearDoc = await repo.create("academicYears", {
    year: "2026/2027",
    semester: "1 (Satu)",
    isActive: true,
  });
  const yearId = yearDoc.id as string;
  console.log(`Created Academic Year: ${yearId}`);

  // 2. Create Class
  const classDoc = await repo.create("classes", {
    name: "XII.RPL.1",
    academicYearId: yearId,
    waliKelas: "Budi Santoso",
  });
  const classId = classDoc.id as string;
  console.log(`Created Class: ${classId}`);

  // 3. Create Students
  const students = [
    { namaSiswa: "Andi Wijaya", namaBesar: "ANDI", namaPendek: "Andi", nis: "1001", nisn: "001001001", gender: "L", status: "aktif" },
    { namaSiswa: "Budi Setiawan", namaBesar: "BUDI", namaPendek: "Budi", nis: "1002", nisn: "001001002", gender: "L", status: "aktif" },
    { namaSiswa: "Citra Lestari", namaBesar: "CITRA", namaPendek: "Citra", nis: "1003", nisn: "001001003", gender: "P", status: "aktif" },
  ];
  const studentIds: string[] = [];
  for (const s of students) {
    const sDoc = await repo.create("students", s);
    studentIds.push(sDoc.id as string);
    // Enroll
    await repo.create("enrollments", { studentId: sDoc.id as string, classId, academicYearId: yearId });
  }
  console.log(`Created ${studentIds.length} Students`);

  // 4. Create Companies
  const companies = [
    { perusahaan: "PT Teknologi Nusantara", pic: "Danu", phone: "081234567890", alamat: "Jl. Sudirman 1" },
    { perusahaan: "CV Maju Jaya", pic: "Eko", phone: "081234567891", alamat: "Jl. Thamrin 2" },
  ];
  const companyIds: string[] = [];
  for (const c of companies) {
    const cDoc = await repo.create("companies", c);
    companyIds.push(cDoc.id as string);
  }
  console.log(`Created ${companyIds.length} Companies`);

  // 5. Create Internships
  const internships = [
    { studentId: studentIds[0], academicYearId: yearId, lokasiMagang: companies[0].perusahaan, posisi: "Frontend Developer", pembimbing: companies[0].pic, phone: companies[0].phone, status: "pending", token: crypto.randomUUID(), ratings: { kedisiplinan: null, kerjasama: null, inisiatif: null, tanggungJawab: null, adaptasi: null, memberiMasukan: null, pengumpulanLaporan: null }, tanggal: new Date().toISOString() },
    { studentId: studentIds[1], academicYearId: yearId, lokasiMagang: companies[1].perusahaan, posisi: "Backend Developer", pembimbing: companies[1].pic, phone: companies[1].phone, status: "pending", token: crypto.randomUUID(), ratings: { kedisiplinan: null, kerjasama: null, inisiatif: null, tanggungJawab: null, adaptasi: null, memberiMasukan: null, pengumpulanLaporan: null }, tanggal: new Date().toISOString() },
  ];
  for (const i of internships) {
    await repo.create("internships", i);
  }
  console.log(`Created ${internships.length} Internships`);

  // 6. Create Counseling
  const counselings = [
    { studentId: studentIds[0], studentName: students[0].namaSiswa, date: new Date().toISOString().slice(0, 10), category: "Akademik", notes: "Siswa perlu meningkatkan nilai matematika.", followUp: "Berikan tugas tambahan", status: "open", counselor: "Guru BK" },
    { studentId: studentIds[2], studentName: students[2].namaSiswa, date: new Date().toISOString().slice(0, 10), category: "Pribadi", notes: "Siswa merasa kesulitan beradaptasi.", followUp: "Jadwalkan sesi minggu depan", status: "selesai", counselor: "Guru BK" },
  ];
  for (const c of counselings) {
    await repo.create("counseling", c);
  }
  console.log(`Created ${counselings.length} Counselings`);

  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
