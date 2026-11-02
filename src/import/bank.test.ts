import { describe, expect, it } from "vitest";
import { decodificar, leerMovimientos, parseCsv, parseFecha, parseImporte, resumir } from "./bank";

describe("parseImporte", () => {
  it("reads Spanish and other formats", () => {
    expect(parseImporte("1.234,56")).toBe(1234.56);
    expect(parseImporte("-45,00 €")).toBe(-45);
    expect(parseImporte("1,234.56")).toBe(1234.56);
    expect(parseImporte("2.500")).toBe(2500);
    expect(parseImporte("12,5")).toBe(12.5);
    expect(parseImporte("(30,00)")).toBe(-30);
    expect(parseImporte("30,00-")).toBe(-30);
    expect(parseImporte(-12.3)).toBe(-12.3);
    expect(parseImporte("")).toBeNull();
    expect(parseImporte("abc")).toBeNull();
  });
});

describe("parseFecha", () => {
  it("reads dd/mm/yyyy, ISO and Excel serials", () => {
    expect(parseFecha("31/10/2026")).toEqual(new Date(2026, 9, 31));
    expect(parseFecha("05-03-26")).toEqual(new Date(2026, 2, 5));
    expect(parseFecha("2026-01-15")).toEqual(new Date(2026, 0, 15));
    expect(parseFecha(46022)).toEqual(new Date(2025, 11, 31));
    expect(parseFecha("31/02/2026")).toBeNull();
  });
});

describe("leerMovimientos", () => {
  it("finds the header below bank preamble and signed amounts", () => {
    const rows = [["Banco Ejemplo"], ["Cuenta ES00 0000"], [], ["Fecha", "Fecha valor", "Concepto", "Importe", "Saldo"],
      ["02/09/2026", "02/09/2026", "Transferencia cliente Estudio Norte", "1.800,00", "5.000,00"],
      ["05/09/2026", "05/09/2026", "Adobe Creative Cloud", "-60,49", "4.939,51"],
      ["30/09/2026", "30/09/2026", "SEGURIDAD SOCIAL RETA 09/2026", "-302,65", "4.636,86"]];
    const m = leerMovimientos(rows);
    expect(m).toHaveLength(3);
    expect(m[2].incluir).toBe(false);
    expect(m[2].motivo).toMatch(/cuota/i);
    const r = resumir(m);
    expect(r).toEqual([{ mes: 8, year: 2026, ingresos: 1800, gastos: 60.49, n: 2 }]);
  });
  it("supports Debe / Haber columns", () => {
    const rows = [["F. Operación", "Descripción", "Debe", "Haber"], ["01/10/2026", "Factura 12", "", "950,00"], ["03/10/2026", "Hosting", "12,10", ""]];
    expect(resumir(leerMovimientos(rows))).toEqual([{ mes: 9, year: 2026, ingresos: 950, gastos: 12.1, n: 2 }]);
  });
  it("explains when the layout is not a statement", () => {
    expect(() => leerMovimientos([["Nombre", "Apellidos"], ["Ana", "Pérez"]])).toThrow(/columnas de fecha e importe/);
  });
});

describe("parseCsv and decodificar", () => {
  it("handles quotes, comma delimiter and Windows-1252", () => {
    expect(parseCsv('Fecha,Concepto,Importe\n01/10/2026,"Pago, con coma","-1.234,56"')).toEqual([["Fecha", "Concepto", "Importe"], ["01/10/2026", "Pago, con coma", "-1.234,56"]]);
    expect(decodificar(new Uint8Array([0x43, 0x61, 0x66, 0xe9]))).toBe("Café"); // invalid UTF-8 -> 1252
  });
  it("reads Excel files with typed cells through the spreadsheet library", async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([["Fecha", "Concepto", "Importe"], [new Date(2026, 9, 1), "Factura 40", 1200], [new Date(2026, 9, 2), "Hosting", -12.1]]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    const back = XLSX.read(XLSX.write(wb, { type: "array", bookType: "xlsx" }), { type: "array", cellDates: true });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(back.Sheets[back.SheetNames[0]], { header: 1, raw: true, defval: "" });
    expect(resumir(leerMovimientos(rows))).toEqual([{ mes: 9, year: 2026, ingresos: 1200, gastos: 12.1, n: 2 }]);
  });
});

describe("sample statement end to end", () => {
  it("reads public/demo/extracto-ejemplo.csv (semicolons, preamble, UTF-8)", async () => {
    const { readFileSync } = await import("node:fs");
    const m = leerMovimientos(parseCsv(decodificar(readFileSync("public/demo/extracto-ejemplo.csv"))));
    expect(m).toHaveLength(15);
    expect(m.filter((x) => !x.incluir)).toHaveLength(3); // the three RETA payments
    expect(resumir(m)).toEqual([
      { mes: 6, year: 2026, ingresos: 2800, gastos: 205.69, n: 4 },
      { mes: 7, year: 2026, ingresos: 1900, gastos: 99.39, n: 3 },
      { mes: 8, year: 2026, ingresos: 3300, gastos: 296.44, n: 5 },
    ]);
  });
});
