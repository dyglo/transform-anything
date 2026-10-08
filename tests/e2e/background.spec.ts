import { expect, test } from '@playwright/test';
test('real local background removal creates alpha, preserves original, chains and exports', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  const writes: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    requests.push(r.url());
    if (r.method() !== 'GET') writes.push(r.method());
  });
  await page.goto('/workspace');
  expect(requests.some((url) => url.includes('u2netp') || url.endsWith('.wasm'))).toBe(false);
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f7f4ef';
    ctx.fillRect(0, 0, 400, 400);
    const body = ctx.createLinearGradient(140, 0, 260, 0);
    body.addColorStop(0, '#591c13');
    body.addColorStop(0.4, '#c96636');
    body.addColorStop(1, '#512217');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(140, 110, 120, 230, 25);
    ctx.fill();
    ctx.fillRect(170, 65, 60, 60);
    ctx.fillStyle = '#252b2b';
    ctx.fillRect(168, 55, 64, 25);
    ctx.fillStyle = '#fff6d3';
    ctx.fillRect(145, 185, 110, 95);
    ctx.fillStyle = '#294236';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('BOTANIC', 151, 225);
    ctx.font = '12px Arial';
    ctx.fillText('EVERYDAY OIL', 157, 252);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page
    .locator('input[type=file]')
    .last()
    .setInputFiles({
      name: 'bottle.png',
      mimeType: 'image/png',
      buffer: Buffer.from(image, 'base64'),
    });
  await page.getByRole('button', { name: 'Remove BG Keep just the subject' }).click();
  await page.getByRole('button', { name: 'Apply remove bg' }).click();
  await expect(page.getByRole('button', { name: /2. Remove BG/ })).toBeVisible({ timeout: 100000 });
  await expect(page.getByRole('button', { name: /1. Original/ })).toBeVisible();
  const alpha = await page.locator('.preview-image').evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return {
      corner: data[3],
      center: data[(220 * canvas.width + 200) * 4 + 3],
      transparent: data.filter((_, i) => i % 4 === 3 && data[i] < 10).length,
      width: canvas.width,
      height: canvas.height,
    };
  });
  expect(alpha.width).toBe(400);
  expect(alpha.height).toBe(400);
  expect(alpha.corner).toBeLessThan(10);
  expect(alpha.center).toBeGreaterThan(240);
  expect(alpha.transparent).toBeGreaterThan(50000);
  await page.screenshot({ path: 'artifacts/remove-bg-desktop.png' });
  await page.getByRole('button', { name: 'Resize Find the right size' }).click();
  await page.getByLabel('Width', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Apply resize' }).click();
  await expect(page.getByRole('button', { name: /3. Resize/ })).toContainText('200 × 200');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/remove-bg-resize\.png$/);
  await page.reload();
  await expect(page.getByRole('button', { name: /2. Remove BG/ })).toBeVisible();
  expect(writes).toEqual([]);
  expect(
    requests.every(
      (url) => url.startsWith(new URL(baseURL!).origin + '/') || url.startsWith('blob:'),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test('missing model fails visibly without adding a history node', async ({ page }) => {
  await page.route('**/models/u2netp.onnx', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/workspace');
  await page.locator('input[type=file]').last().setInputFiles('public/hero-bg.png');
  await page.getByRole('button', { name: 'Remove BG Keep just the subject' }).click();
  await page.getByRole('button', { name: 'Apply remove bg' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not load the background model');
  await expect(page.getByRole('button', { name: /1. Original/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: /2. Remove BG/ })).toHaveCount(0);
});
