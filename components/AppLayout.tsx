import { AppShell, NavLink, Title, Group, Box, Paper } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { House, Student, Chalkboard, CalendarBlank, Briefcase, Buildings, Gear } from "@phosphor-icons/react";

const NAV = [
  { href: "/", label: "Dasbor", Icon: House },
  { href: "/students", label: "Siswa", Icon: Student },
  { href: "/classes", label: "Kelas", Icon: Chalkboard },
  { href: "/academic-years", label: "Tahun Ajaran", Icon: CalendarBlank },
  { href: "/internships", label: "Magang", Icon: Briefcase },
  { href: "/master-magang", label: "Master Magang", Icon: Buildings },
  { href: "/settings", label: "Pengaturan", Icon: Gear },
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
              src="/logo-mdc.png"
              alt="MDC"
              height={34}
              style={{ height: 34, width: "auto" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <Title order={4} c="brand.8">Personal Development Program (Pedevpro)</Title>
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
            leftSection={<n.Icon size={18} weight="duotone" />}
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
