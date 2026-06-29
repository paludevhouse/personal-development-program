import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Button, Group, Select, Stack, Table, Title } from "@mantine/core";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { buildRosterWorkbook } from "@/lib/excel/exportRoster";

export default function StudentsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const yearsList = years.data.data ?? [];
  const activeYears = yearsList.filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const { query } = useStudents({ academicYearId: yearId ?? undefined, classId: classId ?? undefined });

  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const classOptions = (classes.data.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <Stack>
      <Title order={2}>Siswa</Title>
      <Group>
        <Button component={Link} href="/students/import" variant="light">Impor Excel</Button>
        <Button variant="light" disabled={!(query.data?.length)} onClick={() => XLSX.writeFile(buildRosterWorkbook(query.data ?? []), "daftar-siswa.xlsx")}>Ekspor Excel</Button>
      </Group>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={(v) => { setYearId(v); setClassId(null); }} clearable />
        <Select label="Kelas" data={classOptions} value={classId} onChange={setClassId} clearable />
        <Button onClick={() => query.refetch()} loading={query.isFetching}>Cari</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nama</Table.Th><Table.Th>NIS</Table.Th><Table.Th>NISN</Table.Th><Table.Th>L/P</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(query.data ?? []).map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>{s.namaSiswa}</Table.Td><Table.Td>{s.nis}</Table.Td><Table.Td>{s.nisn}</Table.Td><Table.Td>{s.gender}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
