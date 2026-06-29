import { useState } from "react";
import { z } from "zod";
import { Button, CopyButton, Group, Select, Stack, Table, TextInput, Badge } from "@mantine/core";
import { Users, LinkSimple, WarningOctagon, Briefcase } from "@phosphor-icons/react";
import { StateView } from "@/components/StateView";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { PageHeader } from "@/components/PageHeader";
import { useInternships } from "@/lib/hooks/useInternships";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useStudents } from "@/lib/hooks/useStudents";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { FormModal } from "@/components/FormModal";

const internshipFormSchema = z.object({
  lokasiMagang: z.string().trim().default(""),
  posisi: z.string().trim().default(""),
  pembimbing: z.string().trim().default(""),
});

export default function InternshipsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const activeYears = (years.data.data ?? []).filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const { data, create, remove } = useInternships(yearId ?? undefined);
  const studentsHook = useStudents({ academicYearId: yearId ?? undefined });
  const [studentId, setStudentId] = useState<string | null>(null);
  const form = useForm({
    initialValues: { lokasiMagang: "", posisi: "", pembimbing: "" },
    validate: zodResolver(internshipFormSchema),
  });

  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const studentOptions = (studentsHook.query.data ?? []).map((s) => ({ value: s.id, label: s.namaSiswa }));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <Button variant="light" onClick={() => studentsHook.query.refetch()} leftSection={<Users size={16} weight="bold" />}>Muat Siswa</Button>
        <FormModal title="Tambah Penempatan" buttonLabel="Tambah Penempatan">
          {(close) => (
            <form onSubmit={form.onSubmit((values) => { create.mutate({ academicYearId: yearId!, studentId: studentId!, lokasiMagang: values.lokasiMagang, posisi: values.posisi, pembimbing: values.pembimbing }); form.reset(); setStudentId(null); close(); })}>
              <Stack>
                <Select label="Siswa" data={studentOptions} value={studentId} onChange={setStudentId} searchable />
                <TextInput label="Lokasi Magang" {...form.getInputProps("lokasiMagang")} />
                <TextInput label="Posisi" {...form.getInputProps("posisi")} />
                <TextInput label="Pembimbing" {...form.getInputProps("pembimbing")} />
                <Button type="submit" disabled={!yearId || !studentId}>Simpan</Button>
              </Stack>
            </form>
          )}
        </FormModal>
      </Group>
      {data.isError ? (
        <StateView icon={<WarningOctagon size={44} weight="duotone" />} title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data. Muat ulang halaman." />
      ) : ((data.data ?? []).length === 0 && !data.isLoading) ? (
        <StateView icon={<Briefcase size={44} weight="duotone" />} title="Belum ada data" description="Pilih tahun ajaran lalu tambah penempatan magang." />
      ) : (
        <Table>
          <Table.Thead><Table.Tr><Table.Th>Lokasi</Table.Th><Table.Th>Posisi</Table.Th><Table.Th>Status</Table.Th><Table.Th>Nilai</Table.Th><Table.Th>Kategori</Table.Th><Table.Th>Link PIC</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {(data.data ?? []).map((it) => {
              const link = `${origin}/grade/${it.token}`;
              return (
                <Table.Tr key={it.id}>
                  <Table.Td>{it.lokasiMagang}</Table.Td><Table.Td>{it.posisi}</Table.Td>
                  <Table.Td><Badge color={it.status === "graded" ? "green" : "gray"}>{it.status === "graded" ? "Dinilai" : "Menunggu"}</Badge></Table.Td>
                  <Table.Td>{it.nilaiAkhir != null ? it.nilaiAkhir.toFixed(2) : "-"}</Table.Td>
                  <Table.Td>{it.kategori ?? "-"}</Table.Td>
                  <Table.Td><CopyButton value={link}>{({ copied, copy }) => <Button size="xs" variant="light" onClick={copy} leftSection={<LinkSimple size={14} weight="bold" />}>{copied ? "Tersalin" : "Salin Link"}</Button>}</CopyButton></Table.Td>
                  <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(it.id)}>Hapus</Button></Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
