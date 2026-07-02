import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Stack, Table, Title, Text, Select, Modal, Checkbox, Card, Center } from "@mantine/core";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { parseIndonesianRow, TEMPLATE_HEADERS, FIELD_LABELS } from "@/lib/excel/templates";
import { downloadTemplateXlsx } from "@/lib/excel/templateXlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useCompanies } from "@/lib/hooks/useCompanies";

interface ParsedInternship {
  studentId: string;
  lokasiMagang: string;
  posisi: string;
  pembimbing: string;
  phone: string;
}

function useInternshipImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rows, academicYearId }: { rows: ParsedInternship[], academicYearId: string }) => {
      const success: ParsedInternship[] = [];
      const failed: { row: ParsedInternship; error: string }[] = [];

      for (const row of rows) {
        try {
          await axios.post("/api/internships", {
            studentId: String(row.studentId),
            academicYearId,
            lokasiMagang: String(row.lokasiMagang || ""),
            posisi: String(row.posisi || ""),
            pembimbing: String(row.pembimbing || ""),
            phone: String(row.phone || ""),
          });
          success.push({ ...row });
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          failed.push({ row, error: axiosErr?.response?.data?.message || axiosErr.message || "Unknown error" });
        }
      }
      return { success, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internships"] });
    },
  });
}

export default function ImportInternshipsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const studentList = useStudentList();
  const companies = useCompanies();
  const [parsed, setParsed] = useState<ParsedInternship[]>([]);
  const [results, setResults] = useState<{ success: ParsedInternship[]; failed: { row: ParsedInternship; error: string }[] } | null>(null);
  const importMut = useInternshipImport();
  
  // Template download modal
  const [opened, { open, close }] = useDisclosure(false);
  const allFields = TEMPLATE_HEADERS["internships"];
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
    const ws = wb.Sheets["Template"] ?? wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    
    const data = rows.map((raw) => {
      const r = parseIndonesianRow(raw);
      return {
        studentId: String(r.studentId || ""),
        lokasiMagang: String(r.lokasiMagang || ""),
        posisi: String(r.posisi || ""),
        pembimbing: String(r.pembimbing || ""),
        phone: String(r.phone || ""),
      };
    }).filter(r => r.studentId);
    
    setParsed(data);
  }

  function confirm() {
    if (parsed.length === 0 || !yearId) return;
    importMut.mutate({ rows: parsed, academicYearId: yearId }, {
      onSuccess: (data) => {
        setResults(data);
        if (data.failed.length === 0) {
          notifications.show({ color: "green", message: `Berhasil: ${data.success.length} magang baru ditambahkan` });
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

  async function handleDownloadTemplate() {
    const nisList = (studentList.data ?? []).map((s) => s.nis);
    const lokasiList = (companies.data.data ?? []).map((c) => c.perusahaan);
    await downloadTemplateXlsx("internships", {
      selectedFields,
      lists: { nis: nisList, lokasi: lokasiList },
    });
    close();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Impor Penempatan Magang</Title>
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
            <Text fw={500}>Pratinjau {parsed.length} magang:</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>NIS</Table.Th>
                  <Table.Th>Lokasi</Table.Th>
                  <Table.Th>Posisi</Table.Th>
                  <Table.Th>Pembimbing</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {parsed.map((c, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{c.studentId}</Table.Td>
                    <Table.Td>{c.lokasiMagang}</Table.Td>
                    <Table.Td>{c.posisi}</Table.Td>
                    <Table.Td>{c.pembimbing}</Table.Td>
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
                <Table.Thead><Table.Tr><Table.Th>Data (NIS)</Table.Th><Table.Th>Pesan Error</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {results.failed.map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{f.row.studentId}</Table.Td>
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
