import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api/http";
import { Student } from "@/lib/types";

interface AssignClassPayload {
  academicYearId: string;
  classId: string;
  studentIds: string[];
  /** Optional: display name of the target class, used for optimistic UI only (not sent to the API). */
  className?: string;
}

interface AssignClassResult {
  count: number;
}

export function useAssignClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ academicYearId, classId, studentIds }: AssignClassPayload) =>
      http.post("/api/enrollments/bulk", { academicYearId, classId, studentIds }).then((r) => r.data as AssignClassResult),
    onMutate: async (payload: AssignClassPayload) => {
      await qc.cancelQueries({ queryKey: ["students"] });
      await qc.cancelQueries({ queryKey: ["student-list"] });
      const previousStudents = qc.getQueriesData<Student[]>({ queryKey: ["students"] });
      const previousStudentList = qc.getQueriesData<Student[]>({ queryKey: ["student-list"] });
      const ids = new Set(payload.studentIds);
      const patch = (list?: Student[]) =>
        list?.map((s) =>
          ids.has(s.id)
            ? { ...s, classId: payload.classId, academicYearId: payload.academicYearId, ...(payload.className ? { className: payload.className } : {}) }
            : s
        );
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
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["enrollments-year"] });
    },
  });
}
