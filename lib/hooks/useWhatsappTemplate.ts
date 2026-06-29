import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http, getJson } from "@/lib/api/http";

const KEY = ["wa-template"];

export function useWhatsappTemplate() {
  const qc = useQueryClient();
  const data = useQuery<{ template: string }>({
    queryKey: KEY,
    queryFn: () => getJson<{ template: string }>("/api/settings/whatsapp"),
  });
  const save = useMutation({
    mutationFn: (template: string) => http.put("/api/settings/whatsapp", { template }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return { data, save };
}
