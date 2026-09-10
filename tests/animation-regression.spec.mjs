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

  // Dureń-style handoff: the real table card appears immediately. There is no
  // separate long-lived flight clone waiting ~950 ms before the table updates.
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
