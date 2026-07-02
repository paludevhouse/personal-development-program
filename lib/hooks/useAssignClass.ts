import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";

interface AssignClassPayload {
  academicYearId: string;
  classId: string;
  studentIds: string[];
}

interface AssignClassResult {
  count: number;
}

export function useAssignClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignClassPayload) =>
      http.post("/api/enrollments/bulk", payload).then((r) => r.data as AssignClassResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-list"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["enrollments-year"] });
    },
  });
}
