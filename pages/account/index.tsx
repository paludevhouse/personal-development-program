import { useState, useEffect } from "react";
import { Button, Card, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getClientAuth } from "@/lib/firebase/client";
import { useChangePassword } from "@/lib/hooks/useChangePassword";

export default function AccountPage() {
  const change = useChangePassword();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  useEffect(() => { setEmail(getClientAuth().currentUser?.email ?? ""); }, []);

  function submit() {
    if (newPassword.length < 6) { notifications.show({ color: "red", message: "Kata sandi baru minimal 6 karakter" }); return; }
    if (newPassword !== confirm) { notifications.show({ color: "red", message: "Konfirmasi kata sandi tidak cocok" }); return; }
    change.mutate({ currentPassword, newPassword }, {
      onSuccess: () => { notifications.show({ color: "green", message: "Kata sandi berhasil diubah" }); setCurrentPassword(""); setNewPassword(""); setConfirm(""); },
      onError: () => notifications.show({ color: "red", message: "Gagal mengubah kata sandi. Periksa kata sandi saat ini." }),
    });
  }

  return (
    <Stack maw={460}>
      <div>
        <Title order={2}>Akun</Title>
        <Text c="dimmed" size="sm">{email}</Text>
      </div>
      <Card withBorder padding="lg">
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
