import { chromium } from '@playwright/test';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto('http://localhost:3000/ai-center'); await p.waitForLoadState('networkidle'); await p.screenshot({ path: '/private/tmp/claude-501/-Users-macbookpro-Projects-clara/aeabea17-34af-425f-9558-534c86df2fbe/scratchpad/aicenter.png', fullPage: false });
await p.goto('http://localhost:3000/projects/PRJ-606A5AE04C?tab=documents'); await p.waitForLoadState('networkidle'); await p.screenshot({ path: '/private/tmp/claude-501/-Users-macbookpro-Projects-clara/aeabea17-34af-425f-9558-534c86df2fbe/scratchpad/docs.png', fullPage: true });
await p.goto('http://localhost:3000/projects/PRJ-606A5AE04C?tab=change-requests'); await p.waitForLoadState('networkidle'); await p.screenshot({ path: '/private/tmp/claude-501/-Users-macbookpro-Projects-clara/aeabea17-34af-425f-9558-534c86df2fbe/scratchpad/cr.png', fullPage: false });
await b.close();
