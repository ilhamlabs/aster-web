import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

const root = new URL("../", import.meta.url);
const data = JSON.parse(
  await readFile(new URL("downloads.json", root), "utf8"),
);
const expected = {
  "mac-arm64": "dmg",
  "mac-x64": "dmg",
  "win-x64": "exe",
  "linux-x64": "AppImage",
};
assert.deepEqual(
  Object.keys(data.platforms).sort(),
  Object.keys(expected).sort(),
);
for (const [key, extension] of Object.entries(expected)) {
  const item = data.platforms[key];
  assert.equal(item.filename, `Aster-${data.version}-${key}.${extension}`);
  assert.equal(
    item.url,
    `https://media.githubusercontent.com/media/ilhamlabs/aster-web/main/downloads/${item.filename}`,
  );
  assert.match(
    item.sha256 ?? "",
    /^[a-f0-9]{64}$/,
    `Missing SHA-256 for ${key}`,
  );
  assert.ok(
    Number.isSafeInteger(item.size) && item.size > 1_000_000,
    `Missing size for ${key}`,
  );
  if (process.argv.includes("--installers")) {
    const path = new URL("downloads/" + item.filename, root);
    assert.equal(
      (await stat(path)).size,
      item.size,
      `Installer size mismatch: ${key}`,
    );
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    assert.equal(
      hash.digest("hex"),
      item.sha256,
      `Installer digest mismatch: ${key}`,
    );
  }
}
const html = await readFile(new URL("index.html", root), "utf8");
const script = await readFile(new URL("app.js", root), "utf8");
assert.ok(
  html.includes(`src="./app.js?v=${data.version}"`),
  "The page must request the current release script to refresh cached download links.",
);
assert.ok(
  script.includes(`downloads.json?v=${data.version}`),
  "The script must request the current release manifest.",
);
for (const item of Object.values(data.platforms))
  assert.ok(
    html.includes(item.url),
    "No-JavaScript download URLs must match the release manifest.",
  );
assert.ok(html.includes('name="description"'));
assert.ok(html.includes('name="viewport"'));
assert.ok(
  !html.includes("releases/download/"),
  "Download links must point to the actual LFS binaries.",
);
for (const path of [
  "privacy.html",
  "app.js",
  "styles.css",
  "assets/icons.svg",
  "assets/aster-icon.svg",
  "assets/fonts/dm-sans-latin.woff2",
  "assets/fonts/dm-serif-display-regular-latin.woff2",
  "assets/fonts/dm-serif-display-italic-latin.woff2",
])
  assert.ok((await stat(new URL(path, root))).isFile());
console.log(
  "Website structure, four platform download URLs, version, and checksum metadata verified.",
);
