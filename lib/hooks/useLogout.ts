import { useMutation } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { http } from "@/lib/api/http";

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await http.post("/api/auth/logout", {});
      await signOut(getClientAuth());
    },
  });
}
