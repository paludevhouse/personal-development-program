import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Stack, Table, Title, Text, Badge, Modal, Checkbox, Card, Center } from "@mantine/core";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { downloadTemplate, parseIndonesianRow, TEMPLATE_HEADERS, FIELD_LABELS } from "@/lib/excel/templates";
import { Counseling } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

function useCounselingImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<Counseling, "id" | "studentName">[]) => {
      const success: Omit<Counseling, "id" | "studentName">[] = [];
      const failed: { row: Omit<Counseling, "id" | "studentName">; error: string }[] = [];
      
      for (const row of rows) {
        try {
          await axios.post("/api/counseling", {
            studentId: String(row.studentId),
            date: String(row.date),
            category: String(row.category),
            notes: String(row.notes || ""),
            followUp: String(row.followUp || ""),
            status: String(row.status || "open").toLowerCase(),
            counselor: String(row.counselor || ""),
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
      queryClient.invalidateQueries({ queryKey: ["counseling"] });
    },
  });
}

export default function ImportCounselingPage() {
  const [parsed, setParsed] = useState<Omit<Counseling, "id" | "studentName">[]>([]);
  const [results, setResults] = useState<{ success: Omit<Counseling, "id" | "studentName">[]; failed: { row: Omit<Counseling, "id" | "studentName">; error: string }[] } | null>(null);
  const importMut = useCounselingImport();

  // Template download modal
  const [opened, { open, close }] = useDisclosure(false);
  const allFields = TEMPLATE_HEADERS["counseling"];
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
      // Handle Excel date format if necessary
      let parsedDate = String(r.date || "");
      if (typeof r.date === "number") {
        const dateObj = new Date(Math.round((r.date - 25569) * 86400 * 1000));
        parsedDate = dateObj.toISOString().slice(0, 10);
      }

      return {
        studentId: String(r.studentId || ""),
        date: parsedDate,
        category: String(r.category || "Akademik") as Counseling["category"],
        notes: String(r.notes || ""),
        followUp: String(r.followUp || ""),
        status: String(r.status || "open").toLowerCase() as Counseling["status"],
        counselor: String(r.counselor || ""),
      };
    }).filter(r => r.studentId);
    
    setParsed(data);
  }

  function confirm() {
    if (parsed.length === 0) return;
    importMut.mutate(parsed, {
      onSuccess: (data) => {
        setResults(data);
        if (data.failed.length === 0) {
          notifications.show({ color: "green", message: `Berhasil: ${data.success.length} konseling baru ditambahkan` });
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
    downloadTemplate("counseling", selectedFields);
    close();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Impor Konseling</Title>
        <Button variant="light" leftSection={<DownloadSimple size={16} />} onClick={open}>
          Unduh Templat
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
            <Text fw={500}>Pratinjau {parsed.length} data konseling:</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>NIS</Table.Th>
                  <Table.Th>Tanggal</Table.Th>
                  <Table.Th>Kategori</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {parsed.map((c, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{c.studentId}</Table.Td>
                    <Table.Td>{c.date}</Table.Td>
                    <Table.Td>{c.category}</Table.Td>
                    <Table.Td>
                      <Badge color={c.status === "selesai" ? "green" : "gray"}>
                        {c.status === "selesai" ? "Selesai" : "Open"}
                      </Badge>
                    </Table.Td>
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
