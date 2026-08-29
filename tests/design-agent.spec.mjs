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

for (const viewport of viewports) {
  test(`design agent: ${viewport.name} (${SWEEPS} randomized UI sweeps)`, async ({ page }, testInfo) => {
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

      await page.evaluate(({ uiState, language, fourColors }) => {
        prefs.lang = language;
        prefs.fourColors = fourColors;
        prefs.animations = false;
        prefs.sound = false;

        document.querySelectorAll('.modal').forEach(el => el.classList.add('hidden'));
        document.querySelector('#mainMenu')?.classList.add('hidden');

        state = fresh('local', [301, 501, 1001][Math.floor(Math.random() * 3)], 'smart', 'Tester');
        deal();

        if (uiState !== 'menu' && state.phase === 'bid') {
          if (uiState !== 'bid') bid(state.active, state.turnup.s);
        }

        if (uiState === 'menu') {
          document.querySelector('#mainMenu')?.classList.remove('hidden');
        } else if (uiState === 'settings') {
          document.querySelector('#settingsModal')?.classList.remove('hidden');
          if (typeof applySettingsText === 'function') applySettingsText();
        } else if (uiState === 'rules') {
          document.querySelector('#rulesModal')?.classList.remove('hidden');
          if (typeof applyText === 'function') applyText();
        } else if (uiState === 'multiplayer') {
          document.querySelector('#multiplayerModal')?.classList.remove('hidden');
          document.querySelector('#multiplayerSetup')?.classList.remove('hidden');
          document.querySelector('#multiplayerLobby')?.classList.add('hidden');
          if (typeof applyMpCopy === 'function') applyMpCopy();
        }

        render();
        if (typeof applyText === 'function') applyText();
      }, { uiState, language, fourColors });

      await page.waitForTimeout(20);

      const scan = await page.evaluate(({ mobile, uiState }) => {
        const critical = [];
        const warning = [];
        const visible = el => {
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
        };
        const boxData = el => {
          const b = el.getBoundingClientRect();
          return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height), right: Math.round(b.right), bottom: Math.round(b.bottom) };
        };

        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        if (overflow > 2) critical.push({ type: 'horizontal-overflow', overflow });

        const activeRoot = uiState === 'menu'
          ? document.querySelector('#mainMenu .menu-card')
          : uiState === 'settings'
            ? document.querySelector('#settingsModal .modal-card')
            : uiState === 'rules'
              ? document.querySelector('#rulesModal .modal-card')
              : uiState === 'multiplayer'
                ? document.querySelector('#multiplayerModal .modal-card')
                : document.querySelector('.app');

        if (!activeRoot || !visible(activeRoot)) critical.push({ type: 'missing-active-surface', uiState });

        const interactive = [...document.querySelectorAll('button, input, select, textarea')].filter(visible);
        for (const el of interactive) {
          const b = el.getBoundingClientRect();
          const label = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 70) || el.id || el.tagName;
          if (b.right > innerWidth + 2 || b.left < -2) critical.push({ type: 'interactive-clipped-horizontal', label, box: boxData(el) });
          if (b.width < 28 || b.height < 28) warning.push({ type: 'small-control', label, box: boxData(el) });
          if (mobile && (b.width < 40 || b.height < 40) && !el.classList.contains('card')) warning.push({ type: 'small-touch-target', label, box: boxData(el) });
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
          if (!el || !visible(el)) {
            critical.push({ type: 'essential-not-visible', selector });
            continue;
          }
          const b = el.getBoundingClientRect();
          if (b.right > innerWidth + 2 || b.left < -2) critical.push({ type: 'essential-clipped-horizontal', selector, box: boxData(el) });
        }

        const readable = [...document.querySelectorAll('p, small, span, label, button, h1, h2, h3, .section-title, .nameplate')].filter(el => visible(el) && el.textContent.trim());
        for (const el of readable) {
          const size = parseFloat(getComputedStyle(el).fontSize || '0');
          if (mobile && size > 0 && size < 10) {
            warning.push({ type: 'tiny-text-mobile', text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80), fontSize: size });
          }
        }

        if (['bid', 'play'].includes(uiState)) {
          const felt = document.querySelector('.felt')?.getBoundingClientRect();
          const prompt = document.querySelector('#prompt')?.getBoundingClientRect();
          if (felt && prompt && (prompt.left < felt.left - 2 || prompt.right > felt.right + 2)) {
            critical.push({ type: 'prompt-outside-table', felt: { left: felt.left, right: felt.right }, prompt: { left: prompt.left, right: prompt.right } });
          }
          const southCards = [...document.querySelectorAll('#seatSouth .card')].filter(visible);
          if (!southCards.length) warning.push({ type: 'player-hand-not-visible', uiState });
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
      }, { mobile: viewport.mobile, uiState });

      for (const item of scan.critical) criticals.push({ iteration: i, uiState, language, fourColors, ...item });
      for (const item of scan.warning) warnings.push({ iteration: i, uiState, language, fourColors, ...item });
      samples.push({ iteration: i, uiState, language, fourColors, metrics: scan.metrics });

      if (i < states.length) {
        const path = testInfo.outputPath(`${viewport.name}-${uiState}.png`);
        await page.screenshot({ path, fullPage: true });
        await testInfo.attach(`${viewport.name}-${uiState}`, { path, contentType: 'image/png' });
      }
    }

    const report = {
      viewport,
      sweeps: SWEEPS,
      criticals,
      warnings,
      samples,
      pageErrors
    };
    await testInfo.attach('design-agent-report.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json'
    });

    expect(pageErrors, 'The UI emitted browser runtime errors').toEqual([]);
    expect(criticals, `Responsive agent found ${criticals.length} critical layout/access problems`).toEqual([]);
  });
}
