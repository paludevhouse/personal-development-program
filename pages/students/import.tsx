import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Select, Stack, Table, Title, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useClasses } from "@/lib/hooks/useClasses";
import { useStudentImport } from "@/lib/hooks/useStudentImport";
import { parseStudentRows, ParsedStudent } from "@/lib/excel/parseStudents";

export default function ImportPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStudent[]>([]);
  const importMut = useStudentImport();

  async function onFile(file: File | null) {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    setParsed(parseStudentRows(rows));
  }

  function confirm() {
    if (!yearId || !classId) { notifications.show({ color: "red", message: "Pilih tahun ajaran dan kelas" }); return; }
    importMut.mutate(
      { academicYearId: yearId, classId, students: parsed },
      {
        onSuccess: ({ created, updated }) => {
          notifications.show({ color: "green", message: `Berhasil: ${created} baru, ${updated} diperbarui` });
          setParsed([]);
        },
        onError: () => notifications.show({ color: "red", message: "Impor gagal" }),
      }
    );
  }

  const activeYears = (years.data.data ?? []).filter((y) => y.isActive);
  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const classOptions = (classes.data.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <Stack>
      <Title order={2}>Impor Siswa</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={(v) => { setYearId(v); setClassId(null); }} />
        <Select label="Kelas" data={classOptions} value={classId} onChange={setClassId} />
        <FileInput label="File Excel (.xlsx)" accept=".xlsx" onChange={onFile} />
      </Group>
      {parsed.length > 0 && (
        <>
          <Text>Pratinjau {parsed.length} siswa:</Text>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Nama</Table.Th><Table.Th>NIS</Table.Th><Table.Th>NISN</Table.Th><Table.Th>L/P</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{parsed.map((s, i) => (<Table.Tr key={i}><Table.Td>{s.namaSiswa}</Table.Td><Table.Td>{s.nis}</Table.Td><Table.Td>{s.nisn}</Table.Td><Table.Td>{s.gender}</Table.Td></Table.Tr>))}</Table.Tbody>
          </Table>
          <Button loading={importMut.isPending} onClick={confirm} disabled={!yearId || !classId}>Konfirmasi Impor</Button>
        </>
      )}
    </Stack>
  );
}
