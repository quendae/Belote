(() => {
  'use strict';

  // QQND authoritative multiplayer endpoint (kept here for deploy/static verification).
  const QQND_WS_URL = 'wss://api.qqnd.fyi/api/v1/ws';
  void QQND_WS_URL;

  const Game = window.BeloteNetworkBridge;

  // Critical card visuals live in the runtime too, not only in the optional shared
  // stylesheet. This keeps production correct when belote_cards.css is stale,
  // cached independently, or unavailable on a static host.
  const runtimeCardStyle = document.createElement('style');
  runtimeCardStyle.id = 'belote-runtime-card-style';
  runtimeCardStyle.textContent = `
    .card-back {
      border-color: #efe6d0 !important;
      background: repeating-linear-gradient(45deg, #19375d 0 6px, #244d80 6px 12px) !important;
    }
    .card-back::before {
      content: "";
      position: absolute;
      inset: 4px;
      border: 1px solid rgba(255,255,255,.60);
      border-radius: 5px;
      pointer-events: none;
    }
    .contract-suit-icon {
      display: inline-grid;
      place-items: center;
      width: 1.35em;
      height: 1.35em;
      margin-right: .38em;
      border: 1px solid rgba(0,0,0,.28);
      border-radius: 50%;
      background: #fffdf5;
      box-shadow: 0 1px 4px rgba(0,0,0,.35);
      font: 900 1.08em/1 Georgia, serif;
      vertical-align: -.12em;
    }
    .contract-suit-icon[data-suit="H"],
    .contract-suit-icon[data-suit="D"] { color: #bb2134 !important; }
    .contract-suit-icon[data-suit="C"],
    .contract-suit-icon[data-suit="S"] { color: #171a1a !important; }
    /* The old 950 ms travelling clone is retained only as an internal handoff
       signal for the legacy game core. It must never be visible. */
    .card-flight,
    .card-flight.arrived {
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(runtimeCardStyle);
  window.BELOTE_CLIENT_VERSION = '1.0.0';

  const SUIT_SYMBOLS = { C: '♣', S: '♠', H: '♥', D: '♦' };
  const syncContractSuitIcon = () => {
    const suit = Game?.getState?.()?.trump;
    const target = document.querySelector('#contract');
    if (!target || !SUIT_SYMBOLS[suit]) return;

    const current = target.querySelector('.contract-suit-icon');
    if (current?.dataset.suit === suit) return;
    current?.remove();

    const icon = document.createElement('span');
    icon.className = 'contract-suit-icon';
    icon.dataset.suit = suit;
    icon.textContent = SUIT_SYMBOLS[suit];
    icon.setAttribute('aria-hidden', 'true');
    target.prepend(icon);
  };

  // Dureń-style card motion: the real card is rendered at its destination and
  // settles quickly instead of travelling across the whole table for ~950 ms.
  const seenTrickCards = new Set();
  let collectedTrickKey = '';
  let pendingCollectionKey = '';
  const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const baseRotationFor = (node) => {
    if (node.classList.contains('s1')) return 8;
    if (node.classList.contains('s3')) return -8;
    return 0;
  };

  const animateTableEntry = (node) => {
    if (!node || !Game?.prefs?.animations || prefersReducedMotion() || typeof node.animate !== 'function') return null;

    const baseRotation = baseRotationFor(node);
    return node.animate([
      {
        opacity: 0.15,
        transform: `translateY(-60px) scale(0.86) rotate(${baseRotation + 6}deg)`
      },
      {
        opacity: 1,
        transform: `translateY(0px) scale(1) rotate(${baseRotation}deg)`
      }
    ], {
      duration: 280,
      easing: 'cubic-bezier(.2,.8,.3,1)',
      fill: 'both'
    });
  };

  const collectionTarget = (winner) => {
    const selector = ['#seatSouth', '#seatWest', '#seatNorth', '#seatEast'][winner];
    if (!selector) return null;
    const seat = document.querySelector(selector);
    return seat?.querySelector('.nameplate') || seat;
  };

  const trickKey = (state) => state?.trick?.map(item => item?.card?.id).filter(Boolean).join('|') || '';

  const animateTrickCollection = (state, entryBarrier = null) => {
    if (!state || state.phase !== 'trick' || !Array.isArray(state.trick) || state.trick.length !== 4) return;

    const key = trickKey(state);
    if (!key || key === collectedTrickKey || key === pendingCollectionKey) return;

    if (!Game?.prefs?.animations || prefersReducedMotion()) {
      collectedTrickKey = key;
      return;
    }

    // The fourth card is the semantic barrier. Collection cannot begin until the
    // exact table-entry animation created for state.trick.at(-1) has completed.
    // This avoids races between multiple MutationObserver passes.
    if (entryBarrier && entryBarrier.playState !== 'finished') {
      pendingCollectionKey = key;
      Promise.resolve(entryBarrier.finished).catch(() => undefined).then(() => {
        if (pendingCollectionKey === key) pendingCollectionKey = '';
        const current = Game?.getState?.();
        if (trickKey(current) === key) animateTrickCollection(current);
      });
      return;
    }

    collectedTrickKey = key;
    const target = collectionTarget(state.lastWinner);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    document.querySelectorAll('#trick .trick-card').forEach((node, index) => {
      if (typeof node.animate !== 'function') return;
      const rect = node.getBoundingClientRect();
      const dx = targetX - (rect.left + rect.width / 2);
      const dy = targetY - (rect.top + rect.height / 2);
      const baseRotation = baseRotationFor(node);
      const collectRotation = index % 2 ? -8 : 8;

      node.getAnimations().forEach(animation => {
        try { animation.finish(); } catch (_) { /* no-op */ }
      });

      node.animate([
        {
          offset: 0,
          opacity: 1,
          transform: `translate(0px, 0px) scale(1) rotate(${baseRotation}deg)`
        },
        {
          offset: 0.82,
          opacity: 1
        },
        {
          offset: 1,
          opacity: 0,
          transform: `translate(${dx}px, ${dy}px) scale(0.46) rotate(${collectRotation}deg)`
        }
      ], {
        duration: 500,
        easing: 'cubic-bezier(.32,0,.18,1)',
        fill: 'forwards'
      });
    });
  };

  const syncTrickAnimations = () => {
    const state = Game?.getState?.();
    const trick = state?.trick || [];
    const currentIds = new Set(trick.map(item => item?.card?.id).filter(Boolean));
    const lastCardId = trick.at(-1)?.card?.id || '';
    let lastCardEntry = null;

    if (!currentIds.size) {
      seenTrickCards.clear();
      collectedTrickKey = '';
      pendingCollectionKey = '';
    }

    document.querySelectorAll('#trick .trick-card').forEach(node => {
      const id = node.querySelector('[data-card]')?.dataset.card;
      if (!id || !currentIds.has(id) || seenTrickCards.has(id)) return;
      node.dataset.beloteCardId = id;
      const entry = animateTableEntry(node);
      if (id === lastCardId) lastCardEntry = entry;
      seenTrickCards.add(id);
    });

    animateTrickCollection(state, lastCardEntry);
  };

  const finishLegacyFlight = (flight) => {
    if (!flight?.classList?.contains('card-flight')) return;
    // animateCard() attaches its WAAPI animation synchronously after appendChild;
    // the MutationObserver runs afterwards, so finishing here resolves its legacy
    // Promise immediately and lets the real trick card render without a dead gap.
    queueMicrotask(() => {
      flight.getAnimations().forEach(animation => {
        try { animation.finish(); } catch (_) { /* already finished/cancelled */ }
      });
    });
  };

  const syncRuntimeUi = () => {
    syncTrickAnimations();
    syncContractSuitIcon();
  };

  const motionObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (!(added instanceof Element)) continue;
        finishLegacyFlight(added);
        added.querySelectorAll?.('.card-flight').forEach(finishLegacyFlight);
      }
    }
    queueMicrotask(syncRuntimeUi);
  });
  motionObserver.observe(document.body, { childList: true, subtree: true });
  syncRuntimeUi();

  // The monolithic offline core still uses sleep(950) after the fourth card. Keep
  // its logic intact, but give the fourth card 280 ms to settle first and then
  // enough time for Dureń's 500 ms collection before clearing the trick state.
  const nativeSetTimeout = window.setTimeout;
  const installTrickTimerPatch = () => {
    window.setTimeout = function beloteDurenSetTimeout(handler, timeout, ...args) {
      let delay = timeout;
      const state = Game?.getState?.();
      const completedTrick = Number(timeout) === 950 &&
        state?.phase === 'trick' &&
        Array.isArray(state.trick) && state.trick.length === 4 &&
        document.querySelectorAll('#trick .trick-card').length === 4;
      if (completedTrick) {
        delay = (!Game?.prefs?.animations || prefersReducedMotion()) ? 10 : 820;
      }
      return nativeSetTimeout.call(window, handler, delay, ...args);
    };
  };
  installTrickTimerPatch();

  // The offline default player label is "Ty", while online nicknames require 3+ chars.
  const normalizeDefaultNickname = () => {
    const input = document.querySelector('#playerName');
    if (!input) return;
    const value = String(input.value || '').trim();
    if (Array.from(value).length >= 3) return;
    const lang = Game?.prefs?.lang || 'pl';
    input.value = lang === 'de' ? 'Spieler' : lang === 'en' ? 'Player' : 'Gracz';
  };

  normalizeDefaultNickname();
  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('#shareBtn,#shareMenu')) normalizeDefaultNickname();
  }, true);

  const cardStyle = document.createElement('link');
  cardStyle.rel = 'stylesheet';
  cardStyle.href = 'belote_cards.css?v=20260910-1.0.0';
  cardStyle.dataset.beloteCards = 'shared';
  document.head.appendChild(cardStyle);

  // Preserve the canonical filename used by index.html while keeping the
  // authoritative client untouched in a dedicated core file.
  const script = document.createElement('script');
  script.src = 'belote_multiplayer_core.js?v=20260910-1.0.0';
  script.async = false;
  script.addEventListener('load', () => {
    installTrickTimerPatch();
    syncRuntimeUi();
  }, { once: true });
  document.body.appendChild(script);
})();
