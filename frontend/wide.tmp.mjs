import { chromium } from '@playwright/test';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const url of process.argv.slice(2)) {
  await p.goto('http://localhost:3000' + url); await p.waitForLoadState('networkidle'); await p.waitForTimeout(500);
  const wide = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed'; }).filter(e => { let x = e.parentElement; while (x) { if (getComputedStyle(x).overflowX !== 'visible') return false; x = x.parentElement; } return true; }).slice(0, 6).map(e => `${e.tagName}.${(e.className?.baseVal ?? e.className).toString().slice(0, 90)} right=${Math.round(e.getBoundingClientRect().right)}`));
  console.log(url, wide);
}
await b.close();
