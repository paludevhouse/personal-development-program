import type { NextApiRequest } from "next";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../firebase/admin";
import { ApiError } from "../api/respond";

export async function requireAdmin(req: NextApiRequest) {
  getDb(); // ensure admin app initialized
  const cookie = req.cookies.session;
  if (!cookie) throw new ApiError(401, "Unauthorized");
  try {
    return await getAuth().verifySessionCookie(cookie, true);
  } catch {
    throw new ApiError(401, "Unauthorized");
  }
}

export async function createSessionCookie(idToken: string) {
  getDb();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  return getAuth().createSessionCookie(idToken, { expiresIn });
}
