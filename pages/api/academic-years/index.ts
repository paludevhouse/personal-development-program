import { methods, ApiError } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";
import { academicYearSchema, parseOrThrow } from "@/lib/validation/schemas";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    return repo.list("academicYears");
  },
  POST: async (req) => {
    await requireAdmin(req);
    let input;
    try { input = parseOrThrow(academicYearSchema, req.body ?? {}); }
    catch (e) { throw new ApiError(400, (e as Error).message); }
    return repo.create("academicYears", { ...input });
  },
});
