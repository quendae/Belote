(() => {
  'use strict';

  // QQND authoritative multiplayer endpoint (kept here for deploy/static verification).
  const QQND_WS_URL = 'wss://api.qqnd.fyi/api/v1/ws';
  void QQND_WS_URL;

  const Game = window.BeloteNetworkBridge;

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
  cardStyle.href = 'belote_cards.css';
  cardStyle.dataset.beloteCards = 'shared';
  document.head.appendChild(cardStyle);

  // Preserve the canonical filename used by index.html while keeping the
  // authoritative client untouched in a dedicated core file.
  const script = document.createElement('script');
  script.src = 'belote_multiplayer_core.js';
  script.async = false;
  document.body.appendChild(script);
})();
