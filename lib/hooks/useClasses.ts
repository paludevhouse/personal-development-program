import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SchoolClass } from "@/lib/types";
import { http, getJson } from "@/lib/api/http";

export function useClasses(academicYearId?: string) {
  const qc = useQueryClient();
  const key = ["classes", academicYearId ?? "all"];
  const url = academicYearId ? `/api/classes?academicYearId=${academicYearId}` : "/api/classes";
  const data = useQuery<SchoolClass[]>({ queryKey: key, queryFn: ({ signal }) => getJson<SchoolClass[]>(url, signal) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["classes"] });
  const create = useMutation({ mutationFn: (b: Partial<SchoolClass>) => http.post("/api/classes", b).then((r) => r.data), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (b: SchoolClass) => http.put(`/api/classes/${b.id}`, b).then((r) => r.data), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => http.delete(`/api/classes/${id}`).then((r) => r.data), onSuccess: invalidate });
  return { data, create, update, remove };
}
