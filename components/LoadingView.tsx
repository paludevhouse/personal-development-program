import { Center, Loader } from "@mantine/core";

export function LoadingView() {
  return (
    <Center py={48}>
      <Loader color="brand" />
    </Center>
  );
}
