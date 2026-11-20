# Aster website

The Aster download website, in a standalone repository separate from the desktop browser. A static, responsive site with no application server, analytics, cookies, external fonts, or runtime JavaScript dependencies.

The page includes desktop/mobile layouts, keyboard-accessible feature previews, native FAQ disclosures, Apple Silicon/Intel selection, OS-based download highlighting, a privacy note, and direct links to real installer binaries. Core download links also work with JavaScript disabled.

## Local development

Use Node.js 24.13+ and pnpm 12.9.1:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by the server, normally `http://127.0.0.1:4174`.

```sh
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test
```

`dist/` contains the deployable website, with paths that work at both a domain root and `/aster-web/`. Installers are not copied into the Pages artifact; download buttons use GitHub's binary-serving LFS media URLs.

## Installer files and Git LFS

All four v0.4.3 installers live in `downloads/` and are tracked by Git LFS, as configured in `.gitattributes`. This release puts native Windows/Linux window controls in the tabs row, removes bottom footers, moves zoom reset to the toolbar, and expands web-page right-click menus with link tabs/windows/private windows, image actions, selected-text search, editing, page saving, printing and inspection. It retains automatic update notices, profile preservation and prompt-cache improvements. `downloads/release-0.4.3.json` records the source commit, build run, verification and artifact checksums. The Mac downloads are separate for Apple Silicon and Intel. Windows is x64 NSIS; Linux is x86_64 AppImage. These are unsigned development previews, and macOS builds are not notarized.

To fetch actual installers after cloning:

```sh
git lfs install --local
git lfs pull
git lfs fsck
node scripts/check.mjs --installers
```

`downloads.json` records the version, architecture-specific filename, exact size, SHA-256, and public binary URL. `downloads/SHA256SUMS.txt` is a normal, small Git file. Download links point to `media.githubusercontent.com`, not the LFS pointer contents on `raw.githubusercontent.com`. The repository must be public for visitors to download anonymously. GitHub LFS storage and download usage follow the repository owner's plan.

For a new release, copy the four matching installers into `downloads/`, run:

```sh
node scripts/update-downloads.mjs 0.5.0
node scripts/check.mjs --installers
```

Use the canonical `linux-x64` filename in this repository for the Linux AppImage (the desktop builder may call that architecture `x86_64`). Then update the version text, no-JavaScript fallback URLs and script version query in `index.html`, and the fallback filename and manifest version query in `app.js`. The versioned requests keep a cached older manifest or script from overriding the new download links. Run checks and browser tests, stage the new files and metadata, verify `git lfs ls-files`, then commit/push. Keep old versioned files available if their download URLs are still in use.

After publication, run `pnpm test:links` to verify anonymous downloads return installer bytes rather than pointer files and that the published checksums match. This makes short ranged requests and cancels the body after the first chunk; it does not download every installer again.

## Hosting

The included GitHub Actions workflow builds and tests the site, then publishes `dist/` to GitHub Pages for a public `main` branch. It also runs on GitHub's `public` event when the repository changes from private to public. The public website is **https://aster.ilhamlabs.io/**. The tracked `CNAME` file is included in the build, and canonical links and social images use this custom domain.

In repository Settings → Pages, select **GitHub Actions** as the build source. Pages must be enabled before the deploy job runs. If needed, run **Verify and publish Aster website** manually after enabling Pages. No deployment secret or provider API key is needed. Changing repository visibility is left to the repository owner.

The same `dist/` output can be uploaded to another static web host. No server rewrite or environment variable is required. The download files continue to be served from Git LFS.

Support, bug reports, and feedback: **ayaz@ilhamlabs.io**. Contact links are available in the FAQ, footer, and privacy page.

## Assets and verification

The preview is an original CSS/SVG illustration, explicitly labeled as illustrative. It contains no real browsing sessions or user data. The Aster icon comes from the desktop project. DM Sans and DM Serif Display are self-hosted under the SIL Open Font License; their full licenses are in `assets/fonts/`.

Eleven browser tests cover real page rendering, local asset errors, Mac architecture links, keyboard tabs, mobile navigation, FAQs, no-JavaScript fallback, privacy navigation, and horizontal overflow at 360, 390, 768, and 1440 pixels. The installer checks can additionally verify actual local file sizes and SHA-256 hashes.

Never commit `.env`, API keys, credential stores, browser profiles, or user documents to this repository.
