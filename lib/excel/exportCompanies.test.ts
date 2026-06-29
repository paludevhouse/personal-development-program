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
