const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
function closeMenu(restoreFocus = false) {
  if (!menu || !navigation) return;
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
  menu.querySelector("use").setAttribute("href", "./assets/icons.svg#menu");
  if (restoreFocus) menu.focus();
}
menu?.addEventListener("click", () => {
  const opening = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(opening));
  menu.setAttribute(
    "aria-label",
    opening ? "Close navigation" : "Open navigation",
  );
  navigation.classList.toggle("is-open", opening);
  menu
    .querySelector("use")
    .setAttribute("href", `./assets/icons.svg#${opening ? "close" : "menu"}`);
});
navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu?.getAttribute("aria-expanded") === "true")
    closeMenu(true);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
window.matchMedia("(min-width: 521px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

const tabs = [...document.querySelectorAll("[data-scenario]")];
function selectScenario(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  document
    .querySelector("#scenario-panel")
    ?.setAttribute("aria-labelledby", tab.id);
  for (const scene of document.querySelectorAll("[data-scene]")) {
    scene.hidden = scene.dataset.scene !== tab.dataset.scenario;
  }
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectScenario(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (["ArrowDown", "ArrowRight"].includes(event.key))
      next = (index + 1) % tabs.length;
    if (["ArrowUp", "ArrowLeft"].includes(event.key))
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectScenario(tabs[next], true);
    }
  });
});

let manifest;
const architectures = [
  ...document.querySelectorAll('input[name="mac-architecture"]'),
];
const macLink = document.querySelector("#mac-download");
let macChoiceMade = false;
function fileDescription(key) {
  const file = manifest?.platforms?.[key];
  const base =
    key === "mac-arm64"
      ? "Apple Silicon · .dmg"
      : key === "mac-x64"
        ? "Intel · .dmg"
        : key === "win-x64"
          ? "x64 · .exe"
          : "x86_64 · .AppImage";
  return file?.size
    ? `${base} · ${(file.size / 1_000_000).toFixed(0)} MB`
    : base;
}
function setMacArchitecture(key) {
  if (!["mac-arm64", "mac-x64"].includes(key)) return;
  for (const input of architectures) input.checked = input.value === key;
  if (macLink) {
    macLink.dataset.download = key;
    macLink.href =
      manifest?.platforms?.[key]?.url ??
      `https://media.githubusercontent.com/media/ilhamlabs/aster-web/main/downloads/Aster-0.4.1-${key}.dmg`;
    macLink.setAttribute(
      "aria-label",
      `Download for macOS, ${key === "mac-arm64" ? "Apple Silicon" : "Intel"}`,
    );
  }
  const metadata = document.querySelector("#mac-file-meta");
  if (metadata) metadata.textContent = fileDescription(key);
}
architectures.forEach((input) =>
  input.addEventListener("change", () => {
    macChoiceMade = true;
    setMacArchitecture(input.value);
  }),
);

const platformText =
  navigator.userAgentData?.platform ?? navigator.platform ?? "";
const agent = navigator.userAgent;
const platform =
  /mac/i.test(platformText) && !/iphone|ipad|ipod/i.test(agent)
    ? "mac"
    : /win/i.test(platformText)
      ? "windows"
      : /linux/i.test(platformText) &&
          !/android|aarch64|armv7|arm64/i.test(agent)
        ? "linux"
        : null;
if (platform) {
  const recommended = document.querySelector(
    `[data-recommended="${platform}"]`,
  );
  if (recommended) recommended.hidden = false;
  document
    .querySelector(`[data-platform-card="${platform}"]`)
    ?.classList.add("is-recommended");
}
if (platform === "mac" && navigator.userAgentData?.getHighEntropyValues) {
  navigator.userAgentData
    .getHighEntropyValues(["architecture"])
    .then(({ architecture }) => {
      if (macChoiceMade) return;
      if (architecture === "arm") setMacArchitecture("mac-arm64");
      if (architecture === "x86") setMacArchitecture("mac-x64");
    })
    .catch(() => {});
}

async function loadDownloads() {
  try {
    const response = await fetch(
      new URL("./downloads.json?v=0.4.1", import.meta.url),
      { cache: "no-cache" },
    );
    if (!response.ok) return;
    manifest = await response.json();
    const allowed = new Set(["mac-arm64", "mac-x64", "win-x64", "linux-x64"]);
    for (const link of document.querySelectorAll("[data-download]")) {
      const key = link.dataset.download;
      const url = manifest.platforms?.[key]?.url;
      if (
        allowed.has(key) &&
        url?.startsWith(
          "https://media.githubusercontent.com/media/ilhamlabs/aster-web/",
        )
      )
        link.href = url;
    }
    for (const node of document.querySelectorAll("[data-file-meta]"))
      node.textContent = fileDescription(node.dataset.fileMeta);
    setMacArchitecture(
      architectures.find((input) => input.checked)?.value ?? "mac-arm64",
    );
    const hero = document.querySelector(".hero-download");
    const key =
      platform === "windows"
        ? "win-x64"
        : platform === "linux"
          ? "linux-x64"
          : null;
    if (
      hero &&
      key &&
      manifest.platforms?.[key]?.url?.startsWith(
        "https://media.githubusercontent.com/media/ilhamlabs/aster-web/",
      )
    ) {
      hero.href = manifest.platforms[key].url;
      hero.querySelector("span").textContent =
        `Download for ${platform === "windows" ? "Windows" : "Linux"}`;
      hero.dataset.download = key;
    }
  } catch {
    // The HTML already contains working download links when JavaScript or fetch is unavailable.
  }
}
if (macLink) void loadDownloads();
for (const year of document.querySelectorAll("[data-year]"))
  year.textContent = String(new Date().getFullYear());
