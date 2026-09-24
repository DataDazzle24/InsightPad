import { readFile, writeFile } from "node:fs/promises";

const packageUrl = new URL("../functions/src/dataconnect-admin-generated/package.json", import.meta.url);
const contents = await readFile(packageUrl, "utf8");
const manifest = JSON.parse(contents);

if (manifest.name !== "@insightpad/dataconnect-admin") {
  throw new Error("O manifesto gerado do Data Connect não é o pacote administrativo esperado.");
}

const peer = manifest.peerDependencies?.["firebase-admin"];
if (typeof peer !== "string" || (!peer.includes("^13.") && !peer.includes("^14."))) {
  throw new Error(`Peer firebase-admin inesperado no SDK gerado: ${String(peer)}`);
}

if (!peer.includes("^14.")) {
  manifest.peerDependencies["firebase-admin"] = `${peer} || ^14.0.0`;
  await writeFile(packageUrl, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

// Firebase's generator occasionally leaves spaces at the end of placeholder
// lines in documentation and JavaScript. Normalize only generated files so
// repeated SDK generation remains deterministic and release diffs stay clean.
for (const relativePath of [
  "../frontend/src/dataconnect-generated/README.md",
  "../frontend/src/dataconnect-generated/react/README.md",
  "../frontend/src/dataconnect-generated/esm/index.esm.js",
  "../frontend/src/dataconnect-generated/index.cjs.js",
  "../frontend/src/dataconnect-generated/react/esm/index.esm.js",
  "../frontend/src/dataconnect-generated/react/index.cjs.js",
  "../functions/src/dataconnect-admin-generated/esm/index.esm.js",
  "../functions/src/dataconnect-admin-generated/index.cjs.js",
]) {
  const url = new URL(relativePath, import.meta.url);
  const generated = await readFile(url, "utf8");
  const normalized = generated.replace(/[ \t]+$/gm, "");
  if (normalized !== generated) await writeFile(url, normalized, "utf8");
}
