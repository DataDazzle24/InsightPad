export const EMAIL_DOMAIN_SUGGESTIONS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com.br",
  "yahoo.com",
  "live.com",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "proton.me",
  "protonmail.com",
] as const;

export function getEmailSuggestions(value: string, limit = 8): string[] {
  const compact = value.trim().replace(/\s/g, "");
  const atIndex = compact.indexOf("@");

  if (
    atIndex <= 0 ||
    atIndex !== compact.lastIndexOf("@") ||
    limit <= 0
  ) {
    return [];
  }

  const localPart = compact.slice(0, atIndex);
  const typedDomain = compact.slice(atIndex + 1).toLocaleLowerCase("pt-BR");

  return EMAIL_DOMAIN_SUGGESTIONS
    .filter(
      (domain) =>
        domain.startsWith(typedDomain) && domain !== typedDomain,
    )
    .slice(0, limit)
    .map((domain) => `${localPart}@${domain}`);
}
