import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Anchor, Autocomplete, Badge, Button, Group, Modal, Select, SegmentedControl, Stack, Table, Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { ArrowLeft, WarningOctagon, ArrowsClockwise } from "@phosphor-icons/react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingView } from "@/components/LoadingView";
import { StateView } from "@/components/StateView";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useClasses } from "@/lib/hooks/useClasses";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { usePromote, PromoteMapping } from "@/lib/hooks/usePromote";

type Action = "move" | "graduate" | "";

interface RowState {
  action: Action;
  targetClassName: string;
}

export default function PromoteClassesPage() {
  const router = useRouter();
  const years = useAcademicYears();
  const studentList = useStudentList();
  const promoteMut = usePromote();

  const [sourceYearId, setSourceYearId] = useState<string | null>(null);
  const [targetYearId, setTargetYearId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const sourceClasses = useClasses(sourceYearId ?? undefined);
  const targetClasses = useClasses(targetYearId ?? undefined);

  const yearOptions = (years.data.data ?? []).map((y) => ({ value: y.id, label: y.year }));
  const targetYearOptions = yearOptions.filter((y) => y.value !== sourceYearId);

  const targetClassNames = useMemo(
    () => (targetClasses.data.data ?? []).map((c) => c.name),
    [targetClasses.data.data]
  );

  const aktifCountByClass = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of studentList.data ?? []) {
      if (s.status === "aktif" && s.classId) {
        counts.set(s.classId, (counts.get(s.classId) ?? 0) + 1);
      }
    }
    return counts;
  }, [studentList.data]);

  function setRow(classId: string, patch: Partial<RowState>) {
    setRows((prev) => {
      const current: RowState = prev[classId] ?? { action: "", targetClassName: "" };
      const merged: RowState = Object.assign({}, current, patch);
      return { ...prev, [classId]: merged };
    });
  }

  const configuredMappings: PromoteMapping[] = useMemo(() => {
    const list: PromoteMapping[] = [];
    for (const [sourceClassId, row] of Object.entries(rows)) {
      if (row.action === "move" && row.targetClassName.trim()) {
        list.push({ sourceClassId, action: "move", targetClassName: row.targetClassName.trim() });
      } else if (row.action === "graduate") {
        list.push({ sourceClassId, action: "graduate" });
      }
    }
    return list;
  }, [rows]);

  const moveCount = configuredMappings.filter((m) => m.action === "move").length;
  const graduateCount = configuredMappings.filter((m) => m.action === "graduate").length;

  const canSubmit = !!sourceYearId && !!targetYearId && configuredMappings.length > 0;

  const targetYearLabel = yearOptions.find((y) => y.value === targetYearId)?.label ?? "";

  function handleSubmit() {
    if (!sourceYearId || !targetYearId) return;
    promoteMut.mutate(
      { sourceYearId, targetYearId, mappings: configuredMappings },
      {
        onSuccess: (data) => {
          notifications.show({
            color: "green",
            message: `${data.promoted} siswa dinaikkan, ${data.graduated} diluluskan`,
          });
          closeConfirm();
          router.push(`/classes?year=${targetYearId}`);
        },
        onError: () => {
          notifications.show({ color: "red", message: "Gagal menjalankan promosi kelas" });
        },
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

      <Group align="end">
        <Select
          label="Tahun Asal"
          placeholder="Pilih tahun ajaran"
          data={yearOptions}
          value={sourceYearId}
          onChange={(v) => { setSourceYearId(v); setRows({}); }}
        />
        <Select
          label="Tahun Tujuan"
          placeholder="Pilih tahun ajaran"
          data={targetYearOptions}
          value={targetYearId}
          onChange={setTargetYearId}
        />
      </Group>

      {targetYearId && targetClasses.data.isSuccess && (targetClasses.data.data ?? []).length === 0 && (
        <Text size="sm" c="dimmed">
          Tahun tujuan belum memiliki kelas. Kelas baru akan dibuat otomatis sesuai nama yang diisi.
        </Text>
      )}

      {!sourceYearId ? (
        <StateView
          icon={<ArrowsClockwise size={44} weight="duotone" />}
          title="Pilih tahun ajaran"
          description="Pilih tahun asal dan tahun tujuan untuk mulai memetakan kelas."
        />
      ) : sourceClasses.data.isLoading ? (
        <LoadingView />
      ) : sourceClasses.data.isError ? (
        <StateView
          icon={<WarningOctagon size={44} weight="duotone" />}
          title="Gagal memuat data kelas"
          description="Terjadi kesalahan saat mengambil data. Muat ulang halaman."
        />
      ) : (sourceClasses.data.data ?? []).length === 0 ? (
        <StateView
          icon={<ArrowsClockwise size={44} weight="duotone" />}
          title="Belum ada kelas"
          description="Tahun ajaran ini belum memiliki kelas untuk dipetakan."
        />
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Kelas</Table.Th>
                <Table.Th>Aksi</Table.Th>
                <Table.Th>Kelas Tujuan</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(sourceClasses.data.data ?? []).map((c) => {
                const row = rows[c.id] ?? { action: "", targetClassName: "" };
                const aktifCount = aktifCountByClass.get(c.id) ?? 0;
                return (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <Text>{c.name}</Text>
                        <Badge variant="light" color="brand">{aktifCount} aktif</Badge>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <SegmentedControl
                        value={row.action || undefined}
                        onChange={(v) => setRow(c.id, {
                          action: v as Action,
                          targetClassName: v === "move" && !row.targetClassName ? c.name : row.targetClassName,
                        })}
                        data={[
                          { label: "Naik Kelas", value: "move" },
                          { label: "Luluskan", value: "graduate" },
                        ]}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Autocomplete
                        placeholder="Nama kelas tujuan"
                        data={targetClassNames}
                        value={row.action === "move" ? row.targetClassName : ""}
                        onChange={(v) => setRow(c.id, { targetClassName: v })}
                        disabled={row.action !== "move" || !targetYearId}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Group justify="flex-end">
        <Button onClick={openConfirm} disabled={!canSubmit}>
          Jalankan Promosi
        </Button>
      </Group>

      <Modal opened={confirmOpened} onClose={closeConfirm} title="Konfirmasi Promosi Kelas" centered>
        <Stack>
          <Text>
            {moveCount} kelas dinaikkan, {graduateCount} kelas diluluskan. Tahun {targetYearLabel} akan menjadi aktif.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirm} disabled={promoteMut.isPending}>Batal</Button>
            <Button onClick={handleSubmit} loading={promoteMut.isPending}>Jalankan</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
