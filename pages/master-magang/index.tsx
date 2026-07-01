import { useState } from "react";
import * as XLSX from "xlsx";
import { ActionIcon, Button, Group, Stack, Table, TextInput, Tooltip, Modal } from "@mantine/core";
import { WhatsappLogo, DownloadSimple, WarningOctagon, Buildings, PencilSimple, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { StateView } from "@/components/StateView";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import { PageHeader } from "@/components/PageHeader";
import { LoadingView } from "@/components/LoadingView";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { buildCompaniesWorkbook } from "@/lib/excel/exportCompanies";
import { waLink } from "@/lib/contact/waLink";
import { useWhatsappTemplate } from "@/lib/hooks/useWhatsappTemplate";
import { fillTemplate } from "@/lib/contact/fillTemplate";
import { FormModal } from "@/components/FormModal";
import { companySchema } from "@/lib/validation/schemas";
import { Company } from "@/lib/types";

export default function MasterMagangPage() {
  const { data, create, update, remove } = useCompanies();
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());
  const { data: waData } = useWhatsappTemplate();
  const companies = data.data ?? [];
  const template = waData.data?.template ?? "";
  const form = useForm({
    initialValues: { perusahaan: "", pic: "", phone: "", alamat: "" },
    validate: zodResolver(companySchema),
  });

  return (
    <Stack>
      <PageHeader />
      <Group>
        <Button component={Link} href="/master-magang/import" variant="light" leftSection={<UploadSimple size={16} weight="bold" />}>Impor Excel</Button>
        <Button variant="light" disabled={!companies.length} onClick={() => XLSX.writeFile(buildCompaniesWorkbook(companies), "master-magang.xlsx")} leftSection={<DownloadSimple size={16} weight="bold" />}>Ekspor Excel</Button>
      </Group>
      <Group align="end">
        <FormModal title="Tambah Perusahaan">
          {(close) => (
            <form onSubmit={form.onSubmit((values) => { create.mutate({ ...values, idempotencyKey: idemKey }, { onSuccess: () => setIdemKey(crypto.randomUUID()) }); form.reset(); close(); })}>
              <Stack>
                <TextInput label="Perusahaan" {...form.getInputProps("perusahaan")} />
                <TextInput label="PIC" {...form.getInputProps("pic")} />
                <TextInput label="No. Telepon" {...form.getInputProps("phone")} />
                <TextInput label="Alamat" {...form.getInputProps("alamat")} />
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
      ) : (companies.length === 0 && !data.isLoading) ? (
        <StateView icon={<Buildings size={44} weight="duotone" />} title="Belum ada data" description="Tambah perusahaan untuk membangun master data." />
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table>
            <Table.Thead><Table.Tr><Table.Th>Perusahaan</Table.Th><Table.Th>PIC</Table.Th><Table.Th>No. Telepon</Table.Th><Table.Th>Alamat</Table.Th><Table.Th>WhatsApp</Table.Th><Table.Th /></Table.Tr></Table.Thead>
            <Table.Tbody>
              {companies.map((c) => {
                const wa = waLink(c.phone);
                const text = encodeURIComponent(fillTemplate(template, { pic: c.pic, perusahaan: c.perusahaan }));
                const waHref = wa ? `${wa}?text=${text}` : undefined;
                return (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.perusahaan}</Table.Td><Table.Td>{c.pic}</Table.Td><Table.Td>{c.phone}</Table.Td><Table.Td>{c.alamat}</Table.Td>
                    <Table.Td>
                      <Tooltip label={wa ? "Chat WhatsApp" : "Nomor tidak valid"}>
                        <ActionIcon color="green" variant="light" disabled={!wa} component="a" href={waHref ?? undefined} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={18} weight="fill" /></ActionIcon>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <EditCompany company={c} onSave={(v) => update.mutate(v)} />
                        <Button size="xs" color="red" variant="light" onClick={() => remove.mutate(c.id)}>Hapus</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}

function EditCompany({ company, onSave }: { company: Company; onSave: (v: Company) => void }) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: { perusahaan: company.perusahaan, pic: company.pic, phone: company.phone, alamat: company.alamat },
    validate: zodResolver(companySchema),
  });
  return (
    <>
      <Tooltip label="Ubah">
        <ActionIcon variant="light" onClick={() => { form.setValues({ perusahaan: company.perusahaan, pic: company.pic, phone: company.phone, alamat: company.alamat }); open(); }}>
          <PencilSimple size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title="Ubah Perusahaan" centered>
        <form onSubmit={form.onSubmit((v) => { onSave({ ...company, ...v }); close(); })}>
          <Stack>
            <TextInput label="Perusahaan" {...form.getInputProps("perusahaan")} />
            <TextInput label="PIC" {...form.getInputProps("pic")} />
            <TextInput label="No. Telepon" {...form.getInputProps("phone")} />
            <TextInput label="Alamat" {...form.getInputProps("alamat")} />
            <Button type="submit">Simpan</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
