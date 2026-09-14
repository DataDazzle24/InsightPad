const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

export type GroceryIdentifierResult = {
  value: string;
  kind: "EAN" | "SCALE_CODE" | null;
  valid: boolean;
  error: string | null;
};

export function normalizeProductIdentifier(value?: string | null): string {
  return String(value ?? "").trim();
}

export function isValidGtin(value?: string | null): boolean {
  const digits = normalizeProductIdentifier(value);
  if (!GTIN_LENGTHS.has(digits.length) || !/^\d+$/.test(digits)) return false;

  const checkDigit = Number(digits.at(-1));
  let sum = 0;
  for (let index = digits.length - 2, weight = 3; index >= 0; index -= 1, weight = weight === 3 ? 1 : 3) {
    sum += Number(digits[index]) * weight;
  }
  return checkDigit === (10 - (sum % 10)) % 10;
}

export function isValidScaleCode(value?: string | null): boolean {
  const code = normalizeProductIdentifier(value);
  return code.length <= 32 && /^[A-Za-z0-9._-]+$/.test(code);
}

export function resolveGroceryIdentifier(ean?: string | null, scaleCode?: string | null): GroceryIdentifierResult {
  const normalizedEan = normalizeProductIdentifier(ean);
  const normalizedScaleCode = normalizeProductIdentifier(scaleCode);

  if (isValidGtin(normalizedEan)) return { value: normalizedEan, kind: "EAN", valid: true, error: null };
  if (isValidScaleCode(normalizedScaleCode)) return { value: normalizedScaleCode, kind: "SCALE_CODE", valid: true, error: null };
  if (normalizedEan) {
    return {
      value: normalizedEan,
      kind: "EAN",
      valid: false,
      error: "O EAN deve ter 8, 12, 13 ou 14 dígitos e um dígito verificador válido.",
    };
  }
  if (normalizedScaleCode) {
    return {
      value: normalizedScaleCode,
      kind: "SCALE_CODE",
      valid: false,
      error: "O código de balança deve ter até 32 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado.",
    };
  }
  return {
    value: "",
    kind: null,
    valid: false,
    error: "Cadastre um EAN válido ou um código de balança no produto antes de vinculá-lo ao iFood Mercado.",
  };
}
