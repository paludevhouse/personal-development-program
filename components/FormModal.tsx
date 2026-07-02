import { ReactNode, forwardRef, useImperativeHandle, useState } from "react";
import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Plus } from "@phosphor-icons/react";

interface FormModalProps {
  title: string;
  buttonLabel?: string;
  children: (close: () => void, opts: { loading: boolean; setLoading: (v: boolean) => void }) => ReactNode;
}

export interface FormModalHandle {
  open: () => void;
}

export const FormModal = forwardRef<FormModalHandle, FormModalProps>(function FormModal(
  { title, buttonLabel = "Tambah", children },
  ref
) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({ open }), [open]);

  const safeClose = () => {
    if (!loading) {
      close();
    }
  };

  return (
    <>
      <Button onClick={open} leftSection={<Plus size={16} weight="bold" />}>{buttonLabel}</Button>
      <Modal
        opened={opened}
        onClose={safeClose}
        title={title}
        centered
        closeOnClickOutside={false}
        closeOnEscape={!loading}
      >
        {children(safeClose, { loading, setLoading })}
      </Modal>
    </>
  );
});
