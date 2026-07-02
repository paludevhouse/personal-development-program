import { Stack, Skeleton } from "@mantine/core";

export function LoadingView() {
  return (
    <Stack py={24} px="md" gap="sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height={36} radius="sm" />
      ))}
    </Stack>
  );
}
