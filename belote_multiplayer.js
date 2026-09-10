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
    .card-flight,
    .card-flight.arrived {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(runtimeCardStyle);
  window.BELOTE_CLIENT_VERSION = '2026.09.10-card-runtime-2';

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
  cardStyle.href = 'belote_cards.css?v=20260910-card-runtime-2';
  cardStyle.dataset.beloteCards = 'shared';
  document.head.appendChild(cardStyle);

  // Preserve the canonical filename used by index.html while keeping the
  // authoritative client untouched in a dedicated core file.
  const script = document.createElement('script');
  script.src = 'belote_multiplayer_core.js';
  script.async = false;
  document.body.appendChild(script);
})();
