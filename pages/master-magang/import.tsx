import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Stack, Table, Title, Text, Modal, Checkbox, Card, Center } from "@mantine/core";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { downloadTemplate, parseIndonesianRow, TEMPLATE_HEADERS, FIELD_LABELS } from "@/lib/excel/templates";
import { Company } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

function useCompanyImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<Company, "id">[]) => {
      const success: Omit<Company, "id">[] = [];
      const failed: { row: Omit<Company, "id">; error: string }[] = [];
      
      for (const row of rows) {
        try {
          await axios.post("/api/companies", {
            perusahaan: String(row.perusahaan),
            pic: String(row.pic || ""),
            phone: String(row.phone || ""),
            alamat: String(row.alamat || ""),
          });
          success.push(row);
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          failed.push({ row, error: axiosErr?.response?.data?.message || axiosErr.message || "Unknown error" });
        }
      }
      return { success, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export default function ImportCompaniesPage() {
  const [parsed, setParsed] = useState<Omit<Company, "id">[]>([]);
  const [results, setResults] = useState<{ success: Omit<Company, "id">[]; failed: { row: Omit<Company, "id">; error: string }[] } | null>(null);
  const importMut = useCompanyImport();

  // Template download modal
  const [opened, { open, close }] = useDisclosure(false);
  const allFields = TEMPLATE_HEADERS["master-magang"];
  const [selectedFields, setSelectedFields] = useState<string[]>(allFields);

  async function onFile(file: File | null) {
    setResults(null);
    if (!file) {
      setParsed([]);
      return;
    }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    
    const data = rows.map((raw) => {
      const r = parseIndonesianRow(raw);
      return {
        perusahaan: String(r.perusahaan || ""),
        pic: String(r.pic || ""),
        phone: String(r.phone || ""),
        alamat: String(r.alamat || ""),
      };
    }).filter(r => r.perusahaan);
    
    setParsed(data);
  }

  function confirm() {
    if (parsed.length === 0) return;
    importMut.mutate(parsed, {
      onSuccess: (data) => {
        setResults(data);
        if (data.failed.length === 0) {
          notifications.show({ color: "green", message: `Berhasil: ${data.success.length} perusahaan baru ditambahkan` });
        } else {
          notifications.show({ color: "orange", message: `Selesai: ${data.success.length} berhasil, ${data.failed.length} gagal` });
        }
        setParsed([]);
      },
      onError: (err) => {
        console.error(err);
        notifications.show({ color: "red", message: "Impor gagal. Periksa koneksi atau format data." });
      },
    });
  }

  function handleDownloadTemplate() {
    downloadTemplate("master-magang", selectedFields);
    close();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Impor Perusahaan</Title>
        <Button variant="light" leftSection={<DownloadSimple size={16} />} onClick={open}>
          Unduh Template
        </Button>
      </Group>

      <Modal opened={opened} onClose={close} title="Pilih Kolom Templat" centered>
        <Stack>
          <Text size="sm" c="dimmed">Pilih kolom yang ingin disertakan dalam templat Excel.</Text>
          <Checkbox.Group value={selectedFields} onChange={setSelectedFields}>
            <Stack mt="xs">
              {allFields.map((field) => (
                <Checkbox key={field} value={field} label={FIELD_LABELS[field] || field} />
              ))}
            </Stack>
          </Checkbox.Group>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Batal</Button>
            <Button onClick={handleDownloadTemplate}>Unduh</Button>
          </Group>
        </Stack>
      </Modal>

      <Card withBorder padding="lg" radius="md">
        <Stack>
          <Text fw={500}>Unggah File Data (Excel)</Text>
          <FileInput 
            size="md"
            label="Pilih atau seret file ke sini" 
            placeholder="Pilih file .xlsx"
            accept=".xlsx" 
            onChange={onFile} 
            leftSection={<UploadSimple size={20} />}
            clearable
          />
        </Stack>
      </Card>

      {parsed.length > 0 && (
        <Card withBorder padding="md" radius="md">
          <Stack>
            <Text fw={500}>Pratinjau {parsed.length} perusahaan:</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Perusahaan</Table.Th>
                  <Table.Th>PIC</Table.Th>
                  <Table.Th>No. Telepon</Table.Th>
                  <Table.Th>Alamat</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {parsed.map((c, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{c.perusahaan}</Table.Td>
                    <Table.Td>{c.pic}</Table.Td>
                    <Table.Td>{c.phone}</Table.Td>
                    <Table.Td>{c.alamat}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Center>
              <Button size="lg" loading={importMut.isPending} onClick={confirm}>Konfirmasi Impor</Button>
            </Center>
          </Stack>
        </Card>
      )}

      {results && (
        <Card withBorder padding="md" radius="md">
          <Stack>
            <Title order={4}>Hasil Impor</Title>
            <Text c="green">Berhasil: {results.success.length} baris</Text>
            <Text c={results.failed.length > 0 ? "red" : "dimmed"}>Gagal: {results.failed.length} baris</Text>
            {results.failed.length > 0 && (
              <Table striped>
                <Table.Thead><Table.Tr><Table.Th>Data (Perusahaan)</Table.Th><Table.Th>Pesan Error</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {results.failed.map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{f.row.perusahaan}</Table.Td>
                      <Table.Td c="red">{f.error}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
