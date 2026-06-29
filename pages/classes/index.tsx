import { useState } from "react";
import { z } from "zod";
import { Button, Group, Select, Stack, Table, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { PageHeader } from "@/components/PageHeader";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { FormModal } from "@/components/FormModal";

const classFormSchema = z.object({
  name: z.string().trim().min(1, "Nama kelas wajib diisi"),
  waliKelas: z.string().trim().default(""),
});

export default function ClassesPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const yearsList = years.data.data ?? [];
  const activeYears = yearsList.filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const { data, create, remove } = useClasses(yearId ?? undefined);
  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const form = useForm({
    initialValues: { name: "", waliKelas: "" },
    validate: zodResolver(classFormSchema),
  });

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <FormModal title="Tambah Kelas">
          {(close) => (
            <form onSubmit={form.onSubmit((values) => { create.mutate({ name: values.name, academicYearId: yearId!, waliKelas: values.waliKelas }); form.reset(); close(); })}>
              <Stack>
                <TextInput label="Nama Kelas" placeholder="XII.1" {...form.getInputProps("name")} />
                <TextInput label="Wali Kelas" {...form.getInputProps("waliKelas")} />
                <Button type="submit" disabled={!yearId}>Simpan</Button>
              </Stack>
            </form>
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
