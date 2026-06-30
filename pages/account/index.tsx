import { useState, useEffect } from "react";
import { Avatar, Button, Card, Group, PasswordInput, Stack, Text, Title, Badge } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getClientAuth } from "@/lib/firebase/client";
import { useChangePassword } from "@/lib/hooks/useChangePassword";
import { EnvelopeSimple, UserCircle } from "@phosphor-icons/react";

export default function AccountPage() {
  const change = useChangePassword();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [uid, setUid] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const user = getClientAuth().currentUser;
    if (user) {
      setEmail(user.email ?? "");
      setDisplayName(user.displayName ?? "");
      setUid(user.uid ?? "");
    }
  }, []);

  function submit() {
    if (newPassword.length < 6) { notifications.show({ color: "red", message: "Kata sandi baru minimal 6 karakter" }); return; }
    if (newPassword !== confirm) { notifications.show({ color: "red", message: "Konfirmasi kata sandi tidak cocok" }); return; }
    change.mutate({ currentPassword, newPassword }, {
      onSuccess: () => { notifications.show({ color: "green", message: "Kata sandi berhasil diubah" }); setCurrentPassword(""); setNewPassword(""); setConfirm(""); },
      onError: () => notifications.show({ color: "red", message: "Gagal mengubah kata sandi. Periksa kata sandi saat ini." }),
    });
  }

  return (
    <Stack maw={520}>
      <Title order={2}>Akun</Title>

      <Card withBorder padding="lg" radius="md">
        <Group>
          <Avatar size="lg" color="brand" radius="xl">
            <UserCircle size={40} weight="duotone" />
          </Avatar>
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={600} size="lg">{displayName || "Admin"}</Text>
            <Group gap="xs">
              <EnvelopeSimple size={14} weight="bold" />
              <Text size="sm" c="dimmed">{email}</Text>
            </Group>
            <Group gap="xs">
              <Badge variant="light" size="sm">Admin</Badge>
              <Text size="xs" c="dimmed">UID: {uid.slice(0, 12)}...</Text>
            </Group>
          </Stack>
        </Group>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Stack>
          <Title order={4}>Ubah Kata Sandi</Title>
          <PasswordInput label="Kata Sandi Saat Ini" value={currentPassword} onChange={(e) => setCurrentPassword(e.currentTarget.value)} />
          <PasswordInput label="Kata Sandi Baru" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} />
          <PasswordInput label="Konfirmasi Kata Sandi Baru" value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} />
          <Button loading={change.isPending} onClick={submit}>Simpan</Button>
        </Stack>
      </Card>
    </Stack>
  );
}
