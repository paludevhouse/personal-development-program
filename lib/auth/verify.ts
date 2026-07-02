import type { NextApiRequest } from "next";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../firebase/admin";

/**
 * Cheap local session check (JWT verify, NO revocation lookup) used to gate
 * ETag 304 short-circuits so unauthenticated clients can't probe collection
 * freshness. The full requireAdmin (with revocation check) still runs inside
 * the handler on every cache miss.
 */
export async function hasValidSession(req: NextApiRequest): Promise<boolean> {
  const cookie = req.cookies?.session;
  if (!cookie) return false;
  try {
    getDb(); // ensure admin app initialized
    await getAuth().verifySessionCookie(cookie);
    return true;
  } catch {
    return false;
  }
}
