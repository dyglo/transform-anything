import { expect, test } from '@playwright/test';
test('reference hero and mobile navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1293, height: 828 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Make anything into what you need.' }),
  ).toBeVisible();
  await page.locator('.hero').screenshot({ path: 'artifacts/hero-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('link', { name: 'Start transforming' }).first()).toBeVisible();
  await page.screenshot({ path: 'artifacts/hero-mobile.png' });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('image chain, independent branch, recovery, local-only export, and clear', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const network: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') network.push(`${r.method()} ${r.url()}`);
  });
  await page.goto('/workspace');
  await page.locator('input[type=file]').last().setInputFiles('public/hero-bg.png');
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeVisible();
  await page.getByRole('button', { name: 'Crop Keep what matters' }).click();
  await page.getByLabel('Width', { exact: true }).fill('1000');
  await page.getByLabel('Height', { exact: true }).fill('600');
  await page.getByRole('button', { name: 'Apply crop' }).click();
  await expect(page.getByRole('button', { name: /2. Crop/ })).toBeVisible();
  await page.getByRole('button', { name: 'Resize Find the right size' }).click();
  await page.getByLabel('Width', { exact: true }).fill('500');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('300');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.getByRole('button', { name: /3. Resize/ })).toBeVisible();
  await page.getByRole('button', { name: 'Convert Choose your format' }).click();
  await page.getByRole('combobox', { name: 'Output format' }).click();
  await page.getByRole('option', { name: 'WebP', exact: true }).click();
  await page.getByRole('button', { name: 'Apply convert' }).click();
  await expect(page.getByRole('button', { name: /4. Convert/ })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.webp$/);
  await page.getByRole('button', { name: /1. Original/ }).click();
  await page.getByRole('combobox', { name: 'Output format' }).click();
  await page.getByRole('option', { name: 'JPEG', exact: true }).click();
  await page.getByRole('button', { name: 'Apply convert' }).click();
  await expect(page.getByRole('button', { name: /5. Convert/ })).toContainText('From step 1');
  await page.reload();
  await expect(page.getByRole('button', { name: /5. Convert/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: /4. Convert/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/workspace-desktop.png' });
  await page.getByRole('button', { name: 'Resize Find the right size' }).click();
  await page.getByLabel('Width', { exact: true }).fill('-1');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.getByRole('button', { name: /5. Convert/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/workspace-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Clear session', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Clear session', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Start with what you have.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Start with what you have.' })).toBeVisible();
  expect(network).toEqual([]);
  expect(errors).toEqual([]);
});
test('unsupported and corrupt inputs, rotation, clipboard denial, storage failure', async ({
  page,
}) => {
  await page.goto('/workspace');
  const input = page.locator('input[type=file]').last();
  await input.setInputFiles({
    name: 'test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('test'),
  });
  await expect(page.getByRole('alert')).toContainText('supports PNG');
  await input.setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('broken'),
  });
  await expect(page.getByRole('alert')).toContainText('damaged');
  await input.setInputFiles('public/hero-bg.png');
  await page.getByRole('button', { name: 'Rotate Change perspective' }).click();
  await page.getByRole('button', { name: 'Apply rotate' }).click();
  await expect(page.getByRole('button', { name: /2. Rotate/ })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async () => {
          throw new Error('denied');
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Clipboard permission was denied');
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Apply rotate' }).click();
  await expect(page.getByRole('button', { name: /3. Rotate/ })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('storage is full');
});
test('clipboard input, main-thread fallback, object URL cleanup, and expiration', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'OffscreenCanvas', { value: undefined, configurable: true });
    const live = new Set<string>();
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (b) => {
      const u = create(b);
      live.add(u);
      return u;
    };
    URL.revokeObjectURL = (u) => {
      live.delete(u);
      revoke(u);
    };
    Object.assign(window, { livePreviewUrls: live });
  });
  await page.goto('/workspace');
  await expect(page.getByRole('heading', { name: 'Start with what you have.' })).toBeVisible();
  await page.evaluate(async () => {
    const blob = await (await fetch('/hero-bg.png')).blob();
    const data = new DataTransfer();
    data.items.add(new File([blob], 'pasted.png', { type: 'image/png' }));
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data }));
  });
  await expect(page.getByRole('button', { name: /1. Original/ })).toBeVisible();
  await page.getByLabel('Width', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.getByRole('button', { name: /2. Resize/ })).toBeVisible();
  await page.getByRole('button', { name: 'Clear session', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Clear session', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { livePreviewUrls: Set<string> }).livePreviewUrls.size,
      ),
    )
    .toBe(0);
  await page.locator('input[type=file]').last().setInputFiles('public/hero-bg.png');
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('transform-local', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('session', 'readwrite');
      const store = tx.objectStore('session');
      const r = store.get('current');
      r.onsuccess = () => store.put({ ...r.result, expiresAt: Date.now() - 1 }, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Start with what you have.' })).toBeVisible();
  const count = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('transform-local');
      r.onsuccess = () => resolve(r.result);
    });
    const n = await new Promise<number>((resolve) => {
      const r = db.transaction('bytes').objectStore('bytes').count();
      r.onsuccess = () => resolve(r.result);
    });
    db.close();
    return n;
  });
  expect(count).toBe(0);
});
