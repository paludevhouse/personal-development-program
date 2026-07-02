import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";

interface RemoveFromClassPayload {
  studentId: string;
  classId: string;
}

export function useRemoveFromClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, classId }: RemoveFromClassPayload) =>
      http
        .delete(`/api/enrollments?studentId=${studentId}&classId=${classId}`)
        .then((r) => r.data as { ok: true }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-list"] });
      qc.invalidateQueries({ queryKey: ["students", "class", variables.classId] });
    },
  });
}
