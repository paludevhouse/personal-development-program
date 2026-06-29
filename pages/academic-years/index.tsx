import { Button, Group, Table, TextInput, Select, Switch, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { PageHeader } from "@/components/PageHeader";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { FormModal } from "@/components/FormModal";
import { academicYearSchema } from "@/lib/validation/schemas";

const SEMESTER_OPTIONS = ["1 (Satu)", "2 (Dua)"];

export default function AcademicYearsPage() {
  const { data, create, remove } = useAcademicYears();
  const form = useForm({
    initialValues: { year: "", semester: "1 (Satu)", isActive: false },
    validate: zodResolver(academicYearSchema),
  });

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <FormModal title="Tambah Tahun Ajaran">
          {(close) => (
            <form onSubmit={form.onSubmit((values) => { create.mutate(values); form.reset(); form.setFieldValue("semester", "1 (Satu)"); close(); })}>
              <Stack>
                <TextInput label="Tahun" placeholder="2025/2026" {...form.getInputProps("year")} />
                <Select label="Semester" data={SEMESTER_OPTIONS} allowDeselect={false} {...form.getInputProps("semester")} />
                <Switch label="Aktif" {...form.getInputProps("isActive", { type: "checkbox" })} />
                <Button type="submit">Simpan</Button>
              </Stack>
            </form>
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
