import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Internship } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useInternships(academicYearId?: string) {
  const qc = useQueryClient();
  const url = academicYearId ? `/api/internships?academicYearId=${academicYearId}` : "/api/internships";
  const data = useQuery<Internship[]>({ queryKey: ["internships", academicYearId ?? "all"], queryFn: ({ signal }) => getJson<Internship[]>(url, signal) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["internships"] });
  const create = useMutation({ mutationFn: (b: Partial<Internship>) => http.post("/api/internships", b).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: Internship) => http.put(`/api/internships/${b.id}`, b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/internships/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, update, remove };
}
