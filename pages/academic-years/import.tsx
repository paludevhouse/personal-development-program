import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Stack, Table, Title, Text, Modal, Checkbox, Card, Center, Alert } from "@mantine/core";
import { DownloadSimple, UploadSimple, WarningCircle } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { parseIndonesianRow, TEMPLATE_HEADERS, FIELD_LABELS } from "@/lib/excel/templates";
import { downloadTemplateXlsx } from "@/lib/excel/templateXlsx";
import { AcademicYear } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Helper hook for importing, keeping data structures in English
function useAcademicYearImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<AcademicYear, "id">[]) => {
      const success: Omit<AcademicYear, "id">[] = [];
      const failed: { row: Omit<AcademicYear, "id">; error: string }[] = [];
      for (const row of rows) {
        try {
          await axios.post("/api/academic-years", {
            year: String(row.year),
            isActive: row.isActive === true,
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
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

export default function ImportAcademicYearsPage() {
  const [parsed, setParsed] = useState<Omit<AcademicYear, "id">[]>([]);
  const [emptyFile, setEmptyFile] = useState(false);
  const [results, setResults] = useState<{ success: Omit<AcademicYear, "id">[]; failed: { row: Omit<AcademicYear, "id">; error: string }[] } | null>(null);
  const importMut = useAcademicYearImport();

  // Template download modal
  const [opened, { open, close }] = useDisclosure(false);
  const allFields = TEMPLATE_HEADERS["academic-years"];
  const [selectedFields, setSelectedFields] = useState<string[]>(allFields);

  async function onFile(file: File | null) {
    setResults(null);
    setEmptyFile(false);
    if (!file) {
      setParsed([]);
      return;
    }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets["Template"] ?? wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    // Map Excel rows (with Indo headers) back to English keys
    const data = rows.map((raw) => {
      const r = parseIndonesianRow(raw);
      return {
        year: String(r.year || ""),
        isActive: Boolean(r.isActive),
      };
    }).filter(r => r.year);

    setParsed(data);
    setEmptyFile(data.length === 0);
  }

  function confirm() {
    if (parsed.length === 0) return;
    importMut.mutate(parsed, {
      onSuccess: (data) => {
        setResults(data);
        if (data.failed.length === 0) {
          notifications.show({ color: "green", message: `Berhasil: ${data.success.length} data baru ditambahkan` });
        } else {
          notifications.show({ color: "orange", message: `Selesai: ${data.success.length} berhasil, ${data.failed.length} gagal` });
        }
        setParsed([]);
      },
      onError: (err) => {
        console.error(err);
        notifications.show({ color: "red", message: "Impor gagal. Periksa format data Anda." });
      },
    });
  }

  async function handleDownloadTemplate() {
    await downloadTemplateXlsx("academic-years", { selectedFields });
    close();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Impor Tahun Ajaran</Title>
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

      {emptyFile && (
        <Alert color="orange" icon={<WarningCircle size={20} />} title="Tidak ada data terbaca">
          File terunggah tapi tidak ada baris tahun ajaran yang valid. Pastikan Anda memakai templat (tombol &quot;Unduh Template&quot;), mengisi kolom <b>Tahun</b>, serta menyimpan data di sheet <b>Template</b>.
        </Alert>
      )}

      {parsed.length > 0 && (
        <Card withBorder padding="md" radius="md">
          <Stack>
            <Text fw={500}>Pratinjau {parsed.length} tahun ajaran:</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tahun</Table.Th>
                  <Table.Th>Aktif</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {parsed.map((s, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{s.year}</Table.Td>
                    <Table.Td>{s.isActive ? "Ya" : "Tidak"}</Table.Td>
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
                <Table.Thead><Table.Tr><Table.Th>Data (Tahun)</Table.Th><Table.Th>Pesan Error</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {results.failed.map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{f.row.year}</Table.Td>
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
