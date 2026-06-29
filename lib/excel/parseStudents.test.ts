import { describe, it, expect } from "vitest";
import { parseStudentRows } from "./parseStudents";

describe("parseStudentRows", () => {
  it("maps Indonesian headers to fields", () => {
    const out = parseStudentRows([
      { "Nama Siswa": "Aaron Oen", "Nama Besar": "AARON OEN", "Nama Pendek": "Aaron",
        "Nomor Induk Sekolah": "00909", "NISN": "0082013006", "Jenis Kelamin": "L" },
    ]);
    expect(out[0]).toEqual({
      namaSiswa: "Aaron Oen", namaBesar: "AARON OEN", namaPendek: "Aaron",
      nis: "00909", nisn: "0082013006", gender: "L",
    });
  });

  it("defaults namaBesar to uppercase name and gender to L", () => {
    const out = parseStudentRows([{ "Nama Siswa": "Budi", "NISN": "1" }]);
    expect(out[0].namaBesar).toBe("BUDI");
    expect(out[0].gender).toBe("L");
  });

  it("parses Perempuan / P to gender P", () => {
    expect(parseStudentRows([{ "Nama Siswa": "Sari", "NISN": "2", "Jenis Kelamin": "Perempuan" }])[0].gender).toBe("P");
    expect(parseStudentRows([{ "Nama Siswa": "Sari", "NISN": "3", "Gender": "P" }])[0].gender).toBe("P");
  });

  it("skips rows without a name", () => {
    expect(parseStudentRows([{ "NISN": "9" }, { "Nama Siswa": "Ada", "NISN": "10" }])).toHaveLength(1);
  });

  it("coerces numeric NIS/NISN to string", () => {
    expect(parseStudentRows([{ "Nama Siswa": "X", "NISN": 12345 }])[0].nisn).toBe("12345");
  });
});
