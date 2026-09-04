import { describe, expect, it } from "vitest";
import {
  EMAIL_DOMAIN_SUGGESTIONS,
  getEmailSuggestions,
} from "./emailSuggestions";

describe("email suggestions", () => {
  it("offers common domains immediately after the at sign", () => {
    const suggestions = getEmailSuggestions("cliente@");

    expect(suggestions).toHaveLength(8);
    expect(suggestions[0]).toBe("cliente@gmail.com");
    expect(suggestions).toContain("cliente@outlook.com");
  });

  it("filters suggestions by the domain already typed", () => {
    expect(getEmailSuggestions("cliente@out")).toEqual([
      "cliente@outlook.com",
    ]);
    expect(getEmailSuggestions("cliente@yahoo.com.")).toEqual([
      "cliente@yahoo.com.br",
    ]);
  });

  it("does not suggest an already complete or malformed address", () => {
    expect(getEmailSuggestions("cliente@gmail.com")).toEqual([]);
    expect(getEmailSuggestions("@gmail")).toEqual([]);
    expect(getEmailSuggestions("cliente@@gmail")).toEqual([]);
  });

  it("respects a custom result limit", () => {
    expect(getEmailSuggestions("cliente@", 3)).toEqual(
      EMAIL_DOMAIN_SUGGESTIONS.slice(0, 3).map(
        (domain) => `cliente@${domain}`,
      ),
    );
  });
});
