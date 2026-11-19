// Same integer-text convention as financialCsv. No cents pass through Number.
export function integer(value: string): bigint {
  if (!/^\d+$/.test(value)) throw new RangeError("Informe um valor válido.");
  const result = BigInt(value);
  if (result > 9223372036854775807n)
    throw new RangeError("Valor acima do limite permitido.");
  return result;
}
export function money(value: string): string {
  const amount = BigInt(value),
    absolute = amount < 0n ? -amount : amount;
  return `${amount < 0n ? "-" : ""}R$ ${new Intl.NumberFormat("pt-BR").format(absolute / 100n)},${(absolute % 100n).toString().padStart(2, "0")}`;
}
export function cents(draft: string): string {
  const value = draft.trim();
  let normalized: string;
  if (/^\d+\.\d{1,2}$/.test(value)) normalized = value;
  else if (/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(value))
    normalized = value.replaceAll(".", "").replace(",", ".");
  else
    throw new RangeError(
      "Informe o valor em reais, com até duas casas decimais.",
    );
  const [whole, fraction = ""] = normalized.split(".");
  return integer(
    (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))).toString(),
  ).toString();
}
export function decimalCents(value: string): string {
  const n = integer(value);
  return `${n / 100n},${(n % 100n).toString().padStart(2, "0")}`;
}
export function splitCents(value: string, parts: number): string[] {
  const total = integer(value);
  if (!Number.isInteger(parts) || parts < 1 || parts > 12)
    throw new RangeError("Escolha de 1 a 12 partes.");
  const base = total / BigInt(parts),
    rest = Number(total % BigInt(parts));
  return Array.from({ length: parts }, (_, i) =>
    (base + BigInt(i >= parts - rest)).toString(),
  );
}
export function quantity(draft: string, weighted: boolean): string {
  const text = draft.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,3})?$/.test(text))
    throw new RangeError("Quantidade inválida.");
  const [whole, fraction = ""] = text.split(".");
  const units = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
  if (units <= 0n || units > 999000n || (!weighted && units % 1000n !== 0n))
    throw new RangeError(
      weighted
        ? "Informe até 999, com três casas decimais."
        : "Informe uma quantidade inteira de 1 a 999.",
    );
  return text;
}
export const balance = (total: string, received: string) =>
  (BigInt(total) - BigInt(received)).toString();
export function localDate(value: string, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function dateTime(value: string | null, zone: string): string {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: zone,
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}
