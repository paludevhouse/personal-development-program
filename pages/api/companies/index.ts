import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { companySchema, parseOrThrow } from "@/lib/validation/schemas";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    return repo.list("companies");
  },
  POST: async (req) => {
    await requireAdmin(req);
    const key = (req.body ?? {}).idempotencyKey as string | undefined;
    let input;
    try { input = parseOrThrow(companySchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    return repo.createWithKey("companies", { ...input }, key);
  },
});
