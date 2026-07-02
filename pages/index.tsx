import Link from "next/link";
import { Card, SimpleGrid, Text, Title, Stack, ThemeIcon, Group, Progress, Badge } from "@mantine/core";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  Student as StudentIcon,
  Chalkboard,
  Briefcase,
  Buildings,
  CalendarBlank,
  Gear,
  ChatCircleText,
  ClipboardText,
  FileArrowDown,
  ChartBar,
  GraduationCap,
} from "@phosphor-icons/react";
import { useAcademicYears } from "@/lib/hooks/useAcademicYears";
import { useStudentList } from "@/lib/hooks/useStudentList";
import { useClasses } from "@/lib/hooks/useClasses";
import { useInternships } from "@/lib/hooks/useInternships";
import { useCounseling } from "@/lib/hooks/useCounseling";
import { useWawancara } from "@/lib/hooks/useWawancara";

const LINKS = [
  { href: "/students", title: "Siswa", desc: "Kelola data & status siswa", Icon: StudentIcon },
  { href: "/classes", title: "Kelas", desc: "Kelas & anggota per tahun ajaran", Icon: Chalkboard },
  { href: "/internships", title: "Magang", desc: "Penempatan & penilaian magang", Icon: Briefcase },
  { href: "/counseling", title: "Konseling", desc: "Catatan sesi konseling", Icon: ChatCircleText },
  { href: "/wawancara", title: "Wawancara Penjurusan", desc: "Jadwal & hasil wawancara", Icon: ClipboardText },
  { href: "/laporan-magang", title: "Laporan Magang", desc: "Rekap nilai & ekspor Excel/Canva", Icon: FileArrowDown },
  { href: "/master-magang", title: "Master Magang", desc: "Data perusahaan & PIC", Icon: Buildings },
  { href: "/academic-years", title: "Tahun Ajaran", desc: "Atur tahun ajaran", Icon: CalendarBlank },
  { href: "/settings", title: "Pengaturan", desc: "Template pesan WhatsApp", Icon: Gear },
];

function StatCard({
  Icon, label, value, sub, color = "brand", progress, href,
}: {
  Icon: PhosphorIcon;
  label: string; value: React.ReactNode; sub?: string; color?: string; progress?: number; href?: string;
}) {
  const inner = (
    <Card withBorder padding="lg" radius="md" h="100%" style={{ textDecoration: "none" }}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>{label}</Text>
        <ThemeIcon variant="light" size="lg" radius="md" color={color}><Icon size={20} weight="duotone" /></ThemeIcon>
      </Group>
      <Text fw={700} size="1.7rem" lh={1.1}>{value}</Text>
      {sub && <Text size="xs" c="dimmed" mt={4}>{sub}</Text>}
      {progress !== undefined && <Progress value={progress} color={color} size="sm" mt="sm" radius="xl" />}
    </Card>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

export default function Home() {
  const years = useAcademicYears();
  const activeYear = (years.data.data ?? []).find((y) => y.isActive) ?? null;
  const yearId = activeYear?.id;

  const studentsQ = useStudentList();
  const classesQ = useClasses(yearId);
  const internshipsQ = useInternships(yearId);
  const counselingQ = useCounseling();
  const wawancaraQ = useWawancara();

  const students = studentsQ.data ?? [];
  const totalSiswa = students.length;
  const aktif = students.filter((s) => (s.status ?? "aktif") === "aktif").length;
  const nonaktif = totalSiswa - aktif;

  const kelasCount = (classesQ.data.data ?? []).length;

  const internships = internshipsQ.data.data ?? [];
  const magangTotal = internships.length;
  const dinilai = internships.filter((i) => i.status === "graded").length;
  const gradedScores = internships
    .filter((i) => i.status === "graded" && i.nilaiAkhir != null)
    .map((i) => i.nilaiAkhir as number);
  const avgNilai = gradedScores.length ? gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length : null;
  const gradedPct = magangTotal ? Math.round((dinilai / magangTotal) * 100) : 0;

  const counseling = counselingQ.data.data ?? [];
  const konselingOpen = counseling.filter((c) => c.status === "open").length;

  const wawancara = wawancaraQ.data.data ?? [];
  const wawancaraDijadwalkan = wawancara.filter((w) => w.status === "dijadwalkan").length;

  const dash = (loading: boolean, v: React.ReactNode) => (loading ? "…" : v);

  return (
    <Stack>
      <Group justify="space-between" align="end">
        <div>
          <Title order={2}>Dasbor</Title>
          <Text c="dimmed" size="sm">Ringkasan Personal Development Program MDC</Text>
        </div>
        {activeYear && (
          <Badge size="lg" variant="light" leftSection={<CalendarBlank size={14} weight="bold" />}>
            Tahun Ajaran {activeYear.year}
          </Badge>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <StatCard Icon={StudentIcon} label="Siswa Aktif" color="brand" href="/students"
          value={dash(studentsQ.isLoading, aktif)} sub={`${nonaktif} nonaktif · ${totalSiswa} total`} />
        <StatCard Icon={Chalkboard} label="Kelas" color="grape" href="/classes"
          value={dash(classesQ.data.isLoading, kelasCount)} sub={activeYear ? `Tahun ${activeYear.year}` : "—"} />
        <StatCard Icon={GraduationCap} label="Progres Penilaian Magang" color="teal" href="/internships"
          value={dash(internshipsQ.data.isLoading, `${dinilai}/${magangTotal}`)} sub={`${gradedPct}% sudah dinilai`} progress={gradedPct} />
        <StatCard Icon={ChartBar} label="Rata-rata Nilai Magang" color="orange" href="/laporan-magang"
          value={dash(internshipsQ.data.isLoading, avgNilai != null ? avgNilai.toFixed(1) : "—")}
          sub={gradedScores.length ? `dari ${gradedScores.length} siswa dinilai` : "belum ada nilai"} />
        <StatCard Icon={ChatCircleText} label="Konseling" color="blue" href="/counseling"
          value={dash(counselingQ.data.isLoading, counseling.length)} sub={`${konselingOpen} sesi terbuka`} />
        <StatCard Icon={ClipboardText} label="Wawancara Penjurusan" color="indigo" href="/wawancara"
          value={dash(wawancaraQ.data.isLoading, wawancara.length)} sub={`${wawancaraDijadwalkan} dijadwalkan`} />
      </SimpleGrid>

      <Title order={4} mt="md">Menu</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {LINKS.map((l) => (
          <Card key={l.href} component={Link} href={l.href} padding="lg" style={{ textDecoration: "none" }}>
            <Group gap="sm" mb={6}>
              <ThemeIcon variant="light" size="lg" radius="md"><l.Icon size={20} weight="duotone" /></ThemeIcon>
              <Text fw={600} c="brand.8">{l.title}</Text>
            </Group>
            <Text c="dimmed" size="sm">{l.desc}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
