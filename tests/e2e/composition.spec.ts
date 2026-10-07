import { expect, test, type Page } from '@playwright/test';
test.use({ actionTimeout: 10000 });
async function importImages(page: Page) {
  await page.goto('/workspace');
  const files = await page.evaluate(() =>
    [
      ['red', 40, 20, '#ff0000'],
      ['blue', 20, 40, '#0000ff'],
    ].map(([name, w, h, color]) => {
      const c = Object.assign(document.createElement('canvas'), {
        width: Number(w),
        height: Number(h),
      });
      c.getContext('2d')!.fillStyle = String(color);
      c.getContext('2d')!.fillRect(0, 0, Number(w), Number(h));
      return { name: String(name) + '.png', data: c.toDataURL().split(',')[1] };
    }),
  );
  await page.locator('input[aria-label="Import images"]').setInputFiles(
    files.map((f) => ({
      name: f.name,
      mimeType: 'image/png',
      buffer: Buffer.from(f.data, 'base64'),
    })),
  );
  await expect(page.locator('.history-node')).toHaveCount(2);
}
async function combine(page: Page) {
  await page.getByRole('button', { name: /^Combine(?: Bring images together)?$/ }).click();
  await page.getByRole('checkbox', { name: 'Include blue.png' }).check();
  await page.getByLabel('Padding', { exact: true }).fill('5');
  await page.getByLabel('Gap', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Move blue.png earlier' }).click();
  await page.getByRole('button', { name: 'Move red.png earlier' }).click();
  await expect(page.getByRole('button', { name: 'Apply combine' })).toBeEnabled();
}
async function pixels(page: Page, points: number[][]) {
  await expect(page.locator('.preview-image')).toBeVisible();
  return page.evaluate(async (points) => {
    const img = document.querySelector('.preview-image') as HTMLImageElement;
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), {
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return {
      width: c.width,
      height: c.height,
      pixels: points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data)),
    };
  }, points);
}
test('composition pixels, full chain, both parents, persisted snapshots and independent branch', async ({
  page,
}) => {
  const network: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') network.push(r.url());
  });
  await importImages(page);
  await combine(page);
  expect(
    await pixels(page, [
      [5, 15],
      [55, 5],
      [0, 0],
      [50, 20],
    ]),
  ).toEqual({
    width: 80,
    height: 50,
    pixels: [
      [255, 0, 0, 255],
      [0, 0, 255, 255],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  });
  await expect(page.locator('.history-node')).toHaveCount(2);
  await page.getByRole('button', { name: 'Apply combine' }).click();
  await expect(page.getByRole('button', { name: /3. Combine/ })).toContainText('From steps 1, 2');
  await page.getByRole('button', { name: 'Frame Padding, borders and backgrounds' }).click();
  await page.getByLabel('Padding', { exact: true }).fill('5');
  await page.getByLabel('Border', { exact: true }).fill('2');
  await page.getByLabel('Corner radius', { exact: true }).fill('0');
  await page.getByLabel('Background', { exact: true }).selectOption('#ffffff');
  await expect(page.getByRole('button', { name: 'Apply frame' })).toBeEnabled();
  expect(
    await pixels(page, [
      [0, 0],
      [12, 22],
    ]),
  ).toMatchObject({
    width: 94,
    height: 64,
    pixels: [
      [255, 255, 255, 255],
      [255, 0, 0, 255],
    ],
  });
  await page.getByRole('button', { name: 'Apply frame' }).click();
  await expect(page.locator('.history-node')).toHaveCount(4);
  await page.getByLabel('Width', { exact: true }).fill('188');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.locator('.history-node')).toHaveCount(5);
  await page.getByRole('button', { name: 'Convert Choose your format' }).click();
  await page.getByRole('combobox', { name: 'Output format' }).click();
  await page.getByRole('option', { name: 'WebP', exact: true }).click();
  await page.getByRole('button', { name: 'Apply convert' }).click();
  await expect(page.locator('.history-node')).toHaveCount(6);
  await page.getByRole('button', { name: 'Optimize Lighten the file' }).click();
  await page.getByRole('button', { name: 'Apply optimize' }).click();
  await expect(page.locator('.history-node')).toHaveCount(7);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.webp$/);
  await page.reload();
  await expect(page.locator('.history-node')).toHaveCount(7);
  await expect(page.getByRole('button', { name: /7. Optimize/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /1. Original/ }).click();
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.getByRole('button', { name: /8. Resize/ })).toContainText('From step 1');
  const saved = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((r) => {
      const q = indexedDB.open('transform-local');
      q.onsuccess = () => r(q.result);
    });
    const result = await new Promise<{
      operations: { inputIds: string[]; parameters: Record<string, unknown> }[];
    }>((r) => {
      const q = db.transaction('session').objectStore('session').get('current');
      q.onsuccess = () => r(q.result);
    });
    db.close();
    return result;
  });
  expect(saved.operations[0].inputIds).toHaveLength(2);
  expect(saved.operations[0].parameters).toMatchObject({ padding: 5, gap: 10 });
  await page.getByRole('button', { name: /3. Combine/ }).click();
  await page.getByRole('button', { name: 'Crop Keep what matters' }).click();
  await page.getByLabel('Width', { exact: true }).fill('60');
  await page.getByLabel('Height', { exact: true }).fill('40');
  await page.getByRole('button', { name: 'Apply crop' }).click();
  await expect(page.locator('.history-node')).toHaveCount(9);
  await page.getByRole('button', { name: 'Annotate Labels, arrows and highlights' }).click();
  await page.getByRole('button', { name: 'Add highlight', exact: true }).click();
  await page.getByLabel('Annotation x', { exact: true }).fill('5');
  await page.getByLabel('Annotation y', { exact: true }).fill('5');
  await page.getByLabel('Annotation width', { exact: true }).fill('10');
  await page.getByLabel('Annotation height', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.locator('.history-node')).toHaveCount(10);
  await page.screenshot({ path: 'artifacts/composition-desktop.png', fullPage: true });
  expect(network).toEqual([]);
});
test('vertical proportional sizing, mobile ordering, cancel and oversized recovery', async ({
  page,
}) => {
  await importImages(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await combine(page);
  await page.getByLabel('Direction', { exact: true }).selectOption('vertical');
  await page.getByLabel('Image sizing', { exact: true }).selectOption('match');
  await page.getByLabel('Common width', { exact: true }).fill('40');
  await expect(page.getByRole('button', { name: 'Apply combine' })).toBeEnabled();
  expect(
    await pixels(page, [
      [5, 5],
      [5, 35],
    ]),
  ).toMatchObject({
    width: 50,
    height: 120,
    pixels: [
      [255, 0, 0, 255],
      [0, 0, 255, 255],
    ],
  });
  await page.getByRole('checkbox', { name: 'Include blue.png' }).press('Space');
  await expect(page.getByRole('button', { name: 'Apply combine' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Include blue.png' }).press('Space');
  await page.getByRole('button', { name: 'Move red.png later' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Apply combine' })).toBeEnabled();
  expect(await pixels(page, [[5, 5]])).toMatchObject({ pixels: [[0, 0, 255, 255]] });
  await page.screenshot({ path: 'artifacts/composition-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Padding', { exact: true }).fill('16384');
  await expect(page.getByRole('button', { name: 'Apply combine' })).toBeDisabled();
  await expect(page.locator('.composition-properties')).toContainText('must fit');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.history-node')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeEnabled();
});
test('encoding failure keeps inputs and selection; retry and storage quota recovery', async ({
  page,
}) => {
  await importImages(page);
  await combine(page);
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    Object.assign(window, { restoreEncode: () => (HTMLCanvasElement.prototype.toBlob = original) });
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
  });
  await page.getByRole('button', { name: 'Apply combine' }).click();
  await expect(page.getByRole('alert')).toContainText('encoding failed');
  await expect(page.locator('.history-node')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: 'Include red.png' })).toBeChecked();
  await page.evaluate(() => {
    (window as unknown as { restoreEncode: () => void }).restoreEncode();
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Apply combine' }).click();
  await expect(page.locator('.history-node')).toHaveCount(3);
  await expect(page.locator('.workspace-feedback[role=status]')).toContainText('storage is full');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/combine.png$/);
});

test('rounded transparent frame agrees with download and chains through redaction, resize and WebP', async ({
  page,
}) => {
  await importImages(page);
  await page.getByRole('button', { name: 'Frame Padding, borders and backgrounds' }).click();
  await page.getByLabel('Padding', { exact: true }).fill('5');
  await page.getByLabel('Border', { exact: true }).fill('2');
  await page.getByLabel('Corner radius', { exact: true }).fill('8');
  await page.getByLabel('Background', { exact: true }).selectOption('transparent');
  await expect(page.getByRole('button', { name: 'Apply frame' })).toBeEnabled();
  const draft = await pixels(page, [
    [0, 0],
    [7, 7],
    [27, 7],
    [27, 17],
    [4, 17],
    [5, 17],
    [6, 17],
  ]);
  expect(draft).toMatchObject({ width: 54, height: 34 });
  expect(draft.pixels).toEqual([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [255, 0, 0, 255],
    [255, 0, 0, 255],
    [0, 0, 0, 0],
    [255, 255, 255, 255],
    [255, 255, 255, 255],
  ]);
  await page.getByRole('button', { name: 'Apply frame' }).click();
  await expect(page.locator('.history-node')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
  expect(
    await pixels(page, [
      [0, 0],
      [7, 7],
      [27, 7],
      [27, 17],
      [4, 17],
      [5, 17],
      [6, 17],
    ]),
  ).toEqual(draft);
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
  const expected = await page.evaluate(async () => {
    const img = document.querySelector('.preview-image') as HTMLImageElement;
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), {
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    c.getContext('2d')!.drawImage(img, 0, 0);
    return c.toDataURL();
  });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const path = await (await downloaded).path();
  const { readFile } = await import('node:fs/promises');
  const data = (await readFile(path!)).toString('base64');
  expect(
    await page.evaluate(
      async ({ data, expected }) => {
        const imgs = await Promise.all(
          [expected, 'data:image/png;base64,' + data].map(async (src) => {
            const i = new Image();
            i.src = src;
            await i.decode();
            return i;
          }),
        );
        const c = Object.assign(document.createElement('canvas'), {
          width: imgs[0].width,
          height: imgs[0].height,
        });
        const ctx = c.getContext('2d')!;
        ctx.drawImage(imgs[0], 0, 0);
        const a = ctx.getImageData(0, 0, c.width, c.height).data;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(imgs[1], 0, 0);
        const b = ctx.getImageData(0, 0, c.width, c.height).data;
        return a.every((v, i) => v === b[i]);
      },
      { data, expected },
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Annotate Labels, arrows and highlights' }).click();
  await page.getByRole('button', { name: 'Add redact', exact: true }).click();
  await page.getByLabel('Annotation x', { exact: true }).fill('15');
  await page.getByLabel('Annotation y', { exact: true }).fill('10');
  await page.getByLabel('Annotation width', { exact: true }).fill('10');
  await page.getByLabel('Annotation height', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Apply annotations' }).click();
  await expect(page.locator('.history-node')).toHaveCount(4);
  await page.getByRole('button', { name: 'Resize Find the right size' }).click();
  expect(await pixels(page, [[20, 15]])).toMatchObject({ pixels: [[0, 0, 0, 255]] });
  await page.getByLabel('Width', { exact: true }).fill('108');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.locator('.history-node')).toHaveCount(5);
  await page.getByRole('button', { name: 'Convert Choose your format' }).click();
  await page.getByRole('combobox', { name: 'Output format' }).click();
  await page.getByRole('option', { name: 'WebP', exact: true }).click();
  await page.getByRole('button', { name: 'Apply convert' }).click();
  await expect(page.locator('.history-node')).toHaveCount(6);
});
test('missing recovered source bytes fail explicitly without a partial graph and draft URLs clean up', async ({
  page,
}) => {
  await page.addInitScript(() => {
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
    Object.assign(window, { live });
  });
  await importImages(page);
  await combine(page);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.reload();
  await expect(page.locator('.history-node')).toHaveCount(2);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((r) => {
      const q = indexedDB.open('transform-local');
      q.onsuccess = () => r(q.result);
    });
    await new Promise<void>((r) => {
      const tx = db.transaction(['session', 'bytes'], 'readwrite');
      const q = tx.objectStore('session').get('current');
      q.onsuccess = () => tx.objectStore('bytes').delete(q.result.objects[1].storage.key);
      tx.oncomplete = () => r();
    });
    db.close();
  });
  await page.getByRole('button', { name: 'Combine Bring images together' }).click();
  await page.getByRole('checkbox', { name: 'Include blue.png' }).check();
  await expect(page.locator('.composition-properties')).toContainText('no longer available');
  await expect(page.getByRole('button', { name: 'Apply combine' })).toBeDisabled();
  await expect(page.locator('.history-node')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear session', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Clear session', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { live: Set<string> }).live.size))
    .toBe(0);
});

test.describe('touch composition', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('tap selection, ordering and apply creates a reusable correctly ordered PNG', async ({
    page,
  }) => {
    await importImages(page);
    await page.getByRole('button', { name: 'Combine', exact: true }).tap();
    await page.getByRole('checkbox', { name: 'Include blue.png' }).tap();
    await page.getByLabel('Padding', { exact: true }).fill('0');
    await page.getByLabel('Gap', { exact: true }).fill('0');
    await page.getByRole('button', { name: 'Move blue.png earlier' }).tap();
    await expect(page.getByRole('button', { name: 'Apply combine' })).toBeEnabled();
    await expect(page.locator('.preview-info')).toContainText('60 × 40');
    expect(
      await pixels(page, [
        [0, 0],
        [20, 10],
      ]),
    ).toMatchObject({
      width: 60,
      height: 40,
      pixels: [
        [0, 0, 255, 255],
        [255, 0, 0, 255],
      ],
    });
    await page.screenshot({ path: 'artifacts/composition-touch.png', fullPage: true });
    await page.getByRole('button', { name: 'Apply combine' }).tap();
    await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
    await expect(page.getByRole('button', { name: /3. Combine/ })).toContainText('From steps 2, 1');
  });
});
