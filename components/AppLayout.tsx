import { AppShell, NavLink, Title, Group, Box, Paper } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";

const NAV = [
  { href: "/", label: "Dasbor" },
  { href: "/students", label: "Siswa" },
  { href: "/classes", label: "Kelas" },
  { href: "/academic-years", label: "Tahun Ajaran" },
  { href: "/internships", label: "Magang" },
  { href: "/master-magang", label: "Master Magang" },
  { href: "/settings", label: "Pengaturan" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 240, breakpoint: "sm" }} padding="lg">
      <AppShell.Header>
        <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Group h="100%" px="lg" gap="sm" style={{ flex: 1 }}>
            <img
              src="/logo.png"
              alt="MDC"
              height={34}
              style={{ height: 34, width: "auto" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <Title order={4} c="brand.8">MDC Management</Title>
          </Group>
          <Box style={{ height: 3, background: "var(--mantine-color-accent-6)" }} />
        </Box>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {NAV.map((n) => (
          <NavLink
            key={n.href}
            component={Link}
            href={n.href}
            label={n.label}
            active={isActive(n.href)}
            variant="light"
            mb={4}
            style={{ borderRadius: "var(--mantine-radius-md)" }}
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main style={{ backgroundColor: "#f3f6f7" }}>
        <Paper p="lg" shadow="sm" radius="md" withBorder>
          {children}
        </Paper>
      </AppShell.Main>
    </AppShell>
  );
}
