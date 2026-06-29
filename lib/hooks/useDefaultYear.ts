import { useEffect } from "react";
import { AcademicYear } from "@/lib/types";

/**
 * Preselects the active academic year (or the first available) once the
 * years have loaded and nothing is selected yet. Keeps filter pages from
 * opening with an empty selection.
 */
export function useDefaultYear(
  years: AcademicYear[],
  yearId: string | null,
  setYearId: (id: string) => void,
) {
  useEffect(() => {
    if (!yearId && years.length) {
      const active = years.find((y) => y.isActive) ?? years[0];
      setYearId(active.id);
    }
  }, [years, yearId, setYearId]);
}
