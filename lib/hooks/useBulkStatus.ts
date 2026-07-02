import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";
import { StudentStatus } from "@/lib/types";

interface BulkStatusPayload {
  studentIds: string[];
  status: StudentStatus;
}

interface BulkStatusResult {
  count: number;
}

export function useBulkStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkStatusPayload) =>
      http.post("/api/students/bulk-status", payload).then((r) => r.data as BulkStatusResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-list"] });
    },
  });
}
