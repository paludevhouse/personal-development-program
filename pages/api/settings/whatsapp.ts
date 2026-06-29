import { methods } from "@/lib/api/respond";
import { repo } from "@/lib/db/repo";
import { requireAdmin } from "@/lib/auth/session";

const DEFAULT_TEMPLATE =
  "Halo {pic}, mohon mengisi penilaian magang untuk siswa {siswa} di {perusahaan}. Silakan isi melalui tautan berikut: {link}. Terima kasih.";

export default methods({
  GET: async (req) => {
    await requireAdmin(req);
    const doc = await repo.get("settings", "whatsapp");
    return { template: (doc?.template as string) ?? DEFAULT_TEMPLATE };
  },
  PUT: async (req) => {
    await requireAdmin(req);
    const b = req.body ?? {};
    return repo.update("settings", "whatsapp", { template: typeof b.template === "string" ? b.template : DEFAULT_TEMPLATE });
  },
});
