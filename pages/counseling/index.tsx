import { useState } from "react";
import { ActionIcon, Badge, Button, Group, Modal, Select, Stack, Table, Textarea, TextInput, Tooltip } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { ChatCircleText, PencilSimple, WarningOctagon } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { FormModal } from "@/components/FormModal";
import { StateView } from "@/components/StateView";
import { LoadingView } from "@/components/LoadingView";
import { useCounseling } from "@/lib/hooks/useCounseling";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { counselingSchema } from "@/lib/validation/schemas";
import { Counseling } from "@/lib/types";
import { z } from "zod";

type CounselingFormValues = z.infer<typeof counselingSchema>;

const CATEGORY_OPTIONS = [
  { value: "Akademik", label: "Akademik" },
  { value: "Pribadi", label: "Pribadi" },
  { value: "Sosial", label: "Sosial" },
  { value: "Karir", label: "Karir" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "selesai", label: "Selesai" },
];

// ── Edit counseling modal ────────────────────────────────────────────────────

interface EditCounselingProps {
  row: Counseling;
  studentOptions: { value: string; label: string }[];
  onSave: (v: Counseling) => void;
}

function EditCounseling({ row, studentOptions, onSave }: EditCounselingProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm<CounselingFormValues>({
    initialValues: {
      studentId: row.studentId,
      studentName: row.studentName,
      date: row.date,
      category: row.category,
      notes: row.notes,
      followUp: row.followUp,
      status: row.status,
      counselor: row.counselor,
    },
    validate: zodResolver(counselingSchema),
  });

  const handleSubmit = (values: CounselingFormValues) => {
    onSave({ ...row, ...values });
    close();
  };

  const handleOpen = () => {
    form.setValues({
      studentId: row.studentId,
      studentName: row.studentName,
      date: row.date,
      category: row.category,
      notes: row.notes,
      followUp: row.followUp,
      status: row.status,
      counselor: row.counselor,
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
      <Modal opened={opened} onClose={close} title="Ubah Konseling" centered>
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
            <TextInput
              label="Tanggal"
              placeholder="YYYY-MM-DD"
              {...form.getInputProps("date")}
            />
            <Select label="Kategori" data={CATEGORY_OPTIONS} {...form.getInputProps("category")} />
            <Textarea label="Catatan" {...form.getInputProps("notes")} />
            <Textarea label="Tindak Lanjut" {...form.getInputProps("followUp")} />
            <Select label="Status" data={STATUS_OPTIONS} {...form.getInputProps("status")} />
            <TextInput label="Konselor" {...form.getInputProps("counselor")} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CounselingPage() {
  const counseling = useCounseling();
  const students = useStudentList();
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());

  // Filter state
  const [filterStudentId, setFilterStudentId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const data = counseling.data;
  const items: Counseling[] = data.data ?? [];
  const studentOptions = (students.data ?? []).map((s) => ({ value: s.id, label: s.namaSiswa }));

  // Client-side filtering
  const rows = items.filter((item) => {
    if (filterStudentId && item.studentId !== filterStudentId) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const form = useForm<CounselingFormValues>({
    initialValues: {
      studentId: "",
      studentName: "",
      date: "",
      category: "Akademik",
      notes: "",
      followUp: "",
      status: "open",
      counselor: "",
    },
    validate: zodResolver(counselingSchema),
  });

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <Select
          label="Filter Siswa"
          data={[{ value: "", label: "Semua Siswa" }, ...studentOptions]}
          value={filterStudentId ?? ""}
          onChange={(v) => setFilterStudentId(v || null)}
          searchable
          clearable
          placeholder="Semua Siswa"
        />
        <Select
          label="Filter Kategori"
          data={[{ value: "", label: "Semua" }, ...CATEGORY_OPTIONS]}
          value={filterCategory ?? ""}
          onChange={(v) => setFilterCategory(v || null)}
          placeholder="Semua"
        />
        <Select
          label="Filter Status"
          data={[{ value: "", label: "Semua" }, ...STATUS_OPTIONS]}
          value={filterStatus ?? ""}
          onChange={(v) => setFilterStatus(v || null)}
          placeholder="Semua"
        />
        <FormModal title="Tambah Konseling">
          {(close) => (
            <form
              onSubmit={form.onSubmit((values) => {
                counseling.create.mutate(
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
                <DateInput
                  label="Tanggal"
                  placeholder="Pilih tanggal"
                  value={form.values.date ? new Date(form.values.date) : null}
                  onChange={(val) => form.setFieldValue("date", val ? val.toISOString().slice(0, 10) : "")}
                  error={form.errors.date}
                />
                <Select label="Kategori" data={CATEGORY_OPTIONS} {...form.getInputProps("category")} />
                <Textarea label="Catatan" {...form.getInputProps("notes")} />
                <Textarea label="Tindak Lanjut" {...form.getInputProps("followUp")} />
                <Select label="Status" data={STATUS_OPTIONS} {...form.getInputProps("status")} />
                <TextInput label="Konselor" {...form.getInputProps("counselor")} />
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
      ) : rows.length === 0 ? (
        <StateView icon={<ChatCircleText size={44} weight="duotone" />} title="Belum ada konseling" description="Tambah catatan konseling untuk memulai riwayat bimbingan siswa." />
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tanggal</Table.Th>
              <Table.Th>Siswa</Table.Th>
              <Table.Th>Kategori</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Catatan</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.date}</Table.Td>
                <Table.Td>{row.studentName}</Table.Td>
                <Table.Td>{row.category}</Table.Td>
                <Table.Td>
                  <Badge color={row.status === "selesai" ? "green" : "gray"}>
                    {row.status === "selesai" ? "Selesai" : "Open"}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.notes}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <EditCounseling row={row} studentOptions={studentOptions} onSave={(v) => counseling.update.mutate(v)} />
                    <Button size="xs" color="red" variant="light" onClick={() => counseling.remove.mutate(row.id)}>Hapus</Button>
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
