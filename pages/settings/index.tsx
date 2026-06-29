import { useEffect, useState } from "react";
import { Button, Stack, Textarea, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useWhatsappTemplate } from "@/lib/hooks/useWhatsappTemplate";

export default function SettingsPage() {
  const { data, save } = useWhatsappTemplate();
  const [template, setTemplate] = useState("");
  useEffect(() => {
    if (data.data?.template !== undefined) setTemplate(data.data.template);
  }, [data.data?.template]);

  return (
    <Stack maw={640}>
      <Title order={2}>Pengaturan</Title>
      <Text fw={500}>Template Pesan WhatsApp</Text>
      <Text size="sm" c="dimmed">
        Placeholder yang tersedia: {"{pic}"}, {"{siswa}"}, {"{perusahaan}"}, {"{link}"}
      </Text>
      <Textarea minRows={5} autosize value={template} onChange={(e) => setTemplate(e.currentTarget.value)} />
      <Button
        loading={save.isPending}
        onClick={() =>
          save.mutate(template, {
            onSuccess: () => notifications.show({ color: "green", message: "Template disimpan" }),
          })
        }
      >
        Simpan
      </Button>
    </Stack>
  );
}
