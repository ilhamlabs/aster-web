import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(
  await readFile(new URL("../downloads.json", import.meta.url), "utf8"),
);
for (const [key, item] of Object.entries(data.platforms)) {
  const response = await fetch(item.url, {
    headers: { Range: "bytes=0-127" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.ok(
    response.ok,
    `${key}: HTTP ${response.status}. The repository must be public for anonymous downloads.`,
  );
  const reader = response.body.getReader();
  const first = await reader.read();
  await reader.cancel();
  const bytes = Buffer.from(first.value ?? []);
  const text = bytes.subarray(0, 120).toString();
  assert.ok(
    !text.startsWith("version https://git-lfs.github.com"),
    `${key}: received an LFS pointer instead of an installer.`,
  );
  assert.ok(
    !/^(?:<!doctype|<html|\{"error)/i.test(text.trim()),
    `${key}: received an error page instead of an installer.`,
  );
  assert.ok(bytes.length > 0, `${key}: empty download.`);
  if (key === "win-x64") assert.equal(bytes.subarray(0, 2).toString(), "MZ");
  if (key === "linux-x64")
    assert.equal(bytes.subarray(0, 4).toString(), "\x7fELF");
  console.log(`${key}: actual installer bytes served (${response.status}).`);
}
const sums = await fetch(data.checksumsUrl, {
  signal: AbortSignal.timeout(30_000),
});
assert.ok(sums.ok, "Checksums file is not publicly available.");
const body = await sums.text();
for (const item of Object.values(data.platforms))
  assert.ok(
    body.includes(`${item.sha256}  ${item.filename}`),
    "Published checksum file differs from the manifest.",
  );
console.log("All four public download endpoints and checksums passed.");
