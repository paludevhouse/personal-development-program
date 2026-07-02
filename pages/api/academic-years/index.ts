import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { academicYearSchema, parseOrThrow } from "@/lib/validation/schemas";
import { deactivateOthers } from "@/lib/db/academicYears";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    return repo.list("academicYears");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const key = (req.body ?? {}).idempotencyKey as string | undefined;
    let input;
    try { input = parseOrThrow(academicYearSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    const created = await repo.createWithKey("academicYears", { ...input }, key);
    if (input.isActive) await deactivateOthers(created.id);
    return created;
  },
}, { etag: { GET: ["academicYears"] } });
