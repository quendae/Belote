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
    /* The old 950 ms travelling clone is retained only as an internal handoff
       signal for the legacy game core. It must never be visible. */
    .card-flight,
    .card-flight.arrived {
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(runtimeCardStyle);
  window.BELOTE_CLIENT_VERSION = '2026.09.10-duren-motion-1';

  // Dureń-style card motion: the real card is rendered at its destination and
  // settles quickly instead of travelling across the whole table for ~950 ms.
  // Dureń uses 280 ms, cubic-bezier(.2,.8,.3,1), -60px, .86 scale and 6deg.
  const seenTrickCards = new Set();
  const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const baseRotationFor = (node) => {
    if (node.classList.contains('s1')) return 8;
    if (node.classList.contains('s3')) return -8;
    return 0;
  };

  const animateTableEntry = (node) => {
    if (!node || !Game?.prefs?.animations || prefersReducedMotion() || typeof node.animate !== 'function') return;

    const baseRotation = baseRotationFor(node);
    node.animate([
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

  const syncTrickAnimations = () => {
    const trick = Game?.getState?.()?.trick || [];
    const currentIds = new Set(trick.map(item => item?.card?.id).filter(Boolean));
    if (!currentIds.size) seenTrickCards.clear();

    document.querySelectorAll('#trick .trick-card').forEach(node => {
      const id = node.querySelector('[data-card]')?.dataset.card;
      if (!id || !currentIds.has(id) || seenTrickCards.has(id)) return;
      node.dataset.beloteCardId = id;
      animateTableEntry(node);
      seenTrickCards.add(id);
    });
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

  const motionObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (!(added instanceof Element)) continue;
        finishLegacyFlight(added);
        added.querySelectorAll?.('.card-flight').forEach(finishLegacyFlight);
      }
    }
    queueMicrotask(syncTrickAnimations);
  });
  motionObserver.observe(document.body, { childList: true, subtree: true });
  syncTrickAnimations();

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
  cardStyle.href = 'belote_cards.css?v=20260910-duren-motion-1';
  cardStyle.dataset.beloteCards = 'shared';
  document.head.appendChild(cardStyle);

  // Preserve the canonical filename used by index.html while keeping the
  // authoritative client untouched in a dedicated core file.
  const script = document.createElement('script');
  script.src = 'belote_multiplayer_core.js?v=20260910-duren-motion-1';
  script.async = false;
  document.body.appendChild(script);
})();
