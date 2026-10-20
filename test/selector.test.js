const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const hasBrowser = fs.existsSync(executablePath);
let server, browser, base;

before(async () => {
  if (!hasBrowser) return;
  // Run the real application server on a free port, independently of developer sessions.
  const net = require('node:net');
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Application failed to start')), 10000);
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.stdout.on('data', data => { if (data.toString().includes('Server is running')) { clearTimeout(timeout); resolve(); } });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
  });
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); server?.kill(); });

async function selectTaplejung(page) {
  await page.goto(base + '/docs/demo.html');
  await page.locator('#province option[value="1"]').waitFor({ state: 'attached' });
  await page.selectOption('#province', '1');
  await page.locator('#district option[value="101"]').waitFor({ state: 'attached' });
  await page.selectOption('#district', '101');
  await page.locator('#municipality option[value="10101"]').waitFor({ state: 'attached' });
  await page.selectOption('#municipality', '10101');
  await page.locator('#ward option[value="11"]').waitFor({ state: 'attached' });
}

test('selector follows all five levels, saves custom toles, and clears dependents', { skip: !hasBrowser }, async () => {
  const page = await browser.newPage();
  try {
    await selectTaplejung(page);
    assert.equal(await page.locator('#ward option').count(), 12);
    await page.selectOption('#ward', '11');
    await page.getByLabel('5. Village / Tole').fill('My recorded tole');
    await page.getByRole('button', { name: 'Save suggestion' }).click();
    assert.match(await page.locator('#finalText').innerText(), /My recorded tole.*11.*Phungling.*Taplejung.*Koshi/);
    await page.reload();
    await selectTaplejung(page);
    await page.selectOption('#ward', '11');
    assert.equal(await page.locator('#villageSuggestions option[value="My recorded tole"]').count(), 1);
    await page.selectOption('#province', '2');
    for (const id of ['district', 'municipality', 'ward', 'village']) assert.equal(await page.locator('#' + id).inputValue(), '');
    for (const id of ['municipality', 'ward', 'village']) assert.equal(await page.locator('#' + id).isDisabled(), true);
    assert.equal(await page.locator('#selectionResult').isVisible(), false);
  } finally { await page.close(); }
});

test('search supports Nepali, handles empty results, and stays usable on mobile', { skip: !hasBrowser }, async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await page.goto(base + '/docs/demo.html');
    await page.locator('#province option[value="1"]').waitFor({ state: 'attached' });
    await page.getByLabel('Search provinces').fill('मधेश');
    assert.equal(await page.locator('#province option').count(), 2);
    await page.selectOption('#province', '2');
    await page.locator('#district option[value="203"]').waitFor({ state: 'attached' });
    await page.getByLabel('Search districts').fill('not a district');
    assert.match(await page.locator('#district').innerText(), /No matching/);
    await page.getByLabel('Search districts').fill('धनुषा');
    assert.equal(await page.locator('#district option').count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  } finally { await page.close(); }
});

test('failed requests show recovery and stale parent requests cannot overwrite current options', { skip: !hasBrowser }, async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/districts/province-1.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.goto(base + '/docs/demo.html');
    await page.locator('#province option[value="1"]').waitFor({ state: 'attached' });
    await page.selectOption('#province', '1');
    await page.getByRole('button', { name: 'Retry' }).waitFor();
    assert.match(await page.locator('#status').innerText(), /Unable to load/);
    await page.unroute('**/districts/province-1.json');
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.locator('#district option[value="101"]').waitFor({ state: 'attached' });
    await page.route('**/districts/province-1.json', async route => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.continue().catch(() => {});
    });
    await page.selectOption('#province', '2');
    await page.selectOption('#province', '1');
    await page.selectOption('#province', '2');
    await page.locator('#district option[value="201"]').waitFor({ state: 'attached' });
    // Observe longer than the intentionally delayed response.
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#district option').count(), 9);
    assert.equal(await page.locator('#district option[value="101"]').count(), 0);
  } finally { await page.close(); }
});
