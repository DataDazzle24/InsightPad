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
