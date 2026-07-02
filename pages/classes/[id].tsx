import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Anchor, Badge, Button, Group, Modal, MultiSelect, Stack, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { ArrowLeft, UsersThree, WarningOctagon } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingView } from "@/components/LoadingView";
import { StateView } from "@/components/StateView";
import { useClass } from "@/lib/hooks/useClass";
import { useClassRoster } from "@/lib/hooks/useClassRoster";
import { useRemoveFromClass } from "@/lib/hooks/useRemoveFromClass";
import { useAssignClass } from "@/lib/hooks/useAssignClass";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { Student } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  aktif: "Aktif",
  lulus: "Lulus",
  pindah: "Pindah",
};

const STATUS_COLORS: Record<string, string> = {
  aktif: "green",
  lulus: "gray",
  pindah: "gray",
};

export default function ClassRosterPage() {
  const { query: { id } } = useRouter();
  const classId = id as string | undefined;

  const cls = useClass(classId);
  const roster = useClassRoster(classId);
  const years = useAcademicYears();
  const studentList = useStudentList();
  const removeMut = useRemoveFromClass();
  const assignMut = useAssignClass();

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);

  const yearLabel = useMemo(() => {
    const y = years.data.data?.find((y) => y.id === cls.data?.academicYearId);
    return y?.year ?? "-";
  }, [years.data.data, cls.data?.academicYearId]);

  const rosterIds = useMemo(() => new Set((roster.data ?? []).map((s) => s.id)), [roster.data]);

  const addOptions = useMemo(() => {
    return (studentList.data ?? [])
      .filter((s) => !rosterIds.has(s.id))
      .map((s) => ({
        value: s.id,
        label: `${s.namaSiswa} — ${s.nis}${s.className ? ` (${s.className})` : ""}`,
      }));
  }, [studentList.data, rosterIds]);

  function handleAdd() {
    if (!cls.data || selectedIds.length === 0) return;
    assignMut.mutate(
      { academicYearId: cls.data.academicYearId, classId: cls.data.id, studentIds: selectedIds, className: cls.data.name },
      {
        onSuccess: (data) => {
          notifications.show({ color: "green", message: `Menambahkan ${data.count} siswa` });
          setSelectedIds([]);
          closeAdd();
          roster.refetch();
        },
        onError: () => notifications.show({ color: "red", message: "Gagal menambahkan siswa" }),
      }
    );
  }

  function handleRemove() {
    if (!removeTarget || !classId) return;
    removeMut.mutate(
      { studentId: removeTarget.id, classId },
      {
        onSuccess: () => {
          notifications.show({ color: "green", message: `${removeTarget.namaSiswa} dikeluarkan dari kelas` });
          setRemoveTarget(null);
        },
        onError: () => notifications.show({ color: "red", message: "Gagal mengeluarkan siswa" }),
      }
    );
  }

  return (
    <Stack>
      <PageHeader />

      <Anchor component={Link} href="/classes" size="sm" c="dimmed">
        <Group gap={4}>
          <ArrowLeft size={14} />
          Kembali ke daftar kelas
        </Group>
      </Anchor>

      {cls.isLoading ? (
        <LoadingView />
      ) : cls.isError ? (
        <StateView
          icon={<WarningOctagon size={44} weight="duotone" />}
          title="Gagal memuat data kelas"
          description="Terjadi kesalahan saat mengambil data. Muat ulang halaman."
        />
      ) : cls.data ? (
        <Group justify="space-between" wrap="wrap" align="flex-start">
          <Stack gap={2}>
            <Title order={3}>{cls.data.name}</Title>
            <Text size="sm" c="dimmed">Wali Kelas: {cls.data.waliKelas || "-"}</Text>
            <Text size="sm" c="dimmed">Tahun Ajaran: {yearLabel}</Text>
          </Stack>
          <Group gap="xs">
            <Badge size="lg" variant="light">{(roster.data ?? []).length} siswa</Badge>
            <Button onClick={openAdd}>Tambah Siswa</Button>
          </Group>
        </Group>
      ) : null}

      {roster.isLoading ? (
        <LoadingView />
      ) : roster.isError ? (
        <StateView
          icon={<WarningOctagon size={44} weight="duotone" />}
          title="Gagal memuat daftar siswa"
          description="Terjadi kesalahan saat mengambil data siswa."
        />
      ) : !roster.data || roster.data.length === 0 ? (
        <StateView
          icon={<UsersThree size={44} weight="duotone" />}
          title="Belum ada siswa"
          description="Tambahkan siswa ke kelas ini menggunakan tombol Tambah Siswa."
        />
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama</Table.Th>
                <Table.Th>NIS</Table.Th>
                <Table.Th>L/P</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {roster.data.map((s) => (
                <Table.Tr key={s.id}>
                  <Table.Td>{s.namaSiswa}</Table.Td>
                  <Table.Td>{s.nis}</Table.Td>
                  <Table.Td>{s.gender}</Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[s.status] ?? "gray"}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" color="red" variant="light" onClick={() => setRemoveTarget(s)}>
                      Keluarkan
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {/* Tambah Siswa modal */}
      <Modal opened={addOpened} onClose={closeAdd} title="Tambah Siswa" centered>
        <Stack>
          <MultiSelect
            label="Siswa"
            placeholder="Cari nama atau NIS"
            data={addOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            searchable
            nothingFoundMessage="Tidak ditemukan"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeAdd} disabled={assignMut.isPending}>Batal</Button>
            <Button
              onClick={handleAdd}
              loading={assignMut.isPending}
              disabled={selectedIds.length === 0}
            >
              Tambahkan
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm remove modal */}
      <Modal opened={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Keluarkan Siswa" centered>
        <Stack>
          <Text>Keluarkan {removeTarget?.namaSiswa} dari kelas ini?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRemoveTarget(null)} disabled={removeMut.isPending}>Batal</Button>
            <Button color="red" onClick={handleRemove} loading={removeMut.isPending}>Keluarkan</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
