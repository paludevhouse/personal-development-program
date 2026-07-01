import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type DraftValue = Record<string, unknown>;

interface DraftState {
  drafts: Record<string, DraftValue>;
  setDraft: (key: string, value: DraftValue) => void;
  getDraft: (key: string) => DraftValue | undefined;
  clearDraft: (key: string) => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    immer((set, get) => ({
      drafts: {},
      setDraft: (key, value) => set((s) => { s.drafts[key] = value; }),
      getDraft: (key) => get().drafts[key],
      clearDraft: (key) => set((s) => { delete s.drafts[key]; }),
    })),
    {
      name: "pedevpro-form-drafts",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage))),
    },
  ),
);
