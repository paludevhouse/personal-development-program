import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Stack, Table, Title, Text, Select, Modal, Checkbox, Card, Center } from "@mantine/core";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { downloadTemplate, parseIndonesianRow, TEMPLATE_HEADERS, FIELD_LABELS } from "@/lib/excel/templates";
import { SchoolClass } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";

function useClassImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rows, academicYearId }: { rows: Omit<SchoolClass, "id" | "academicYearId">[], academicYearId: string }) => {
      const success: Omit<SchoolClass, "id">[] = [];
      const failed: { row: Omit<SchoolClass, "id" | "academicYearId">; error: string }[] = [];

      for (const row of rows) {
        try {
          await axios.post("/api/classes", {
            name: String(row.name),
            waliKelas: String(row.waliKelas || ""),
            academicYearId,
          });
          success.push({ ...row, academicYearId });
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          failed.push({ row, error: axiosErr?.response?.data?.message || axiosErr.message || "Unknown error" });
        }
      }
      return { success, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export default function ImportClassesPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Omit<SchoolClass, "id" | "academicYearId">[]>([]);
  const [results, setResults] = useState<{ success: Omit<SchoolClass, "id">[]; failed: { row: Omit<SchoolClass, "id" | "academicYearId">; error: string }[] } | null>(null);
  const importMut = useClassImport();
  
  // Template download modal
  const [opened, { open, close }] = useDisclosure(false);
  const allFields = TEMPLATE_HEADERS["classes"];
  const [selectedFields, setSelectedFields] = useState<string[]>(allFields);

  const activeYears = (years.data?.data ?? []).filter((y) => y.isActive);
  const yearOptions = activeYears.map((y) => ({ value: y.id, label: y.year }));

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
        name: String(r.name || ""),
        waliKelas: String(r.waliKelas || ""),
      };
    }).filter(r => r.name);
    
    setParsed(data);
  }

  function confirm() {
    if (parsed.length === 0 || !yearId) return;
    importMut.mutate({ rows: parsed, academicYearId: yearId }, {
      onSuccess: (data) => {
        setResults(data);
        if (data.failed.length === 0) {
          notifications.show({ color: "green", message: `Berhasil: ${data.success.length} kelas baru ditambahkan` });
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
    downloadTemplate("classes", selectedFields);
    close();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Impor Kelas</Title>
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
          <Text fw={500}>1. Pilih Tahun Ajaran</Text>
          <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} placeholder="Pilih tahun ajaran" />

          <Text fw={500} mt="sm">2. Unggah File Data (Excel)</Text>
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
            <Text fw={500}>Pratinjau {parsed.length} kelas:</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nama Kelas</Table.Th>
                  <Table.Th>Wali Kelas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {parsed.map((c, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{c.name}</Table.Td>
                    <Table.Td>{c.waliKelas}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Center>
              <Button size="lg" loading={importMut.isPending} onClick={confirm} disabled={!yearId}>Konfirmasi Impor</Button>
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
                <Table.Thead><Table.Tr><Table.Th>Data (Nama Kelas)</Table.Th><Table.Th>Pesan Error</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {results.failed.map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{f.row.name}</Table.Td>
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
