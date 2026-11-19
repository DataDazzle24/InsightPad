import { describe, expect, it } from "vitest";
import { cents, decimalCents, money, quantity, splitCents } from "./money";
import { calendarRange, advanceCalendar } from "./calendarDates";
describe("Encomendas e Comandas: valores exatos", () => {
  it("preserva Int64 e centavos sem divisão binária", () => {
    expect(cents("92.233.720.368.547.758,07")).toBe("9223372036854775807");
    expect(decimalCents("9223372036854775807")).toBe("92233720368547758,07");
    expect(money("9007199254740991")).toBe("R$ 90.071.992.547.409,91");
  });
  it.each([
    ["100,00", "10000"],
    ["10.50", "1050"],
    ["1.234,56", "123456"],
    ["1.000", "100000"],
    ["0,01", "1"],
  ])("interpreta %s com separador explícito", (input, result) =>
    expect(cents(input)).toBe(result),
  );
  it.each(["", "-1", "NaN", "1,234", "1234.567", "92.233.720.368.547.758,08"])(
    "recusa dinheiro inválido ou overflow %s",
    (value) => expect(() => cents(value)).toThrow(),
  );
  it("conserva todos os centavos nos restos finais", () => {
    expect(splitCents("10000", 3)).toEqual(["3333", "3333", "3334"]);
    expect(splitCents("2800", 3)).toEqual(["933", "933", "934"]);
    expect(
      splitCents("9007199254740993", 12).reduce(
        (sum, x) => sum + BigInt(x),
        0n,
      ),
    ).toBe(9007199254740993n);
  });
  it("não admite fração para unidade indivisível nem arredonda casas excedentes", () => {
    expect(quantity("1,125", true)).toBe("1.125");
    for (const input of ["1.5", "0", "1000", "1.0001"])
      expect(() => quantity(input, false)).toThrow();
    expect(() => quantity("1.0001", true)).toThrow();
  });
  it("limita partes a inteiros de 1 a 12", () => {
    for (const parts of [0, 13, 1.5, NaN])
      expect(() => splitCents("10000", parts)).toThrow();
  });
  it("calendário atravessa mês e ano sem depender do fuso do navegador", () => {
    expect(calendarRange("2026-12-31", "MONTH")).toEqual({
      from: "2026-11-29",
      to: "2027-01-09",
    });
    expect(advanceCalendar("2026-12-31", "MONTH", 1)).toBe("2027-01-01");
    expect(advanceCalendar("2026-12-31", "WEEK", 1)).toBe("2027-01-07");
  });
});
