import { useMutation } from "@tanstack/react-query";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export function useChangePassword() {
  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const user = getClientAuth().currentUser;
      if (!user || !user.email) throw new Error("Tidak ada sesi pengguna");
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
    },
  });
}
