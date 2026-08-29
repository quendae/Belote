import { test, expect } from '@playwright/test';

const CONFIGS = [
  { name: 'four humans', humanSeats: [1, 2, 3], botSeats: [], difficulty: 'smart' },
  { name: 'guest west + two bots', humanSeats: [1], botSeats: [2, 3], difficulty: 'calm' },
  { name: 'guest north + two bots', humanSeats: [2], botSeats: [1, 3], difficulty: 'smart' },
  { name: 'guest east + two bots', humanSeats: [3], botSeats: [1, 2], difficulty: 'smart' },
  { name: 'two guests + bot west', humanSeats: [2, 3], botSeats: [1], difficulty: 'calm' },
  { name: 'two guests + bot north', humanSeats: [1, 3], botSeats: [2], difficulty: 'smart' },
  { name: 'two guests + bot east', humanSeats: [1, 2], botSeats: [3], difficulty: 'smart' }
];

async function debug(page) {
  return page.evaluate(() => !!window.BeloteMultiplayerRuntime?.debug);
}

async function driveDeal(page, config) {
  await page.evaluate((cfg) => window.BeloteMultiplayerRuntime.debug.startHost({ ...cfg, goal: 301 }), config);

  let forcedBid = false;
  for (let step = 0; step < 500; step++) {
    const snapshot = await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.state());
    if (snapshot.phase === 'done') return snapshot;

    const botSeats = new Set(config.botSeats);
    const active = snapshot.active;
    if (botSeats.has(active)) {
      await page.waitForTimeout(5);
      continue;
    }

    if (snapshot.phase === 'bid') {
      const choices = await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.bidChoices());
      const suit = !forcedBid && choices.length ? choices[0] : 'pass';
      forcedBid = forcedBid || suit !== 'pass';
      const ok = await page.evaluate(({ active, suit }) => window.BeloteMultiplayerRuntime.debug.action(active, 'bid', { suit }), { active, suit });
      expect(ok).toBe(true);
      await page.waitForTimeout(3);
      continue;
    }

    if (snapshot.phase === 'play') {
      const legal = await page.evaluate((seat) => window.BeloteMultiplayerRuntime.debug.legal(seat), active);
      expect(legal.length).toBeGreaterThan(0);
      const ok = await page.evaluate(({ active, cardId }) => window.BeloteMultiplayerRuntime.debug.action(active, 'play', { cardId }), { active, cardId: legal[0] });
      expect(ok).toBe(true);
      await page.waitForTimeout(4);
      continue;
    }

    await page.waitForTimeout(5);
  }
  throw new Error(`Deal did not finish for ${config.name}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/belote_offline_single.html');
  await page.waitForSelector('#mainMenu');
  expect(await debug(page)).toBe(true);
});

test('multiplayer v2 replaces local pass-and-play and manual SDP exchange', async ({ page }) => {
  await expect(page.locator('[data-action="new-local"]')).toHaveCount(0);
  await expect(page.locator('#mode option[value="local"]')).toHaveCount(0);

  await page.locator('#shareBtn').click();
  await expect(page.locator('#multiplayerModal')).toBeVisible();
  await expect(page.locator('#mpCreateButton')).toBeVisible();
  await expect(page.locator('#mpJoinButton')).toBeVisible();
  await expect(page.locator('#mpRoomCode')).toBeVisible();
  await expect(page.locator('#mpOutgoingCode')).toHaveCount(0);
  await expect(page.locator('#mpAnswerCode')).toHaveCount(0);
  await expect(page.locator('#multiplayerModal textarea')).toHaveCount(0);
});

test('host-authoritative routing rejects wrong seat and hidden state never leaks deck/opponent hands', async ({ page }) => {
  await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.startHost({ humanSeats: [1, 2, 3], botSeats: [], difficulty: 'smart', goal: 301 }));
  const report = await page.evaluate(() => {
    const D = window.BeloteMultiplayerRuntime.debug;
    const state = D.state();
    const view = D.view(1);
    const wrongSeat = (state.active + 1) % 4;
    const wrongTurnAccepted = D.action(wrongSeat, 'bid', { suit: D.bidChoices()[0] || 'pass' });
    const fakeCardAccepted = D.action(state.active, 'play', { cardId: 'not-a-card' });
    return { state, view, wrongTurnAccepted, fakeCardAccepted };
  });

  expect(report.wrongTurnAccepted).toBe(false);
  expect(report.fakeCardAccepted).toBe(false);
  expect(report.state.stock.length).toBeGreaterThan(0);
  expect(report.view.stock).toEqual([]);
  expect(report.view.hands[0].every(card => card.s && card.r && !card.hidden)).toBe(true);
  expect(report.view.hands.slice(1).flat().every(card => card.hidden === true && !('s' in card) && !('r' in card))).toBe(true);
});

test('lobby requires at least one remote human and accepts host-side bot seats', async ({ page }) => {
  const noHuman = await page.evaluate(() => {
    const D = window.BeloteMultiplayerRuntime.debug;
    D.startHost({ humanSeats: [], botSeats: [1, 2, 3], difficulty: 'smart' });
    return D.lobby();
  });
  expect(noHuman.ready).toBe(false);
  expect(noHuman.botSeats.sort()).toEqual([1, 2, 3]);

  const hybrid = await page.evaluate(() => {
    const D = window.BeloteMultiplayerRuntime.debug;
    D.startHost({ humanSeats: [1], botSeats: [2, 3], difficulty: 'calm' });
    return D.lobby();
  });
  expect(hybrid.ready).toBe(true);
  expect(hybrid.humans).toBe(1);
  expect(hybrid.botSeats.sort()).toEqual([2, 3]);
});

for (const config of CONFIGS) {
  test(`complete host-authoritative deal: ${config.name}`, async ({ page }) => {
    const final = await driveDeal(page, config);
    expect(final.phase).toBe('done');
    expect(final.hands.every(hand => hand.length === 0)).toBe(true);
    expect(final.tricks[0] + final.tricks[1]).toBe(8);
    expect(final.raw[0] + final.raw[1]).toBe(162);
    expect(final.scores[0] + final.scores[1]).toBeGreaterThan(0);
  });
}
