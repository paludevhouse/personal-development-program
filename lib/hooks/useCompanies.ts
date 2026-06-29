import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Company } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

const KEY = ["companies"];

export function useCompanies() {
  const qc = useQueryClient();
  const data = useQuery<Company[]>({ queryKey: KEY, queryFn: () => getJson<Company[]>("/api/companies") });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({ mutationFn: (b: Partial<Company>) => http.post("/api/companies", b).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: Company) => http.put(`/api/companies/${b.id}`, b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/companies/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, update, remove };
}
