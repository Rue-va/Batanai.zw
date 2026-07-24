import { chromium } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ serviceWorkers: 'allow' });
const page = await context.newPage();

await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker?.controller != null, { timeout: 10000 });
await page.waitForTimeout(1500); // let any controllerchange-triggered reload settle
console.log('✓ service worker active, url:', page.url());

const v1 = await page.evaluate(() => fetch('/__cache-test.png').then(r => r.text())).catch(e => 'ERR: ' + e.message);
console.log('fetch result (populates SW cache):', v1.trim());

// confirm it's actually IN the SW cache now
const cached = await page.evaluate(async () => {
  const cache = await caches.open('batanai-shell-v1');
  const match = await cache.match('/__cache-test.png');
  return match ? await match.text() : 'NOT IN CACHE';
});
console.log('what SW cache holds:', cached.trim());

await browser.close();
