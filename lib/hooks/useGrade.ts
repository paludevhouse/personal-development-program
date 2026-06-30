import { useMutation, useQuery } from "@tanstack/react-query";
import { http, getJson } from "@/lib/api/http";
import { InternshipRatings } from "@/lib/types";

export interface GradeItem {
  id: string;
  studentName: string;
  posisi: string;
  lokasiMagang: string;
  pembimbing: string;
  phone: string;
  tanggal: string;
  ratings: InternshipRatings | null;
  nilaiAkhir: number | null;
  kategori: string | null;
  status: string;
}

export interface GradeGroup {
  perusahaan: string;
  pic: string;
  items: GradeItem[];
}

export function useGrade(token: string | undefined) {
  const info = useQuery<GradeGroup>({
    queryKey: ["grade", token],
    queryFn: ({ signal }) => getJson<GradeGroup>(`/api/grade/${token}`, signal),
    enabled: !!token,
    retry: false,
  });

  const submit = useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: (payload: {
      internshipId: string;
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
