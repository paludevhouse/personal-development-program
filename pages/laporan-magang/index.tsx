import { useMemo } from "react";
import { Button, Card, Group, Select, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import * as XLSX from "xlsx";
import { FileArrowDown, ChartLineUp } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingView } from "@/components/LoadingView";
import { StateView } from "@/components/StateView";
import { useInternships } from "@/lib/hooks/useInternships";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { useUrlParams } from "@/lib/hooks/useUrlParams";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useEnrollmentsByYear } from "@/lib/hooks/useEnrollmentsByYear";
import { buildGradesWorkbook } from "@/lib/excel/exportGrades";
import type { Internship } from "@/lib/types";

export default function LaporanMagang() {
  const { get, set, ready } = useUrlParams();
  const yearId = get("yearId") ?? null;

  const years = useAcademicYears();
  const allYears = years.data.data ?? [];

  useDefaultYear(allYears, yearId, (id) => set({ yearId: id }));

  const yearOptions = allYears
    .filter((y) => y.isActive)
    .map((y) => ({ value: y.id, label: y.year }));

  const selectedYear = allYears.find((y) => y.id === yearId);
  const academicYear = selectedYear?.year ?? "";

  const { data: internshipsQuery } = useInternships(yearId ?? undefined);
  const items: Internship[] = useMemo(() => internshipsQuery.data ?? [], [internshipsQuery.data]);

  const studentList = useStudentList();
  const enrollmentsByYear = useEnrollmentsByYear(yearId);

  const nisById = useMemo<Record<string, string>>(() => {
    const students = studentList.data ?? [];
    return Object.fromEntries(students.map((s) => [s.id, s.nis]));
  }, [studentList.data]);

  const kelasById = useMemo<Record<string, string>>(() => {
    const enrollments = enrollmentsByYear.data ?? [];
    return Object.fromEntries(enrollments.map((e) => [e.studentId, e.className]));
  }, [enrollmentsByYear.data]);

  const stats = useMemo(() => {
    const total = items.length;
    const graded = items.filter((i) => i.status === "graded");
    const dinilai = graded.length;
    const menunggu = total - dinilai;
    const avgNilai =
      dinilai > 0
        ? (graded.reduce((sum, i) => sum + (i.nilaiAkhir ?? 0), 0) / dinilai).toFixed(2)
        : "-";
    const sangatBaik = graded.filter((i) => i.kategori === "sangat baik").length;
    const baik = graded.filter((i) => i.kategori === "baik").length;
    const cukupBaik = graded.filter((i) => i.kategori === "cukup baik").length;
    return { total, dinilai, menunggu, avgNilai, sangatBaik, baik, cukupBaik };
  }, [items]);

  const handleExport = () => {
    const wb = buildGradesWorkbook(items, { academicYear, nisById, kelasById });
    XLSX.writeFile(wb, "nilai-magang.xlsx");
  };

  const isLoading = !ready || years.data.isLoading || internshipsQuery.isLoading;

  return (
    <Stack>
      <PageHeader />

      <Group gap="sm" wrap="nowrap" align="flex-end">
        <Select
          label="Tahun Ajaran"
          placeholder="Pilih tahun ajaran"
          data={yearOptions}
          value={yearId}
          onChange={(v) => set({ yearId: v ?? undefined })}
          w={200}
        />
        <Button
          leftSection={<FileArrowDown size={16} weight="bold" />}
          onClick={handleExport}
          disabled={items.length === 0}
        >
          Ekspor Nilai (Excel)
        </Button>
      </Group>

      {isLoading ? (
        <LoadingView />
      ) : items.length === 0 ? (
        <StateView
          icon={<ChartLineUp size={40} weight="duotone" />}
          title="Belum ada data magang"
          description="Pilih tahun ajaran yang memiliki data penempatan magang."
        />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <StatCard label="Total Penempatan" value={stats.total} color="brand.7" />
            <StatCard label="Sudah Dinilai" value={stats.dinilai} color="teal.7" />
            <StatCard label="Menunggu Penilaian" value={stats.menunggu} color="orange.7" />
            <StatCard label="Rata-rata Nilai" value={stats.avgNilai} color="blue.7" />
          </SimpleGrid>

          <Title order={5} mt="sm">Distribusi Kategori</Title>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <StatCard label="Sangat Baik" value={stats.sangatBaik} color="green.7" />
            <StatCard label="Baik" value={stats.baik} color="cyan.7" />
            <StatCard label="Cukup Baik" value={stats.cukupBaik} color="yellow.7" />
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card padding="lg" withBorder>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
        {label}
      </Text>
      <Text fz={28} fw={700} c={color}>
        {value}
      </Text>
    </Card>
  );
}
