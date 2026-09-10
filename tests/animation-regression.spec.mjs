import { test, expect } from '@playwright/test';

test('card backs and Duren-style table entry survive missing shared stylesheet', async ({ page }) => {
  await page.route('**/belote_cards.css*', route => route.abort());
  await page.goto('/');
  await page.waitForFunction(() => !!window.BeloteNetworkBridge);

  await page.evaluate(() => {
    window.__BELOTE_MANUAL_TEST__ = true;
    const bridge = window.BeloteNetworkBridge;
    bridge.prefs.animations = true;

    const state = bridge.fresh('bots', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.deal = 1;
    state.trump = 'H';
    state.bidder = 0;
    state.active = 0;
    state.hands = [
      [{ id: 'anim-H-A', s: 'H', r: 'A' }],
      [{ id: 'opp-S-7', s: 'S', r: '7' }],
      [],
      []
    ];
    state.trick = [];
    state.tricks = [0, 0];
    state.raw = [0, 0];
    bridge.setState(state);
    bridge.render();
    document.querySelector('#mainMenu')?.classList.add('hidden');
  });

  const back = page.locator('.card-back').first();
  await expect(back).toHaveCount(1);
  const backBackground = await back.evaluate(el => getComputedStyle(el).backgroundImage);
  expect(backBackground, 'card back fell back to the old green inline style').toMatch(/rgb\(25, 55, 93\)|rgb\(36, 77, 128\)|#19375d|#244d80/i);

  await page.evaluate(() => {
    window.BeloteNetworkBridge.play(0, 'anim-H-A');
  });

  await expect(page.locator('.card-flight')).toHaveCount(0);
  const tableCard = page.locator('#trick .trick-card').first();
  await expect(tableCard).toHaveCount(1);

  const entry = await tableCard.evaluate(el => {
    const animation = el.getAnimations()[0];
    if (!animation) return null;
    const timing = animation.effect?.getComputedTiming?.();
    const frames = animation.effect?.getKeyframes?.() || [];
    return {
      duration: Number(timing?.duration || 0),
      firstTransform: String(frames[0]?.transform || ''),
      lastTransform: String(frames.at(-1)?.transform || '')
    };
  });

  expect(entry, 'new trick card should animate into its final table position').not.toBeNull();
  expect(entry.duration).toBeGreaterThanOrEqual(240);
  expect(entry.duration).toBeLessThanOrEqual(350);
  expect(entry.firstTransform).toMatch(/translateY\(-60px\).*scale\(0\.86\).*rotate\(6deg\)/);
  expect(entry.lastTransform).toMatch(/translateY\(0px\).*scale\(1\).*rotate\(0deg\)/);
});

test('contract shows the trump suit icon', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.BeloteNetworkBridge);

  await page.evaluate(() => {
    const bridge = window.BeloteNetworkBridge;
    const state = bridge.fresh('bots', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.deal = 1;
    state.trump = 'H';
    state.bidder = 0;
    state.active = 0;
    state.hands = [[], [], [], []];
    state.trick = [];
    state.tricks = [0, 0];
    state.raw = [0, 0];
    bridge.setState(state);
    bridge.render();
    document.querySelector('#mainMenu')?.classList.add('hidden');
  });

  const icon = page.locator('#contract .contract-suit-icon');
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveText('♥');
  await expect(icon).toHaveAttribute('data-suit', 'H');
});

test('fourth card settles on table before completed trick is collected', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.BeloteNetworkBridge);

  await page.evaluate(() => {
    window.__BELOTE_MANUAL_TEST__ = true;
    const bridge = window.BeloteNetworkBridge;
    bridge.prefs.animations = true;

    const state = bridge.fresh('bots', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.deal = 1;
    state.trump = 'H';
    state.bidder = 0;
    state.active = 0;
    state.hands = [
      [{ id: 'collect-S-A', s: 'S', r: 'A' }],
      [{ id: 'collect-S-7', s: 'S', r: '7' }],
      [{ id: 'collect-S-8', s: 'S', r: '8' }],
      [{ id: 'collect-S-9', s: 'S', r: '9' }]
    ];
    state.trick = [];
    state.tricks = [0, 0];
    state.raw = [0, 0];
    bridge.setState(state);
    bridge.render();
    document.querySelector('#mainMenu')?.classList.add('hidden');
  });

  for (const [player, cardId] of [
    [0, 'collect-S-A'],
    [1, 'collect-S-7'],
    [2, 'collect-S-8']
  ]) {
    await page.evaluate(([p, id]) => window.BeloteNetworkBridge.play(p, id), [player, cardId]);
  }

  const fourthPlayedAt = Date.now();
  await page.evaluate(() => window.BeloteNetworkBridge.play(3, 'collect-S-9'));
  await page.waitForFunction(() => window.BeloteNetworkBridge.getState()?.phase === 'trick');
  await expect(page.locator('#trick .trick-card')).toHaveCount(4);

  const fourthCard = page.locator('#trick .trick-card').filter({ has: page.locator('[data-card="collect-S-9"]') });
  await expect(fourthCard).toHaveCount(1);

  const immediateAnimations = await fourthCard.evaluate(el => el.getAnimations().map(animation => Number(animation.effect?.getComputedTiming?.()?.duration || 0)));
  expect(immediateAnimations.some(duration => duration >= 240 && duration <= 350), 'fourth card should first run the normal table-entry animation').toBeTruthy();
  expect(immediateAnimations.some(duration => duration >= 450 && duration <= 560), 'collection must not overlap the fourth-card entry').toBeFalsy();

  await page.waitForTimeout(170);
  const midAnimations = await fourthCard.evaluate(el => el.getAnimations().map(animation => Number(animation.effect?.getComputedTiming?.()?.duration || 0)));
  expect(midAnimations.some(duration => duration >= 450 && duration <= 560), 'collection started before the fourth card had time to settle').toBeFalsy();

  await expect.poll(async () => {
    return fourthCard.evaluate(el => el.getAnimations().some(animation => {
      const duration = Number(animation.effect?.getComputedTiming?.()?.duration || 0);
      return duration >= 450 && duration <= 560;
    }));
  }, { timeout: 500 }).toBeTruthy();

  expect(Date.now() - fourthPlayedAt, 'collection should begin only after the ~280 ms entry').toBeGreaterThanOrEqual(220);

  await expect.poll(async () => page.locator('#trick .trick-card').count(), { timeout: 1100 }).toBe(0);
  expect(Date.now() - fourthPlayedAt, 'the sequential entry + collection should still finish promptly').toBeLessThan(1000);
});
