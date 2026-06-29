import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Button, Card, Group, Select, Stack, Title, Text, Alert, TextInput } from "@mantine/core";
import { http } from "@/lib/api/http";
import { CRITERIA } from "@/lib/internship/grade";
import { InternshipRatings, Rating } from "@/lib/types";
import type { NextPageWithLayout } from "@/pages/_app";

const RATING_OPTIONS = [
  { value: "A", label: "A (Sangat Baik)" },
  { value: "B", label: "B (Baik)" },
  { value: "C", label: "C (Cukup)" },
];

const GradePage: NextPageWithLayout = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const [info, setInfo] = useState<{ studentName: string; lokasiMagang: string; posisi: string; pembimbing: string; status: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ratings, setRatings] = useState<Partial<InternshipRatings>>({});
  const [lokasiMagang, setLokasiMagang] = useState("");
  const [posisi, setPosisi] = useState("");
  const [pembimbing, setPembimbing] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    http.get(`/api/grade/${token}`)
      .then((r) => {
        setInfo(r.data);
        setLokasiMagang(r.data.lokasiMagang ?? "");
        setPosisi(r.data.posisi ?? "");
        setPembimbing(r.data.pembimbing ?? "");
        if (r.data.status === "graded") setDone(true);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  async function submit() {
    if (CRITERIA.some((c) => !ratings[c.key]) || !lokasiMagang || !posisi || !pembimbing) {
      setError("Mohon lengkapi semua data dan kriteria"); return;
    }
    setSaving(true); setError("");
    try {
      await http.post(`/api/grade/${token}`, { ratings, lokasiMagang, posisi, pembimbing });
      setDone(true);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        setError("Penilaian sudah dikirim sebelumnya"); setDone(true);
      } else {
        setError("Gagal mengirim penilaian");
      }
    } finally { setSaving(false); }
  }

  if (notFound) return <Alert color="red" maw={500} mx="auto" mt={80}>Link tidak valid.</Alert>;
  if (!info) return <Text ta="center" mt={80}>Memuat...</Text>;

  return (
    <Card maw={560} mx="auto" mt={60} withBorder padding="lg">
      <Stack>
        <Title order={3}>Penilaian Magang</Title>
        <Text><b>Siswa:</b> {info.studentName}</Text>
        {done ? (
          <Alert color="green">Terima kasih. Penilaian telah dikirim.</Alert>
        ) : (
          <>
            <TextInput label="Lokasi Magang" value={lokasiMagang} onChange={(e) => setLokasiMagang(e.currentTarget.value)} />
            <TextInput label="Posisi" value={posisi} onChange={(e) => setPosisi(e.currentTarget.value)} />
            <TextInput label="Pembimbing (PIC)" value={pembimbing} onChange={(e) => setPembimbing(e.currentTarget.value)} />
            {CRITERIA.map((c) => (
              <Select key={c.key} label={c.label} data={RATING_OPTIONS}
                value={ratings[c.key] ?? null}
                onChange={(v) => setRatings((p) => ({ ...p, [c.key]: v as Rating }))} />
            ))}
            {error && <Text c="red">{error}</Text>}
            <Group justify="flex-end"><Button loading={saving} onClick={submit}>Kirim Penilaian</Button></Group>
          </>
        )}
      </Stack>
    </Card>
  );
};

GradePage.getLayout = (page) => page; // public page — no app shell
export default GradePage;
