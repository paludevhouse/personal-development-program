/** Normalize an Indonesian phone number to a wa.me chat URL, or null if it has no digits. */
export function waLink(phone: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("0")) normalized = "62" + normalized.slice(1);
  else if (!normalized.startsWith("62")) normalized = "62" + normalized;
  return `https://wa.me/${normalized}`;
}
