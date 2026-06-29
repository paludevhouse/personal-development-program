import { ReactNode } from "react";
import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Plus } from "@phosphor-icons/react";

export function FormModal({
  title,
  buttonLabel = "Tambah",
  children,
}: {
  title: string;
  buttonLabel?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Button onClick={open} leftSection={<Plus size={16} weight="bold" />}>{buttonLabel}</Button>
      <Modal opened={opened} onClose={close} title={title} centered>
        {children(close)}
      </Modal>
    </>
  );
}
