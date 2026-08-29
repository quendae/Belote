import { test, expect } from '@playwright/test';

const STRESS_GAMES = Number(process.env.RULE_STRESS_GAMES || 500);

test('rules agent: production logic contract + 500 complete deals', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.goto('/belote_offline_single.html');
  await page.waitForSelector('#mainMenu');

  // Test-only bridge. A classic script injected after the game can access the
  // same global lexical environment, so this exposes the real production
  // functions without modifying belote_offline_single.html.
  await page.addScriptTag({ content: `
    window.__beloteQA = {
      fresh,
      deck,
      legal,
      trickWinner,
      points,
      strength,
      completeDeal,
      sortHand,
      team,
      getState: () => state,
      setState: value => { state = value; return state; }
    };
  ` });

  const report = await page.evaluate(games => {
    const Q = window.__beloteQA;
    const samples = [];
    const counts = {};
    const stats = { games, tricksChecked: 0, legalSetsChecked: 0, cardsPlayed: 0, dealsWith162Points: 0 };
    const fail = (kind, message, context = {}) => {
      counts[kind] = (counts[kind] || 0) + 1;
      if (samples.length < 120) samples.push({ kind, message, context });
    };
    const check = (condition, kind, message, context = {}) => {
      if (!condition) fail(kind, message, context);
    };
    const makeCard = (s, r, id = `${s}${r}-${Math.random().toString(36).slice(2)}`) => ({ id, s, r });
    const ids = cards => cards.map(card => card.id).sort();
    const sameCards = (a, b) => JSON.stringify(ids(a)) === JSON.stringify(ids(b));
    const tStrength = rank => ({ '7': 0, '8': 1, Q: 2, K: 3, '10': 4, A: 5, '9': 6, J: 7 })[rank];
    const nStrength = rank => ({ '7': 0, '8': 1, '9': 2, J: 3, Q: 4, K: 5, '10': 6, A: 7 })[rank];
    const independentStrength = (card, trump) => card.s === trump ? tStrength(card.r) : nStrength(card.r);
    const independentPoints = (card, trump) => card.s === trump
      ? ({ J: 20, '9': 14, A: 11, '10': 10, K: 4, Q: 3, '8': 0, '7': 0 })[card.r]
      : ({ A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0 })[card.r];
    const independentWinner = (trick, trump) => {
      if (!trick.length) return null;
      const lead = trick[0].card.s;
      let winning = trick[0];
      for (const item of trick.slice(1)) {
        const a = item.card;
        const b = winning.card;
        if (a.s === trump && b.s !== trump) winning = item;
        else if (a.s === trump && b.s === trump && independentStrength(a, trump) > independentStrength(b, trump)) winning = item;
        else if (b.s !== trump && a.s === lead && b.s === lead && independentStrength(a, trump) > independentStrength(b, trump)) winning = item;
      }
      return winning.p;
    };
    const expectedLegal = (source, player) => {
      const hand = source.hands[player];
      if (!source.trick.length) return hand;
      const lead = source.trick[0].card.s;
      const follow = hand.filter(card => card.s === lead);
      const currentWinner = independentWinner(source.trick, source.trump);

      if (follow.length) {
        if (lead === source.trump) {
          const currentTrumps = source.trick.filter(item => item.card.s === source.trump).map(item => item.card);
          const highest = currentTrumps.sort((a, b) => independentStrength(b, source.trump) - independentStrength(a, source.trump))[0];
          const higher = follow.filter(card => independentStrength(card, source.trump) > independentStrength(highest, source.trump));
          if (higher.length) return higher;
        }
        return follow;
      }

      if (currentWinner !== null && Q.team(currentWinner) === Q.team(player)) return hand;
      const trumps = hand.filter(card => card.s === source.trump);
      if (!trumps.length) return hand;
      const currentTrumps = source.trick.filter(item => item.card.s === source.trump).map(item => item.card);
      if (!currentTrumps.length) return trumps;
      const highest = currentTrumps.sort((a, b) => independentStrength(b, source.trump) - independentStrength(a, source.trump))[0];
      const higher = trumps.filter(card => independentStrength(card, source.trump) > independentStrength(highest, source.trump));
      return higher.length ? higher : trumps;
    };
    const setState = overrides => {
      const value = {
        ...Q.fresh('local', 1001, 'smart', 'Tester'),
        phase: 'play',
        deal: 1,
        trump: 'H',
        bidder: 0,
        hands: [[], [], [], []],
        trick: [],
        ...overrides
      };
      Q.setState(value);
      return value;
    };

    // Production point values and card strength must match the Belote contract.
    for (const [rank, expected] of Object.entries({ J: 20, '9': 14, A: 11, '10': 10, K: 4, Q: 3, '8': 0, '7': 0 })) {
      check(Q.points(makeCard('H', rank), 'H') === expected, 'points-trump', `Wrong trump value for ${rank}`, { rank, expected });
    }
    for (const [rank, expected] of Object.entries({ A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0 })) {
      check(Q.points(makeCard('S', rank), 'H') === expected, 'points-plain', `Wrong non-trump value for ${rank}`, { rank, expected });
    }
    ['7', '8', 'Q', 'K', '10', 'A', '9', 'J'].forEach((rank, index) => {
      check(Q.strength(makeCard('H', rank), 'H') === index, 'strength-trump', `Wrong trump order for ${rank}`, { rank, index });
    });
    ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'].forEach((rank, index) => {
      check(Q.strength(makeCard('S', rank), 'H') === index, 'strength-plain', `Wrong non-trump order for ${rank}`, { rank, index });
    });

    // Deterministic legality probes.
    let follow = makeCard('S', '7', 'follow');
    setState({
      active: 1,
      trick: [{ p: 0, card: makeCard('S', 'A', 'lead') }],
      hands: [[], [follow, makeCard('H', 'J', 'trump'), makeCard('C', 'A', 'discard')], [], []]
    });
    check(sameCards(Q.legal(1), [follow]), 'follow-suit', 'Player can avoid following the led suit');

    let mustTrump = makeCard('H', '7', 'must-trump');
    setState({
      active: 2,
      trick: [
        { p: 0, card: makeCard('S', '7', 'lead-2') },
        { p: 1, card: makeCard('S', 'A', 'opponent-winning') }
      ],
      hands: [[], [], [mustTrump, makeCard('C', 'A', 'discard-2')], []]
    });
    check(sameCards(Q.legal(2), [mustTrump]), 'must-trump', 'Player can discard while an opponent is winning and trump is available');

    let freeTrump = makeCard('H', '7', 'free-trump');
    let freeDiscard = makeCard('C', 'A', 'free-discard');
    setState({
      active: 2,
      trick: [
        { p: 0, card: makeCard('S', 'A', 'partner-winning') },
        { p: 1, card: makeCard('S', '10', 'loser') }
      ],
      hands: [[], [], [freeTrump, freeDiscard], []]
    });
    check(sameCards(Q.legal(2), [freeTrump, freeDiscard]), 'partner-winning', 'Player is forced to trump although partner is winning');

    let over = makeCard('H', 'J', 'over');
    setState({
      active: 2,
      trick: [
        { p: 0, card: makeCard('S', '7', 'plain-lead') },
        { p: 1, card: makeCard('H', '9', 'opponent-trumped') }
      ],
      hands: [[], [], [over, makeCard('H', '7', 'under'), makeCard('C', 'A', 'other')], []]
    });
    check(sameCards(Q.legal(2), [over]), 'overtrump', 'Player is not forced to overtrump an opponent when able');

    let higherTrump = makeCard('H', 'J', 'higher-trump');
    setState({
      active: 1,
      trick: [{ p: 0, card: makeCard('H', '9', 'trump-lead') }],
      hands: [[], [higherTrump, makeCard('H', '7', 'lower-trump'), makeCard('C', 'A', 'off-suit')], [], []]
    });
    check(sameCards(Q.legal(1), [higherTrump]), 'trump-led-overtrump', 'When trump is led, a player with a higher trump may undertrump');

    // Stress the production deck/deal helpers, legal(), trickWinner(), points() and strength().
    for (let game = 0; game < games; game++) {
      const source = Q.fresh('local', 1001, game % 2 ? 'smart' : 'calm', `Tester-${game}`);
      source.dealer = game % 4;
      source.deal = game + 1;
      const cards = Q.deck();
      source.hands = [0, 1, 2, 3].map(player => Q.sortHand(cards.slice(player * 5, player * 5 + 5)));
      source.turnup = cards[20];
      source.stock = cards.slice(21);
      source.trump = source.turnup.s;
      source.bidder = (source.dealer + 1) % 4;
      source.phase = 'play';
      source.active = (source.dealer + 1) % 4;
      source.trick = [];
      source.tricks = [0, 0];
      source.raw = [0, 0];
      Q.setState(source);
      Q.completeDeal(source.bidder);

      const state = Q.getState();
      const allCards = state.hands.flat();
      check(allCards.length === 32, 'deal-size', 'Completed deal does not contain 32 cards', { game, count: allCards.length });
      check(new Set(allCards.map(card => card.id)).size === 32, 'duplicate-card', 'Duplicate card detected after deal', { game });
      check(state.hands.every(hand => hand.length === 8), 'hand-size', 'Not every player has 8 cards after bidding', { game, sizes: state.hands.map(hand => hand.length) });

      for (let trickNo = 0; trickNo < 8; trickNo++) {
        for (let playNo = 0; playNo < 4; playNo++) {
          const current = Q.getState();
          const player = current.active;
          const actual = Q.legal(player);
          const expected = expectedLegal(current, player);
          stats.legalSetsChecked++;
          if (!sameCards(actual, expected)) {
            fail('legal-set', 'Production legal() differs from the Belote rule contract', {
              game,
              trickNo,
              playNo,
              player,
              trump: current.trump,
              trick: current.trick.map(item => ({ p: item.p, s: item.card.s, r: item.card.r })),
              hand: current.hands[player].map(card => ({ id: card.id, s: card.s, r: card.r })),
              actual: ids(actual),
              expected: ids(expected)
            });
          }
          check(actual.length > 0, 'no-legal-card', 'No legal card returned for a non-empty hand', { game, trickNo, playNo, player });
          const choice = actual[(game + trickNo + playNo) % actual.length];
          if (!choice) break;
          current.hands[player] = current.hands[player].filter(card => card.id !== choice.id);
          current.trick.push({ p: player, card: choice });
          current.active = (player + 1) % 4;
          stats.cardsPlayed++;
        }

        const current = Q.getState();
        const actualWinner = Q.trickWinner();
        const expectedWinner = independentWinner(current.trick, current.trump);
        check(actualWinner === expectedWinner, 'trick-winner', 'Production trickWinner() disagrees with independent Belote ranking', {
          game,
          trickNo,
          actualWinner,
          expectedWinner,
          trump: current.trump,
          trick: current.trick.map(item => ({ p: item.p, s: item.card.s, r: item.card.r }))
        });
        const productionValue = current.trick.reduce((sum, item) => sum + Q.points(item.card, current.trump), 0) + (trickNo === 7 ? 10 : 0);
        const independentValue = current.trick.reduce((sum, item) => sum + independentPoints(item.card, current.trump), 0) + (trickNo === 7 ? 10 : 0);
        check(productionValue === independentValue, 'trick-points', 'Production point total differs from independent calculation', { game, trickNo, productionValue, independentValue });
        current.raw[Q.team(actualWinner)] += productionValue;
        current.tricks[Q.team(actualWinner)]++;
        current.trick = [];
        current.active = actualWinner;
        stats.tricksChecked++;
      }

      const finished = Q.getState();
      const total = finished.raw[0] + finished.raw[1];
      check(total === 162, 'deal-total', 'Completed deal does not total 162 points', { game, total, raw: [...finished.raw] });
      if (total === 162) stats.dealsWith162Points++;
      check(finished.tricks[0] + finished.tricks[1] === 8, 'trick-count', 'Completed deal does not contain 8 tricks', { game, tricks: [...finished.tricks] });
      check(finished.hands.every(hand => hand.length === 0), 'cards-left', 'Cards remain after 8 tricks', { game, sizes: finished.hands.map(hand => hand.length) });
    }

    return { counts, samples, stats };
  }, STRESS_GAMES);

  await testInfo.attach('rules-agent-report.json', {
    body: Buffer.from(JSON.stringify({ ...report, pageErrors }, null, 2)),
    contentType: 'application/json'
  });

  const problemCount = Object.values(report.counts).reduce((sum, count) => sum + count, 0);
  console.log(`[rules-agent] ${report.stats.games} deals, ${report.stats.tricksChecked} tricks, ${report.stats.legalSetsChecked} legal-set checks, ${problemCount} problems`);
  if (problemCount) console.log(`[rules-agent] counts: ${JSON.stringify(report.counts)}`);
  if (report.samples.length) console.log(`[rules-agent] sample: ${JSON.stringify(report.samples.slice(0, 12))}`);

  expect(pageErrors, 'The game emitted browser runtime errors').toEqual([]);
  expect(problemCount, `Rules agent found ${problemCount} rule/integrity problems`).toBe(0);
});
