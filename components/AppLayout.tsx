import { AppShell, NavLink, Title, Group, Box, Paper, Button, Text, Burger, Divider } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDisclosure } from "@mantine/hooks";
import { House, Student, Chalkboard, CalendarBlank, Briefcase, Buildings, Gear, ChatCircleText, SignOut, UserCircle } from "@phosphor-icons/react";
import { useLogout } from "@/lib/hooks/useLogout";

const NAV_SECTIONS = [
  {
    label: "Utama",
    items: [
      { href: "/", label: "Dasbor", Icon: House },
    ],
  },
  {
    label: "Data Master",
    items: [
      { href: "/students", label: "Siswa", Icon: Student },
      { href: "/classes", label: "Kelas", Icon: Chalkboard },
      { href: "/academic-years", label: "Tahun Ajaran", Icon: CalendarBlank },
      { href: "/master-magang", label: "Master Magang", Icon: Buildings },
    ],
  },
  {
    label: "Program",
    items: [
      { href: "/counseling", label: "Konseling", Icon: ChatCircleText },
      { href: "/internships", label: "Magang", Icon: Briefcase },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/settings", label: "Pengaturan", Icon: Gear },
      { href: "/account", label: "Akun", Icon: UserCircle },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { pathname } = router;
  const logout = useLogout();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const handleNav = () => {
    // Close mobile nav on navigation
    if (mobileOpened) toggleMobile();
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !mobileOpened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Group h="100%" px="lg" gap="sm" justify="space-between" style={{ flex: 1 }}>
            <Group gap="sm">
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <img
                src="/logo-mdc.png"
                alt="MDC"
                height={34}
                style={{ height: 34, width: "auto" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <Title order={4} c="brand.8" visibleFrom="xs">Personal Development Program (Pedevpro)</Title>
            </Group>
            <Button
              variant="subtle"
              color="gray"
              leftSection={<SignOut size={16} weight="bold" />}
              loading={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/login") })}
            >Keluar</Button>
          </Group>
          <Box style={{ height: 3, background: "var(--mantine-color-accent-6)" }} />
        </Box>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {NAV_SECTIONS.map((section, si) => (
          <Box key={section.label}>
            {si > 0 && <Divider my="xs" />}
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4} mt={si > 0 ? 4 : 0}>
              {section.label}
            </Text>
            {section.items.map((n) => (
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
                onClick={handleNav}
              />
            ))}
          </Box>
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
