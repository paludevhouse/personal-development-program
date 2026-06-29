import { serialize } from "cookie";
import { methods, ApiError } from "@/lib/api/respond";
import { createSessionCookie } from "@/lib/auth/session";

export default methods({
  POST: async (req, res) => {
    const { idToken } = req.body ?? {};
    if (!idToken) throw new ApiError(400, "missing token");
    try {
      const cookie = await createSessionCookie(idToken);
      res.setHeader("Set-Cookie", serialize("session", cookie, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 5,
      }));
      res.status(200).json({ ok: true });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(401, "invalid token");
    }
  },
});
