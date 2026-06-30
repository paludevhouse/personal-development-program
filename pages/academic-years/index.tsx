import { Button, Group, Table, TextInput, Select, Switch, Stack, Modal, ActionIcon, Tooltip } from "@mantine/core";
import { WarningOctagon, CalendarBlank, PencilSimple } from "@phosphor-icons/react";
import { StateView } from "@/components/StateView";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import { PageHeader } from "@/components/PageHeader";
import { LoadingView } from "@/components/LoadingView";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { FormModal } from "@/components/FormModal";
import { academicYearSchema } from "@/lib/validation/schemas";
import { AcademicYear } from "@/lib/types";

const SEMESTER_OPTIONS = ["1 (Satu)", "2 (Dua)"];

export default function AcademicYearsPage() {
  const { data, create, update, remove } = useAcademicYears();
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
      {data.isLoading ? (
        <LoadingView />
      ) : data.isError ? (
        <StateView icon={<WarningOctagon size={44} weight="duotone" />} title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data. Muat ulang halaman." />
      ) : ((data.data ?? []).length === 0 && !data.isLoading) ? (
        <StateView icon={<CalendarBlank size={44} weight="duotone" />} title="Belum ada data" description="Tambah tahun ajaran untuk memulai." />
      ) : (
        <Table>
          <Table.Thead><Table.Tr><Table.Th>Tahun</Table.Th><Table.Th>Semester</Table.Th><Table.Th>Aktif</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {(data.data ?? []).map((y) => (
              <Table.Tr key={y.id}>
                <Table.Td>{y.year}</Table.Td><Table.Td>{y.semester}</Table.Td><Table.Td>{y.isActive ? "Ya" : "Tidak"}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <EditYear year={y} onSave={(v) => update.mutate(v)} />
                    <Button size="xs" color="red" variant="light" onClick={() => remove.mutate(y.id)}>Hapus</Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

function EditYear({ year, onSave }: { year: AcademicYear; onSave: (v: AcademicYear) => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: { year: year.year, semester: year.semester, isActive: year.isActive },
    validate: zodResolver(academicYearSchema),
  });
  return (
    <>
      <Tooltip label="Ubah">
        <ActionIcon variant="light" onClick={() => { form.setValues({ year: year.year, semester: year.semester, isActive: year.isActive }); open(); }}>
          <PencilSimple size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title="Ubah Tahun Ajaran" centered>
        <form onSubmit={form.onSubmit((v) => { onSave({ ...year, ...v }); close(); })}>
          <Stack>
            <TextInput label="Tahun" {...form.getInputProps("year")} />
            <Select label="Semester" data={SEMESTER_OPTIONS} allowDeselect={false} {...form.getInputProps("semester")} />
            <Switch label="Aktif" {...form.getInputProps("isActive", { type: "checkbox" })} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
