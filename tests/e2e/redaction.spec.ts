import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Session } from '../../src/core/types';

async function importPattern(page: Page) {
  await page.goto('/workspace');
  const png = await page.evaluate(() => {
    const c = Object.assign(document.createElement('canvas'), { width: 128, height: 96 });
    const ctx = c.getContext('2d')!;
    for (let y = 0; y < 70; y++)
      for (let x = 0; x < 128; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, 1, 1);
      }
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, 20, 21, 16);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(80, 80, 10, 10);
    return c.toDataURL().split(',')[1];
  });
  await page
    .locator('input[type=file]')
    .last()
    .setInputFiles({
      name: 'private.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
  await page.getByRole('button', { name: /^Annotate/ }).click();
  await expect(page.getByRole('button', { name: 'Add redact', exact: true })).toBeVisible();
}
async function savedSession(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('transform-local');
      req.onsuccess = () => resolve(req.result);
    });
    const session = await new Promise<Session>((resolve) => {
      const req = db.transaction('session').objectStore('session').get('current');
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return session;
  });
}
async function box(page: Page, values: Record<string, number>) {
  for (const [key, value] of Object.entries(values))
    await page.getByLabel(`Annotation ${key}`, { exact: true }).fill(String(value));
}

test('opaque redaction and real blur match preview, retain alpha, export only pixels, chain and recover', async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [],
    remote: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (
      r.method() !== 'GET' ||
      (!r.url().startsWith(new URL(baseURL!).origin + '/') &&
        !r.url().startsWith('blob:') &&
        !r.url().startsWith('data:'))
    )
      remote.push(r.url());
  });
  await importPattern(page);
  await expect(
    page.getByText(/Your original and earlier images remain in local history/),
  ).toBeVisible();
  const source = await page.locator('.preview-image').evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), { width: 128, height: 96 });
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, 128, 96).data);
  });
  await page.getByRole('button', { name: 'Add redact', exact: true }).click();
  await box(page, { x: 10.4, y: 20.3, width: 20.2, height: 15.5 });
  await expect(page.getByLabel('Annotation opacity')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add blur', exact: true }).click();
  await box(page, { x: 50, y: 20, width: 24, height: 24, blurRadius: 2 });
  await expect
    .poll(() =>
      page
        .locator('.annotation-overlay canvas')
        .evaluate((c: HTMLCanvasElement) =>
          Array.from(c.getContext('2d')!.getImageData(10, 20, 1, 1).data),
        ),
    )
    .toEqual([0, 0, 0, 255]);
  const expected = await page
    .locator('.annotation-overlay canvas')
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.screenshot({ path: 'artifacts/redaction-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Apply annotations', exact: true }).click();
  await expect(page.locator('.history-node')).toHaveCount(2);
  const pixels = await page.locator('.preview-image').evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), { width: 128, height: 96 });
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, 128, 96).data);
  });
  let blurred = false;
  for (let y = 0; y < 96; y++)
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      if (x >= 10 && x < 31 && y >= 20 && y < 36)
        expect(pixels.slice(i, i + 4)).toEqual([0, 0, 0, 255]);
      else if (x >= 50 && x < 74 && y >= 20 && y < 44) {
        if (pixels[i] > 0 && pixels[i] < 255 && pixels[i] !== source[i]) blurred = true;
      } else expect(pixels.slice(i, i + 4)).toEqual(source.slice(i, i + 4));
    }
  expect(blurred).toBe(true);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('private-annotate.png');
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  // Decode the real downloaded PNG and compare all pixels to the complete preview.
  const equal = await page.evaluate(
    async ({ expected, actual }) => {
      const a = new Image(),
        b = new Image();
      a.src = expected;
      b.src = actual;
      await Promise.all([a.decode(), b.decode()]);
      const c = Object.assign(document.createElement('canvas'), { width: 128, height: 96 });
      const ctx = c.getContext('2d')!;
      ctx.drawImage(a, 0, 0);
      const first = ctx.getImageData(0, 0, 128, 96).data;
      ctx.clearRect(0, 0, 128, 96);
      ctx.drawImage(b, 0, 0);
      const second = ctx.getImageData(0, 0, 128, 96).data;
      return first.every((v, i) => v === second[i]);
    },
    { expected, actual: `data:image/png;base64,${bytes.toString('base64')}` },
  );
  expect(equal).toBe(true);
  const state = await savedSession(page);
  expect(state.operations[0]).toMatchObject({
    transformationId: 'annotate',
    version: 2,
    inputIds: [state.objects[0].id],
    outputIds: [state.objects[1].id],
    parameters: {
      annotations: {
        version: 2,
        elements: [
          { kind: 'redact', opacity: 1 },
          { kind: 'blur', blurRadius: 2 },
        ],
      },
    },
  });
  await page.getByRole('button', { name: /^Crop Keep/ }).click();
  await page.getByLabel('Width', { exact: true }).fill('120');
  await page.getByLabel('Height', { exact: true }).fill('90');
  await page.getByRole('button', { name: 'Apply crop' }).click();
  await expect(page.locator('.history-node')).toHaveCount(3);
  await page.getByRole('button', { name: /^Resize Find/ }).click();
  await page.getByLabel('Width', { exact: true }).fill('60');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.locator('.history-node')).toHaveCount(4);
  await page.getByRole('button', { name: /^Convert Choose/ }).click();
  await page.getByRole('combobox', { name: 'Output format' }).click();
  await page.getByRole('option', { name: 'WebP' }).click();
  await page.getByRole('button', { name: 'Apply convert' }).click();
  await expect(page.locator('.history-node')).toHaveCount(5);
  await page.getByRole('button', { name: 'Optimize Lighten the file' }).click();
  await page.getByRole('button', { name: 'Apply optimize' }).click();
  await expect(page.locator('.history-node')).toHaveCount(6);
  const webp = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await webp).suggestedFilename()).toMatch(/\.webp$/);
  await page.reload();
  await expect(page.locator('.history-node')).toHaveCount(6);
  expect((await savedSession(page)).operations).toHaveLength(5);
  await page.getByRole('button', { name: /1\. Original/ }).click();
  const originalPixel = await page
    .locator('.preview-image')
    .evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 96;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(15, 25, 1, 1).data);
    });
  expect(originalPixel).toEqual([0, 255, 0, 255]);
  await page.getByRole('button', { name: /^Annotate/ }).click();
  await page.getByRole('button', { name: 'Add redact', exact: true }).click();
  await box(page, { x: 0, y: 0, width: 128, height: 96 });
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.locator('.history-node')).toHaveCount(7);
  const branches = await savedSession(page);
  expect(branches.operations[5].inputIds).toEqual(branches.operations[0].inputIds);
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
});

test('invalid blur, cancel, draft undo and encoding failure preserve the selected image', async ({
  page,
}) => {
  page.on('dialog', (d) => void d.dismiss());
  await importPattern(page);
  await page.getByRole('button', { name: 'Add blur', exact: true }).click();
  await box(page, { blurRadius: 0 });
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.getByRole('alert')).toContainText('Blur radius');
  await expect(page.locator('.history-node')).toHaveCount(1);
  await page.getByRole('button', { name: 'Cancel annotations' }).click();
  await page.getByRole('button', { name: /^Annotate/ }).click();
  await expect(page.locator('.annotation-box')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add redact', exact: true }).click();
  await page.getByRole('button', { name: 'Move redact 1' }).press('Shift+ArrowRight');
  await expect(page.getByLabel('Annotation x', { exact: true })).toHaveValue('22.8');
  await page.getByRole('button', { name: 'Undo draft', exact: true }).click();
  await page.getByLabel('Selected element').selectOption({ label: '1. redact' });
  await expect(page.getByLabel('Annotation x', { exact: true })).toHaveValue('12.8');
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = (cb) => cb(null);
  });
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.getByRole('alert')).toContainText('encoding failed');
  await expect(page.locator('.history-node')).toHaveCount(1);
  await expect(page.locator('.annotation-box')).toHaveCount(1);
});

test.describe('mobile region editing', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('touch redaction and keyboard resize use source pixels and export on mobile', async ({
    page,
    context,
  }) => {
    await importPattern(page);
    await page.getByLabel('Drawing tool').selectOption('redact');
    const layer = page.locator('.annotation-overlay');
    await layer.scrollIntoViewIfNeeded();
    const bounds = (await layer.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: bounds.x + bounds.width * 0.1, y: bounds.y + bounds.height * 0.1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: bounds.x + bounds.width * 0.5, y: bounds.y + bounds.height * 0.5 }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(
      Number(await page.getByLabel('Annotation width', { exact: true }).inputValue()),
    ).toBeCloseTo(51.2, 0);
    await page.getByRole('button', { name: 'Resize annotation', exact: true }).press('ArrowRight');
    expect(
      Number(await page.getByLabel('Annotation width', { exact: true }).inputValue()),
    ).toBeCloseTo(52.2, 0);
    await page.screenshot({ path: 'artifacts/redaction-mobile.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Apply annotations' }).click();
    await expect(page.locator('.history-node')).toHaveCount(2);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    expect((await downloaded).suggestedFilename()).toMatch(/\.png$/);
    await cdp.detach();
  });
});
