import { useMutation, useQuery } from "@tanstack/react-query";
import { http, getJson } from "@/lib/api/http";
import { InternshipRatings } from "@/lib/types";

export interface GradeInfo {
  studentName: string;
  lokasiMagang: string;
  posisi: string;
  pembimbing: string;
  phone: string;
  tanggal: string;
  status: string;
}

export function useGrade(token: string | undefined) {
  const info = useQuery<GradeInfo>({
    queryKey: ["grade", token],
    queryFn: ({ signal }) => getJson<GradeInfo>(`/api/grade/${token}`, signal),
    enabled: !!token,
    retry: false,
  });

  const submit = useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: (payload: {
      ratings: InternshipRatings;
      studentName: string;
      lokasiMagang: string;
      posisi: string;
      pembimbing: string;
      phone: string;
      tanggal: string;
    }) => http.post(`/api/grade/${token}`, payload).then((r) => r.data),
  });

  return { info, submit };
}
