import { test, expect } from '@playwright/test';

test('played card remains visible until the real trick card takes over', async ({ page }) => {
  await page.goto('/belote_offline_single.html');
  await page.waitForFunction(() => {
    const style = document.querySelector('link[data-belote-cards="shared"]');
    return !!window.BeloteNetworkBridge && !!style?.sheet;
  });

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
    state.hands = [[{ id: 'anim-H-A', s: 'H', r: 'A' }], [], [], []];
    state.trick = [];
    state.tricks = [0, 0];
    state.raw = [0, 0];
    bridge.setState(state);
    bridge.render();
    document.querySelector('#mainMenu')?.classList.add('hidden');
  });

  await page.evaluate(() => window.BeloteNetworkBridge.play(0, 'anim-H-A'));
  const flight = page.locator('.card-flight');
  await expect(flight).toHaveCount(1);

  const lateFrame = await page.evaluate(() => {
    const ghost = document.querySelector('.card-flight');
    const animation = ghost?.getAnimations()[0];
    if (!ghost || !animation) return null;
    animation.pause();
    animation.currentTime = 945;
    return {
      opacity: Number.parseFloat(getComputedStyle(ghost).opacity),
      destinationCount: document.querySelectorAll('#trick .trick-card').length
    };
  });

  expect(lateFrame).not.toBeNull();
  expect(
    lateFrame.destinationCount > 0 || lateFrame.opacity >= 0.95,
    `Card visually disappears during handoff: ${JSON.stringify(lateFrame)}`
  ).toBe(true);

  await page.evaluate(() => document.querySelector('.card-flight')?.getAnimations()[0]?.finish());
  await expect(page.locator('#trick .trick-card')).toHaveCount(1);
});
