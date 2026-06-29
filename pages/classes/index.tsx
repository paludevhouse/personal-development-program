import { useState } from "react";
import { Button, Group, Select, Stack, Table, TextInput, Title } from "@mantine/core";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { FormModal } from "@/components/FormModal";

export default function ClassesPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const yearsList = years.data.data ?? [];
  const activeYears = yearsList.filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const { data, create, remove } = useClasses(yearId ?? undefined);
  const [name, setName] = useState("");
  const [wali, setWali] = useState("");
  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));

  return (
    <Stack>
      <Title order={2}>Kelas</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <FormModal title="Tambah Kelas">
          {(close) => (
            <Stack>
              <TextInput label="Nama Kelas" placeholder="XII.1" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <TextInput label="Wali Kelas" value={wali} onChange={(e) => setWali(e.currentTarget.value)} />
              <Button disabled={!yearId} onClick={() => { create.mutate({ name, academicYearId: yearId!, waliKelas: wali }); setName(""); setWali(""); close(); }}>Simpan</Button>
            </Stack>
          )}
        </FormModal>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Kelas</Table.Th><Table.Th>Wali Kelas</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {(data.data ?? []).map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td>{c.name}</Table.Td><Table.Td>{c.waliKelas}</Table.Td>
              <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(c.id)}>Hapus</Button></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
