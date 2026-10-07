import { test, expect, type Page } from '@playwright/test';
import type { Session } from '../../src/core/types';
async function setup(page: Page, portrait = false) {
  page.on('dialog', (dialog) => void dialog.dismiss());
  await page.goto('/workspace');
  const png = await page.evaluate(
    ({ portrait }) => {
      const c = Object.assign(document.createElement('canvas'), {
        width: portrait ? 500 : 800,
        height: portrait ? 800 : 500,
      });
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 20, 20);
      return c.toDataURL().split(',')[1];
    },
    { portrait },
  );
  await page
    .locator('input[type=file]')
    .last()
    .setInputFiles({
      name: 'alpha.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
  await page.getByRole('button', { name: /^Annotate(?: Labels, arrows and highlights)?$/ }).click();
  await expect(page.getByRole('button', { name: 'Add text', exact: true })).toBeVisible();
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('transform-local');
      r.onsuccess = () => resolve(r.result);
    });
    const saved = await new Promise<Session>((resolve) => {
      const r = db.transaction('session').objectStore('session').get('current');
      r.onsuccess = () => resolve(r.result);
    });
    db.close();
    return saved;
  });
}
async function drag(page: Page, label: string, dx: number, dy: number) {
  const target = page.getByRole('button', { name: label, exact: true });
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 5 });
  await page.mouse.up();
}
test('four annotation types, draft edits, exact raster, branching, chaining and recovery', async ({
  page,
}) => {
  const errors: string[] = [],
    sent: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.method() !== 'GET') sent.push(r.url());
  });
  await setup(page);
  for (const [i, kind] of ['text', 'arrow', 'rectangle', 'highlight'].entries()) {
    await page.getByRole('button', { name: `Add ${kind}`, exact: true }).click();
    await page.getByLabel('Annotation x', { exact: true }).fill(String(40 + i * 160));
    await page.getByLabel('Annotation width', { exact: true }).fill('120');
    if (kind === 'text') await page.getByLabel('Text content').fill('Hello\nTransform');
    if (kind === 'rectangle') await page.getByLabel('Annotation stroke').fill('6');
    await page.getByLabel('Annotation opacity').fill(kind === 'highlight' ? '0.4' : '1');
  }
  await page.getByLabel('Selected element').selectOption({ label: '1. text' });
  await page.getByRole('button', { name: 'Move text 1', exact: true }).press('Shift+ArrowRight');
  await expect(page.getByLabel('Annotation x', { exact: true })).toHaveValue('50');
  await page.getByRole('button', { name: 'Resize annotation', exact: true }).press('ArrowDown');
  await expect(page.getByLabel('Annotation height')).toHaveValue('101');
  await page.getByRole('button', { name: 'Delete element', exact: true }).click();
  await expect(page.locator('.annotation-box')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo draft', exact: true }).click();
  await expect(page.locator('.annotation-box')).toHaveCount(4);
  await page.getByRole('button', { name: 'Redo draft', exact: true }).click();
  await expect(page.locator('.annotation-box')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo draft', exact: true }).click();
  await page.getByRole('button', { name: 'Resize Find the right size' }).click();
  await expect(page.getByRole('status')).toContainText('drafts retained');
  await page.getByRole('button', { name: /^Annotate(?: Labels, arrows and highlights)?$/ }).click();
  await expect(page.locator('.annotation-box')).toHaveCount(4);
  // Capture the full-resolution preview composite before the editor clears it.
  const expected = await page.evaluate(() => {
    const layer = document.querySelector('.annotation-overlay canvas') as HTMLCanvasElement;
    const c = Object.assign(document.createElement('canvas'), {
      width: layer.width,
      height: layer.height,
    });
    const ctx = c.getContext('2d')!;
    ctx.drawImage(layer, 0, 0);
    return c.toDataURL();
  });
  await page.screenshot({ path: 'artifacts/annotations-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Apply annotations', exact: true }).click();
  await expect(page.locator('.history-node')).toHaveCount(2);
  const equal = await page.evaluate(async (expected) => {
    const actual = document.querySelector('.preview-image') as HTMLImageElement;
    await actual.decode();
    const img = new Image();
    img.src = expected;
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), {
      width: img.width,
      height: img.height,
    });
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const a = ctx.getImageData(0, 0, c.width, c.height).data;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(actual, 0, 0);
    const b = ctx.getImageData(0, 0, c.width, c.height).data;
    return {
      equal: a.every((v, i) => v === b[i]),
      alpha: b[(499 * 800 + 799) * 4 + 3],
      textPixels: Array.from(b.slice((100 * 800 + 50) * 4, (100 * 800 + 170) * 4)).some(
        (v) => v > 0,
      ),
    };
  }, expected);
  expect(equal.equal).toBe(true);
  expect(equal.alpha).toBe(0);
  let state = await snapshot(page);
  expect(state.operations).toHaveLength(1);
  expect(state.objects[1].metadata).toEqual({ width: 800, height: 500 });
  expect(state.operations[0].parameters.annotations).toMatchObject({
    version: 2,
    elements: [{ text: 'Hello\nTransform' }, {}, {}, {}],
  });
  await page.getByRole('button', { name: /1\. Original/ }).click();
  await page.getByRole('button', { name: 'Add arrow', exact: true }).click();
  await page.getByRole('button', { name: 'Apply annotations', exact: true }).click();
  await expect(page.locator('.history-node')).toHaveCount(3);
  state = await snapshot(page);
  expect(state.operations[0].inputIds).toEqual(state.operations[1].inputIds);
  await page.getByRole('button', { name: 'Resize Find the right size' }).click();
  await page.getByLabel('Width', { exact: true }).fill('400');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.locator('.history-node')).toHaveCount(4);
  await page.getByRole('button', { name: 'Convert Choose your format' }).click();
  await page.getByRole('combobox', { name: 'Output format' }).click();
  await page.getByRole('option', { name: 'WebP' }).click();
  await page.getByRole('button', { name: 'Apply convert' }).click();
  await expect(page.locator('.history-node')).toHaveCount(5);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.webp$/);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async (items: ClipboardItem[]) => {
          (window as unknown as { copiedType: string }).copiedType = items[0].types[0];
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copiedType: string }).copiedType)).toBe(
    'image/png',
  );
  await page.reload();
  await expect(page.locator('.history-node')).toHaveCount(5);
  state = await snapshot(page);
  expect(state.operations[0].parameters.annotations).toMatchObject({
    version: 2,
    elements: [{ text: 'Hello\nTransform' }, {}, {}, {}],
  });
  await expect(page.locator('.preview-image')).toBeVisible();
  expect(errors).toEqual([]);
  expect(sent).toEqual([]);
});

test('cancel, per-image drafts, invalid parameters, failed render and malformed recovery preserve work', async ({
  page,
}) => {
  await setup(page);
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await page.getByLabel('Text content').fill('');
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid annotations');
  await expect(page.locator('.history-node')).toHaveCount(1);
  await page.getByLabel('Text content').fill('Retained');
  await page.evaluate(() => {
    const proto = HTMLCanvasElement.prototype;
    (window as unknown as { originalToBlob: typeof proto.toBlob }).originalToBlob = proto.toBlob;
    proto.toBlob = (cb) => cb(null);
  });
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.getByRole('alert')).toContainText('encoding failed');
  await expect(page.locator('.history-node')).toHaveCount(1);
  await expect(page.getByLabel('Text content')).toHaveValue('Retained');
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = (
      window as unknown as { originalToBlob: typeof HTMLCanvasElement.prototype.toBlob }
    ).originalToBlob;
  });
  await page.locator('input[type=file]').first().setInputFiles('public/hero-bg.png');
  await expect(page.locator('.history-node')).toHaveCount(2);
  await page.getByRole('button', { name: /1\. Original/ }).click();
  await expect(page.getByLabel('Text content')).toHaveValue('Retained');
  await page.getByRole('button', { name: 'Cancel annotations' }).click();
  await expect(page.locator('.history-node')).toHaveCount(2);
  await page.getByRole('button', { name: /^Annotate(?: Labels, arrows and highlights)?$/ }).click();
  await expect(page.locator('.annotation-box')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add rectangle' }).click();
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.locator('.history-node')).toHaveCount(3);
  // A historical v1 annotation remains recoverable after introducing v2 regions.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('transform-local');
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('session', 'readwrite');
      const store = tx.objectStore('session');
      const r = store.get('current');
      r.onsuccess = () => {
        r.result.operations[0].version = 1;
        r.result.operations[0].parameters.annotations.version = 1;
        store.put(r.result, 'current');
      };
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator('.history-node')).toHaveCount(3);
  await expect(
    page.getByText('Some recovered annotation parameters', { exact: false }),
  ).toHaveCount(0);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('transform-local');
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('session', 'readwrite');
      const store = tx.objectStore('session');
      const r = store.get('current');
      r.onsuccess = () => {
        r.result.operations[0].parameters.annotations.version = 99;
        store.put(r.result, 'current');
      };
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator('.history-node')).toHaveCount(3);
  await expect(page.getByRole('status')).toContainText('invalid or unsupported');
});

test.describe('scaled portrait mobile annotations', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('touch draw/move/resize, keyboard focus and bounded source coordinates', async ({
    page,
    context,
  }) => {
    await setup(page, true);
    await page.getByLabel('Drawing tool').selectOption('rectangle');
    const layer = page.locator('.annotation-overlay');
    await layer.scrollIntoViewIfNeeded();
    const b = (await layer.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: b.x + 10, y: b.y + 10 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: b.x + 60, y: b.y + 80 }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(
      Number(await page.getByLabel('Annotation width', { exact: true }).inputValue()),
    ).toBeCloseTo((50 * 500) / b.width, 0);
    expect(
      Number(await page.getByLabel('Annotation height', { exact: true }).inputValue()),
    ).toBeCloseTo((70 * 800) / b.height, 0);
    const before = Number(await page.getByLabel('Annotation x', { exact: true }).inputValue());
    await drag(page, 'Move rectangle 1', 10, 5);
    expect(Number(await page.getByLabel('Annotation x', { exact: true }).inputValue())).toBeCloseTo(
      before + (10 * 500) / b.width,
      0,
    );
    const w = Number(await page.getByLabel('Annotation width', { exact: true }).inputValue());
    await drag(page, 'Resize annotation', 10, 10);
    expect(
      Number(await page.getByLabel('Annotation width', { exact: true }).inputValue()),
    ).toBeCloseTo(w + (10 * 500) / b.width, 0);
    await page.getByRole('button', { name: 'Move rectangle 1' }).press('ArrowLeft');
    await page.screenshot({ path: 'artifacts/annotations-mobile.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Apply annotations' }).click();
    await expect(page.locator('.history-node')).toHaveCount(2);
    await cdp.detach();
  });
});
