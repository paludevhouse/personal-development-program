import { useState } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { Button, Card, PasswordInput, TextInput, Title, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { NextPageWithLayout } from "@/pages/_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("login gagal");
      router.push("/");
    } catch {
      notifications.show({ color: "red", message: "Email atau kata sandi salah" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card maw={400} mx="auto" mt={120} withBorder padding="lg">
      <Stack>
        <Title order={2}>Masuk</Title>
        <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        <PasswordInput label="Kata Sandi" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
        <Button loading={loading} onClick={submit}>Masuk</Button>
      </Stack>
    </Card>
  );
};

LoginPage.getLayout = (page) => page; // no app shell on the login page
export default LoginPage;
