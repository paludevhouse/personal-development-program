import { useMutation } from "@tanstack/react-query";
import { http } from "@/lib/api/http";
import { ParsedStudent } from "@/lib/excel/parseStudents";

export interface StudentImportResult {
  created: number;
  updated: number;
  success: ParsedStudent[];
  failed: { row: ParsedStudent; error: string }[];
}

export function useStudentImport() {
  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: (payload: {
      academicYearId: string;
      classId: string;
      students: ParsedStudent[];
    }) =>
      http
        .post("/api/students/import", payload)
        .then((r) => r.data as StudentImportResult),
  });
}
