import Link from "next/link";
import { Card, SimpleGrid, Text, Title, Stack, ThemeIcon, Group, Progress, Badge, Skeleton } from "@mantine/core";
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
import { useDashboard } from "@/lib/hooks/useDashboard";

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
  Icon, label, value, sub, color = "brand", progress, href, loading,
}: {
  Icon: PhosphorIcon;
  label: string; value: React.ReactNode; sub?: string; color?: string; progress?: number; href?: string; loading?: boolean;
}) {
  const inner = (
    <Card withBorder padding="lg" radius="md" h="100%" style={{ textDecoration: "none" }}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>{label}</Text>
        <ThemeIcon variant="light" size="lg" radius="md" color={color}><Icon size={20} weight="duotone" /></ThemeIcon>
      </Group>
      {loading ? <Skeleton height={28} width="60%" radius="sm" /> : <Text fw={700} size="1.7rem" lh={1.1}>{value}</Text>}
      {loading ? (
        <Skeleton height={14} width="80%" radius="sm" mt={8} />
      ) : (
        sub && <Text size="xs" c="dimmed" mt={4}>{sub}</Text>
      )}
      {progress !== undefined && !loading && <Progress value={progress} color={color} size="sm" mt="sm" radius="xl" />}
    </Card>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

export default function Home() {
  const dashboardQ = useDashboard();
  const loading = dashboardQ.isLoading;
  const d = dashboardQ.data;

  const activeYear = d?.activeYear ?? null;

  const totalSiswa = d?.siswa.total ?? 0;
  const aktif = d?.siswa.aktif ?? 0;
  const nonaktif = d?.siswa.nonaktif ?? 0;

  const kelasCount = d?.kelas ?? 0;

  const magangTotal = d?.magang.total ?? 0;
  const dinilai = d?.magang.dinilai ?? 0;
  const avgNilai = d?.magang.avgNilai ?? null;
  const gradedPct = magangTotal ? Math.round((dinilai / magangTotal) * 100) : 0;

  const konselingTotal = d?.konseling.total ?? 0;
  const konselingOpen = d?.konseling.open ?? 0;

  const wawancaraTotal = d?.wawancara.total ?? 0;
  const wawancaraDijadwalkan = d?.wawancara.dijadwalkan ?? 0;

  const dash = (isLoading: boolean, v: React.ReactNode) => (isLoading ? "…" : v);

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
        <StatCard Icon={StudentIcon} label="Siswa Aktif" color="brand" href="/students" loading={loading}
          value={dash(loading, aktif)} sub={`${nonaktif} nonaktif · ${totalSiswa} total`} />
        <StatCard Icon={Chalkboard} label="Kelas" color="grape" href="/classes" loading={loading}
          value={dash(loading, kelasCount)} sub={activeYear ? `Tahun ${activeYear.year}` : "—"} />
        <StatCard Icon={GraduationCap} label="Progres Penilaian Magang" color="teal" href="/internships" loading={loading}
          value={dash(loading, `${dinilai}/${magangTotal}`)} sub={`${gradedPct}% sudah dinilai`} progress={gradedPct} />
        <StatCard Icon={ChartBar} label="Rata-rata Nilai Magang" color="orange" href="/laporan-magang" loading={loading}
          value={dash(loading, avgNilai != null ? avgNilai.toFixed(1) : "—")}
          sub={dinilai ? `dari ${dinilai} siswa dinilai` : "belum ada nilai"} />
        <StatCard Icon={ChatCircleText} label="Konseling" color="blue" href="/counseling" loading={loading}
          value={dash(loading, konselingTotal)} sub={`${konselingOpen} sesi terbuka`} />
        <StatCard Icon={ClipboardText} label="Wawancara Penjurusan" color="indigo" href="/wawancara" loading={loading}
          value={dash(loading, wawancaraTotal)} sub={`${wawancaraDijadwalkan} dijadwalkan`} />
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
