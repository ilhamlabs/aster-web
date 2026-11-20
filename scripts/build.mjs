import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of [
  "index.html",
  "privacy.html",
  "styles.css",
  "app.js",
  "downloads.json",
  "assets",
]) {
  await cp(new URL("../" + name, import.meta.url), new URL(name, output), {
    recursive: true,
  });
}
await writeFile(new URL(".nojekyll", output), "");
const manifest = JSON.parse(
  await readFile(new URL("downloads.json", output), "utf8"),
);
console.log(
  `Built Aster website for v${manifest.version} in dist/. Installers are served directly from Git LFS.`,
);
