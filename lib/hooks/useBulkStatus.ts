import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";
import { Student, StudentStatus } from "@/lib/types";

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
    onMutate: async (payload: BulkStatusPayload) => {
      await qc.cancelQueries({ queryKey: ["students"] });
      await qc.cancelQueries({ queryKey: ["student-list"] });
      const previousStudents = qc.getQueriesData<Student[]>({ queryKey: ["students"] });
      const previousStudentList = qc.getQueriesData<Student[]>({ queryKey: ["student-list"] });
      const ids = new Set(payload.studentIds);
      const patch = (list?: Student[]) => list?.map((s) => (ids.has(s.id) ? { ...s, status: payload.status } : s));
      qc.setQueriesData<Student[]>({ queryKey: ["students"] }, patch);
      qc.setQueriesData<Student[]>({ queryKey: ["student-list"] }, patch);
      return { previousStudents, previousStudentList };
    },
    onError: (_err, _payload, context) => {
      context?.previousStudents?.forEach(([key, data]) => qc.setQueryData(key, data));
      context?.previousStudentList?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-list"] });
    },
  });
}
