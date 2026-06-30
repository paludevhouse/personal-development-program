import axios from "axios";

/** Best-effort human message from any thrown error (axios/API/Error). */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.response?.status === 401) return "Sesi berakhir. Silakan masuk kembali.";
    if (error.response && error.response.status >= 500) return "Terjadi kesalahan pada server.";
    return error.message || "Terjadi kesalahan jaringan.";
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan.";
}

/** HTTP status code from an axios error, or null if not an HTTP error. */
export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) return error.response?.status ?? null;
  return null;
}
