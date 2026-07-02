import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/http";

export interface DashboardData {
  activeYear: { id: string; year: string } | null;
  siswa: { aktif: number; nonaktif: number; total: number };
  kelas: number;
  magang: { total: number; dinilai: number; avgNilai: number | null };
  konseling: { total: number; open: number };
  wawancara: { total: number; dijadwalkan: number };
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => getJson<DashboardData>("/api/dashboard", signal),
    staleTime: 10 * 60_000,
  });
}
