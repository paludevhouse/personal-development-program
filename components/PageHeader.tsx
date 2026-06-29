import { Stack, Title, Text } from "@mantine/core";
import { useRouter } from "next/router";
import { routeMeta } from "@/lib/routes";

export function PageHeader() {
  const { pathname } = useRouter();
  const meta = routeMeta(pathname);
  return (
    <Stack gap={2} mb="sm">
      <Title order={2}>{meta.title}</Title>
      {meta.description && <Text c="dimmed" size="sm">{meta.description}</Text>}
    </Stack>
  );
}
