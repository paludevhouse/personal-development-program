import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildRosterWorkbook } from "./exportRoster";
import { Student } from "@/lib/types";

const s: Student = { id: "1", namaSiswa: "Aaron Oen", nis: "00909", gender: "L", status: "aktif" };

describe("buildRosterWorkbook", () => {
  it("produces a sheet whose rows round-trip the student fields", () => {
    const wb = buildRosterWorkbook([s]);
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]]);
    expect(rows[0]["Nama Lengkap"]).toBe("Aaron Oen");
    expect(rows[0]["NIS"]).toBe("00909");
    expect(rows[0]["Jenis Kelamin"]).toBe("L");
  });
});
