import { describe, it, expect } from "vitest";
import { parseStudentRows } from "./parseStudents";

describe("parseStudentRows", () => {
  it("maps Indonesian headers to fields", () => {
    const out = parseStudentRows([
      { "Nama Lengkap": "Aaron Oen", "NIS": "00909", "Jenis Kelamin": "L" },
    ]);
    expect(out[0]).toEqual({
      namaSiswa: "Aaron Oen", nis: "00909", gender: "L",
    });
  });

  it("defaults gender to L", () => {
    const out = parseStudentRows([{ "Nama Siswa": "Budi", "NIS": "1" }]);
    expect(out[0].gender).toBe("L");
  });

  it("parses Perempuan / P to gender P", () => {
    expect(parseStudentRows([{ "Nama Siswa": "Sari", "NIS": "2", "Jenis Kelamin": "Perempuan" }])[0].gender).toBe("P");
    expect(parseStudentRows([{ "Nama Siswa": "Sari", "NIS": "3", "Gender": "P" }])[0].gender).toBe("P");
  });

  it("skips rows without a name", () => {
    expect(parseStudentRows([{ "NIS": "9" }, { "Nama Siswa": "Ada", "NIS": "10" }])).toHaveLength(1);
  });

  it("coerces numeric NIS to string", () => {
    expect(parseStudentRows([{ "Nama Siswa": "X", "NIS": 12345 }])[0].nis).toBe("12345");
  });
});
