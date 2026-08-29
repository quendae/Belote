import { test, expect } from '@playwright/test';

const STRESS_GAMES = Number(process.env.RULE_STRESS_GAMES || 500);

test('rules agent: validate Belote contract and stress hundreds of deals', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.goto('/belote_offline_single.html');
  await page.waitForSelector('#mainMenu');

  const report = await page.evaluate(({ games }) => {
    prefs.animations = false;
    prefs.sound = false;

    const failures = [];
    const observations = [];
    const fail = (kind, message, context = {}) => failures.push({ kind, message, context });
    const check = (condition, kind, message, context = {}) => {
      if (!condition) fail(kind, message, context);
    };
    const makeCard = (s, r, suffix = Math.random().toString(36).slice(2)) => ({ id: `${s}${r}-${suffix}`, s, r });
    const ids = cards => cards.map(card => card.id).sort();
    const sameCards = (actual, expected) => JSON.stringify(ids(actual)) === JSON.stringify(ids(expected));
    const tStrength = card => ({ '7': 0, '8': 1, Q: 2, K: 3, '10': 4, A: 5, '9': 6, J: 7 })[card.r];
    const nStrength = card => ({ '7': 0, '8': 1, '9': 2, J: 3, Q: 4, K: 5, '10': 6, A: 7 })[card.r];
    const cardStrength = (card, trump) => card.s === trump ? tStrength(card) : nStrength(card);
    const independentWinner = () => {
      if (!state.trick.length) return null;
      const lead = state.trick[0].card.s;
      let winning = state.trick[0];
      for (const item of state.trick.slice(1)) {
        const a = item.card;
        const b = winning.card;
        const aTrump = a.s === state.trump;
        const bTrump = b.s === state.trump;
        if (aTrump && !bTrump) winning = item;
        else if (aTrump && bTrump && cardStrength(a, state.trump) > cardStrength(b, state.trump)) winning = item;
        else if (!bTrump && a.s === lead && b.s === lead && cardStrength(a, state.trump) > cardStrength(b, state.trump)) winning = item;
      }
      return winning.p;
    };
    const highestTrumpInTrick = () => {
      const trumps = state.trick.filter(item => item.card.s === state.trump).map(item => item.card);
      if (!trumps.length) return null;
      return trumps.sort((a, b) => cardStrength(b, state.trump) - cardStrength(a, state.trump))[0];
    };
    const expectedLegal = p => {
      const hand = state.hands[p];
      if (!state.trick.length) return hand;
      const lead = state.trick[0].card.s;
      const follow = hand.filter(card => card.s === lead);
      const winner = independentWinner();
      const partnerWinning = winner !== null && team(winner) === team(p);

      if (follow.length) {
        if (lead === state.trump) {
          const highest = highestTrumpInTrick();
          const higher = highest ? follow.filter(card => cardStrength(card, state.trump) > cardStrength(highest, state.trump)) : [];
          if (higher.length) return higher;
        }
        return follow;
      }

      if (partnerWinning) return hand;
      const trumps = hand.filter(card => card.s === state.trump);
      if (!trumps.length) return hand;
      const highest = highestTrumpInTrick();
      if (!highest) return trumps;
      const higher = trumps.filter(card => cardStrength(card, state.trump) > cardStrength(highest, state.trump));
      return higher.length ? higher : trumps;
    };

    // Point values and ranking contract.
    const trumpPoints = { J: 20, '9': 14, A: 11, '10': 10, K: 4, Q: 3, '8': 0, '7': 0 };
    const plainPoints = { A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0 };
    for (const [rank, expected] of Object.entries(trumpPoints)) {
      check(points(makeCard('H', rank), 'H') === expected, 'points', `Wrong trump value for ${rank}`, { expected });
    }
    for (const [rank, expected] of Object.entries(plainPoints)) {
      check(points(makeCard('S', rank), 'H') === expected, 'points', `Wrong plain-suit value for ${rank}`, { expected });
    }

    const trumpOrder = ['7', '8', 'Q', 'K', '10', 'A', '9', 'J'];
    const plainOrder = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'];
    check(trumpOrder.every((rank, i) => strength(makeCard('H', rank), 'H') === i), 'ranking', 'Trump ranking differs from Belote order');
    check(plainOrder.every((rank, i) => strength(makeCard('S', rank), 'H') === i), 'ranking', 'Plain-suit ranking differs from Belote order');

    // Deterministic legality cases.
    state = fresh('local', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.trump = 'H';
    state.active = 1;
    state.trick = [{ p: 0, card: makeCard('S', 'A', 'lead') }];
    state.hands = [[], [makeCard('S', '7', 'follow'), makeCard('H', 'J', 'trump'), makeCard('C', 'A', 'discard')], [], []];
    check(sameCards(legal(1), [state.hands[1][0]]), 'follow-suit', 'Player can avoid following the led suit');

    state = fresh('local', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.trump = 'H';
    state.active = 2;
    state.trick = [
      { p: 0, card: makeCard('S', '7', 'lead2') },
      { p: 1, card: makeCard('S', 'A', 'oppwin') }
    ];
    state.hands = [[], [], [makeCard('H', '7', 'musttrump'), makeCard('C', 'A', 'discard2')], []];
    check(sameCards(legal(2), [state.hands[2][0]]), 'must-trump', 'Player can discard although an opponent is winning and trump is available');

    state = fresh('local', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.trump = 'H';
    state.active = 2;
    state.trick = [
      { p: 0, card: makeCard('S', 'A', 'partnerwin') },
      { p: 1, card: makeCard('S', '10', 'loser') }
    ];
    state.hands = [[], [], [makeCard('H', '7', 'freeTrump'), makeCard('C', 'A', 'freeDiscard')], []];
    check(sameCards(legal(2), state.hands[2]), 'partner-winning', 'Player is forced to trump although partner is winning');

    state = fresh('local', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.trump = 'H';
    state.active = 2;
    state.trick = [
      { p: 0, card: makeCard('S', '7', 'plainlead') },
      { p: 1, card: makeCard('H', '9', 'trumped') }
    ];
    state.hands = [[], [], [makeCard('H', 'J', 'over'), makeCard('H', '7', 'under'), makeCard('C', 'A', 'other')], []];
    check(sameCards(legal(2), [state.hands[2][0]]), 'overtrump', 'Player is not forced to overtrump an opponent when able');

    state = fresh('local', 501, 'smart', 'Tester');
    state.phase = 'play';
    state.trump = 'H';
    state.active = 1;
    state.trick = [{ p: 0, card: makeCard('H', '9', 'trumplead') }];
    state.hands = [[], [makeCard('H', 'J', 'higherTrump'), makeCard('H', '7', 'lowerTrump'), makeCard('C', 'A', 'off')], [], []];
    check(sameCards(legal(1), [state.hands[1][0]]), 'trump-led-overtrump', 'When trump is led, a player with a higher trump is allowed to undertrump');

    // Stress complete deals using the production deck, deal completion, legality, winner and point functions.
    let tricksChecked = 0;
    let legalChoicesChecked = 0;
    let maxDealPoints = 0;
    for (let game = 0; game < games; game++) {
      state = fresh('local', 501, game % 2 ? 'smart' : 'calm', `Tester-${game}`);
      state.dealer = game % 4;
      const cards = deck();
      state.hands = [0, 1, 2, 3].map(p => sortHand(cards.slice(p * 5, p * 5 + 5)));
      state.turnup = cards[20];
      state.stock = cards.slice(21);
      state.trump = state.turnup.s;
      state.bidder = (state.dealer + 1) % 4;
      state.bidRound = 1;
      state.phase = 'play';
      state.active = (state.dealer + 1) % 4;
      state.trick = [];
      state.tricks = [0, 0];
      state.raw = [0, 0];
      completeDeal(state.bidder);

      const initial = state.hands.flat();
      check(initial.length === 32, 'deal-size', 'Completed deal does not contain 32 cards', { game, count: initial.length });
      check(new Set(initial.map(card => card.id)).size === 32, 'duplicate-card', 'Duplicate card detected after deal', { game });
      check(state.hands.every(hand => hand.length === 8), 'hand-size', 'Not every player received 8 cards', { game, sizes: state.hands.map(hand => hand.length) });

      for (let trickNo = 0; trickNo < 8; trickNo++) {
        for (let playNo = 0; playNo < 4; playNo++) {
          const p = state.active;
          const actual = legal(p);
          const expected = expectedLegal(p);
          legalChoicesChecked++;
          if (!sameCards(actual, expected)) {
            fail('legal-set', 'Production legal() differs from Belote contract', {
              game,
              trickNo,
              playNo,
              player: p,
              trump: state.trump,
              trick: state.trick.map(item => ({ p: item.p, s: item.card.s, r: item.card.r })),
              hand: state.hands[p].map(card => ({ id: card.id, s: card.s, r: card.r })),
              actual: ids(actual),
              expected: ids(expected)
            });
          }
          check(actual.length > 0, 'no-legal-card', 'No legal card returned for a non-empty hand', { game, trickNo, player: p });
          const choice = actual[(game + trickNo + playNo) % actual.length];
          state.hands[p] = state.hands[p].filter(card => card.id !== choice.id);
          state.trick.push({ p, card: choice });
          if (state.trick.length < 4) state.active = (p + 1) % 4;
        }

        const actualWinner = trickWinner();
        const expectedWinner = independentWinner();
        check(actualWinner === expectedWinner, 'trick-winner', 'trickWinner() disagrees with independent ranking', {
          game,
          trickNo,
          actualWinner,
          expectedWinner,
          trump: state.trump,
          trick: state.trick.map(item => ({ p: item.p, s: item.card.s, r: item.card.r }))
        });
        const value = state.trick.reduce((sum, item) => sum + points(item.card, state.trump), 0) + (trickNo === 7 ? 10 : 0);
        state.raw[team(actualWinner)] += value;
        state.tricks[team(actualWinner)]++;
        state.trick = [];
        state.active = actualWinner;
        tricksChecked++;
      }

      const total = state.raw[0] + state.raw[1];
      maxDealPoints = Math.max(maxDealPoints, total);
      check(total === 162, 'deal-total', 'A completed deal does not total 162 card points', { game, raw: [...state.raw], total });
      check(state.tricks[0] + state.tricks[1] === 8, 'trick-count', 'A completed deal does not contain exactly 8 tricks', { game, tricks: [...state.tricks] });
      check(state.hands.every(hand => hand.length === 0), 'cards-left', 'Cards remain after eight tricks', { game, sizes: state.hands.map(hand => hand.length) });
    }

    observations.push({
      games,
      tricksChecked,
      legalChoicesChecked,
      maxDealPoints,
      contractSource: 'Classic four-player Belote: follow suit, mandatory trump when opponent wins, overtrump when possible, 162 points per deal.'
    });

    return { games, failures, observations };
  }, { games: STRESS_GAMES });

  await testInfo.attach('rules-agent-report.json', {
    body: Buffer.from(JSON.stringify({ ...report, pageErrors }, null, 2)),
    contentType: 'application/json'
  });

  expect(pageErrors, 'The game emitted browser runtime errors').toEqual([]);
  expect(report.failures, `Rules agent found ${report.failures.length} rule/integrity problems`).toEqual([]);
});
