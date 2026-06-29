import { serialize } from "cookie";
import { methods } from "@/lib/api/respond";

export default methods({
  POST: async (_req, res) => {
    res.setHeader("Set-Cookie", serialize("session", "", { path: "/", maxAge: 0 }));
    res.status(200).json({ ok: true });
  },
});
