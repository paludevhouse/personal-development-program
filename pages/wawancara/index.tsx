import { useEffect, useState } from "react";
import { ActionIcon, Badge, Button, Group, Modal, Select, Stack, Table, Tabs, Textarea, TextInput, Tooltip } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { Notebook, PencilSimple, WarningOctagon } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { FormModal } from "@/components/FormModal";
import { StateView } from "@/components/StateView";
import { LoadingView } from "@/components/LoadingView";
import { useWawancara } from "@/lib/hooks/useWawancara";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useUrlParams } from "@/lib/hooks/useUrlParams";
import { wawancaraSchema } from "@/lib/validation/schemas";
import { Wawancara } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/date";
import { z } from "zod";

type WawancaraFormValues = z.infer<typeof wawancaraSchema>;

const STATUS_OPTIONS = [
  { value: "dijadwalkan", label: "Dijadwalkan" },
  { value: "selesai", label: "Selesai" },
];

// ── Edit wawancara modal ─────────────────────────────────────────────────────

interface EditWawancaraProps {
  row: Wawancara;
  studentOptions: { value: string; label: string }[];
  onSave: (v: Wawancara) => void;
}

function EditWawancara({ row, studentOptions, onSave }: EditWawancaraProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm<WawancaraFormValues>({
    initialValues: {
      studentId: row.studentId,
      studentName: row.studentName,
      date: row.date,
      pewawancara: row.pewawancara,
      jurusan: row.jurusan,
      catatan: row.catatan,
      status: row.status,
    },
    validate: zodResolver(wawancaraSchema),
  });

  const handleSubmit = (values: WawancaraFormValues) => {
    onSave({ ...row, ...values });
    close();
  };

  const handleOpen = () => {
    form.setValues({
      studentId: row.studentId,
      studentName: row.studentName,
      date: row.date,
      pewawancara: row.pewawancara,
      jurusan: row.jurusan,
      catatan: row.catatan,
      status: row.status,
    });
    open();
  };

  return (
    <>
      <Tooltip label="Ubah">
        <ActionIcon variant="light" onClick={handleOpen}>
          <PencilSimple size={16} weight="bold" />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title="Ubah Wawancara Penjurusan" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Siswa"
              data={studentOptions}
              searchable
              {...form.getInputProps("studentId")}
              onChange={(val) => {
                const label = studentOptions.find((s) => s.value === val)?.label ?? "";
                form.setValues({ ...form.values, studentId: val ?? "", studentName: label });
              }}
            />
            <DateTimePicker
              label="Tanggal & Waktu"
              placeholder="Pilih tanggal dan waktu"
              value={(() => { const d = new Date(form.values.date); return form.values.date && !isNaN(d.getTime()) ? d : null; })()}
              onChange={(d) => form.setFieldValue("date", d ? d.toISOString() : "")}
              error={form.errors.date}
            />
            <TextInput label="Pewawancara" {...form.getInputProps("pewawancara")} />
            <TextInput label="Jurusan yang Direkomendasikan" {...form.getInputProps("jurusan")} />
            <Textarea label="Catatan" {...form.getInputProps("catatan")} />
            <Select label="Status" data={STATUS_OPTIONS} {...form.getInputProps("status")} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function WawancaraPage() {
  const wawancara = useWawancara();
  const students = useStudentList();
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());

  // Filter state
  const [filterStudentId, setFilterStudentId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { get, set, ready } = useUrlParams();

  // Initialize filter state from URL once router is ready
  useEffect(() => {
    if (!ready) return;
    const urlStudent = get("student");
    const urlStatus = get("status");
    if (urlStudent) setFilterStudentId(urlStudent);
    if (urlStatus) setFilterStatus(urlStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const data = wawancara.data;
  const items: Wawancara[] = data.data ?? [];
  const studentOptions = (students.data ?? []).map((s) => ({ value: s.id, label: s.namaSiswa }));

  // Client-side filtering
  const rows = items.filter((item) => {
    if (filterStudentId && item.studentId !== filterStudentId) return false;
    if (filterStatus && filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  const form = useForm<WawancaraFormValues>({
    initialValues: {
      studentId: "",
      studentName: "",
      date: "",
      pewawancara: "",
      jurusan: "",
      catatan: "",
      status: "dijadwalkan",
    },
    validate: zodResolver(wawancaraSchema),
  });

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <Select
          label="Filter Siswa"
          data={[{ value: "", label: "Semua Siswa" }, ...studentOptions]}
          value={filterStudentId ?? ""}
          onChange={(v) => { setFilterStudentId(v || null); set({ student: v || null }); }}
          searchable
          clearable
          placeholder="Semua Siswa"
        />
        <FormModal title="Tambah Wawancara Penjurusan">
          {(close) => (
            <form
              onSubmit={form.onSubmit((values) => {
                wawancara.create.mutate(
                  { ...values, idempotencyKey: idemKey },
                  { onSuccess: () => setIdemKey(crypto.randomUUID()) }
                );
                form.reset();
                close();
              })}
            >
              <Stack>
                <Select
                  label="Siswa"
                  data={studentOptions}
                  searchable
                  {...form.getInputProps("studentId")}
                  onChange={(val) => {
                    const label = studentOptions.find((s) => s.value === val)?.label ?? "";
                    form.setValues({ ...form.values, studentId: val ?? "", studentName: label });
                  }}
                />
                <DateTimePicker
                  label="Tanggal & Waktu"
                  placeholder="Pilih tanggal dan waktu"
                  value={(() => { const d = new Date(form.values.date); return form.values.date && !isNaN(d.getTime()) ? d : null; })()}
                  onChange={(val) => form.setFieldValue("date", val ? val.toISOString() : "")}
                  error={form.errors.date}
                />
                <TextInput label="Pewawancara" {...form.getInputProps("pewawancara")} />
                <TextInput label="Jurusan yang Direkomendasikan" {...form.getInputProps("jurusan")} />
                <Textarea label="Catatan" {...form.getInputProps("catatan")} />
                <Select label="Status" data={STATUS_OPTIONS} {...form.getInputProps("status")} />
                <Button type="submit">Simpan</Button>
              </Stack>
            </form>
          )}
        </FormModal>
      </Group>
      <Tabs
        value={filterStatus ?? "all"}
        onChange={(v) => {
          const s = v ?? "all";
          setFilterStatus(s === "all" ? null : s);
          set({ status: s === "all" ? null : s });
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="dijadwalkan">Dijadwalkan</Tabs.Tab>
          <Tabs.Tab value="selesai">Selesai</Tabs.Tab>
          <Tabs.Tab value="all">Semua</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {data.isLoading ? (
        <LoadingView />
      ) : data.isError ? (
        <StateView icon={<WarningOctagon size={44} weight="duotone" />} title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data. Muat ulang halaman." />
      ) : rows.length === 0 ? (
        <StateView icon={<Notebook size={44} weight="duotone" />} title="Belum ada wawancara" description="Tambah catatan wawancara penjurusan untuk memulai riwayat pemilihan jurusan siswa." />
      ) : (
        <Table.ScrollContainer minWidth={950}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tanggal</Table.Th>
                <Table.Th>Siswa</Table.Th>
                <Table.Th>Jurusan</Table.Th>
                <Table.Th>Pewawancara</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDateTime(row.date)}</Table.Td>
                  <Table.Td>{row.studentName}</Table.Td>
                  <Table.Td>{row.jurusan}</Table.Td>
                  <Table.Td>{row.pewawancara}</Table.Td>
                  <Table.Td>
                    <Badge color={row.status === "selesai" ? "green" : "gray"}>
                      {row.status === "selesai" ? "Selesai" : "Dijadwalkan"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <EditWawancara row={row} studentOptions={studentOptions} onSave={(v) => wawancara.update.mutate(v)} />
                      <Button size="xs" color="red" variant="light" onClick={() => wawancara.remove.mutate(row.id)}>Hapus</Button>
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
