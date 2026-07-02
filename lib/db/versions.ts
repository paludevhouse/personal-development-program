import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../firebase/admin";

const DOC = () => getDb().collection("meta").doc("versions");

export async function bumpVersion(...cols: string[]) {
  const patch: Record<string, FieldValue> = {};
  for (const c of cols) patch[c] = FieldValue.increment(1);
  await DOC().set(patch, { merge: true });
}

export async function getVersions(cols: string[]): Promise<string> {
  const snap = await DOC().get();
  const d = snap.data() ?? {};
  return cols.map((c) => `${c}:${d[c] ?? 0}`).join(",");
}
