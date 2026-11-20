import { test, expect } from "@playwright/test";

const base =
  "https://media.githubusercontent.com/media/ilhamlabs/aster-web/main/downloads/";

for (const [platform, label, filename] of [
  ["Windows", "Windows", "Aster-0.4.3-win-x64.exe"],
  ["Linux", "Linux", "Aster-0.4.3-linux-x64.AppImage"],
]) {
  test(`offers a direct ${label} download on narrow screens`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.addInitScript((reportedPlatform) => {
      Object.defineProperty(navigator, "userAgentData", {
        value: { platform: reportedPlatform },
        configurable: true,
      });
    }, platform);
    await page.goto("/");
    const link = page.locator(".hero-download");
    await expect(link).toContainText(`Download for ${label}`);
    await expect(link).toHaveAttribute("href", base + filename);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

test("renders the site without broken local assets or script errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.url().startsWith("http://127.0.0.1:4174") &&
      response.status() >= 400
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little more possibility.",
  );
  await expect(
    page
      .getByRole("link", { name: "Download for Windows", exact: true })
      .last(),
  ).toHaveAttribute("href", base + "Aster-0.4.3-win-x64.exe");
  await expect(
    page.getByRole("link", { name: "Download for Linux", exact: true }).last(),
  ).toHaveAttribute("href", base + "Aster-0.4.3-linux-x64.AppImage");
  expect(
    await page.evaluate(() =>
      document.fonts.check('400 20px "DM Serif Display"'),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("switches between real Mac architecture files and accurate labels", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgentData", {
      value: { platform: "macOS" },
      configurable: true,
    });
  });
  await page.goto("/#download");
  const link = page.locator("#mac-download");
  await expect(link).toHaveAttribute(
    "href",
    base + "Aster-0.4.3-mac-arm64.dmg",
  );
  await page.getByRole("radio", { name: "Intel", exact: true }).check();
  await expect(link).toHaveAttribute("href", base + "Aster-0.4.3-mac-x64.dmg");
  await expect(link).toHaveAccessibleName("Download for macOS, Intel");
  await expect(page.locator("#mac-file-meta")).toContainText("Intel");
  await page.getByRole("radio", { name: "Apple Silicon" }).check();
  await expect(link).toHaveAttribute(
    "href",
    base + "Aster-0.4.3-mac-arm64.dmg",
  );
});

test("supports feature previews with a keyboard and native FAQ controls", async ({
  page,
}) => {
  await page.goto("/#inside");
  const first = page.getByRole("tab", { name: /Follow your curiosity/ });
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("tab", { name: /Move the busywork/ }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Your answer needed");
  await page.keyboard.press("End");
  await expect(page.getByRole("tabpanel")).toContainText("Portfolio.pdf");
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("Option A");
  const question = page.getByText("Which Mac download should I choose?", {
    exact: true,
  });
  await question.click();
  await expect(
    page.getByText("Open the Apple menu and choose About This Mac.", {
      exact: false,
    }),
  ).toBeVisible();
});

for (const width of [360, 390, 768, 1440]) {
  test(`fits a ${width}px viewport and keeps downloads reachable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.locator("#download").scrollIntoViewIfNeeded();
    await expect(page.locator("#mac-download")).toBeVisible();
    await expect(
      page.locator('[data-platform-card="linux"] .platform-download'),
    ).toBeVisible();
  });
}

test("opens and closes the mobile navigation with keyboard support", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator(".menu-toggle");
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("link", { name: "Good to know" }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("keeps direct downloads and privacy information usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/");
  await expect(page.locator("#mac-download")).toHaveAttribute(
    "href",
    base + "Aster-0.4.3-mac-arm64.dmg",
  );
  await expect(
    page.getByRole("link", { name: "Download Intel Mac version" }),
  ).toHaveAttribute("href", base + "Aster-0.4.3-mac-x64.dmg");
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Privacy, in plain language.",
  );
  await context.close();
});
