import { useState } from "react";
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
import { CaretDown, CaretUp, Check } from "@phosphor-icons/react";
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

/** Per-student form state, lifted to the page so the mass panel and the
 * single "Kirim Semua" action can read/write it directly. */
interface RowForm {
  ratings: Partial<InternshipRatings>;
  studentName: string;
  lokasiMagang: string;
  posisi: string;
  pembimbing: string;
  phone: string;
  tanggal: string;
}

function draftKeyFor(token: string, id: string): string {
  return `grade-draft:${token}:${id}`;
}

/** Default form for a (non-graded) item — restored draft, if any, wins over
 * the server-provided placement values. */
function defaultRowForm(item: GradeItem, token: string): RowForm {
  const d = useDraftStore.getState().getDraft(draftKeyFor(token, item.id));
  return {
    ratings: (d?.ratings as Partial<InternshipRatings>) ?? {},
    studentName: (d?.studentName as string) ?? item.studentName ?? "",
    lokasiMagang: (d?.lokasiMagang as string) ?? item.lokasiMagang ?? "",
    posisi: (d?.posisi as string) ?? item.posisi ?? "",
    pembimbing: (d?.pembimbing as string) ?? item.pembimbing ?? "",
    phone: (d?.phone as string) ?? item.phone ?? "",
    tanggal: (d?.tanggal as string) ?? item.tanggal ?? "",
  };
}

/** Ready = all 7 criteria + required placement fields filled */
function isFormReady(f: RowForm): boolean {
  return (
    CRITERIA.every((c) => !!f.ratings[c.key]) &&
    !!f.studentName &&
    !!f.lokasiMagang &&
    !!f.posisi &&
    !!f.pembimbing
  );
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

interface GradeStudentProps {
  item: GradeItem;
  form: RowForm;
  onChange: (patch: Partial<RowForm>) => void;
  mode: "card" | "row";
}

/** Mobile card renderer for one student — controlled by `form` + `onChange` */
function GradeStudentCard({ item, form, onChange }: Omit<GradeStudentProps, "mode">) {
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

  const ready = isFormReady(form);

  return (
    <Card withBorder radius="md" p="sm">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>{item.studentName || "(Nama belum diisi)"}</Text>
        <Group gap={4}>
          {ready && <Badge color="teal" size="sm" variant="light">Siap Kirim</Badge>}
          <Badge color="orange" size="sm">Belum Dinilai</Badge>
        </Group>
      </Group>
      <Stack gap="xs">
        <PlacementFields
          studentName={form.studentName} setStudentName={(v) => onChange({ studentName: v })}
          lokasiMagang={form.lokasiMagang} setLokasiMagang={(v) => onChange({ lokasiMagang: v })}
          posisi={form.posisi} setPosisi={(v) => onChange({ posisi: v })}
          pembimbing={form.pembimbing} setPembimbing={(v) => onChange({ pembimbing: v })}
          phone={form.phone} setPhone={(v) => onChange({ phone: v })}
          tanggal={form.tanggal} setTanggal={(v) => onChange({ tanggal: v })}
        />
        <Divider label="Kriteria Penilaian" labelPosition="left" mt="xs" />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {CRITERIA.map((c) => (
            <Select
              key={c.key}
              label={c.label}
              data={RATING_OPTIONS_FULL}
              value={form.ratings[c.key] ?? null}
              onChange={(v) => onChange({ ratings: { [c.key]: v as Rating } })}
              size="sm"
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Card>
  );
}

/** Desktop table row renderer for one student — includes criteria Selects + expandable placement detail */
function GradeStudentTableRow({ item, form, onChange }: Omit<GradeStudentProps, "mode">) {
  const [detailOpened, { toggle: toggleDetail }] = useDisclosure(false);

  if (item.status === "graded") {
    return (
      <Table.Tr style={{ backgroundColor: "var(--mantine-color-green-0)" }}>
        <Table.Td>
          <Text size="sm" fw={500}>{item.studentName || "(Nama belum diisi)"}</Text>
        </Table.Td>
        {CRITERIA.map((c) => (
          <Table.Td key={c.key} ta="center">
            <Text size="sm" fw={500}>{item.ratings?.[c.key] ?? "-"}</Text>
          </Table.Td>
        ))}
        <Table.Td>
          <Badge color="green" size="sm">Dinilai</Badge>
        </Table.Td>
        <Table.Td ta="center">
          <Stack gap={0}>
            <Text size="sm" fw={600}>{item.nilaiAkhir?.toFixed(2) ?? "-"}</Text>
            {item.kategori && <Text size="xs" c="dimmed">{item.kategori}</Text>}
          </Stack>
        </Table.Td>
      </Table.Tr>
    );
  }

  const ready = isFormReady(form);

  return (
    <>
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
              value={form.ratings[c.key] ?? null}
              onChange={(v) => onChange({ ratings: { [c.key]: v as Rating } })}
              size="xs"
              styles={{ input: { textAlign: "center", paddingLeft: 4, paddingRight: 20 } }}
              aria-label={c.label}
            />
          </Table.Td>
        ))}
        <Table.Td>
          <Badge color="orange" size="sm">Belum</Badge>
        </Table.Td>
        <Table.Td style={{ minWidth: 70 }} ta="center">
          {ready ? (
            <Tooltip label="Siap dikirim" withArrow>
              <Check size={18} weight="bold" color="var(--mantine-color-teal-6)" />
            </Tooltip>
          ) : (
            <Text c="dimmed" size="sm">–</Text>
          )}
        </Table.Td>
      </Table.Tr>
      {/* Detail expand row for placement fields */}
      <Table.Tr style={{ padding: 0 }}>
        <Table.Td colSpan={CRITERIA.length + 3} style={{ padding: 0, border: "none" }}>
          <Collapse in={detailOpened}>
            <Paper p="sm" m="xs" withBorder radius="sm">
              <Text size="xs" fw={600} mb="xs" c="dimmed">Data Penempatan</Text>
              <PlacementFields
                studentName={form.studentName} setStudentName={(v) => onChange({ studentName: v })}
                lokasiMagang={form.lokasiMagang} setLokasiMagang={(v) => onChange({ lokasiMagang: v })}
                posisi={form.posisi} setPosisi={(v) => onChange({ posisi: v })}
                pembimbing={form.pembimbing} setPembimbing={(v) => onChange({ pembimbing: v })}
                phone={form.phone} setPhone={(v) => onChange({ phone: v })}
                tanggal={form.tanggal} setTanggal={(v) => onChange({ tanggal: v })}
              />
            </Paper>
          </Collapse>
        </Table.Td>
      </Table.Tr>
    </>
  );
}

function GradeStudent({ item, form, onChange, mode }: GradeStudentProps) {
  if (mode === "row") {
    return <GradeStudentTableRow item={item} form={form} onChange={onChange} />;
  }
  return <GradeStudentCard item={item} form={form} onChange={onChange} />;
}

interface MassGradingPanelProps {
  items: GradeItem[];
  onApply: (ids: string[], ratings: Partial<InternshipRatings>) => void;
}

/** "Penilaian Massal" panel — applies shared criteria into selected rows'
 * forms. It never submits; the page-level "Kirim Semua" button does that. */
function MassGradingPanel({ items, onApply }: MassGradingPanelProps) {
  const pendingItems = items.filter((i) => i.status !== "graded");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [massRatings, setMassRatings] = useState<Partial<InternshipRatings>>({});

  const allSelected =
    pendingItems.length > 0 && selectedIds.length === pendingItems.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const allCriteriaFilled = CRITERIA.every((c) => !!massRatings[c.key]);
  const canApply = selectedIds.length > 0 && allCriteriaFilled;

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

  function handleApply() {
    if (!canApply) return;
    onApply(selectedIds, massRatings);
    notifications.show({
      color: "blue",
      title: "Nilai Diterapkan",
      message: `Nilai diterapkan ke ${selectedIds.length} siswa. Periksa lalu kirim.`,
    });
  }

  if (pendingItems.length === 0) return null;

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Title order={5}>Penilaian Massal (Beberapa Siswa)</Title>
        <Text size="sm" c="dimmed">
          Pilih siswa yang belum dinilai, isi 7 kriteria sekali, lalu terapkan ke tabel.
          Periksa data tiap siswa, baru kirim semua sekaligus di bawah.
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
            Lengkapi semua 7 kriteria penilaian sebelum menerapkan.
          </Text>
        )}

        <Group justify="flex-end">
          <Button disabled={!canApply} onClick={handleApply}>
            Terapkan ke {selectedIds.length} Siswa
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

const GradePage: NextPageWithLayout = () => {
  const router = useRouter();
  const token = (router.query.token as string | undefined) ?? "";

  const { info, submit } = useGrade(token || undefined);

  // SSR-safe: undefined on server, resolves on client
  const isDesktop = useMediaQuery("(min-width: 62em)");

  const [forms, setForms] = useState<Record<string, RowForm>>({});
  const [submitAllOpened, { open: openSubmitAll, close: closeSubmitAll }] = useDisclosure(false);
  const [submitAllLoading, setSubmitAllLoading] = useState(false);

  const notFound = info.isError;
  const loading = info.isLoading || !info.data;

  const items = info.data?.items ?? [];

  function getForm(item: GradeItem): RowForm {
    return forms[item.id] ?? defaultRowForm(item, token);
  }

  function handleFormChange(item: GradeItem, patch: Partial<RowForm>) {
    setForms((prev) => {
      const cur = prev[item.id] ?? defaultRowForm(item, token);
      const next: RowForm = {
        ...cur,
        ...patch,
        ratings: patch.ratings ? { ...cur.ratings, ...patch.ratings } : cur.ratings,
      };
      useDraftStore.getState().setDraft(draftKeyFor(token, item.id), next as unknown as Record<string, unknown>);
      return { ...prev, [item.id]: next };
    });
  }

  function handleMassApply(ids: string[], ratings: Partial<InternshipRatings>) {
    const byId = new Map(items.map((i) => [i.id, i]));
    setForms((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const item = byId.get(id);
        if (!item) continue;
        const cur = prev[id] ?? defaultRowForm(item, token);
        const merged: RowForm = { ...cur, ratings: { ...cur.ratings, ...ratings } };
        next[id] = merged;
        useDraftStore.getState().setDraft(draftKeyFor(token, id), merged as unknown as Record<string, unknown>);
      }
      return next;
    });
  }

  const pendingItems = items.filter((i) => i.status !== "graded");
  const readyItems = pendingItems.filter((i) => isFormReady(getForm(i)));
  const notReadyItems = pendingItems.filter((i) => !isFormReady(getForm(i)));
  const readyIds = readyItems.map((i) => i.id);

  async function handleSubmitAllConfirm() {
    closeSubmitAll();
    setSubmitAllLoading(true);
    let successCount = 0;
    const failedNames: string[] = [];

    for (const item of readyItems) {
      const f = getForm(item);
      try {
        await submit.mutateAsync({
          internshipId: item.id,
          ratings: f.ratings as InternshipRatings,
          studentName: f.studentName,
          lokasiMagang: f.lokasiMagang,
          posisi: f.posisi,
          pembimbing: f.pembimbing,
          phone: f.phone,
          tanggal: f.tanggal,
        });
        successCount++;
        useDraftStore.getState().clearDraft(draftKeyFor(token, item.id));
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          // Already graded elsewhere — treat as done
          successCount++;
          useDraftStore.getState().clearDraft(draftKeyFor(token, item.id));
        } else {
          failedNames.push(f.studentName || item.studentName || "(Nama belum diisi)");
        }
      }
    }

    setSubmitAllLoading(false);
    await info.refetch();

    notifications.show({
      color: "green",
      title: "Penilaian Terkirim",
      message: `Berhasil menilai ${successCount} siswa`,
    });
    if (failedNames.length > 0) {
      notifications.show({
        color: "red",
        title: "Sebagian Gagal Dikirim",
        message: `Gagal mengirim untuk: ${failedNames.join(", ")}`,
      });
    }
  }

  if (notFound) return <Alert color="red" maw={500} mx="auto" mt={80}>Link tidak valid atau token tidak ditemukan.</Alert>;
  if (loading) return <Text ta="center" mt={80}>Memuat data penilaian...</Text>;

  const { perusahaan, pic } = info.data!;

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

      <MassGradingPanel items={items} onApply={handleMassApply} />

      {pendingItems.length > 0 && (
        <>
          <Modal
            opened={submitAllOpened}
            onClose={closeSubmitAll}
            title="Konfirmasi Kirim Semua Penilaian"
            centered
          >
            <Stack gap="md">
              <Text size="sm">
                Kirim penilaian untuk <strong>{readyIds.length} siswa</strong>? Setelah
                dikirim tidak dapat diubah.
              </Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={closeSubmitAll}>Batal</Button>
                <Button loading={submitAllLoading} onClick={handleSubmitAllConfirm}>Kirim</Button>
              </Group>
            </Stack>
          </Modal>

          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" wrap="wrap" align="flex-start">
              <Stack gap={4}>
                <Button
                  size="md"
                  disabled={readyIds.length === 0}
                  onClick={openSubmitAll}
                >
                  Kirim Semua Penilaian ({readyIds.length} siap)
                </Button>
                {notReadyItems.length > 0 && (
                  <Text size="sm" c="dimmed" maw={520}>
                    {notReadyItems.length} siswa belum lengkap:{" "}
                    {notReadyItems.map((i) => i.studentName || "(Nama belum diisi)").join(", ")}
                  </Text>
                )}
              </Stack>
            </Group>
          </Paper>
        </>
      )}

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
                  <Table.Th style={{ minWidth: 70 }}>Siap</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => (
                  <GradeStudent
                    key={item.id}
                    item={item}
                    form={getForm(item)}
                    onChange={(patch) => handleFormChange(item, patch)}
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
              form={getForm(item)}
              onChange={(patch) => handleFormChange(item, patch)}
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
