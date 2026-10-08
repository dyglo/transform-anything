# Vercel deployment — DEP-01

8 October 2026. Deployment-only repair; DC-01 remains TODO. Production recovery is pending PR merge and live verification.

## Diagnosis

- Project: `transform-anything`, ID `prj_E2gQ1i5SyC4BG2zxc7xanPQT4SE9`, team `next-q`. Framework detection reports `vite`.
- Original production deployment: `dpl_8QiY5bVr3Jg2wiR4ASacPvApCHDv`, `transform-anything-bv0sqnfrm-next-q.vercel.app`, READY. Git metadata and build logs identify `dyglo/transform-anything`, branch `main`, commit `5c174060c9442ec73da4549961a266131f1e7631`; build entrypoint is repository root (`.`).
- `transform-anything.vercel.app` is verified, assigned to that project/deployment with no redirect, branch override or alias error. This is not an unassigned domain or failed build.
- Logs show `npm run build` invoking development mode and the Cloudflare plugin emitting `dist/client/index.html`, browser JS/CSS/worker/WASM assets and a separate `dist/transform_local` Worker bundle.
- Live `/` returns HTTP 404 with `X-Vercel-Error: NOT_FOUND`; `/client/index.html` returns HTTP 200 and Transform HTML referencing `/assets/...`. This directly proves that the parent output directory was published: the app entry point is one directory too deep and its absolute asset URLs cannot resolve there. A rewrite alone cannot correct that output layout.
- Connector project responses do not expose all saved root/build/output/production-branch settings. The effective root/command/branch are evidenced by the deployed logs and metadata, and the output by live HTTP behavior. Preview Git delivery must be observed after pushing the fix rather than inferred from the initial import.

## Minimal fix

Root `vercel.json` explicitly selects Vite, `npm run build:production`, and `dist/client`. A SPA rewrite serves `index.html` for direct visits/reloads of `/workspace` and the application's fallback route. Existing files continue to be served as static assets. This follows [Vercel's Vite SPA guidance](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

Vite, React/TypeScript, Cloudflare build/deploy configuration and every transformation remain intact. Only browser assets are published to Vercel; the Cloudflare Worker is not a Vercel backend. No infrastructure is provisioned. Local image bytes still remain in the browser.

`playwright.config.ts` accepts `PLAYWRIGHT_BASE_URL` for running the same existing acceptance suite against a deployed origin, without starting a local server. With no override its behavior is unchanged.

## Validation

- PR: [#4 — Fix Vercel production 404 by serving dist/client](https://github.com/dyglo/transform-anything/pull/4), against `main`, branch `codex/fix-vercel-production`. Open/unmerged at handoff; no merge or production promotion performed.
- Local: `npm ci`, `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` (49 tests / 11 files), `npm run build:production`, and `git diff --check` passed. Formatting normalized Windows checkout line endings without adding unrelated source changes to the PR.
- Local development-server suite: `npm run test:e2e` had 21 passes and one timeout waiting for the Remove BG history node (100 seconds). This local-dev limitation remains recorded; no transformation code was changed to hide it. Real background removal passes on the deployed production-mode preview.
- Tested preview: [transform-anything-j6fxq77zm-next-q.vercel.app](https://transform-anything-j6fxq77zm-next-q.vercel.app), deployment `dpl_4ZJ4c92UzAsumbtKueRfVoZrSkqL`, commit `ef01930`, READY, source `git`, framework `vite`, build duration approximately 19 seconds. Build logs confirm `build:production`, `dist/client/index.html`, build completion and successful output deployment. The successful Git preview establishes that the repository integration processes branch pushes.
- Protected preview accessed through the Vercel connector's temporary authenticated link/cookie; protection was not disabled. An ignored Playwright wrapper supplied cookie storage to the same suite. Fresh stable rerun: **all 22 desktop/mobile Chromium scenarios passed in 1.5 minutes**. `tests/e2e/background.spec.ts` and `redaction.spec.ts` now derive their allowed origin from `baseURL`, keeping no-upload checks effective outside localhost. Preview and local application/configuration are identical; subsequent test/documentation changes do not alter app output.
- Preview HTTP: `/`, `/workspace`, app fallback `/missing-route`, JS, CSS and favicon return 200; JS/CSS have correct MIME. Real model loading/inference and worker/WASM execution pass in the background test. Desktop and mobile screenshots visually reviewed after landscape image decoding; workspace image/composition outputs, downloads and persistence verified by browser/pixel tests. Browser smoke reports no unexpected page errors. Connector event reads expose build logs, not a complete client runtime log stream; browser evidence covers client exceptions.
- Production alias rechecked at handoff: still HTTP **404**, pointing to the original READY deployment. Production is **not fixed yet**. DEP-01 remains IN PROGRESS pending merge and the live checks below. No CI-only success claim is made.

## Exact post-merge verification

1. Confirm this PR is merged into `main`. In Vercel team `next-q`, project `transform-anything`, select the resulting **Production** deployment. Require READY, `main`, and the actual merge commit SHA. Read build logs: `npm run build:production`, browser output `dist/client/index.html`, successful upload, no build error. Confirm Root Directory is repository root, framework Vite, output `dist/client`, Git repository `dyglo/transform-anything`, production branch `main`, and the production alias points to this deployment. If no Git deployment occurs, investigate the Git connection/branch/event; do not mark success or silently deploy another revision.
2. From PowerShell run `curl.exe -i https://transform-anything.vercel.app/` and `curl.exe -i https://transform-anything.vercel.app/workspace`. Both must return HTTP 200 and Transform HTML. Fetch the JS/CSS URLs from that HTML and require HTTP 200 with the correct content types, not HTML fallback. Check `/models/u2netp.onnx` and the generated worker/WASM assets; verify the landscape renders.
3. Check out merged `main`, run `npm ci`, install Chromium with `npx playwright install chromium`, then run the existing browser suite against production:

   ```powershell
   $env:PLAYWRIGHT_BASE_URL = 'https://transform-anything.vercel.app'
   npm run test:e2e
   Remove-Item Env:PLAYWRIGHT_BASE_URL
   ```

   Run serially and retain the report. The suite imports images locally, checks desktop/mobile landing and workspace, crop/resize/convert/export/branch/recovery, background removal, annotations/redaction, ordered Combine, Frame/padding and chained output pixels. Existing failure simulations are deliberate; separate them from unexpected runtime errors. Confirm downloads decode, originals/intermediates remain usable, and no image upload occurs.

4. Open the live homepage and direct `/workspace` in a fresh browser, reload both, and inspect desktop plus 390px mobile layout. Import two PNG/JPEG/WebP images → Combine → Frame → Resize → WebP → Download, inspect downloaded pixels/dimensions, refresh and select original. Check the browser console/network for unexpected exceptions, failed asset loads, MIME errors and processing requests. Verify clipboard copy where permission is supported.
5. Inspect Vercel deployment/runtime logs and HTTP failures for the actual production deployment during the checks. This static app has no server-side transformation functions: browser exceptions require browser evidence, not an empty server log. Record deployment ID/URL, merge SHA, alias mapping, HTTP results, suite results and remaining limitations in this document, tracker and implementation status. Mark DEP-01 DONE only after live acceptance passes.

If the PR has not merged in this session, stop with production verification pending. Do not merge it automatically or claim that CI has fixed the live site.
