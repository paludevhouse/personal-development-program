import { useState } from "react";
import { Button, Group, Table, TextInput, Select, Switch, Stack } from "@mantine/core";
import { PageHeader } from "@/components/PageHeader";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { FormModal } from "@/components/FormModal";

const SEMESTER_OPTIONS = ["1 (Satu)", "2 (Dua)"];

export default function AcademicYearsPage() {
  const { data, create, remove } = useAcademicYears();
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("1 (Satu)");
  const [isActive, setIsActive] = useState(false);

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <FormModal title="Tambah Tahun Ajaran">
          {(close) => (
            <Stack>
              <TextInput label="Tahun" placeholder="2025/2026" value={year} onChange={(e) => setYear(e.currentTarget.value)} />
              <Select label="Semester" data={SEMESTER_OPTIONS} value={semester} onChange={(v) => setSemester(v ?? "1 (Satu)")} allowDeselect={false} />
              <Switch label="Aktif" checked={isActive} onChange={(e) => setIsActive(e.currentTarget.checked)} />
              <Button onClick={() => { create.mutate({ year, semester, isActive }); setYear(""); setIsActive(false); close(); }}>Simpan</Button>
            </Stack>
          )}
        </FormModal>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Tahun</Table.Th><Table.Th>Semester</Table.Th><Table.Th>Aktif</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(data.data ?? []).map((y) => (
            <Table.Tr key={y.id}>
              <Table.Td>{y.year}</Table.Td><Table.Td>{y.semester}</Table.Td><Table.Td>{y.isActive ? "Ya" : "Tidak"}</Table.Td>
              <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(y.id)}>Hapus</Button></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
