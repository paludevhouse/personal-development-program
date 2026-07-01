import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wawancara } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useWawancara(studentId?: string) {
  const qc = useQueryClient();
  const url = studentId ? `/api/wawancara?studentId=${studentId}` : "/api/wawancara";
  const data = useQuery<Wawancara[]>({ queryKey: ["wawancara", studentId ?? "all"], queryFn: ({ signal }) => getJson<Wawancara[]>(url, signal) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["wawancara"] });
  const create = useMutation({ mutationFn: (b: Partial<Wawancara>) => http.post("/api/wawancara", b).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: Wawancara) => http.put(`/api/wawancara/${b.id}`, b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/wawancara/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, update, remove };
}
