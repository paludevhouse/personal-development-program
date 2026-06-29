import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Button, Group, Select, Stack, Table } from "@mantine/core";
import { MagnifyingGlass, UploadSimple, DownloadSimple, WarningOctagon, UsersThree } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { StateView } from "@/components/StateView";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { StudentStatus } from "@/lib/types";
import { buildRosterWorkbook } from "@/lib/excel/exportRoster";

export default function StudentsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const yearsList = years.data.data ?? [];
  const activeYears = yearsList.filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("aktif");
  const { query, update } = useStudents({ academicYearId: yearId ?? undefined, classId: classId ?? undefined });

  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const classOptions = (classes.data.data ?? []).map((c) => ({ value: c.id, label: c.name }));
  const rows = (query.data ?? []).filter((s) => statusFilter === "all" ? true : (s.status ?? "aktif") === statusFilter);

  return (
    <Stack>
      <PageHeader />
      <Group>
        <Button component={Link} href="/students/import" variant="light" leftSection={<UploadSimple size={16} weight="bold" />}>Impor Excel</Button>
        <Button variant="light" disabled={!(query.data?.length)} onClick={() => XLSX.writeFile(buildRosterWorkbook(query.data ?? []), "daftar-siswa.xlsx")} leftSection={<DownloadSimple size={16} weight="bold" />}>Ekspor Excel</Button>
      </Group>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={(v) => { setYearId(v); setClassId(null); }} clearable />
        <Select label="Kelas" data={classOptions} value={classId} onChange={setClassId} clearable />
        <Select label="Status" data={[{value:"aktif",label:"Aktif"},{value:"lulus",label:"Lulus"},{value:"pindah",label:"Pindah"},{value:"all",label:"Semua"}]} value={statusFilter} onChange={(v) => setStatusFilter(v ?? "aktif")} />
        <Button onClick={() => query.refetch()} loading={query.isFetching} leftSection={<MagnifyingGlass size={16} weight="bold" />}>Cari</Button>
      </Group>
      {query.isError ? (
        <StateView icon={<WarningOctagon size={44} weight="duotone" />} title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data siswa." />
      ) : !query.isFetched ? (
        <StateView icon={<MagnifyingGlass size={44} weight="duotone" />} title="Mulai pencarian" description="Pilih tahun ajaran dan/atau kelas, lalu klik Cari." />
      ) : rows.length === 0 ? (
        <StateView icon={<UsersThree size={44} weight="duotone" />} title="Tidak ada siswa" description="Tidak ada siswa yang cocok dengan filter ini." />
      ) : (
        <Table>
          <Table.Thead><Table.Tr><Table.Th>Nama</Table.Th><Table.Th>NIS</Table.Th><Table.Th>NISN</Table.Th><Table.Th>L/P</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {rows.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.namaSiswa}</Table.Td><Table.Td>{s.nis}</Table.Td><Table.Td>{s.nisn}</Table.Td><Table.Td>{s.gender}</Table.Td>
                <Table.Td><Select size="xs" data={[{value:"aktif",label:"Aktif"},{value:"lulus",label:"Lulus"},{value:"pindah",label:"Pindah"}]} value={s.status ?? "aktif"} onChange={(v) => v && update.mutate({ ...s, status: v as StudentStatus })} /></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
