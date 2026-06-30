import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Button, Card, Group, Select, Stack, Title, Text, Alert, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { CRITERIA } from "@/lib/internship/grade";
import { InternshipRatings, Rating } from "@/lib/types";
import { useGrade } from "@/lib/hooks/useGrade";
import type { NextPageWithLayout } from "@/pages/_app";

const RATING_OPTIONS = [
  { value: "A", label: "A (Sangat Baik)" },
  { value: "B", label: "B (Baik)" },
  { value: "C", label: "C (Cukup)" },
];

const GradePage: NextPageWithLayout = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;

  const { info, submit } = useGrade(token);

  const [ratings, setRatings] = useState<Partial<InternshipRatings>>({});
  const [studentName, setStudentName] = useState("");
  const [lokasiMagang, setLokasiMagang] = useState("");
  const [posisi, setPosisi] = useState("");
  const [pembimbing, setPembimbing] = useState("");
  const [phone, setPhone] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!info.data) return;
    setStudentName(info.data.studentName ?? "");
    setLokasiMagang(info.data.lokasiMagang ?? "");
    setPosisi(info.data.posisi ?? "");
    setPembimbing(info.data.pembimbing ?? "");
    setPhone(info.data.phone ?? "");
    setTanggal(info.data.tanggal ?? "");
    if (info.data.status === "graded") setDone(true);
  }, [info.data]);

  const notFound = info.isError;
  const loading = info.isLoading || !info.data;

  function handleSubmit() {
    if (CRITERIA.some((c) => !ratings[c.key]) || !studentName || !lokasiMagang || !posisi || !pembimbing) {
      setError("Mohon lengkapi semua data dan kriteria"); return;
    }
    setError("");
    submit.mutate(
      { ratings: ratings as InternshipRatings, studentName, lokasiMagang, posisi, pembimbing, phone, tanggal },
      {
        onSuccess: () => setDone(true),
        onError: (e) => {
          if (axios.isAxiosError(e) && e.response?.status === 409) {
            setError("Penilaian sudah dikirim sebelumnya");
            setDone(true);
          } else {
            setError("Gagal mengirim penilaian");
          }
        },
      }
    );
  }

  if (notFound) return <Alert color="red" maw={500} mx="auto" mt={80}>Link tidak valid.</Alert>;
  if (loading) return <Text ta="center" mt={80}>Memuat...</Text>;

  const isDone = done || info.data?.status === "graded";

  return (
    <Card maw={560} mx="auto" mt={60} withBorder padding="lg">
      <Stack>
        <Title order={3}>Penilaian Magang</Title>
        {isDone ? (
          <Alert color="green">Terima kasih. Penilaian telah dikirim.</Alert>
        ) : (
          <>
            <TextInput label="Nama Siswa" value={studentName} onChange={(e) => setStudentName(e.currentTarget.value)} />
            <TextInput label="Lokasi Magang" value={lokasiMagang} onChange={(e) => setLokasiMagang(e.currentTarget.value)} />
            <TextInput label="Posisi" value={posisi} onChange={(e) => setPosisi(e.currentTarget.value)} />
            <TextInput label="Pembimbing (PIC)" value={pembimbing} onChange={(e) => setPembimbing(e.currentTarget.value)} />
            <TextInput label="No. Telepon" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
            <DateInput
              label="Tanggal"
              value={tanggal ? new Date(tanggal) : null}
              onChange={(d) => setTanggal(d ? d.toISOString().slice(0, 10) : "")}
            />
            {CRITERIA.map((c) => (
              <Select key={c.key} label={c.label} data={RATING_OPTIONS}
                value={ratings[c.key] ?? null}
                onChange={(v) => setRatings((p) => ({ ...p, [c.key]: v as Rating }))} />
            ))}
            {error && <Text c="red">{error}</Text>}
            <Group justify="flex-end"><Button loading={submit.isPending} onClick={handleSubmit}>Kirim Penilaian</Button></Group>
          </>
        )}
      </Stack>
    </Card>
  );
};

GradePage.getLayout = (page) => page; // public page — no app shell
export default GradePage;
