import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AcademicYear } from "@/lib/types";

const KEY = ["academic-years"];
async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useAcademicYears() {
  const qc = useQueryClient();
  const data = useQuery<AcademicYear[]>({ queryKey: KEY, queryFn: () => jsonFetch("/api/academic-years") });
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const create = useMutation({
    mutationFn: (b: Partial<AcademicYear>) =>
      jsonFetch("/api/academic-years", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (b: AcademicYear) =>
      jsonFetch(`/api/academic-years/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/academic-years/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  return { data, create, update, remove };
}
