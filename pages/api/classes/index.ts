import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { classSchema, parseOrThrow } from "@/lib/validation/schemas";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const yearId = req.query.academicYearId as string | undefined;
    return repo.list("classes", yearId ? [["academicYearId", yearId]] : []);
  },
  POST: async (req) => {
    await requireAdmin(req);
    const key = (req.body ?? {}).idempotencyKey as string | undefined;
    let input;
    try { input = parseOrThrow(classSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    return repo.createWithKey("classes", { ...input }, key);
  },
}, { etag: { GET: ["classes"] } });
