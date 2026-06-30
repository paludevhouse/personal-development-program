import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Student } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useStudents(filters: { classId?: string; academicYearId?: string }) {
  const qc = useQueryClient();
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
  const query = useQuery<Student[]>({
    queryKey: ["students", filters],
    queryFn: ({ signal }) => getJson<Student[]>(`/api/students?${params.toString()}`, signal),
    enabled: false, // manual: only runs on refetch() (Search button)
  });
  const invalidateStudentList = () => qc.invalidateQueries({ queryKey: ["student-list"] });
  const create = useMutation({ mutationFn: (b: Partial<Student>) => http.post("/api/students", b).then((r) => r.data), onSuccess: () => { query.refetch(); invalidateStudentList(); } });
  const update = useMutation({ mutationFn: (b: Student) => http.put(`/api/students/${b.id}`, b).then((r) => r.data), onSuccess: () => { query.refetch(); invalidateStudentList(); } });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/students/${id}`).then((r) => r.data), onSuccess: () => { query.refetch(); invalidateStudentList(); } });
  return { query, create, update, remove };
}
