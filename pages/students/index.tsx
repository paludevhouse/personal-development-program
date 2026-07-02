import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Button, Checkbox, Group, Modal, Paper, Select, Stack, Table, Tabs, Text } from "@mantine/core";
import { MagnifyingGlass, UploadSimple, DownloadSimple, WarningOctagon, UsersThree } from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { PageHeader } from "@/components/PageHeader";
import { StateView } from "@/components/StateView";
import { LoadingView } from "@/components/LoadingView";
import { useStudents } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useDefaultYear } from "@/lib/hooks/useDefaultYear";
import { useUrlParams } from "@/lib/hooks/useUrlParams";
import { useAssignClass } from "@/lib/hooks/useAssignClass";
import { useBulkStatus } from "@/lib/hooks/useBulkStatus";
import { StudentStatus } from "@/lib/types";
import { buildRosterWorkbook } from "@/lib/excel/exportRoster";

export default function StudentsPage() {
  const years = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const yearsList = years.data.data ?? [];
  const activeYears = yearsList.filter((y) => y.isActive);
  useDefaultYear(activeYears, yearId, setYearId);
  const classes = useClasses(yearId ?? undefined);
  const [classId, setClassId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("aktif");
  const { query, update } = useStudents({ academicYearId: yearId ?? undefined, classId: classId ?? undefined });
  const { get, set, ready } = useUrlParams();
  const didAutoFetch = useRef(false);

  // Selection state for bulk-assign
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignClassId, setAssignClassId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const assignMut = useAssignClass();
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const bulkStatusMut = useBulkStatus();

  // Initialize filter state from URL once router is ready
  useEffect(() => {
    if (!ready) return;
    const urlYear = get("year");
    const urlClass = get("class");
    const urlStatus = get("status");
    if (urlYear) setYearId(urlYear);
    if (urlClass) setClassId(urlClass);
    if (urlStatus) {
      // Map legacy ?status=lulus/pindah URLs onto the Nonaktif tab
      setStatusFilter(urlStatus === "lulus" || urlStatus === "pindah" ? "nonaktif" : urlStatus);
    }
    // Auto-refetch once if filters are present in the URL
    if (!didAutoFetch.current && (urlYear || urlClass)) {
      didAutoFetch.current = true;
      setTimeout(() => query.refetch(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const yearOptions = activeYears.map((y) => ({ value: y.id, label: y.year }));
  const classOptions = (classes.data.data ?? []).map((c) => ({ value: c.id, label: c.name }));
  const rows = (query.data ?? []).filter((s) => {
    const status = s.status ?? "aktif";
    if (statusFilter === "all") return true;
    if (statusFilter === "nonaktif") return status === "lulus" || status === "pindah";
    return status === "aktif";
  });

  // Clear selection whenever rows change (filter/refetch)
  useEffect(() => { setSelectedIds(new Set()); }, [query.dataUpdatedAt]);

  const allSelected = rows.length > 0 && rows.every((s) => selectedIds.has(s.id));
  const someSelected = rows.some((s) => selectedIds.has(s.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((s) => s.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selectedCount = selectedIds.size;
  const assignClassName = classOptions.find((c) => c.value === assignClassId)?.label ?? "";
  const statusOptions = [
    { value: "aktif", label: "Aktif" },
    { value: "lulus", label: "Lulus" },
    { value: "pindah", label: "Pindah" },
  ];
  const bulkStatusLabel = statusOptions.find((o) => o.value === bulkStatus)?.label ?? "";

  function handleAssign() {
    if (!yearId || !assignClassId) return;
    assignMut.mutate(
      { academicYearId: yearId, classId: assignClassId, studentIds: Array.from(selectedIds), className: assignClassName },
      {
        onSuccess: (data) => {
          notifications.show({ color: "green", message: `Berhasil menetapkan ${data.count} siswa ke kelas ${assignClassName}` });
          setSelectedIds(new Set());
          setAssignClassId(null);
          setConfirmOpen(false);
          query.refetch();
        },
        onError: () => { notifications.show({ color: "red", message: "Gagal menetapkan kelas" }); setConfirmOpen(false); },
      }
    );
  }

  function handleBulkStatus() {
    if (!bulkStatus) return;
    bulkStatusMut.mutate(
      { studentIds: Array.from(selectedIds), status: bulkStatus as StudentStatus },
      {
        onSuccess: (data) => {
          notifications.show({ color: "green", message: `Status ${data.count} siswa diperbarui` });
          setSelectedIds(new Set());
          setBulkStatus(null);
          setStatusConfirmOpen(false);
          query.refetch();
        },
        onError: () => { notifications.show({ color: "red", message: "Gagal mengubah status" }); setStatusConfirmOpen(false); },
      }
    );
  }

  return (
    <Stack>
      <PageHeader />
      <Group>
        <Button component={Link} href="/students/import" variant="light" leftSection={<UploadSimple size={16} weight="bold" />}>Impor Excel</Button>
        <Button variant="light" disabled={!(query.data?.length)} onClick={() => XLSX.writeFile(buildRosterWorkbook(query.data ?? []), "daftar-siswa.xlsx")} leftSection={<DownloadSimple size={16} weight="bold" />}>Ekspor Excel</Button>
      </Group>
      <Group align="end">
        <Select
          label="Tahun Ajaran"
          data={yearOptions}
          value={yearId}
          onChange={(v) => { setYearId(v); setClassId(null); set({ year: v ?? null, class: null }); }}
          clearable
        />
        <Select
          label="Kelas"
          data={classOptions}
          value={classId}
          onChange={(v) => { setClassId(v); set({ class: v ?? null }); }}
          clearable
        />
        <Button
          onClick={() => { set({ year: yearId ?? null, class: classId ?? null, status: statusFilter }); query.refetch(); }}
          loading={query.isFetching}
          leftSection={<MagnifyingGlass size={16} weight="bold" />}
        >
          Cari
        </Button>
      </Group>
      <Tabs
        value={statusFilter}
        onChange={(v) => {
          const s = v ?? "aktif";
          setStatusFilter(s);
          set({ status: s });
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="aktif">Aktif</Tabs.Tab>
          <Tabs.Tab value="nonaktif">Nonaktif</Tabs.Tab>
          <Tabs.Tab value="all">Semua</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <Paper withBorder p="sm" radius="md">
          <Stack gap="sm">
            <Text size="sm" fw={500}>{selectedCount} siswa dipilih</Text>
            <Group align="flex-end">
              <Select
                label="Tetapkan ke Kelas"
                data={classOptions}
                value={assignClassId}
                onChange={setAssignClassId}
                placeholder="Pilih kelas"
                style={{ minWidth: 200 }}
              />
              <Button
                disabled={!yearId || !assignClassId}
                loading={assignMut.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                Terapkan
              </Button>
            </Group>
            <Group align="flex-end">
              <Select
                label="Ubah Status"
                data={statusOptions}
                value={bulkStatus}
                onChange={setBulkStatus}
                placeholder="Pilih status"
                style={{ minWidth: 200 }}
              />
              <Button
                disabled={!bulkStatus}
                loading={bulkStatusMut.isPending}
                onClick={() => setStatusConfirmOpen(true)}
              >
                Ubah Status
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Confirm modal: class assignment */}
      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Konfirmasi Penetapan Kelas"
        centered
      >
        <Stack>
          <Text>Tetapkan {selectedCount} siswa ke kelas <strong>{assignClassName}</strong>?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button loading={assignMut.isPending} onClick={handleAssign}>Terapkan</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm modal: bulk status change */}
      <Modal
        opened={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        title="Konfirmasi Ubah Status"
        centered
      >
        <Stack>
          <Text>Ubah status {selectedCount} siswa menjadi <strong>{bulkStatusLabel}</strong>?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setStatusConfirmOpen(false)}>Batal</Button>
            <Button loading={bulkStatusMut.isPending} onClick={handleBulkStatus}>Ubah Status</Button>
          </Group>
        </Stack>
      </Modal>

      {query.isFetching ? (
        <LoadingView />
      ) : query.isError ? (
        <StateView icon={<WarningOctagon size={44} weight="duotone" />} title="Gagal memuat data" description="Terjadi kesalahan saat mengambil data siswa." />
      ) : !query.isFetched ? (
        <StateView
          icon={<MagnifyingGlass size={44} weight="duotone" />}
          title="Mulai pencarian"
          description="Pilih tahun ajaran dan/atau kelas, lalu klik Cari."
          action={
            <Button
              leftSection={<MagnifyingGlass size={16} weight="bold" />}
              onClick={() => { set({ year: yearId ?? null, class: classId ?? null, status: statusFilter }); query.refetch(); }}
            >
              Cari Sekarang
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <StateView icon={<UsersThree size={44} weight="duotone" />} title="Tidak ada siswa" description="Tidak ada siswa yang cocok dengan filter ini." />
      ) : (
        <Table.ScrollContainer minWidth={1000} maxHeight="calc(100vh - 430px)">
          <Table stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    aria-label="Pilih semua"
                  />
                </Table.Th>
                <Table.Th>Nama</Table.Th>
                <Table.Th>NIS</Table.Th>
                <Table.Th>Kelas</Table.Th>
                <Table.Th>L/P</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((s) => (
                <Table.Tr key={s.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      aria-label={`Pilih ${s.namaSiswa}`}
                    />
                  </Table.Td>
                  <Table.Td>{s.namaSiswa}</Table.Td>
                  <Table.Td>{s.nis}</Table.Td>
                  <Table.Td>{s.className ?? "-"}</Table.Td>
                  <Table.Td>{s.gender}</Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      data={[{value:"aktif",label:"Aktif"},{value:"lulus",label:"Lulus"},{value:"pindah",label:"Pindah"}]}
                      value={s.status ?? "aktif"}
                      onChange={(v) => v && update.mutate({ ...s, status: v as StudentStatus }, {
                        onError: () => notifications.show({ color: "red", message: "Gagal mengubah status siswa" }),
                      })}
                    />
                  </Table.Td>
                  <Table.Td><Button component={Link} href={`/students/${s.id}`} size="xs" variant="light">Detail</Button></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
