import { useMutation, useQuery } from "@tanstack/react-query";
import { http, getJson } from "@/lib/api/http";
import { InternshipRatings } from "@/lib/types";

export interface GradeInfo {
  studentName: string;
  lokasiMagang: string;
  posisi: string;
  pembimbing: string;
  status: string;
}

export function useGrade(token: string | undefined) {
  const info = useQuery<GradeInfo>({
    queryKey: ["grade", token],
    queryFn: () => getJson<GradeInfo>(`/api/grade/${token}`),
    enabled: !!token,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: (payload: {
      ratings: InternshipRatings;
      lokasiMagang: string;
      posisi: string;
      pembimbing: string;
    }) => http.post(`/api/grade/${token}`, payload).then((r) => r.data),
  });

  return { info, submit };
}
