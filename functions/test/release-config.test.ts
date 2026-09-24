import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repository = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, repository), "utf8");

describe("release 1.0 configuration gates", () => {
  it("keeps production Firebase resources explicitly separated from DEV", () => {
    const rc = JSON.parse(read(".firebaserc.production"));
    const firebase = JSON.parse(read("firebase.production.json"));

    expect(rc.projects.default).toBe("insightpad-dd");
    expect(firebase.hosting.site).toBe("insightpad-dd");
    expect(firebase.functions.runtime).toBe("nodejs22");
    expect(firebase.dataconnect.source).toBe("dataconnect");
    expect(`${JSON.stringify(rc)}${JSON.stringify(firebase)}`).not.toContain("insightpad-dd-dev");
  });

  it("requires App Check in production without embedding a private secret", () => {
    const frontendExample = read("frontend/.env.production.example");
    const functionsExample = read("functions/.env.insightpad-dd.example");
    const client = read("frontend/src/lib/firebase.ts");
    const server = read("functions/src/index.ts");

    expect(frontendExample).toContain("VITE_FIREBASE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY=");
    expect(functionsExample).toContain("ENFORCE_APP_CHECK=true");
    expect(client).toContain("ReCaptchaEnterpriseProvider");
    expect(server).toContain("enforceAppCheck");
    expect(server).not.toMatch(/IFOOD_SERVICE_ACCOUNT[\s\S]{0,200}default:/);
  });

  it("keeps the production preflight non-deploying and branch-gated", () => {
    const script = read("scripts/validate-ifood-production.sh");

    expect(script).toContain('PRODUCTION_BRANCH="release/production-v1"');
    expect(script).toContain("ENFORCE_APP_CHECK");
    expect(script).not.toMatch(/firebase(?:-tools)?[^\n]*(?:deploy|sql:migrate)/);
  });
});
