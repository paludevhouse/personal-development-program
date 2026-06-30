import { useMutation } from "@tanstack/react-query";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { http } from "@/lib/api/http";

export function useLogin() {
  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const idToken = await cred.user.getIdToken();
      await http.post("/api/auth/login", { idToken });
    },
  });
}
