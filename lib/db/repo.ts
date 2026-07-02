import { getDb } from "../firebase/admin";
import { bumpVersion } from "./versions";

type Filter = [field: string, value: unknown];

function doc(d: FirebaseFirestore.DocumentSnapshot) {
  return { id: d.id, ...d.data() } as Record<string, unknown> & { id: string };
}

export const repo = {
  async list(col: string, filters: Filter[] = []) {
    let q: FirebaseFirestore.Query = getDb().collection(col);
    for (const [field, value] of filters) q = q.where(field, "==", value);
    const snap = await q.get();
    return snap.docs.map(doc);
  },
  async get(col: string, id: string) {
    const d = await getDb().collection(col).doc(id).get();
    return d.exists ? doc(d) : null;
  },
  async create(col: string, data: Record<string, unknown>) {
    const ref = await getDb().collection(col).add(data);
    if (col !== "meta") await bumpVersion(col);
    return { id: ref.id, ...data };
  },
  async update(col: string, id: string, data: Record<string, unknown>) {
    await getDb().collection(col).doc(id).set(data, { merge: true });
    if (col !== "meta") await bumpVersion(col);
    return { id, ...data };
  },
  async remove(col: string, id: string) {
    await getDb().collection(col).doc(id).delete();
    if (col !== "meta") await bumpVersion(col);
    return { ok: true };
  },
  async createWithId(col: string, id: string, data: Record<string, unknown>) {
    const ref = getDb().collection(col).doc(id);
    const snap = await ref.get();
    if (snap.exists) throw new Error("exists");
    await ref.set(data);
    if (col !== "meta") await bumpVersion(col);
    return { id, ...data };
  },
  async createWithKey(col: string, data: Record<string, unknown>, key?: string) {
    if (key) {
      const existing = await repo.list(col, [["idempotencyKey", key]]);
      if (existing.length) return existing[0];
      return repo.create(col, { ...data, idempotencyKey: key });
    }
    return repo.create(col, data);
  },
};
