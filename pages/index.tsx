import Link from "next/link";
import { Card, SimpleGrid, Text, Title, Stack, ThemeIcon, Group } from "@mantine/core";
import { Student, Chalkboard, Briefcase, Buildings, CalendarBlank, Gear } from "@phosphor-icons/react";

const LINKS = [
  { href: "/students", title: "Siswa", desc: "Kelola data & status siswa", Icon: Student },
  { href: "/classes", title: "Kelas", desc: "Kelas per tahun ajaran", Icon: Chalkboard },
  { href: "/internships", title: "Magang", desc: "Penempatan & penilaian magang", Icon: Briefcase },
  { href: "/master-magang", title: "Master Magang", desc: "Data perusahaan & PIC", Icon: Buildings },
  { href: "/academic-years", title: "Tahun Ajaran", desc: "Atur tahun ajaran", Icon: CalendarBlank },
  { href: "/settings", title: "Pengaturan", desc: "Template pesan WhatsApp", Icon: Gear },
];

export default function Home() {
  return (
    <Stack>
      <div>
        <Title order={2}>Selamat datang</Title>
        <Text c="dimmed" size="sm">Sistem manajemen konseling & magang MDC</Text>
      </div>
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
