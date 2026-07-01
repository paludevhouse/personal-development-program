import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { DateInput } from "@mantine/dates";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { CRITERIA } from "@/lib/internship/grade";
import { InternshipRatings, Rating } from "@/lib/types";
import { useGrade, GradeItem } from "@/lib/hooks/useGrade";
import { useDraftStore } from "@/lib/store/draftStore";
import type { NextPageWithLayout } from "@/pages/_app";

const RATING_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
];

/** Full label options for mobile cards */
const RATING_OPTIONS_FULL = [
  { value: "A", label: "A (Sangat Baik)" },
  { value: "B", label: "B (Baik)" },
  { value: "C", label: "C (Cukup)" },
];

/** Guard against invalid date strings (e.g. "Surabaya, 4 Mei 2026") */
function toDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

interface GradeStudentProps {
  item: GradeItem;
  submit: ReturnType<typeof useGrade>["submit"];
  onGraded: () => void;
  token: string;
  mode: "card" | "row";
}

/** Shared logic hook extracted so both card and table-row renderers can use it */
function useStudentGradeState(
  item: GradeItem,
  token: string,
  submit: ReturnType<typeof useGrade>["submit"],
  onGraded: () => void
) {
  const [ratings, setRatings] = useState<Partial<InternshipRatings>>({});
  const [studentName, setStudentName] = useState(item.studentName ?? "");
  const [lokasiMagang, setLokasiMagang] = useState(item.lokasiMagang ?? "");
  const [posisi, setPosisi] = useState(item.posisi ?? "");
  const [pembimbing, setPembimbing] = useState(item.pembimbing ?? "");
  const [phone, setPhone] = useState(item.phone ?? "");
  const [tanggal, setTanggal] = useState(item.tanggal ?? "");
  const [error, setError] = useState("");
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const draftKey = `grade-draft:${token}:${item.id}`;

  // Restore draft from store on mount (non-graded only)
  useEffect(() => {
    if (item.status === "graded") return;
    const d = useDraftStore.getState().getDraft(draftKey);
    if (d) {
      if (d.studentName != null) setStudentName(d.studentName as string);
      if (d.lokasiMagang != null) setLokasiMagang(d.lokasiMagang as string);
      if (d.posisi != null) setPosisi(d.posisi as string);
      if (d.pembimbing != null) setPembimbing(d.pembimbing as string);
      if (d.phone != null) setPhone(d.phone as string);
      if (d.tanggal != null) setTanggal(d.tanggal as string);
      if (d.ratings) setRatings(d.ratings as Partial<InternshipRatings>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft to store on change (non-graded only)
  useEffect(() => {
    if (item.status === "graded") return;
    useDraftStore.getState().setDraft(draftKey, { studentName, lokasiMagang, posisi, pembimbing, phone, tanggal, ratings });
  }, [studentName, lokasiMagang, posisi, pembimbing, phone, tanggal, ratings, item.status, draftKey]);

  // NOTE: do NOT re-seed from `item` on change — it would overwrite the
  // restored draft and clobber in-progress input on every refetch. Initial
  // state comes from the useState initializers above; the draft (if any)
  // overrides it on mount. Graded items early-return to the read-only view
  // below regardless of form state.

  function validate(): string {
    const missing: string[] = [];
    if (!studentName) missing.push("Nama Siswa");
    if (!lokasiMagang) missing.push("Lokasi Magang");
    if (!posisi) missing.push("Posisi");
    if (!pembimbing) missing.push("Pembimbing");
    const missingCriteria = CRITERIA.filter((c) => !ratings[c.key]);
    if (missingCriteria.length > 0) missing.push("semua kriteria penilaian");
    if (missing.length > 0) {
      return `Lengkapi: ${missing.join(", ")}.`;
    }
    return "";
  }

  function handleSubmitClick() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    openConfirm();
  }

  function handleConfirm() {
    submit.mutate(
      {
        internshipId: item.id,
        ratings: ratings as InternshipRatings,
        studentName,
        lokasiMagang,
        posisi,
        pembimbing,
        phone,
        tanggal,
      },
      {
        onSuccess: () => {
          useDraftStore.getState().clearDraft(draftKey);
          closeConfirm();
          onGraded();
        },
        onError: (e) => {
          closeConfirm();
          if (axios.isAxiosError(e) && e.response?.status === 409) {
            setError("Penilaian sudah dikirim sebelumnya");
            onGraded();
          } else {
            setError("Gagal mengirim penilaian. Coba lagi.");
          }
        },
      }
    );
  }

  return {
    ratings, setRatings,
    studentName, setStudentName,
    lokasiMagang, setLokasiMagang,
    posisi, setPosisi,
    pembimbing, setPembimbing,
    phone, setPhone,
    tanggal, setTanggal,
    error,
    confirmOpened, openConfirm, closeConfirm,
    handleSubmitClick, handleConfirm,
  };
}

/** Placement fields shared between card and table-row detail panel */
function PlacementFields({
  studentName, setStudentName,
  lokasiMagang, setLokasiMagang,
  posisi, setPosisi,
  pembimbing, setPembimbing,
  phone, setPhone,
  tanggal, setTanggal,
}: {
  studentName: string; setStudentName: (v: string) => void;
  lokasiMagang: string; setLokasiMagang: (v: string) => void;
  posisi: string; setPosisi: (v: string) => void;
  pembimbing: string; setPembimbing: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  tanggal: string; setTanggal: (v: string) => void;
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
      <TextInput label="Nama Siswa" value={studentName} onChange={(e) => setStudentName(e.currentTarget.value)} size="sm" />
      <TextInput label="Lokasi Magang" value={lokasiMagang} onChange={(e) => setLokasiMagang(e.currentTarget.value)} size="sm" />
      <TextInput label="Posisi" value={posisi} onChange={(e) => setPosisi(e.currentTarget.value)} size="sm" />
      <TextInput label="Pembimbing (PIC)" value={pembimbing} onChange={(e) => setPembimbing(e.currentTarget.value)} size="sm" />
      <TextInput label="No. Telepon" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} size="sm" />
      <DateInput
        label="Tanggal"
        value={toDate(tanggal)}
        onChange={(d) => setTanggal(d ? d.toISOString().slice(0, 10) : "")}
        size="sm"
      />
    </SimpleGrid>
  );
}

/** Confirm modal shared */
function ConfirmModal({
  opened, onClose, onConfirm, loading,
}: {
  opened: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Konfirmasi Penilaian" centered>
      <Stack gap="md">
        <Text size="sm">
          Pastikan semua data dan nilai sudah benar. Setelah dikirim, penilaian{" "}
          <strong>tidak dapat diubah</strong> lagi.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Batal</Button>
          <Button loading={loading} onClick={onConfirm}>Kirim</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/** Mobile card renderer for one student */
function GradeStudentCard({ item, submit, onGraded, token }: Omit<GradeStudentProps, "mode">) {
  const s = useStudentGradeState(item, token, submit, onGraded);

  if (item.status === "graded") {
    return (
      <Card withBorder radius="md" p="sm">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>{item.studentName || "(Nama belum diisi)"}</Text>
          <Badge color="green" size="sm">Sudah Dinilai</Badge>
        </Group>
        <Text size="sm"><strong>Nilai Akhir:</strong> {item.nilaiAkhir?.toFixed(2) ?? "-"}</Text>
        <Text size="sm"><strong>Kategori:</strong> {item.kategori ?? "-"}</Text>
      </Card>
    );
  }

  return (
    <>
      <ConfirmModal
        opened={s.confirmOpened}
        onClose={s.closeConfirm}
        onConfirm={s.handleConfirm}
        loading={submit.isPending}
      />
      <Card withBorder radius="md" p="sm">
        <Group justify="space-between" mb="sm">
          <Text fw={600}>{item.studentName || "(Nama belum diisi)"}</Text>
          <Badge color="orange" size="sm">Belum Dinilai</Badge>
        </Group>
        <Stack gap="xs">
          <PlacementFields
            studentName={s.studentName} setStudentName={s.setStudentName}
            lokasiMagang={s.lokasiMagang} setLokasiMagang={s.setLokasiMagang}
            posisi={s.posisi} setPosisi={s.setPosisi}
            pembimbing={s.pembimbing} setPembimbing={s.setPembimbing}
            phone={s.phone} setPhone={s.setPhone}
            tanggal={s.tanggal} setTanggal={s.setTanggal}
          />
          <Divider label="Kriteria Penilaian" labelPosition="left" mt="xs" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {CRITERIA.map((c) => (
              <Select
                key={c.key}
                label={c.label}
                data={RATING_OPTIONS_FULL}
                value={s.ratings[c.key] ?? null}
                onChange={(v) => s.setRatings((p) => ({ ...p, [c.key]: v as Rating }))}
                size="sm"
              />
            ))}
          </SimpleGrid>
          {s.error && <Text c="red" size="sm">{s.error}</Text>}
          <Group justify="flex-end">
            <Button size="sm" onClick={s.handleSubmitClick}>Kirim Penilaian</Button>
          </Group>
        </Stack>
      </Card>
    </>
  );
}

/** Desktop table row renderer for one student — includes criteria Selects + expandable placement detail */
function GradeStudentTableRow({ item, submit, onGraded, token }: Omit<GradeStudentProps, "mode">) {
  const s = useStudentGradeState(item, token, submit, onGraded);
  const [detailOpened, { toggle: toggleDetail }] = useDisclosure(false);

  if (item.status === "graded") {
    return (
      <>
        <Table.Tr style={{ backgroundColor: "var(--mantine-color-green-0)" }}>
          <Table.Td>
            <Text size="sm" fw={500}>{item.studentName || "(Nama belum diisi)"}</Text>
          </Table.Td>
          {CRITERIA.map((c) => (
            <Table.Td key={c.key} ta="center">
              <Text size="sm" c="dimmed">-</Text>
            </Table.Td>
          ))}
          <Table.Td>
            <Badge color="green" size="sm">Sudah Dinilai</Badge>
          </Table.Td>
          <Table.Td ta="center">
            <Text size="xs" c="dimmed">
              {item.nilaiAkhir?.toFixed(2) ?? "-"}
            </Text>
          </Table.Td>
        </Table.Tr>
      </>
    );
  }

  return (
    <>
      <ConfirmModal
        opened={s.confirmOpened}
        onClose={s.closeConfirm}
        onConfirm={s.handleConfirm}
        loading={submit.isPending}
      />
      <Table.Tr>
        <Table.Td style={{ minWidth: 140 }}>
          <Stack gap={4}>
            <Text size="sm" fw={500}>{item.studentName || "(Nama belum diisi)"}</Text>
            <Tooltip label={detailOpened ? "Sembunyikan detail" : "Edit data penempatan"} withArrow>
              <ActionIcon
                variant="subtle"
                size="xs"
                color="gray"
                onClick={toggleDetail}
                aria-label="Toggle detail"
              >
                {detailOpened ? <CaretUp size={14} /> : <CaretDown size={14} />}
              </ActionIcon>
            </Tooltip>
          </Stack>
        </Table.Td>
        {CRITERIA.map((c) => (
          <Table.Td key={c.key} style={{ minWidth: 72 }}>
            <Select
              data={RATING_OPTIONS}
              value={s.ratings[c.key] ?? null}
              onChange={(v) => s.setRatings((p) => ({ ...p, [c.key]: v as Rating }))}
              size="xs"
              styles={{ input: { textAlign: "center", paddingLeft: 4, paddingRight: 20 } }}
              aria-label={c.label}
            />
          </Table.Td>
        ))}
        <Table.Td>
          <Badge color="orange" size="sm">Belum</Badge>
        </Table.Td>
        <Table.Td style={{ minWidth: 90 }}>
          <Stack gap={4}>
            <Button size="xs" onClick={s.handleSubmitClick}>Kirim</Button>
            {s.error && (
              <Text c="red" size="xs" style={{ maxWidth: 90 }}>{s.error}</Text>
            )}
          </Stack>
        </Table.Td>
      </Table.Tr>
      {/* Detail expand row for placement fields */}
      <Table.Tr style={{ padding: 0 }}>
        <Table.Td colSpan={CRITERIA.length + 3} style={{ padding: 0, border: "none" }}>
          <Collapse in={detailOpened}>
            <Paper p="sm" m="xs" withBorder radius="sm">
              <Text size="xs" fw={600} mb="xs" c="dimmed">Data Penempatan</Text>
              <PlacementFields
                studentName={s.studentName} setStudentName={s.setStudentName}
                lokasiMagang={s.lokasiMagang} setLokasiMagang={s.setLokasiMagang}
                posisi={s.posisi} setPosisi={s.setPosisi}
                pembimbing={s.pembimbing} setPembimbing={s.setPembimbing}
                phone={s.phone} setPhone={s.setPhone}
                tanggal={s.tanggal} setTanggal={s.setTanggal}
              />
            </Paper>
          </Collapse>
        </Table.Td>
      </Table.Tr>
    </>
  );
}

function GradeStudent({ item, submit, onGraded, token, mode }: GradeStudentProps) {
  if (mode === "row") {
    return <GradeStudentTableRow item={item} submit={submit} onGraded={onGraded} token={token} />;
  }
  return <GradeStudentCard item={item} submit={submit} onGraded={onGraded} token={token} />;
}

interface MassGradingPanelProps {
  items: GradeItem[];
  submit: ReturnType<typeof useGrade>["submit"];
  onDone: () => void;
}

function MassGradingPanel({ items, submit, onDone }: MassGradingPanelProps) {
  const pendingItems = items.filter((i) => i.status !== "graded");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [massRatings, setMassRatings] = useState<Partial<InternshipRatings>>({});
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allSelected =
    pendingItems.length > 0 && selectedIds.length === pendingItems.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const allCriteriaFilled = CRITERIA.every((c) => !!massRatings[c.key]);
  const canSubmit = selectedIds.length > 0 && allCriteriaFilled;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingItems.map((i) => i.id));
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmitClick() {
    if (!canSubmit) return;
    setError("");
    openConfirm();
  }

  async function handleConfirm() {
    closeConfirm();
    setLoading(true);
    let successCount = 0;

    // Look up items by id at submit time from the prop (server data)
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));

    for (const item of selectedItems) {
      try {
        await submit.mutateAsync({
          internshipId: item.id,
          ratings: massRatings as InternshipRatings,
          studentName: item.studentName,
          lokasiMagang: item.lokasiMagang,
          posisi: item.posisi,
          pembimbing: item.pembimbing,
          phone: item.phone,
          tanggal: item.tanggal,
        });
        successCount++;
      } catch (e) {
        // Skip 409 (already graded) — treat as success for counting purposes
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          successCount++;
        }
        // Other errors: skip this student and continue
      }
    }

    setLoading(false);
    await onDone();
    setSelectedIds([]);
    setMassRatings({});
    notifications.show({
      color: "green",
      title: "Penilaian Massal Berhasil",
      message: `Berhasil menilai ${successCount} siswa`,
    });
  }

  if (pendingItems.length === 0) return null;

  return (
    <>
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Konfirmasi Penilaian Massal"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Menilai <strong>{selectedIds.length} siswa</strong> dengan nilai yang sama.
            Setelah dikirim tidak dapat diubah.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirm}>
              Batal
            </Button>
            <Button color="blue" loading={loading} onClick={handleConfirm}>
              Kirim Semua
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={5}>Penilaian Massal (Beberapa Siswa)</Title>
          <Text size="sm" c="dimmed">
            Pilih siswa yang belum dinilai, isi 7 kriteria sekali, lalu kirim untuk semua sekaligus.
          </Text>

          <Divider label="Pilih Siswa" labelPosition="left" />

          <Stack gap="xs">
            <Checkbox
              label="Pilih semua"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleSelectAll}
              fw={500}
            />
            {pendingItems.map((item) => (
              <Checkbox
                key={item.id}
                label={item.studentName || "(Nama belum diisi)"}
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
                pl="md"
              />
            ))}
          </Stack>

          <Divider label="Kriteria Penilaian" labelPosition="left" />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {CRITERIA.map((c) => (
              <Select
                key={c.key}
                label={c.label}
                data={RATING_OPTIONS_FULL}
                value={massRatings[c.key] ?? null}
                onChange={(v) =>
                  setMassRatings((p) => ({ ...p, [c.key]: v as Rating }))
                }
                size="sm"
              />
            ))}
          </SimpleGrid>

          {!allCriteriaFilled && selectedIds.length > 0 && (
            <Text size="sm" c="orange">
              Lengkapi semua 7 kriteria penilaian sebelum mengirim.
            </Text>
          )}

          {error && <Text size="sm" c="red">{error}</Text>}

          <Group justify="flex-end">
            <Button
              disabled={!canSubmit}
              loading={loading}
              onClick={handleSubmitClick}
            >
              Kirim Penilaian Terpilih ({selectedIds.length} siswa)
            </Button>
          </Group>
        </Stack>
      </Paper>
    </>
  );
}

const GradePage: NextPageWithLayout = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;

  const { info, submit } = useGrade(token);

  // SSR-safe: undefined on server, resolves on client
  const isDesktop = useMediaQuery("(min-width: 62em)");

  const notFound = info.isError;
  const loading = info.isLoading || !info.data;

  if (notFound) return <Alert color="red" maw={500} mx="auto" mt={80}>Link tidak valid atau token tidak ditemukan.</Alert>;
  if (loading) return <Text ta="center" mt={80}>Memuat data penilaian...</Text>;

  const { perusahaan, pic, items } = info.data!;

  const graded = items.filter((i) => i.status === "graded").length;
  const total = items.length;

  const headerInfo = (
    <>
      <Title order={3}>Penilaian Magang</Title>
      <Group gap="lg" wrap="wrap">
        <Text size="sm"><strong>Perusahaan:</strong> {perusahaan}</Text>
        <Text size="sm"><strong>PIC / Pembimbing:</strong> {pic}</Text>
      </Group>

      <Group>
        <Badge size="lg" variant="light" color={graded === total ? "green" : "orange"}>
          Dinilai {graded} dari {total} siswa
        </Badge>
      </Group>

      {graded < total ? (
        <Alert color="orange">
          Masih ada {total - graded} siswa yang belum dinilai. Mohon nilai semua siswa.
        </Alert>
      ) : (
        <Alert color="green">
          Semua siswa sudah dinilai. Terima kasih.
        </Alert>
      )}
    </>
  );

  return (
    <Stack
      mx="auto"
      mt={40}
      mb={60}
      px={{ base: "sm", md: "xl" }}
      style={{ maxWidth: isDesktop ? 1100 : 700 }}
    >
      {headerInfo}

      <MassGradingPanel
        items={items}
        submit={submit}
        onDone={info.refetch}
      />

      {/* Desktop: Table with criteria as columns */}
      {isDesktop ? (
        <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover withColumnBorders verticalSpacing="xs" fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ minWidth: 140 }}>Nama</Table.Th>
                  {CRITERIA.map((c) => (
                    <Table.Th key={c.key} ta="center" style={{ minWidth: 72 }}>
                      <Tooltip label={c.label} withArrow position="top">
                        <Text size="xs" fw={600} style={{ cursor: "default" }}>
                          {/* Shortened header to keep columns compact */}
                          {c.label.length > 10 ? c.label.slice(0, 8) + "…" : c.label}
                        </Text>
                      </Tooltip>
                    </Table.Th>
                  ))}
                  <Table.Th style={{ minWidth: 80 }}>Status</Table.Th>
                  <Table.Th style={{ minWidth: 90 }}>Kirim</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => (
                  <GradeStudent
                    key={item.id}
                    item={item}
                    submit={submit}
                    onGraded={() => info.refetch()}
                    token={token ?? ""}
                    mode="row"
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      ) : (
        /* Mobile: Cards stacked */
        <Stack gap="sm">
          {items.map((item) => (
            <GradeStudent
              key={item.id}
              item={item}
              submit={submit}
              onGraded={() => info.refetch()}
              token={token ?? ""}
              mode="card"
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

GradePage.getLayout = (page) => page; // public page — no app shell
export default GradePage;
