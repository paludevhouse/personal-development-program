import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { counselingSchema, parseOrThrow } from "@/lib/validation/schemas";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const item = await repo.get("counseling", req.query.id as string);
    if (!item) throw new ApiError(404, "not found");
    return item;
  },
  PUT: async (req) => {
    await requireAdmin(req);
    let input;
    try { input = parseOrThrow(counselingSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    return repo.update("counseling", req.query.id as string, { ...input });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("counseling", req.query.id as string);
  },
});
