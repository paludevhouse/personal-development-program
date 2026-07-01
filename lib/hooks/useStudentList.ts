import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/http";
import { Student } from "@/lib/types";

export function useStudentList() {
  return useQuery<Student[]>({ queryKey: ["student-list"], queryFn: ({ signal }) => getJson<Student[]>("/api/students", signal), staleTime: 30 * 60 * 1000 });
}
