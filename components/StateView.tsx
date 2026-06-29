import { ReactNode } from "react";
import { Stack, Text, Title, ThemeIcon } from "@mantine/core";

export function StateView({
  icon, title, description, action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack align="center" justify="center" gap="xs" py={48} px="md" ta="center">
      <ThemeIcon variant="light" color="brand" size={88} radius="100%">{icon}</ThemeIcon>
      <Title order={3} mt="sm">{title}</Title>
      {description && <Text c="dimmed" size="sm" maw={420}>{description}</Text>}
      {action}
    </Stack>
  );
}
