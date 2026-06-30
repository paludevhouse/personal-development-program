import { describe, it, expect } from "vitest";
import axios from "axios";
import { getErrorMessage } from "./errorMessage";

function makeAxiosError(status: number, data?: unknown, message = "network error") {
  const err = Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data },
  });
  // Make axios.isAxiosError recognise it
  return err as unknown as ReturnType<typeof axios.create> extends never ? never : Parameters<typeof axios.isAxiosError>[0];
}

describe("getErrorMessage", () => {
  it("returns response.data.error when present", () => {
    const err = makeAxiosError(400, { error: "Email sudah terdaftar" });
    expect(getErrorMessage(err)).toBe("Email sudah terdaftar");
  });

  it("returns server error message for 500+", () => {
    const err = makeAxiosError(500, {});
    expect(getErrorMessage(err)).toBe("Terjadi kesalahan pada server.");
  });

  it("returns session-expired message for 401 without data.error", () => {
    const err = makeAxiosError(401, {});
    expect(getErrorMessage(err)).toBe("Sesi berakhir. Silakan masuk kembali.");
  });

  it("returns Error.message for plain Error", () => {
    expect(getErrorMessage(new Error("Something went wrong"))).toBe("Something went wrong");
  });

  it("returns fallback for unknown error types", () => {
    expect(getErrorMessage("some string error")).toBe("Terjadi kesalahan.");
    expect(getErrorMessage(null)).toBe("Terjadi kesalahan.");
    expect(getErrorMessage(undefined)).toBe("Terjadi kesalahan.");
    expect(getErrorMessage(42)).toBe("Terjadi kesalahan.");
  });
});
