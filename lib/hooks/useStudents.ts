import { useMutation, useQuery } from "@tanstack/react-query";
import { Student } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useStudents(filters: { classId?: string; academicYearId?: string }) {
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
  const query = useQuery<Student[]>({
    queryKey: ["students", filters],
    queryFn: () => getJson<Student[]>(`/api/students?${params.toString()}`),
    enabled: false, // manual: only runs on refetch() (Search button)
  });
  const create = useMutation({ mutationFn: (b: Partial<Student>) => http.post("/api/students", b).then((r) => r.data), onSuccess: () => query.refetch() });
  const update = useMutation({ mutationFn: (b: Student) => http.put(`/api/students/${b.id}`, b).then((r) => r.data), onSuccess: () => query.refetch() });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/students/${id}`).then((r) => r.data), onSuccess: () => query.refetch() });
  return { query, create, update, remove };
}
