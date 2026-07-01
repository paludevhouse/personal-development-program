import { useState } from "react";
import { Button, Group, Table, TextInput, Switch, Stack, Modal, ActionIcon, Tooltip } from "@mantine/core";
import { WarningOctagon, CalendarBlank, PencilSimple, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
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

export default function AcademicYearsPage() {
  const { data, create, update, remove } = useAcademicYears();
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());
  const form = useForm({
    initialValues: { year: "", isActive: true },
    validate: zodResolver(academicYearSchema),
  });

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <FormModal title="Tambah Tahun Ajaran">
          {(close, { loading, setLoading }) => (
            <form onSubmit={form.onSubmit((values) => {
              setLoading(true);
              create.mutate({ ...values, idempotencyKey: idemKey }, {
                onSuccess: () => { setIdemKey(crypto.randomUUID()); form.reset(); setLoading(false); close(); },
                onError: () => { setLoading(false); },
              });
            })}>
              <Stack>
                <TextInput label="Tahun" placeholder="2025/2026" {...form.getInputProps("year")} />
                <Switch label="Aktif" {...form.getInputProps("isActive", { type: "checkbox" })} />
                <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={close} disabled={loading}>Batal</Button>
                  <Button type="submit" loading={loading}>Simpan</Button>
                </Group>
              </Stack>
            </form>
          )}
        </FormModal>
        <Button component={Link} href="/academic-years/import" variant="light" leftSection={<UploadSimple size={16} weight="bold" />}>Impor Excel</Button>
      </Group>
      {data.isLoading ? (
        <LoadingView />
      ) : data.isError ? (
        <StateView icon={<WarningOctagon size={44} weight="duotone" />} title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data. Muat ulang halaman." />
      ) : ((data.data ?? []).length === 0 && !data.isLoading) ? (
        <StateView icon={<CalendarBlank size={44} weight="duotone" />} title="Belum ada data" description="Tambah tahun ajaran untuk memulai." />
      ) : (
        <Table.ScrollContainer minWidth={500}>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Tahun</Table.Th><Table.Th>Aktif</Table.Th><Table.Th /></Table.Tr></Table.Thead>
            <Table.Tbody>
              {(data.data ?? []).map((y) => (
                <Table.Tr key={y.id}>
                  <Table.Td>{y.year}</Table.Td><Table.Td>{y.isActive ? "Ya" : "Tidak"}</Table.Td>
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
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}

function EditYear({ year, onSave }: { year: AcademicYear; onSave: (v: AcademicYear) => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: { year: year.year, isActive: year.isActive },
    validate: zodResolver(academicYearSchema),
  });
  return (
    <>
      <Tooltip label="Ubah">
        <ActionIcon variant="light" onClick={() => { form.setValues({ year: year.year, isActive: year.isActive }); open(); }}>
          <PencilSimple size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title="Ubah Tahun Ajaran" centered>
        <form onSubmit={form.onSubmit((v) => { onSave({ ...year, ...v }); close(); })}>
          <Stack>
            <TextInput label="Tahun" {...form.getInputProps("year")} />
            <Switch label="Aktif" {...form.getInputProps("isActive", { type: "checkbox" })} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
