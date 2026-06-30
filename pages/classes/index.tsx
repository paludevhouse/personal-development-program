import { useState } from "react";
import { z } from "zod";
import { Button, Group, Select, Stack, Table, TextInput, Modal, ActionIcon, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import { WarningOctagon, Chalkboard, PencilSimple } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { StateView } from "@/components/StateView";
import { LoadingView } from "@/components/LoadingView";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { FormModal } from "@/components/FormModal";
import { SchoolClass } from "@/lib/types";

const classFormSchema = z.object({
  name: z.string().trim().min(1, "Nama kelas wajib diisi"),
  waliKelas: z.string().trim().default(""),
});

export default function ClassesPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());
  const yearsList = years.data.data ?? [];
  const activeYears = yearsList.filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const { data, create, update, remove } = useClasses(yearId ?? undefined);
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
            <form onSubmit={form.onSubmit((values) => { create.mutate({ name: values.name, academicYearId: yearId!, waliKelas: values.waliKelas, idempotencyKey: idemKey }, { onSuccess: () => setIdemKey(crypto.randomUUID()) }); form.reset(); close(); })}>
              <Stack>
                <TextInput label="Nama Kelas" placeholder="XII.1" {...form.getInputProps("name")} />
                <TextInput label="Wali Kelas" {...form.getInputProps("waliKelas")} />
                <Button type="submit" disabled={!yearId}>Simpan</Button>
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
        <StateView icon={<Chalkboard size={44} weight="duotone" />} title="Belum ada data" description="Tambah kelas untuk tahun ajaran terpilih." />
      ) : (
        <Table>
          <Table.Thead><Table.Tr><Table.Th>Kelas</Table.Th><Table.Th>Wali Kelas</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {(data.data ?? []).map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td><Table.Td>{c.waliKelas}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <EditClass cls={c} onSave={(v) => update.mutate(v)} />
                    <Button size="xs" color="red" variant="light" onClick={() => remove.mutate(c.id)}>Hapus</Button>
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

function EditClass({ cls, onSave }: { cls: SchoolClass; onSave: (v: SchoolClass) => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: { name: cls.name, waliKelas: cls.waliKelas },
    validate: zodResolver(classFormSchema),
  });
  return (
    <>
      <Tooltip label="Ubah">
        <ActionIcon variant="light" onClick={() => { form.setValues({ name: cls.name, waliKelas: cls.waliKelas }); open(); }}>
          <PencilSimple size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title="Ubah Kelas" centered>
        <form onSubmit={form.onSubmit((v) => { onSave({ ...cls, ...v }); close(); })}>
          <Stack>
            <TextInput label="Nama Kelas" {...form.getInputProps("name")} />
            <TextInput label="Wali Kelas" {...form.getInputProps("waliKelas")} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
