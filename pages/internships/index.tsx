import { useState } from "react";
import { ActionIcon, Badge, Button, CopyButton, Group, Modal, Select, Stack, Table, TextInput, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { Briefcase, LinkSimple, PencilSimple, Users, WarningOctagon } from "@phosphor-icons/react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { FormModal } from "@/components/FormModal";
import { StateView } from "@/components/StateView";
import { useInternships } from "@/lib/hooks/useInternships";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useStudents } from "@/lib/hooks/useStudents";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { useWhatsappTemplate } from "@/lib/hooks/useWhatsappTemplate";
import { fillTemplate } from "@/lib/contact/fillTemplate";
import { waLink } from "@/lib/contact/waLink";
import { Company, Internship } from "@/lib/types";
import { z } from "zod";

const internshipFormSchema = z.object({
  lokasiMagang: z.string().trim().default(""),
  posisi: z.string().trim().default(""),
  pembimbing: z.string().trim().default(""),
  phone: z.string().trim().default(""),
});

type InternshipFormValues = z.infer<typeof internshipFormSchema>;

// ── Edit internship modal ────────────────────────────────────────────────────

interface EditInternshipProps {
  it: Internship;
  companyOptions: { value: string; label: string }[];
  companyList: Company[];
  onSave: (v: Internship) => void;
}

function EditInternship({ it, companyOptions, companyList, onSave }: EditInternshipProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm<InternshipFormValues>({
    initialValues: { lokasiMagang: it.lokasiMagang, posisi: it.posisi, pembimbing: it.pembimbing, phone: it.phone ?? "" },
    validate: zodResolver(internshipFormSchema),
  });

  const handleSubmit = (values: InternshipFormValues) => {
    onSave({ ...it, ...values });
    close();
  };

  return (
    <>
      <Tooltip label="Edit penempatan">
        <ActionIcon variant="light" onClick={open}>
          <PencilSimple size={16} weight="bold" />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title="Edit Penempatan Magang">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Perusahaan (Master Magang)"
              placeholder="Pilih untuk isi otomatis"
              data={companyOptions}
              searchable
              clearable
              onChange={(cid) => {
                const c = companyList.find((x) => x.id === cid);
                if (c) { form.setValues({ ...form.values, lokasiMagang: c.perusahaan, pembimbing: c.pic, phone: c.phone }); }
              }}
            />
            <TextInput label="Lokasi Magang" {...form.getInputProps("lokasiMagang")} />
            <TextInput label="Posisi" {...form.getInputProps("posisi")} />
            <TextInput label="Pembimbing" {...form.getInputProps("pembimbing")} />
            <TextInput label="No. Telepon PIC" {...form.getInputProps("phone")} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function InternshipsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const activeYears = (years.data.data ?? []).filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const { data, create, update, remove } = useInternships(yearId ?? undefined);
  const studentsHook = useStudents({ academicYearId: yearId ?? undefined });
  const [studentId, setStudentId] = useState<string | null>(null);

  const companies = useCompanies();
  const companyList = companies.data.data ?? [];
  const companyOptions = companyList.map((c) => ({ value: c.id, label: c.perusahaan }));

  const { data: waData } = useWhatsappTemplate();
  const template = waData.data?.template ?? "";

  const form = useForm<InternshipFormValues>({
    initialValues: { lokasiMagang: "", posisi: "", pembimbing: "", phone: "" },
    validate: zodResolver(internshipFormSchema),
  });

  const yearOptions = activeYears.map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const studentOptions = (studentsHook.query.data ?? []).map((s) => ({ value: s.id, label: s.namaSiswa }));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const studentName = (id: string) => (studentsHook.query.data ?? []).find((s) => s.id === id)?.namaSiswa ?? "";

  return (
    <Stack>
      <PageHeader />
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <Button variant="light" onClick={() => studentsHook.query.refetch()} leftSection={<Users size={16} weight="bold" />}>Muat Siswa</Button>
        <FormModal title="Tambah Penempatan" buttonLabel="Tambah Penempatan">
          {(close) => (
            <form onSubmit={form.onSubmit((values) => {
              create.mutate({ academicYearId: yearId!, studentId: studentId!, ...values });
              form.reset();
              setStudentId(null);
              close();
            })}>
              <Stack>
                <Select label="Siswa" data={studentOptions} value={studentId} onChange={setStudentId} searchable />
                <Select
                  label="Perusahaan (Master Magang)"
                  placeholder="Pilih untuk isi otomatis"
                  data={companyOptions}
                  searchable
                  clearable
                  onChange={(cid) => {
                    const c = companyList.find((x) => x.id === cid);
                    if (c) { form.setValues({ ...form.values, lokasiMagang: c.perusahaan, pembimbing: c.pic, phone: c.phone }); }
                  }}
                />
                <TextInput label="Lokasi Magang" {...form.getInputProps("lokasiMagang")} />
                <TextInput label="Posisi" {...form.getInputProps("posisi")} />
                <TextInput label="Pembimbing" {...form.getInputProps("pembimbing")} />
                <TextInput label="No. Telepon PIC" {...form.getInputProps("phone")} />
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
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Lokasi</Table.Th>
              <Table.Th>Posisi</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Nilai</Table.Th>
              <Table.Th>Kategori</Table.Th>
              <Table.Th>Link PIC</Table.Th>
              <Table.Th>WA</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(data.data ?? []).map((it) => {
              const link = `${origin}/grade/${it.token}`;
              const wl = waLink(it.phone ?? "");
              const text = encodeURIComponent(fillTemplate(template, { pic: it.pembimbing, siswa: studentName(it.studentId), perusahaan: it.lokasiMagang, link: `${origin}/grade/${it.token}` }));
              const waHref = wl ? `${wl}?text=${text}` : undefined;
              return (
                <Table.Tr key={it.id}>
                  <Table.Td>{it.lokasiMagang}</Table.Td>
                  <Table.Td>{it.posisi}</Table.Td>
                  <Table.Td><Badge color={it.status === "graded" ? "green" : "gray"}>{it.status === "graded" ? "Dinilai" : "Menunggu"}</Badge></Table.Td>
                  <Table.Td>{it.nilaiAkhir != null ? it.nilaiAkhir.toFixed(2) : "-"}</Table.Td>
                  <Table.Td>{it.kategori ?? "-"}</Table.Td>
                  <Table.Td>
                    <CopyButton value={link}>{({ copied, copy }) => <Button size="xs" variant="light" onClick={copy} leftSection={<LinkSimple size={14} weight="bold" />}>{copied ? "Tersalin" : "Salin Link"}</Button>}</CopyButton>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={wl ? "Kirim link penilaian via WhatsApp" : "Nomor PIC belum diisi"}>
                      <ActionIcon color="green" variant="light" disabled={!wl} component="a" href={waHref} target="_blank" rel="noopener noreferrer">
                        <WhatsappLogo size={18} weight="fill" />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <EditInternship it={it} companyOptions={companyOptions} companyList={companyList} onSave={(v) => update.mutate(v)} />
                      <Button size="xs" color="red" variant="light" onClick={() => remove.mutate(it.id)}>Hapus</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
