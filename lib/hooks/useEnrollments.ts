import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/http";

export interface EnrollmentRow {
  id: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYear: string;
  waliKelas: string;
}

export function useEnrollments(studentId?: string) {
  return useQuery<EnrollmentRow[]>({
    queryKey: ["enrollments", studentId],
    queryFn: ({ signal }) => getJson<EnrollmentRow[]>(`/api/enrollments?studentId=${studentId}`, signal),
    enabled: !!studentId,
    staleTime: 30 * 60_000,
  });
}
