import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { wawancaraSchema, parseOrThrow } from "@/lib/validation/schemas";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const item = await repo.get("wawancara", req.query.id as string);
    if (!item) throw new ApiError(404, "not found");
    return item;
  },
  PUT: async (req) => {
    await requireAdmin(req);
    let input;
    try { input = parseOrThrow(wawancaraSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    return repo.update("wawancara", req.query.id as string, { ...input });
  },
  DELETE: async (req) => {
    await requireAdmin(req);
    return repo.remove("wawancara", req.query.id as string);
  },
});
