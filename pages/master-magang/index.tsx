import { useState } from "react";
import * as XLSX from "xlsx";
import { ActionIcon, Button, Group, Stack, Table, TextInput, Title, Tooltip } from "@mantine/core";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { buildCompaniesWorkbook } from "@/lib/excel/exportCompanies";
import { waLink } from "@/lib/contact/waLink";
import { FormModal } from "@/components/FormModal";

export default function MasterMagangPage() {
  const { data, create, remove } = useCompanies();
  const [perusahaan, setPerusahaan] = useState("");
  const [pic, setPic] = useState("");
  const [phone, setPhone] = useState("");
  const [alamat, setAlamat] = useState("");
  const companies = data.data ?? [];

  function add(close: () => void) {
    if (!perusahaan) return;
    create.mutate({ perusahaan, pic, phone, alamat });
    setPerusahaan(""); setPic(""); setPhone(""); setAlamat("");
    close();
  }

  return (
    <Stack>
      <Title order={2}>Master Magang</Title>
      <Group>
        <Button variant="light" disabled={!companies.length} onClick={() => XLSX.writeFile(buildCompaniesWorkbook(companies), "master-magang.xlsx")}>Ekspor Excel</Button>
      </Group>
      <Group align="end">
        <FormModal title="Tambah Perusahaan">
          {(close) => (
            <Stack>
              <TextInput label="Perusahaan" value={perusahaan} onChange={(e) => setPerusahaan(e.currentTarget.value)} />
              <TextInput label="PIC" value={pic} onChange={(e) => setPic(e.currentTarget.value)} />
              <TextInput label="No. Telepon" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
              <TextInput label="Alamat" value={alamat} onChange={(e) => setAlamat(e.currentTarget.value)} />
              <Button disabled={!perusahaan} onClick={() => add(close)}>Simpan</Button>
            </Stack>
          )}
        </FormModal>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Perusahaan</Table.Th><Table.Th>PIC</Table.Th><Table.Th>No. Telepon</Table.Th><Table.Th>Alamat</Table.Th><Table.Th>WhatsApp</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {companies.map((c) => {
            const wa = waLink(c.phone);
            return (
              <Table.Tr key={c.id}>
                <Table.Td>{c.perusahaan}</Table.Td><Table.Td>{c.pic}</Table.Td><Table.Td>{c.phone}</Table.Td><Table.Td>{c.alamat}</Table.Td>
                <Table.Td>
                  <Tooltip label={wa ? "Chat WhatsApp" : "Nomor tidak valid"}>
                    <ActionIcon color="green" variant="light" disabled={!wa} component="a" href={wa ?? undefined} target="_blank" rel="noopener noreferrer">WA</ActionIcon>
                  </Tooltip>
                </Table.Td>
                <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(c.id)}>Hapus</Button></Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
