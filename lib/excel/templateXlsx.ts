import ExcelJS from "exceljs";
import { TEMPLATE_HEADERS, FIELD_LABELS } from "./templates";

type TemplateType =
  | "academic-years"
  | "classes"
  | "students"
  | "master-magang"
  | "internships"
  | "counseling";

// Column → validation source map
// FIXED: inline list values
// DYNAMIC: key into opts.lists
type FixedValidation = { kind: "fixed"; values: string[] };
type DynamicValidation = { kind: "dynamic"; listKey: string };
type ColValidation = FixedValidation | DynamicValidation;

const VALIDATION_MAP: Record<string, Partial<Record<string, ColValidation>>> = {
  students: {
    gender: { kind: "fixed", values: ["L", "P"] },
    status: { kind: "fixed", values: ["aktif", "lulus", "pindah"] },
    kelas: { kind: "dynamic", listKey: "kelas" },
  },
  "academic-years": {
    isActive: { kind: "fixed", values: ["TRUE", "FALSE"] },
  },
  internships: {
    studentId: { kind: "dynamic", listKey: "nis" },
    lokasiMagang: { kind: "dynamic", listKey: "lokasi" },
  },
  counseling: {
    studentId: { kind: "dynamic", listKey: "nis" },
    category: { kind: "fixed", values: ["Akademik", "Pribadi", "Sosial", "Karir"] },
    status: { kind: "fixed", values: ["open", "selesai"] },
  },
  classes: {},
  "master-magang": {},
};

export async function downloadTemplateXlsx(
  type: TemplateType,
  opts?: { selectedFields?: string[]; lists?: Record<string, string[]> }
): Promise<void> {
  const allHeaders = TEMPLATE_HEADERS[type];
  const headers =
    opts?.selectedFields && opts.selectedFields.length > 0
      ? opts.selectedFields
      : allHeaders;

  if (!headers || headers.length === 0) return;

  const wb = new ExcelJS.Workbook();

  // --- Referensi sheet (very hidden) for dynamic lists ---
  const refSheet = wb.addWorksheet("Referensi", {
    state: "veryHidden",
  });

  // Build dynamic list columns in Referensi sheet
  // Track: fieldKey -> column letter in Referensi sheet (A, B, C, …)
  const refColMap: Record<string, { col: number; count: number }> = {};
  const validationCols = VALIDATION_MAP[type] ?? {};
  const lists = opts?.lists ?? {};

  let refColIdx = 1;
  for (const field of headers) {
    const validation = validationCols[field];
    if (validation && validation.kind === "dynamic") {
      const listKey = validation.listKey;
      const values = lists[listKey] ?? [];
      if (values.length > 0 && !(listKey in refColMap)) {
        // Write values into this Referensi column
        for (let i = 0; i < values.length; i++) {
          refSheet.getCell(i + 2, refColIdx).value = values[i];
        }
        refColMap[listKey] = { col: refColIdx, count: values.length };
        refColIdx++;
      }
    }
  }

  // --- Template sheet ---
  const templateSheet = wb.addWorksheet("Template");

  // Write header row (bold)
  const indoHeaders = headers.map((h) => FIELD_LABELS[h] || h);
  const headerRow = templateSheet.addRow(indoHeaders);
  headerRow.font = { bold: true };

  // Apply data validations per column
  headers.forEach((field, colIdx) => {
    const validation = validationCols[field];
    if (!validation) return;

    // ExcelJS columns are 1-indexed; we need to address rows 2..500
    const col = templateSheet.getColumn(colIdx + 1);
    const colLetter = col.letter;

    for (let row = 2; row <= 500; row++) {
      const cell = templateSheet.getCell(row, colIdx + 1);

      if (validation.kind === "fixed") {
        const inlineList = `"${validation.values.join(",")}"`;
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [inlineList],
        };
      } else if (validation.kind === "dynamic") {
        const listKey = validation.listKey;
        const ref = refColMap[listKey];
        if (ref) {
          // Convert column index to letter(s)
          const refColLetter = getColLetter(ref.col);
          const rangeFormula = `Referensi!$${refColLetter}$2:$${refColLetter}$${ref.count + 1}`;
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [rangeFormula],
          };
        }
      }
    }

    // Suppress TS "unused variable" warning — colLetter used for reference only
    void colLetter;
  });

  // --- Download ---
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `template-${type}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Convert 1-based column index to Excel column letter (A, B, … Z, AA, …) */
function getColLetter(n: number): string {
  let result = "";
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}
