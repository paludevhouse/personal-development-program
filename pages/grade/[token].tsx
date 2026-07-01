import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { CRITERIA } from "@/lib/internship/grade";
import { InternshipRatings, Rating } from "@/lib/types";
import { useGrade, GradeItem } from "@/lib/hooks/useGrade";
import { useDraftStore } from "@/lib/store/draftStore";
import type { NextPageWithLayout } from "@/pages/_app";

const RATING_OPTIONS = [
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
}

function GradeStudent({ item, submit, onGraded, token }: GradeStudentProps) {
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

  if (item.status === "graded") {
    return (
      <Stack gap="xs" p="xs">
        <Badge color="green" size="lg">Sudah dinilai</Badge>
        <Text size="sm"><strong>Nama:</strong> {item.studentName}</Text>
        <Text size="sm"><strong>Nilai Akhir:</strong> {item.nilaiAkhir?.toFixed(2) ?? "-"}</Text>
        <Text size="sm"><strong>Kategori:</strong> {item.kategori ?? "-"}</Text>
      </Stack>
    );
  }

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

  return (
    <>
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Konfirmasi Penilaian"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Pastikan semua data dan nilai sudah benar. Setelah dikirim, penilaian{" "}
            <strong>tidak dapat diubah</strong> lagi.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirm}>
              Batal
            </Button>
            <Button loading={submit.isPending} onClick={handleConfirm}>
              Kirim
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack gap="sm" p="xs">
        <TextInput label="Nama Siswa" value={studentName} onChange={(e) => setStudentName(e.currentTarget.value)} />
        <TextInput label="Lokasi Magang" value={lokasiMagang} onChange={(e) => setLokasiMagang(e.currentTarget.value)} />
        <TextInput label="Posisi" value={posisi} onChange={(e) => setPosisi(e.currentTarget.value)} />
        <TextInput label="Pembimbing (PIC)" value={pembimbing} onChange={(e) => setPembimbing(e.currentTarget.value)} />
        <TextInput label="No. Telepon" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
        <DateInput
          label="Tanggal"
          value={toDate(tanggal)}
          onChange={(d) => setTanggal(d ? d.toISOString().slice(0, 10) : "")}
        />
        {CRITERIA.map((c) => (
          <Select
            key={c.key}
            label={c.label}
            data={RATING_OPTIONS}
            value={ratings[c.key] ?? null}
            onChange={(v) => setRatings((p) => ({ ...p, [c.key]: v as Rating }))}
          />
        ))}
        {error && <Text c="red" size="sm">{error}</Text>}
        <Group justify="flex-end">
          <Button onClick={handleSubmitClick}>
            Kirim Penilaian
          </Button>
        </Group>
      </Stack>
    </>
  );
}

const GradePage: NextPageWithLayout = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;

  const { info, submit } = useGrade(token);

  const notFound = info.isError;
  const loading = info.isLoading || !info.data;

  if (notFound) return <Alert color="red" maw={500} mx="auto" mt={80}>Link tidak valid atau token tidak ditemukan.</Alert>;
  if (loading) return <Text ta="center" mt={80}>Memuat data penilaian...</Text>;

  const { perusahaan, pic, items } = info.data!;

  const graded = items.filter((i) => i.status === "graded").length;
  const total = items.length;

  return (
    <Card maw={700} mx="auto" mt={60} withBorder padding="lg">
      <Stack>
        <Title order={3}>Penilaian Magang</Title>
        <Text size="sm"><strong>Perusahaan:</strong> {perusahaan}</Text>
        <Text size="sm"><strong>PIC / Pembimbing:</strong> {pic}</Text>

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

        <Accordion variant="separated" mt="sm">
          {items.map((item) => (
            <Accordion.Item key={item.id} value={item.id}>
              <Accordion.Control>
                <Group gap="sm">
                  <Text fw={500}>{item.studentName || "(Nama belum diisi)"}</Text>
                  {item.status === "graded" ? (
                    <Badge color="green" size="sm">Sudah Dinilai</Badge>
                  ) : (
                    <Badge color="orange" size="sm">Belum Dinilai</Badge>
                  )}
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <GradeStudent
                  item={item}
                  submit={submit}
                  onGraded={() => info.refetch()}
                  token={token ?? ""}
                />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </Card>
  );
};

GradePage.getLayout = (page) => page; // public page — no app shell
export default GradePage;
