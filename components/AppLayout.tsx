import { AppShell, NavLink, Title, Group } from "@mantine/core";
import Link from "next/link";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShell.Header><Group h="100%" px="md"><Title order={4}>MDC Management</Title></Group></AppShell.Header>
      <AppShell.Navbar p="xs">
        <NavLink component={Link} href="/" label="Dasbor" />
        <NavLink component={Link} href="/students" label="Siswa" />
        <NavLink component={Link} href="/classes" label="Kelas" />
        <NavLink component={Link} href="/academic-years" label="Tahun Ajaran" />
        <NavLink component={Link} href="/internships" label="Magang" />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
