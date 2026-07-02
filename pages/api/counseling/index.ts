import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { counselingSchema, parseOrThrow } from "@/lib/validation/schemas";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const studentId = req.query.studentId as string | undefined;
    return repo.list("counseling", studentId ? [["studentId", studentId]] : []);
  },
  POST: async (req) => {
    await requireAdmin(req);
    const key = (req.body ?? {}).idempotencyKey as string | undefined;
    let input;
    try { input = parseOrThrow(counselingSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    return repo.createWithKey("counseling", { ...input }, key);
  },
}, { etag: { GET: ["counseling"] } });
