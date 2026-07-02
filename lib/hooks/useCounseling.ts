import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Counseling } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useCounseling(studentId?: string) {
  const qc = useQueryClient();
  const url = studentId ? `/api/counseling?studentId=${studentId}` : "/api/counseling";
  const data = useQuery<Counseling[]>({ queryKey: ["counseling", studentId ?? "all"], queryFn: ({ signal }) => getJson<Counseling[]>(url, signal), staleTime: 30 * 60_000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["counseling"] });
  const create = useMutation({ mutationFn: (b: Partial<Counseling>) => http.post("/api/counseling", b).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: Counseling) => http.put(`/api/counseling/${b.id}`, b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/counseling/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, update, remove };
}
