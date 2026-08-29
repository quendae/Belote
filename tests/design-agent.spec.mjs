import { test, expect } from '@playwright/test';

const SWEEPS = Number(process.env.DESIGN_SWEEPS_PER_VIEWPORT || 24);

const viewports = [
  { name: 'phone-portrait-360x800', width: 360, height: 800, mobile: true },
  { name: 'phone-landscape-844x390', width: 844, height: 390, mobile: true },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024, mobile: true },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768, mobile: false },
  { name: 'laptop-1366x768', width: 1366, height: 768, mobile: false },
  { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false }
];

const states = ['menu', 'bid', 'play', 'settings', 'rules', 'multiplayer'];
const languages = ['pl', 'en', 'de'];
const suits = ['S', 'H', 'D', 'C'];
const ranks = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'];
const deck = suits.flatMap(s => ranks.map(r => ({ id: `${s}${r}-qa`, s, r })));

function savedState(phase, iteration) {
  const base = {
    v: 2,
    mode: 'local',
    diff: 'smart',
    goal: [301, 501, 1001][iteration % 3],
    names: ['Tester', 'Lena', 'Marek', 'Nora'],
    scores: [(iteration * 17) % 240, (iteration * 11) % 220],
    dealer: 3,
    deal: iteration + 1,
    phase,
    hands: [[], [], [], []],
    trump: null,
    bidder: null,
    bidRound: 1,
    turnup: null,
    stock: [],
    active: iteration % 4,
    passCount: 0,
    trick: [],
    tricks: [0, 0],
    raw: [0, 0],
    logs: [],
    lastTrick: null,
    lastWinner: null,
    botTimer: 0
  };

  if (phase === 'bid') {
    base.hands = [0, 1, 2, 3].map(p => deck.slice(p * 5, p * 5 + 5));
    base.turnup = deck[20];
    base.stock = deck.slice(21);
    base.active = iteration % 4;
    return base;
  }

  base.phase = 'play';
  base.hands = [0, 1, 2, 3].map(p => deck.slice(p * 8, p * 8 + 8));
  base.trump = 'H';
  base.bidder = 0;
  base.active = iteration % 4;
  return base;
}

async function prepare(page, uiState, language, fourColors, iteration) {
  const needsGame = uiState !== 'menu';
  const state = needsGame ? savedState(uiState === 'bid' ? 'bid' : 'play', iteration) : null;
  await page.evaluate(({ language, fourColors, state }) => {
    localStorage.setItem('belotePrefs', JSON.stringify({ language, lang: language, fourColors, sound: false, animations: false }));
    if (state) localStorage.setItem('beloteState', JSON.stringify(state));
    else localStorage.removeItem('beloteState');
  }, { language, fourColors, state });
  await page.reload();
  await page.waitForSelector('.app');

  if (uiState === 'settings') await page.locator('[data-action="settings"]').click();
  if (uiState === 'rules') await page.locator('[data-action="rules"]').click();
  if (uiState === 'multiplayer') await page.locator('[data-action="share"]').click();
}

for (const viewport of viewports) {
  test(`design agent: ${viewport.name} (${SWEEPS} UI sweeps)`, async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error)));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/belote_offline_single.html');
    await page.waitForSelector('#mainMenu');

    const criticals = [];
    const warnings = [];
    const samples = [];

    for (let i = 0; i < SWEEPS; i++) {
      const uiState = states[i % states.length];
      const language = languages[i % languages.length];
      const fourColors = i % 2 === 1;
      await prepare(page, uiState, language, fourColors, i);
      await page.waitForTimeout(15);

      const scan = await page.evaluate(({ mobile, uiState, width, height }) => {
        const critical = [];
        const warning = [];
        const visible = el => {
          if (!el) return false;
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
        };
        const boxData = el => {
          const b = el.getBoundingClientRect();
          return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height), right: Math.round(b.right), bottom: Math.round(b.bottom) };
        };
        const clippedByHiddenAncestor = el => {
          const own = el.getBoundingClientRect();
          let parent = el.parentElement;
          while (parent && parent !== document.body) {
            const style = getComputedStyle(parent);
            const box = parent.getBoundingClientRect();
            const ox = style.overflowX;
            const oy = style.overflowY;
            if ((ox === 'hidden' || ox === 'clip') && (own.left < box.left - 1 || own.right > box.right + 1)) return { axis: 'x', ancestor: parent.className || parent.id };
            if ((oy === 'hidden' || oy === 'clip') && (own.top < box.top - 1 || own.bottom > box.bottom + 1)) return { axis: 'y', ancestor: parent.className || parent.id };
            parent = parent.parentElement;
          }
          return null;
        };

        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        if (overflow > 2) critical.push({ type: 'horizontal-page-overflow', overflow });

        const activeRoot = uiState === 'menu'
          ? document.querySelector('#mainMenu .menu-card')
          : uiState === 'settings'
            ? document.querySelector('#settingsModal .modal-card')
            : uiState === 'rules'
              ? document.querySelector('#rulesModal .modal-card')
              : uiState === 'multiplayer'
                ? document.querySelector('#multiplayerModal .modal-card')
                : document.querySelector('.app');
        if (!visible(activeRoot)) critical.push({ type: 'missing-active-surface', uiState });

        const interactive = [...document.querySelectorAll('button, input, select, textarea')].filter(visible);
        for (const el of interactive) {
          const b = el.getBoundingClientRect();
          const label = el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) || el.id || el.tagName;
          if (b.right > innerWidth + 2 || b.left < -2) critical.push({ type: 'interactive-clipped-horizontal', label, box: boxData(el) });
          const ancestorClip = clippedByHiddenAncestor(el);
          if (ancestorClip) critical.push({ type: 'interactive-clipped-by-container', label, ...ancestorClip, box: boxData(el) });
          if (b.width < 28 || b.height < 28) warning.push({ type: 'small-control', label, box: boxData(el) });
          if (mobile && !el.classList.contains('card') && (b.width < 40 || b.height < 40)) warning.push({ type: 'small-touch-target', label, box: boxData(el) });

          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          if (!el.classList.contains('card') && cx >= 0 && cx <= innerWidth && cy >= 0 && cy <= innerHeight) {
            const hit = document.elementFromPoint(cx, cy);
            if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) warning.push({ type: 'possibly-occluded-control', label, hit: hit.id || hit.className || hit.tagName });
          }
        }

        const essentials = uiState === 'menu'
          ? ['#mainMenu .menu-title', '#botsMenu', '#localMenu', '#learnMenu', '#language']
          : uiState === 'settings'
            ? ['#settingsTitle', '#settingsLanguage', '#settingsCardColors', '#settingsSave']
            : uiState === 'rules'
              ? ['#rulesHead', '#rulesText']
              : uiState === 'multiplayer'
                ? ['#multiplayerTitle', '#mpCreateButton', '#mpOfferButton']
                : ['.topbar', '.felt', '#prompt', '#rulesBtn', '#shareBtn', '#newBtn'];

        for (const selector of essentials) {
          const el = document.querySelector(selector);
          if (!visible(el)) {
            critical.push({ type: 'essential-not-visible', selector });
            continue;
          }
          const b = el.getBoundingClientRect();
          if (b.right > innerWidth + 2 || b.left < -2) critical.push({ type: 'essential-clipped-horizontal', selector, box: boxData(el) });
          const ancestorClip = clippedByHiddenAncestor(el);
          if (ancestorClip) critical.push({ type: 'essential-clipped-by-container', selector, ...ancestorClip, box: boxData(el) });
        }

        const readable = [...document.querySelectorAll('p, small, span, label, button, h1, h2, h3, .section-title, .nameplate')].filter(el => visible(el) && el.textContent.trim());
        for (const el of readable) {
          const size = parseFloat(getComputedStyle(el).fontSize || '0');
          if (mobile && size > 0 && size < 10) warning.push({ type: 'tiny-text-mobile', text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80), fontSize: size });
        }

        if (['bid', 'play'].includes(uiState)) {
          const felt = document.querySelector('.felt')?.getBoundingClientRect();
          const prompt = document.querySelector('#prompt')?.getBoundingClientRect();
          if (felt && prompt && (prompt.left < felt.left - 2 || prompt.right > felt.right + 2)) critical.push({ type: 'prompt-outside-table', felt: { left: felt.left, right: felt.right }, prompt: { left: prompt.left, right: prompt.right } });
          const activeCards = [...document.querySelectorAll(`[data-player] .card`)].filter(visible);
          if (!activeCards.length) warning.push({ type: 'no-visible-cards', uiState });
        }

        if (mobile && width > height && document.documentElement.scrollHeight > innerHeight * 2.5) {
          warning.push({ type: 'landscape-excessive-vertical-scroll', ratio: Number((document.documentElement.scrollHeight / innerHeight).toFixed(2)), scrollHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight });
        }

        return {
          critical,
          warning,
          metrics: {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: document.documentElement.clientHeight,
            interactives: interactive.length
          }
        };
      }, { mobile: viewport.mobile, uiState, width: viewport.width, height: viewport.height });

      for (const item of scan.critical) criticals.push({ iteration: i, uiState, language, fourColors, ...item });
      for (const item of scan.warning) warnings.push({ iteration: i, uiState, language, fourColors, ...item });
      samples.push({ iteration: i, uiState, language, fourColors, metrics: scan.metrics });

      if (i < states.length) {
        const path = testInfo.outputPath(`${viewport.name}-${uiState}.png`);
        await page.screenshot({ path, fullPage: true });
        await testInfo.attach(`${viewport.name}-${uiState}`, { path, contentType: 'image/png' });
      }
    }

    const report = { viewport, sweeps: SWEEPS, criticals, warnings, samples, pageErrors };
    await testInfo.attach('design-agent-report.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json'
    });

    expect(pageErrors, 'The UI emitted browser runtime errors').toEqual([]);
    expect(criticals, `Responsive agent found ${criticals.length} critical layout/access problems`).toEqual([]);
  });
}
