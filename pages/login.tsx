import { useState } from "react";
import { useRouter } from "next/router";
import { Anchor, Button, Card, PasswordInput, Text, TextInput, Title, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useLogin } from "@/lib/hooks/useLogin";
import type { NextPageWithLayout } from "@/pages/_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function submit() {
    login.mutate(
      { email, password },
      {
        onSuccess: () => router.push("/"),
        onError: () => notifications.show({ color: "red", message: "Email atau kata sandi salah" }),
      }
    );
  }

  return (
    <Card maw={400} mx="auto" mt={120} withBorder padding="lg">
      <Stack>
        <img src="/logo-mdc.png" alt="MDC" height={48} style={{ height: 48, width: "auto", alignSelf: "center" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <Title order={2}>Masuk</Title>
        <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        <PasswordInput label="Kata Sandi" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
        <Button loading={login.isPending} onClick={submit}>Masuk</Button>
        <Text size="xs" c="dimmed" ta="center">
          Dibuat oleh <Anchor href="https://paludevhouse.site" target="_blank" rel="noopener noreferrer" size="xs">Palu Dev House</Anchor>
        </Text>
      </Stack>
    </Card>
  );
};

LoginPage.getLayout = (page) => page; // no app shell on the login page
export default LoginPage;
