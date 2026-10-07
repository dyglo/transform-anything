import { expect, test, type Page } from '@playwright/test';
async function setup(page: Page, portrait = false) {
  await page.goto('/workspace');
  await page.locator('input[type=file]').last().setInputFiles('public/hero-bg.png');
  await expect(page.getByRole('button', { name: 'Apply resize' })).toBeEnabled();
  if (portrait) {
    await page.getByRole('button', { name: 'Rotate Change perspective' }).click();
    await page.getByRole('button', { name: 'Apply rotate' }).click();
    await expect(page.getByRole('button', { name: /2. Rotate/ })).toBeVisible();
  }
  await page.getByRole('button', { name: /^Crop(?: Keep what matters)?$/ }).click();
  await expect(page.getByRole('button', { name: 'Resize crop from bottom-right' })).toBeVisible();
}
async function drag(page: Page, label: string, dx: number, dy: number) {
  const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
  if (!box) throw new Error('Missing crop handle');
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 6 });
  await page.mouse.up();
}
test('drag corners on a scaled portrait image, move, clamp, sync numeric edits, and apply', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page, true);
  const image = await page.locator('.preview-image').boundingBox();
  const overlay = await page.getByRole('group', { name: 'Crop selection' }).boundingBox();
  expect(image).not.toBeNull();
  expect(overlay).not.toBeNull();
  expect(overlay!.width).toBeCloseTo(image!.width, 0);
  expect(overlay!.height).toBeCloseTo(image!.height, 0);
  await drag(page, 'Resize crop from bottom-right', -25, -35);
  const width = Number(await page.getByLabel('Width', { exact: true }).inputValue()),
    height = Number(await page.getByLabel('Height', { exact: true }).inputValue());
  expect(width).toBeCloseTo(1003 - (25 * 1003) / image!.width, 0);
  expect(height).toBeCloseTo(1568 - (35 * 1568) / image!.height, 0);
  await drag(page, 'Resize crop from top-left', 15, 20);
  expect(Number(await page.getByLabel('Left', { exact: true }).inputValue())).toBeGreaterThan(0);
  expect(Number(await page.getByLabel('Top', { exact: true }).inputValue())).toBeGreaterThan(0);
  const right =
    Number(await page.getByLabel('Left', { exact: true }).inputValue()) +
    Number(await page.getByLabel('Width', { exact: true }).inputValue());
  expect(right).toBe(width);
  await drag(page, 'Move crop selection', -1000, -1000);
  await expect(page.getByLabel('Left', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Top', { exact: true })).toHaveValue('0');
  await page.getByLabel('Width', { exact: true }).fill('300');
  await page.getByLabel('Height', { exact: true }).fill('500');
  const sized = await page.getByRole('group', { name: 'Crop selection' }).boundingBox();
  expect(sized!.width).toBeCloseTo((image!.width * 300) / 1003, 0);
  await page.getByRole('button', { name: 'Resize crop from top-right' }).press('ArrowLeft');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('299');
  await page.getByRole('button', { name: 'Resize crop from bottom-left' }).press('Shift+ArrowUp');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('490');
  await page.screenshot({ path: 'artifacts/crop-drag-desktop.png' });
  await page.getByRole('button', { name: 'Apply crop' }).click();
  await expect(page.getByRole('button', { name: /3. Crop/ })).toContainText('299 × 490');
  expect(errors).toEqual([]);
});
test.describe('touch crop', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('resizes with a real touch gesture without scrolling the page', async ({
    page,
    context,
  }) => {
    await setup(page);
    const handle = page.getByRole('button', { name: 'Resize crop from bottom-right' });
    await handle.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    const image = await page.locator('.preview-image').boundingBox();
    if (!box || !image) throw new Error('Missing crop image');
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const scroll = await page.evaluate(() => scrollY);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x - 30, y: y - 20 }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(Number(await page.getByLabel('Width', { exact: true }).inputValue())).toBeCloseTo(
      1568 - (30 * 1568) / image.width,
      0,
    );
    expect(Number(await page.getByLabel('Height', { exact: true }).inputValue())).toBeCloseTo(
      1003 - (20 * 1003) / image.height,
      0,
    );
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await page.screenshot({ path: 'artifacts/crop-drag-mobile.png', fullPage: true });
    await cdp.detach();
  });
});
