import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/id";

dayjs.extend(customParseFormat);
dayjs.locale("id");

/** "4 Mei 2026" — falls back to the raw value if unparseable, "-" if empty. */
export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("D MMMM YYYY") : value;
}

/** "4 Mei 2026 14.30" — falls back to raw value if unparseable, "-" if empty. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("D MMMM YYYY HH.mm") : value;
}
