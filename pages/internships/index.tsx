import { useState } from "react";
import { Button, CopyButton, Group, Select, Stack, Table, TextInput, Title, Badge } from "@mantine/core";
import { useInternships } from "@/lib/hooks/useInternships";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useStudents } from "@/lib/hooks/useStudents";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";

export default function InternshipsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  useDefaultYear(years.data.data ?? [], yearId, setYearId);
  const { data, create, remove } = useInternships(yearId ?? undefined);
  const studentsHook = useStudents({ academicYearId: yearId ?? undefined });
  const [studentId, setStudentId] = useState<string | null>(null);
  const [lokasi, setLokasi] = useState(""); const [posisi, setPosisi] = useState(""); const [pembimbing, setPembimbing] = useState("");

  const yearOptions = (years.data.data ?? []).map((y) => ({ value: y.id, label: `${y.year} - ${y.semester}` }));
  const studentOptions = (studentsHook.query.data ?? []).map((s) => ({ value: s.id, label: s.namaSiswa }));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Stack>
      <Title order={2}>Magang</Title>
      <Group align="end">
        <Select label="Tahun Ajaran" data={yearOptions} value={yearId} onChange={setYearId} />
        <Button variant="light" onClick={() => studentsHook.query.refetch()}>Muat Siswa</Button>
        <Select label="Siswa" data={studentOptions} value={studentId} onChange={setStudentId} searchable />
        <TextInput label="Lokasi Magang" value={lokasi} onChange={(e) => setLokasi(e.currentTarget.value)} />
        <TextInput label="Posisi" value={posisi} onChange={(e) => setPosisi(e.currentTarget.value)} />
        <TextInput label="Pembimbing" value={pembimbing} onChange={(e) => setPembimbing(e.currentTarget.value)} />
        <Button disabled={!yearId || !studentId} onClick={() => create.mutate({ academicYearId: yearId!, studentId: studentId!, lokasiMagang: lokasi, posisi, pembimbing })}>Tambah Penempatan</Button>
      </Group>
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
                <Table.Td><CopyButton value={link}>{({ copied, copy }) => <Button size="xs" variant="light" onClick={copy}>{copied ? "Tersalin" : "Salin Link"}</Button>}</CopyButton></Table.Td>
                <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove.mutate(it.id)}>Hapus</Button></Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
