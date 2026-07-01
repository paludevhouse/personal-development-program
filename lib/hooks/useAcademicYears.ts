import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AcademicYear } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

const KEY = ["academic-years"];

export function useAcademicYears() {
  const qc = useQueryClient();
  const data = useQuery<AcademicYear[]>({ queryKey: KEY, queryFn: ({ signal }) => getJson<AcademicYear[]>("/api/academic-years", signal), staleTime: 30 * 60 * 1000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({
    mutationFn: (b: Partial<AcademicYear>) => http.post("/api/academic-years", b).then((r) => r.data),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (b: AcademicYear) => http.put(`/api/academic-years/${b.id}`, b).then((r) => r.data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => http.delete(`/api/academic-years/${id}`).then((r) => r.data),
    onSuccess: invalidate,
  });
  return { data, create, update, remove };
}
