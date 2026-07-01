import { useQuery } from "@tanstack/react-query";
import { Student } from "@/lib/types";
import { getJson } from "@/lib/api/http";

export function useStudent(id?: string) {
  return useQuery<Student>({
    queryKey: ["student", id],
    queryFn: ({ signal }) => getJson<Student>(`/api/students/${id}`, signal),
    enabled: !!id,
  });
}
