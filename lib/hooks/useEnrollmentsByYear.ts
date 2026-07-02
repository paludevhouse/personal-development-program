import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/http";

export interface EnrollmentByYearRow {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  academicYearId: string;
  waliKelas: string;
}

export function useEnrollmentsByYear(academicYearId?: string | null) {
  return useQuery<EnrollmentByYearRow[]>({
    queryKey: ["enrollments-year", academicYearId ?? "none"],
    queryFn: ({ signal }) =>
      getJson<EnrollmentByYearRow[]>(`/api/enrollments?academicYearId=${academicYearId}`, signal),
    enabled: !!academicYearId,
    staleTime: 30 * 60_000,
  });
}
