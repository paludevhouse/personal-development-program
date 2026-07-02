import { useQuery } from "@tanstack/react-query";
import { Student } from "@/lib/types";
import { getJson } from "@/lib/api/http";

export function useClassRoster(classId?: string) {
  return useQuery<Student[]>({
    queryKey: ["students", "class", classId],
    queryFn: ({ signal }) => getJson<Student[]>(`/api/students?classId=${classId}`, signal),
    enabled: !!classId,
    staleTime: 30 * 60_000,
  });
}
