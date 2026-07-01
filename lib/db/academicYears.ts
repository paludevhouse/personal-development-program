import { repo } from "@/lib/db/repo";

export async function deactivateOthers(activeId: string) {
  const all = await repo.list("academicYears", [["isActive", true]]);
  await Promise.all(
    all.filter((y) => y.id !== activeId).map((y) => repo.update("academicYears", y.id as string, { isActive: false })),
  );
}
