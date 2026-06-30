import { useMutation } from "@tanstack/react-query";
import { http } from "@/lib/api/http";
import { ParsedStudent } from "@/lib/excel/parseStudents";

export function useStudentImport() {
  return useMutation({
    mutationFn: (payload: {
      academicYearId: string;
      classId: string;
      students: ParsedStudent[];
    }) =>
      http
        .post("/api/students/import", payload)
        .then((r) => r.data as { created: number; updated: number }),
  });
}
