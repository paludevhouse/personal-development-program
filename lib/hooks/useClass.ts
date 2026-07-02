import { useQuery } from "@tanstack/react-query";
import { SchoolClass } from "@/lib/types";
import { getJson } from "@/lib/api/http";

export function useClass(id?: string) {
  return useQuery<SchoolClass>({
    queryKey: ["class", id],
    queryFn: ({ signal }) => getJson<SchoolClass>(`/api/classes/${id}`, signal),
    enabled: !!id,
    staleTime: 30 * 60_000,
  });
}
