import Link from "next/link";
import { useRouter } from "next/router";
import { Anchor, Badge, Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import { ArrowLeft, BookOpen, Briefcase, ChatCircleText, UsersThree, WarningOctagon } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingView } from "@/components/LoadingView";
import { StateView } from "@/components/StateView";
import { useStudent } from "@/lib/hooks/useStudent";
import { useEnrollments } from "@/lib/hooks/useEnrollments";
import { useStudentInternships } from "@/lib/hooks/useInternships";
import { useCounseling } from "@/lib/hooks/useCounseling";
import { useWawancara } from "@/lib/hooks/useWawancara";
import { formatDate, formatDateTime } from "@/lib/utils/date";

const STATUS_LABELS: Record<string, string> = {
  aktif: "Aktif",
  lulus: "Lulus",
  pindah: "Pindah",
};

const STATUS_COLORS: Record<string, string> = {
  aktif: "green",
  lulus: "blue",
  pindah: "orange",
};

export default function StudentDetailPage() {
  const { query: { id } } = useRouter();
  const studentId = id as string | undefined;

  const student = useStudent(studentId);
  const enrollments = useEnrollments(studentId);
  const internships = useStudentInternships(studentId);
  const counseling = useCounseling(studentId);
  const wawancara = useWawancara(studentId);

  const s = student.data;

  return (
    <Stack>
      <PageHeader />

      <Anchor component={Link} href="/students" size="sm" c="dimmed">
        <Group gap={4}>
          <ArrowLeft size={14} />
          Kembali ke daftar siswa
        </Group>
      </Anchor>

      {/* Student info card */}
      {student.isLoading ? (
        <LoadingView />
      ) : student.isError ? (
        <StateView
          icon={<WarningOctagon size={44} weight="duotone" />}
          title="Gagal memuat data siswa"
          description="Terjadi kesalahan saat mengambil data. Muat ulang halaman."
        />
      ) : s ? (
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap">
            <Stack gap={2}>
              <Title order={3}>{s.namaSiswa}</Title>
              <Text size="sm" c="dimmed">NIS: {s.nis}</Text>
              <Text size="sm" c="dimmed">L/P: {s.gender}</Text>
            </Stack>
            <Badge color={STATUS_COLORS[s.status] ?? "gray"} size="lg">
              {STATUS_LABELS[s.status] ?? s.status}
            </Badge>
          </Group>
        </Card>
      ) : null}

      {/* Kelas (Enrollments) */}
      <Stack gap="xs">
        <Title order={4}>Riwayat Kelas</Title>
        {enrollments.isLoading ? (
          <LoadingView />
        ) : enrollments.isError ? (
          <StateView
            icon={<WarningOctagon size={44} weight="duotone" />}
            title="Gagal memuat riwayat kelas"
            description="Terjadi kesalahan saat mengambil data kelas."
          />
        ) : !enrollments.data || enrollments.data.length === 0 ? (
          <StateView
            icon={<BookOpen size={44} weight="duotone" />}
            title="Belum ada data kelas"
            description="Siswa ini belum memiliki riwayat kelas."
          />
        ) : (
          <Table.ScrollContainer minWidth={400}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tahun Ajaran</Table.Th>
                  <Table.Th>Kelas</Table.Th>
                  <Table.Th>Wali Kelas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {enrollments.data.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>{e.academicYear}</Table.Td>
                    <Table.Td>{e.className}</Table.Td>
                    <Table.Td>{e.waliKelas}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>

      {/* Magang (Internships) */}
      <Stack gap="xs">
        <Title order={4}>Riwayat Magang</Title>
        {internships.isLoading ? (
          <LoadingView />
        ) : internships.isError ? (
          <StateView
            icon={<WarningOctagon size={44} weight="duotone" />}
            title="Gagal memuat riwayat magang"
            description="Terjadi kesalahan saat mengambil data magang."
          />
        ) : !internships.data || internships.data.length === 0 ? (
          <StateView
            icon={<Briefcase size={44} weight="duotone" />}
            title="Belum ada data magang"
            description="Siswa ini belum memiliki riwayat magang."
          />
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Lokasi</Table.Th>
                  <Table.Th>Posisi</Table.Th>
                  <Table.Th>Pembimbing</Table.Th>
                  <Table.Th>Nilai</Table.Th>
                  <Table.Th>Kategori</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Tanggal</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {internships.data.map((i) => (
                  <Table.Tr key={i.id}>
                    <Table.Td>{i.lokasiMagang}</Table.Td>
                    <Table.Td>{i.posisi}</Table.Td>
                    <Table.Td>{i.pembimbing}</Table.Td>
                    <Table.Td>{i.nilaiAkhir != null ? i.nilaiAkhir.toFixed(2) : "-"}</Table.Td>
                    <Table.Td>{i.kategori ?? "-"}</Table.Td>
                    <Table.Td>
                      <Badge color={i.status === "graded" ? "green" : "gray"}>
                        {i.status === "graded" ? "Dinilai" : "Menunggu"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(i.tanggal)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>

      {/* Konseling */}
      <Stack gap="xs">
        <Title order={4}>Riwayat Konseling</Title>
        {counseling.data.isLoading ? (
          <LoadingView />
        ) : counseling.data.isError ? (
          <StateView
            icon={<WarningOctagon size={44} weight="duotone" />}
            title="Gagal memuat riwayat konseling"
            description="Terjadi kesalahan saat mengambil data konseling."
          />
        ) : !counseling.data.data || counseling.data.data.length === 0 ? (
          <StateView
            icon={<ChatCircleText size={44} weight="duotone" />}
            title="Belum ada data konseling"
            description="Siswa ini belum memiliki riwayat konseling."
          />
        ) : (
          <Table.ScrollContainer minWidth={500}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tanggal</Table.Th>
                  <Table.Th>Kategori</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Catatan</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {counseling.data.data.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>{formatDateTime(c.date)}</Table.Td>
                    <Table.Td>{c.category}</Table.Td>
                    <Table.Td>
                      <Badge color={c.status === "selesai" ? "green" : "gray"}>
                        {c.status === "selesai" ? "Selesai" : "Open"}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.notes}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>

      {/* Wawancara Penjurusan */}
      <Stack gap="xs">
        <Title order={4}>Riwayat Wawancara Penjurusan</Title>
        {wawancara.data.isLoading ? (
          <LoadingView />
        ) : wawancara.data.isError ? (
          <StateView
            icon={<WarningOctagon size={44} weight="duotone" />}
            title="Gagal memuat riwayat wawancara"
            description="Terjadi kesalahan saat mengambil data wawancara."
          />
        ) : !wawancara.data.data || wawancara.data.data.length === 0 ? (
          <StateView
            icon={<UsersThree size={44} weight="duotone" />}
            title="Belum ada data wawancara"
            description="Siswa ini belum memiliki riwayat wawancara penjurusan."
          />
        ) : (
          <Table.ScrollContainer minWidth={500}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tanggal</Table.Th>
                  <Table.Th>Jurusan</Table.Th>
                  <Table.Th>Pewawancara</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {wawancara.data.data.map((w) => (
                  <Table.Tr key={w.id}>
                    <Table.Td>{formatDateTime(w.date)}</Table.Td>
                    <Table.Td>{w.jurusan}</Table.Td>
                    <Table.Td>{w.pewawancara}</Table.Td>
                    <Table.Td>
                      <Badge color={w.status === "selesai" ? "green" : "blue"}>
                        {w.status === "selesai" ? "Selesai" : "Dijadwalkan"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </Stack>
  );
}
