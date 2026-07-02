import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";

export interface PromoteMapping {
  sourceClassId: string;
  action: "move" | "graduate";
  targetClassName?: string;
}

interface PromotePayload {
  sourceYearId: string;
  targetYearId: string;
  mappings: PromoteMapping[];
}

interface PromoteResult {
  promoted: number;
  graduated: number;
  classesCreated: number;
}

export function usePromote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromotePayload) =>
      http.post("/api/enrollments/promote", payload).then((r) => r.data as PromoteResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-list"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["enrollments-year"] });
    },
  });
}
