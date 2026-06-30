import { useState } from "react";
import * as XLSX from "xlsx";
import { Button, FileInput, Group, Select, Stack, Table, Title, Text, Modal, Checkbox, Card, Center } from "@mantine/core";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useClasses } from "@/lib/hooks/useClasses";
import { useStudentImport, StudentImportResult } from "@/lib/hooks/useStudentImport";
import { parseStudentRows, ParsedStudent } from "@/lib/excel/parseStudents";
import { downloadTemplate, TEMPLATE_HEADERS, FIELD_LABELS } from "@/lib/excel/templates";

export default function ImportPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStudent[]>([]);
  const [results, setResults] = useState<StudentImportResult | null>(null);
  const importMut = useStudentImport();
  
  // Template download modal
  const [opened, { open, close }] = useDisclosure(false);
  const allFields = TEMPLATE_HEADERS["students"];
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
    setParsed(parseStudentRows(rows));
  }

  function confirm() {
    if (!yearId || !classId) { notifications.show({ color: "red", message: "Pilih tahun ajaran dan kelas" }); return; }
    importMut.mutate(
      { academicYearId: yearId, classId, students: parsed },
      {
        onSuccess: (data) => {
          setResults(data);
          if (data.failed.length === 0) {
            notifications.show({ color: "green", message: `Berhasil: ${data.created} baru, ${data.updated} diperbarui` });
          } else {
            notifications.show({ color: "orange", message: `Selesai: ${data.success.length} berhasil, ${data.failed.length} gagal` });
          }
          setParsed([]);
        },
        onError: () => notifications.show({ color: "red", message: "Impor gagal" }),
      }
    );
  }

  const activeYears = (years.data?.data ?? []).filter((y) => y.isActive);
  const yearOptions = activeYears.map((y) => ({ value: y.id, label: y.year }));
  const classOptions = (classes.data?.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  function handleDownloadTemplate() {
    downloadTemplate("students", selectedFields);
    close();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Impor Siswa</Title>
        <Button variant="light" leftSection={<DownloadSimple size={16} />} onClick={open}>
          Unduh Template
        </Button>
      </Group>
      
      <Modal opened={opened} onClose={close} title="Pilih Kolom Templat" centered>
        <Stack>
          <Text size="sm" color="dimmed">Pilih kolom yang ingin disertakan dalam templat Excel.</Text>
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
          <Text fw={500}>1. Pilih Target Kelas</Text>
          <Group grow>
            <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={(v) => { setYearId(v); setClassId(null); }} placeholder="Pilih tahun ajaran" />
            <Select label="Kelas" data={classOptions} value={classId} onChange={setClassId} disabled={!yearId} placeholder="Pilih kelas" />
          </Group>

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
            <Text fw={500}>Pratinjau {parsed.length} data siswa:</Text>
            <Table striped highlightOnHover>
              <Table.Thead><Table.Tr><Table.Th>Nama Lengkap</Table.Th><Table.Th>NIS</Table.Th><Table.Th>L/P</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>{parsed.map((s, i) => (<Table.Tr key={i}><Table.Td>{s.namaSiswa}</Table.Td><Table.Td>{s.nis}</Table.Td><Table.Td>{s.gender}</Table.Td></Table.Tr>))}</Table.Tbody>
            </Table>
            <Center>
              <Button size="lg" loading={importMut.isPending} onClick={confirm} disabled={!yearId || !classId}>Konfirmasi Impor</Button>
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
                <Table.Thead><Table.Tr><Table.Th>Data (Nama Siswa)</Table.Th><Table.Th>Pesan Error</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {results.failed.map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{f.row.namaSiswa}</Table.Td>
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
