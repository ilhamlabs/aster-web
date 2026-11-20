import { createReadStream } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version ?? ""))
  throw new Error("Usage: node scripts/update-downloads.mjs 0.4.0");
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("downloads.json", root), "utf8"),
);
manifest.version = version;
manifest.releaseDate = new Date().toISOString().slice(0, 10);
const sums = [];
for (const [key, item] of Object.entries(manifest.platforms)) {
  const extension = key.startsWith("mac-")
    ? "dmg"
    : key === "win-x64"
      ? "exe"
      : "AppImage";
  const filename = `Aster-${version}-${key}.${extension}`;
  const path = new URL("downloads/" + filename, root);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  item.filename = filename;
  item.url = `https://media.githubusercontent.com/media/ilhamlabs/aster-web/main/downloads/${filename}`;
  item.sha256 = hash.digest("hex");
  item.size = (await stat(path)).size;
  sums.push(`${item.sha256}  ${filename}`);
}
await writeFile(
  new URL("downloads.json", root),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  new URL("downloads/SHA256SUMS.txt", root),
  sums.join("\n") + "\n",
);
console.log(
  `Updated metadata and SHA-256 checksums for all four v${version} installers.`,
);
