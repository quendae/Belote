import { test, expect } from '@playwright/test';

const STRESS_GAMES = Number(process.env.RULE_STRESS_GAMES || 500);

const card = (s, r, id = `${s}${r}-${Math.random().toString(36).slice(2)}`) => ({ id, s, r });
const baseState = overrides => ({
  v: 2,
  mode: 'local',
  diff: 'smart',
  goal: 1001,
  names: ['Tester', 'Lena', 'Marek', 'Nora'],
  scores: [0, 0],
  dealer: 3,
  deal: 1,
  phase: 'play',
  hands: [[], [], [], []],
  trump: 'H',
  bidder: 0,
  bidRound: 1,
  turnup: null,
  stock: [],
  active: 0,
  passCount: 0,
  trick: [],
  tricks: [0, 0],
  raw: [0, 0],
  logs: [],
  lastTrick: null,
  lastWinner: null,
  botTimer: 0,
  ...overrides
});

async function seedState(page, state) {
  await page.evaluate(value => localStorage.setItem('beloteState', JSON.stringify(value)), state);
  await page.reload();
  await page.waitForSelector('.app');
}

async function allowedIds(page, player) {
  return page.locator(`[data-player="${player}"] .card:not(.illegal)`).evaluateAll(nodes => nodes.map(node => node.dataset.card).sort());
}

async function checkLegalCase(page, failures, name, state, expectedIds) {
  await seedState(page, state);
  const actual = await allowedIds(page, state.active);
  const expected = [...expectedIds].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push({ kind: name, message: 'Rendered legal cards differ from the Belote rule contract', actual, expected, state });
  }
}

test('rules agent: real UI + 500 complete deals', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms = 0, ...args) => nativeSetTimeout(fn, Math.min(Number(ms) || 0, 1), ...args);
    localStorage.setItem('belotePrefs', JSON.stringify({ lang: 'en', sound: false, animations: false, fourColors: false }));
  });

  await page.goto('/belote_offline_single.html');
  await page.waitForSelector('#mainMenu');

  const failures = [];

  const follow = card('S', '7', 'follow');
  await checkLegalCase(page, failures, 'follow-suit', baseState({
    active: 1,
    trick: [{ p: 0, card: card('S', 'A', 'lead') }],
    hands: [[], [follow, card('H', 'J', 'trump'), card('C', 'A', 'discard')], [], []]
  }), [follow.id]);

  const mustTrump = card('H', '7', 'must-trump');
  await checkLegalCase(page, failures, 'must-trump', baseState({
    active: 2,
    trick: [
      { p: 0, card: card('S', '7', 'lead-2') },
      { p: 1, card: card('S', 'A', 'opponent-winning') }
    ],
    hands: [[], [], [mustTrump, card('C', 'A', 'discard-2')], []]
  }), [mustTrump.id]);

  const freeTrump = card('H', '7', 'free-trump');
  const freeDiscard = card('C', 'A', 'free-discard');
  await checkLegalCase(page, failures, 'partner-winning', baseState({
    active: 2,
    trick: [
      { p: 0, card: card('S', 'A', 'partner-winning') },
      { p: 1, card: card('S', '10', 'loser') }
    ],
    hands: [[], [], [freeTrump, freeDiscard], []]
  }), [freeTrump.id, freeDiscard.id]);

  const over = card('H', 'J', 'over');
  await checkLegalCase(page, failures, 'overtrump', baseState({
    active: 2,
    trick: [
      { p: 0, card: card('S', '7', 'plain-lead') },
      { p: 1, card: card('H', '9', 'opponent-trumped') }
    ],
    hands: [[], [], [over, card('H', '7', 'under'), card('C', 'A', 'other')], []]
  }), [over.id]);

  const higherTrump = card('H', 'J', 'higher-trump');
  await checkLegalCase(page, failures, 'trump-led-overtrump', baseState({
    active: 1,
    trick: [{ p: 0, card: card('H', '9', 'trump-lead') }],
    hands: [[], [higherTrump, card('H', '7', 'lower-trump'), card('C', 'A', 'off-suit')], [], []]
  }), [higherTrump.id]);

  // Start a fresh real local game. From here every action goes through the production click handlers.
  await page.evaluate(() => localStorage.removeItem('beloteState'));
  await page.reload();
  await page.locator('[data-action="new-local"]').click();
  await page.locator('#goal').selectOption('1001');
  await page.locator('[data-action="start"]').click();

  const stress = await page.evaluate(async games => {
    const failures = [];
    const stats = { games, tricksChecked: 0, legalSetsChecked: 0, cardsPlayed: 0 };
    const read = () => JSON.parse(localStorage.getItem('beloteState') || 'null');
    const wait = () => new Promise(resolve => setTimeout(resolve, 0));
    const waitFor = async predicate => {
      for (let i = 0; i < 80; i++) {
        const value = read();
        if (predicate(value)) return value;
        await wait();
      }
      return read();
    };
    const team = player => player % 2;
    const tStrength = rank => ({ '7': 0, '8': 1, Q: 2, K: 3, '10': 4, A: 5, '9': 6, J: 7 })[rank];
    const nStrength = rank => ({ '7': 0, '8': 1, '9': 2, J: 3, Q: 4, K: 5, '10': 6, A: 7 })[rank];
    const strength = (c, trump) => c.s === trump ? tStrength(c.r) : nStrength(c.r);
    const points = (c, trump) => c.s === trump
      ? ({ J: 20, '9': 14, A: 11, '10': 10, K: 4, Q: 3, '8': 0, '7': 0 })[c.r]
      : ({ A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0 })[c.r];
    const winner = (trick, trump) => {
      if (!trick.length) return null;
      const lead = trick[0].card.s;
      let win = trick[0];
      for (const item of trick.slice(1)) {
        const a = item.card;
        const b = win.card;
        if (a.s === trump && b.s !== trump) win = item;
        else if (a.s === trump && b.s === trump && strength(a, trump) > strength(b, trump)) win = item;
        else if (b.s !== trump && a.s === lead && b.s === lead && strength(a, trump) > strength(b, trump)) win = item;
      }
      return win.p;
    };
    const expectedLegal = (state, player) => {
      const hand = state.hands[player];
      if (!state.trick.length) return hand;
      const lead = state.trick[0].card.s;
      const follow = hand.filter(c => c.s === lead);
      const currentWinner = winner(state.trick, state.trump);
      if (follow.length) {
        if (lead === state.trump) {
          const currentTrumps = state.trick.filter(x => x.card.s === state.trump).map(x => x.card);
          const highest = currentTrumps.sort((a, b) => strength(b, state.trump) - strength(a, state.trump))[0];
          const higher = follow.filter(c => strength(c, state.trump) > strength(highest, state.trump));
          if (higher.length) return higher;
        }
        return follow;
      }
      if (currentWinner !== null && team(currentWinner) === team(player)) return hand;
      const trumps = hand.filter(c => c.s === state.trump);
      if (!trumps.length) return hand;
      const currentTrumps = state.trick.filter(x => x.card.s === state.trump).map(x => x.card);
      if (!currentTrumps.length) return trumps;
      const highest = currentTrumps.sort((a, b) => strength(b, state.trump) - strength(a, state.trump))[0];
      const higher = trumps.filter(c => strength(c, state.trump) > strength(highest, state.trump));
      return higher.length ? higher : trumps;
    };
    const ids = cards => cards.map(c => c.id).sort();

    for (let game = 0; game < games; game++) {
      let state = read();
      if (!state || state.phase !== 'bid') {
        failures.push({ kind: 'deal-start', game, phase: state?.phase });
        break;
      }

      // First-round acceptance gives a deterministic, fast contract while still using the real bidding UI.
      const bidButton = document.querySelector(`[data-bid="${state.turnup.s}"]`);
      if (!bidButton) {
        failures.push({ kind: 'bid-control-missing', game, active: state.active, suit: state.turnup.s });
        break;
      }
      bidButton.click();
      state = await waitFor(s => s?.phase === 'play');
      if (state?.phase !== 'play' || !state.trump) {
        failures.push({ kind: 'bid-failed', game, state });
        break;
      }
      if (state.hands.some(hand => hand.length !== 8)) failures.push({ kind: 'hand-size', game, sizes: state.hands.map(h => h.length) });
      const all = state.hands.flat();
      if (all.length !== 32 || new Set(all.map(c => c.id)).size !== 32) failures.push({ kind: 'deck-integrity', game, count: all.length });

      for (let trickNo = 0; trickNo < 8; trickNo++) {
        let expectedWinner = null;
        let expectedValue = null;

        for (let playNo = 0; playNo < 4; playNo++) {
          state = read();
          const player = state.active;
          const expected = expectedLegal(state, player);
          const actual = [...document.querySelectorAll(`[data-player="${player}"] .card:not(.illegal)`)].map(el => el.dataset.card).sort();
          stats.legalSetsChecked++;
          if (JSON.stringify(actual) !== JSON.stringify(ids(expected))) {
            failures.push({
              kind: 'legal-set', game, trickNo, playNo, player, trump: state.trump,
              trick: state.trick.map(x => ({ p: x.p, s: x.card.s, r: x.card.r })),
              hand: state.hands[player].map(c => ({ id: c.id, s: c.s, r: c.r })),
              actual, expected: ids(expected)
            });
          }
          const chosenId = actual[0];
          const chosen = state.hands[player].find(c => c.id === chosenId);
          if (!chosen) {
            failures.push({ kind: 'no-playable-card', game, trickNo, playNo, player, actual });
            return { failures, stats };
          }
          if (playNo === 3) {
            const completed = [...state.trick, { p: player, card: chosen }];
            expectedWinner = winner(completed, state.trump);
            expectedValue = completed.reduce((sum, item) => sum + points(item.card, state.trump), 0) + (trickNo === 7 ? 10 : 0);
          }
          document.querySelector(`[data-card="${CSS.escape(chosenId)}"]`)?.click();
          stats.cardsPlayed++;
          await wait();
        }

        state = await waitFor(s => s && (s.phase === 'play' || s.phase === 'done') && s.trick.length === 0);
        stats.tricksChecked++;
        if (state.lastWinner !== expectedWinner) failures.push({ kind: 'trick-winner', game, trickNo, expectedWinner, actualWinner: state.lastWinner, lastTrick: state.lastTrick });
        if (state.lastTrick?.value !== expectedValue) failures.push({ kind: 'trick-value', game, trickNo, expectedValue, actualValue: state.lastTrick?.value, lastTrick: state.lastTrick });
      }

      state = read();
      const total = (state.raw?.[0] || 0) + (state.raw?.[1] || 0);
      if (total !== 162) failures.push({ kind: 'deal-total', game, total, raw: state.raw });
      if ((state.tricks?.[0] || 0) + (state.tricks?.[1] || 0) !== 8) failures.push({ kind: 'trick-count', game, tricks: state.tricks });
      if (!state.hands.every(hand => hand.length === 0)) failures.push({ kind: 'cards-left', game, sizes: state.hands.map(h => h.length) });

      document.querySelector('[data-action="next-hand"]')?.click();
      state = await waitFor(s => s?.phase === 'bid');
      if (state?.phase !== 'bid') {
        failures.push({ kind: 'next-deal-failed', game, phase: state?.phase });
        break;
      }
    }

    return { failures, stats };
  }, STRESS_GAMES);

  const report = { deterministicFailures: failures, stress, pageErrors };
  await testInfo.attach('rules-agent-report.json', {
    body: Buffer.from(JSON.stringify(report, null, 2)),
    contentType: 'application/json'
  });

  expect(pageErrors, 'The game emitted browser runtime errors').toEqual([]);
  expect([...failures, ...stress.failures], `Rules agent found ${failures.length + stress.failures.length} rule/integrity problems`).toEqual([]);
});
