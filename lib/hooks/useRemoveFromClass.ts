import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";
import { Student } from "@/lib/types";

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
    onMutate: async ({ studentId, classId }: RemoveFromClassPayload) => {
      const rosterKey = ["students", "class", classId];
      await qc.cancelQueries({ queryKey: rosterKey });
      const previousRoster = qc.getQueryData<Student[]>(rosterKey);
      qc.setQueryData<Student[]>(rosterKey, (list) => list?.filter((s) => s.id !== studentId));
      return { previousRoster, rosterKey };
    },
    onError: (_err, _variables, context) => {
      if (context) qc.setQueryData(context.rosterKey, context.previousRoster);
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-list"] });
      qc.invalidateQueries({ queryKey: ["students", "class", variables.classId] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["enrollments-year"] });
    },
  });
}
