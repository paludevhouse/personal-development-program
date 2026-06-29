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
