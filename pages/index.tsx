import Link from "next/link";
import { Card, SimpleGrid, Text, Title, Stack } from "@mantine/core";

const LINKS = [
  { href: "/students", title: "Siswa", desc: "Kelola data & status siswa" },
  { href: "/classes", title: "Kelas", desc: "Kelas per tahun ajaran" },
  { href: "/internships", title: "Magang", desc: "Penempatan & penilaian magang" },
  { href: "/master-magang", title: "Master Magang", desc: "Data perusahaan & PIC" },
  { href: "/academic-years", title: "Tahun Ajaran", desc: "Atur tahun ajaran" },
  { href: "/settings", title: "Pengaturan", desc: "Template pesan WhatsApp" },
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
            <Text fw={600} c="brand.8">{l.title}</Text>
            <Text c="dimmed" size="sm" mt={4}>{l.desc}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
