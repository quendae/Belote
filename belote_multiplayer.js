(() => {
  'use strict';

  const Game = window.BeloteNetworkBridge;
  if (!Game) return;

  const DEFAULT_URL = 'wss://api.qqnd.fyi/api/v1/ws';
  const SESSION_KEY = 'belote.qqnd.session.v1';
  const GAME_ID = 'belote';
  const $ = (selector) => document.querySelector(selector);

  const COPY = {
    pl: {
      eyebrow: 'QQND CARD ROOM', title: 'Multiplayer online',
      lead: 'Pokoje działają przez wspólny serwer QQND. Serwer pilnuje zasad, kart i punktacji.',
      notice: 'Po rozłączeniu seat i ręka są zachowane przez 60 s. Potem bot kontynuuje dokładnie z tego miejsca, a wracający gracz może odzyskać seat bez cofania gry.',
      nick: 'Twój nick', roomName: 'Nazwa pokoju', visibility: 'Widoczność', public: 'Publiczny', private: 'Prywatny',
      create: 'Utwórz pokój', joinCode: 'Kod pokoju', join: 'Dołącz', refresh: 'Odśwież pokoje', openRooms: 'Publiczne pokoje', noRooms: 'Brak publicznych pokoi.',
      copy: 'Kopiuj kod', leave: 'Opuść pokój', start: 'Rozpocznij grę', connected: 'Połączony', disconnected: 'Rozłączony', openSeat: 'Wolne miejsce', bot: 'Bot', host: 'Gospodarz',
      fillBots: 'Wypełnij wolne miejsca botami', bots0: 'Bez botów', autoTakeover: 'Zastępstwo po rozłączeniu', takeoverValue: 'Bot automatycznie po 60 s',
      goal: 'Cel partii', difficulty: 'Poziom botów', calm: 'Spokojne', smart: 'Sprytne', waiting: 'Oczekiwanie', connecting: 'Łączenie…', ready: 'Połączono z QQND.', created: 'Pokój utworzony.', joined: 'Dołączono do pokoju.', copied: 'Kod skopiowany.',
      lostServer: 'Utracono połączenie z serwerem', retrying: 'Próbuję wznowić sesję i zachować Twój seat.', lostPlayer: (name) => `Utracono połączenie z graczem ${name}.`, grace: (s) => `Bot przejmie jego miejsce za ${s} s.`,
      botTook: (name) => `Bot przejął miejsce gracza ${name}`, botTookBody: 'Bot kontynuuje aktualną rękę. Jeśli gracz wróci, przejmie zastany stan.', returned: (name) => `${name} wrócił do gry`, returnedBody: 'Seat i aktualny stan zostały odzyskane bez cofania rozgrywki.',
      authorityError: 'Błąd trybu online', authorityBody: 'Belote oczekuje kanonicznego stanu z qqnd-game-server.', serverError: 'Serwer odrzucił operację', roomFull: 'Do startu potrzebne są dokładnie 4 seaty (ludzie + boty).'
    },
    en: {
      eyebrow: 'QQND CARD ROOM', title: 'Online multiplayer', lead: 'Rooms use the shared QQND server. The server owns rules, cards and scoring.',
      notice: 'After a disconnect the seat and hand are kept for 60 s. A bot then continues from that exact state, and the returning player can reclaim the seat without rewinding play.',
      nick: 'Nickname', roomName: 'Room name', visibility: 'Visibility', public: 'Public', private: 'Private', create: 'Create room', joinCode: 'Room code', join: 'Join', refresh: 'Refresh rooms', openRooms: 'Public rooms', noRooms: 'No public rooms.', copy: 'Copy code', leave: 'Leave room', start: 'Start game', connected: 'Connected', disconnected: 'Disconnected', openSeat: 'Open seat', bot: 'Bot', host: 'Host', fillBots: 'Fill open seats with bots', bots0: 'No bots', autoTakeover: 'Disconnect substitute', takeoverValue: 'Bot automatically after 60 s', goal: 'Match target', difficulty: 'Bot level', calm: 'Relaxed', smart: 'Sharp', waiting: 'Waiting', connecting: 'Connecting…', ready: 'Connected to QQND.', created: 'Room created.', joined: 'Joined room.', copied: 'Code copied.',
      lostServer: 'Connection to server lost', retrying: 'Trying to resume the session and preserve your seat.', lostPlayer: (name) => `Connection to ${name} was lost.`, grace: (s) => `A bot will take the seat in ${s} s.`, botTook: (name) => `A bot took ${name}'s seat`, botTookBody: 'The bot continues the current hand. If the player returns, they reclaim the current state.', returned: (name) => `${name} returned`, returnedBody: 'The seat and current state were restored without rewinding play.', authorityError: 'Online mode error', authorityBody: 'Belote now expects canonical state from qqnd-game-server.', serverError: 'The server rejected the operation', roomFull: 'Exactly 4 seats (humans + bots) are required to start.'
    },
    de: {
      eyebrow: 'QQND CARD ROOM', title: 'Online-Mehrspieler', lead: 'Räume laufen über den gemeinsamen QQND-Server. Regeln, Karten und Wertung sind serverseitig.',
      notice: 'Nach einer Trennung bleiben Sitz und Hand 60 s erhalten. Danach spielt ein Bot genau diesen Zustand weiter; der zurückkehrende Spieler übernimmt ohne Zurückspulen.',
      nick: 'Nickname', roomName: 'Raumname', visibility: 'Sichtbarkeit', public: 'Öffentlich', private: 'Privat', create: 'Raum erstellen', joinCode: 'Raumcode', join: 'Beitreten', refresh: 'Räume aktualisieren', openRooms: 'Öffentliche Räume', noRooms: 'Keine öffentlichen Räume.', copy: 'Code kopieren', leave: 'Raum verlassen', start: 'Spiel starten', connected: 'Verbunden', disconnected: 'Getrennt', openSeat: 'Freier Platz', bot: 'Bot', host: 'Host', fillBots: 'Freie Plätze mit Bots füllen', bots0: 'Keine Bots', autoTakeover: 'Ersatz bei Trennung', takeoverValue: 'Bot automatisch nach 60 s', goal: 'Spielziel', difficulty: 'Bot-Stärke', calm: 'Ruhig', smart: 'Klug', waiting: 'Warten', connecting: 'Verbindung…', ready: 'Mit QQND verbunden.', created: 'Raum erstellt.', joined: 'Raum beigetreten.', copied: 'Code kopiert.',
      lostServer: 'Serververbindung verloren', retrying: 'Sitzung wird fortgesetzt; dein Sitz bleibt erhalten.', lostPlayer: (name) => `Verbindung zu ${name} verloren.`, grace: (s) => `Ein Bot übernimmt in ${s} s.`, botTook: (name) => `Bot hat ${name}s Sitz übernommen`, botTookBody: 'Der Bot spielt die aktuelle Hand weiter. Bei Rückkehr übernimmt der Spieler den aktuellen Stand.', returned: (name) => `${name} ist zurück`, returnedBody: 'Sitz und aktueller Stand wurden ohne Zurückspulen wiederhergestellt.', authorityError: 'Fehler im Online-Modus', authorityBody: 'Belote erwartet den kanonischen Zustand vom qqnd-game-server.', serverError: 'Der Server hat die Aktion abgelehnt', roomFull: 'Zum Start sind genau 4 Sitze (Menschen + Bots) nötig.'
    }
  };

  const text = () => COPY[Game.prefs?.lang] || COPY.en;
  const escapeHtml = (value) => { const node = document.createElement('span'); node.textContent = String(value ?? ''); return node.innerHTML; };

  class QQNDMultiplayerClient extends EventTarget {
    constructor({ url = DEFAULT_URL, game = GAME_ID } = {}) {
      super(); this.url = url; this.game = game; this.ws = null; this.session = null; this.resumeToken = ''; this.room = null;
      this.manualClose = false; this.reconnectTimer = null; this.reconnectAttempt = 0; this.pendingNickname = ''; this.readyPromise = null; this.readyResolve = null;
    }
    emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
    send(payload) { if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('qqnd_socket_not_open'); this.ws.send(JSON.stringify(payload)); }
    loadSession() { try { const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return saved?.sessionId && saved?.resumeToken ? saved : null; } catch (_) { return null; } }
    saveSession() { if (this.session?.id && this.resumeToken) try { localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: this.session.id, resumeToken: this.resumeToken })); } catch (_) {} }
    clearSession() { this.session = null; this.resumeToken = ''; try { localStorage.removeItem(SESSION_KEY); } catch (_) {} }
    async connect(nickname = 'Gracz') {
      this.pendingNickname = String(nickname || 'Gracz').trim().slice(0, 20) || 'Gracz';
      if (this.ws?.readyState === WebSocket.OPEN && this.session) return this.session;
      if (this.readyPromise) return this.readyPromise;
      this.manualClose = false; this.readyPromise = new Promise((resolve) => { this.readyResolve = resolve; }); this.openSocket(); return this.readyPromise;
    }
    openSocket() {
      clearTimeout(this.reconnectTimer); const ws = new WebSocket(this.url); this.ws = ws;
      ws.addEventListener('message', (event) => this.onMessage(event.data)); ws.addEventListener('close', () => this.onClose()); ws.addEventListener('error', () => this.emit('connection', { connected: false, state: 'error' }));
    }
    onClose() {
      this.emit('connection', { connected: false, state: 'closed' }); if (this.manualClose) return;
      const delay = Math.min(8000, 500 * (2 ** Math.min(this.reconnectAttempt++, 4))); this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
    }
    onMessage(raw) {
      let message; try { message = JSON.parse(typeof raw === 'string' ? raw : String(raw)); } catch (_) { return; }
      if (message.type === 'hello') { const saved = this.loadSession(); this.send(saved ? { type: 'session.resume', sessionId: saved.sessionId, resumeToken: saved.resumeToken } : { type: 'session.create', nickname: this.pendingNickname }); return; }
      if (message.type === 'session.created') { this.session = message.session; this.resumeToken = message.resumeToken; this.saveSession(); this.reconnectAttempt = 0; this.readyResolve?.(this.session); this.readyResolve = null; this.readyPromise = null; this.emit('connection', { connected: true, state: 'ready', resumed: false }); this.emit('session', { session: this.session, resumed: false }); return; }
      if (message.type === 'session.resumed') { const saved = this.loadSession(); this.session = message.session; this.resumeToken = saved?.resumeToken || this.resumeToken; this.reconnectAttempt = 0; this.readyResolve?.(this.session); this.readyResolve = null; this.readyPromise = null; this.emit('connection', { connected: true, state: 'ready', resumed: true }); this.emit('session', { session: this.session, resumed: true, rooms: message.rooms || [] }); const active = (message.rooms || []).find((room) => room.game === this.game); if (active) { this.room = active; this.emit('room', { room: active, resumed: true }); } return; }
      if (message.type === 'error') { if (message.code === 'invalid_session_credentials') { this.clearSession(); this.send({ type: 'session.create', nickname: this.pendingNickname }); return; } this.emit('server-error', message); return; }
      if (message.type === 'rooms.list') { this.emit('rooms', { rooms: message.rooms || [] }); return; }
      if (['room.created', 'room.joined', 'room.updated'].includes(message.type)) { this.room = message.room; this.emit('room', { room: message.room, event: message.type }); return; }
      if (message.type === 'room.left' || message.type === 'room.closed') { if (!message.roomId || this.room?.id === message.roomId) this.room = null; this.emit('room-left', message); return; }
      if (message.type === 'game.started') { this.room = message.room || this.room; this.emit('game-started', message); return; }
      if (message.type === 'game.state' || message.type === 'game.state.empty') { this.emit('game-state', message); return; }
      if (message.type === 'game.player.connection' || message.type === 'game.player.bot_takeover' || message.type === 'game.presence' || message.type === 'game.host.changed') { this.emit('presence', message); return; }
      this.emit('message', message);
    }
    listRooms() { this.send({ type: 'rooms.list', game: this.game }); }
    createRoom(name, visibility = 'public') { this.send({ type: 'room.create', game: this.game, name, visibility, maxPlayers: 4 }); }
    joinRoom(roomId) { this.send({ type: 'room.join', roomId: String(roomId || '').trim().toUpperCase() }); }
    leaveRoom(roomId = this.room?.id) { if (roomId) this.send({ type: 'room.leave', roomId }); }
    startGame(botCount = 0, settings = {}) { if (!this.room?.id) throw new Error('qqnd_room_missing'); this.send({ type: 'game.start', roomId: this.room.id, botCount, settings }); }
    action(action, payload = {}) { const roomId = this.room?.id || mp.room; if (roomId) this.send({ type: 'game.action', roomId, action, payload }); }
    getState(roomId = this.room?.id || mp.room) { if (roomId) this.send({ type: 'game.state.get', roomId }); }
    close() { this.manualClose = true; clearTimeout(this.reconnectTimer); try { this.ws?.close(); } catch (_) {} this.ws = null; }
  }

  const mp = { client: null, room: '', roomData: null, role: null, inGame: false, viewerSeat: null, botCount: 0, goal: 501, botDifficulty: 'smart', rooms: [], presence: [], presenceTimer: null, lastServerError: null };

  function injectUi() {
    if (!$('#qqndMultiplayerStyle')) {
      const style = document.createElement('style'); style.id = 'qqndMultiplayerStyle';
      style.textContent = `.qqnd-room-list{display:grid;gap:7px;margin-top:9px;max-height:210px;overflow:auto}.qqnd-room{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;width:100%;text-align:left;padding:10px 11px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.035);color:inherit;cursor:pointer}.qqnd-room:hover{border-color:rgba(215,180,94,.6);background:rgba(215,180,94,.08)}.qqnd-room small{display:block;color:var(--muted);margin-top:3px}.qqnd-room b:last-child{color:var(--gold2)}.qqnd-status{min-height:20px;margin:10px 0 0;color:var(--muted);font-size:11px}.qqnd-status.error{color:#ff9d96}.qqnd-lobby-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.qqnd-policy{margin-top:12px;padding:10px 12px;border:1px solid rgba(215,180,94,.28);border-radius:12px;background:rgba(215,180,94,.06);font-size:11px;color:#c8d3cd}.qqnd-policy b{color:var(--gold2)}.network-presence{position:fixed;left:50%;top:50%;z-index:190;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 28px));padding:18px 20px;border:1px solid rgba(215,180,94,.62);border-radius:18px;background:linear-gradient(180deg,rgba(12,24,18,.98),rgba(6,13,9,.98));box-shadow:0 25px 80px rgba(0,0,0,.62);text-align:center;pointer-events:none}.network-presence.hidden{display:none!important}.network-presence b{display:block;color:#fff0bd;font:800 19px/1.25 Georgia,serif}.network-presence span{display:block;margin-top:7px;color:#d0dbd5;font-size:12px;line-height:1.5}.network-presence.transient{top:20%;opacity:.97}.network-pill.visible{display:inline-flex}.network-pill.offline .network-dot{background:#d66;box-shadow:0 0 10px #d66}@media(max-width:760px){.qqnd-lobby-tools{grid-template-columns:1fr}.network-presence{top:42%}.multiplayer-grid{grid-template-columns:1fr!important}}`;
      document.head.appendChild(style);
    }
    if (!$('#networkPresenceOverlay')) { const overlay = document.createElement('div'); overlay.id = 'networkPresenceOverlay'; overlay.className = 'network-presence hidden'; overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-live', 'assertive'); overlay.innerHTML = '<b id="networkPresenceTitle"></b><span id="networkPresenceBody"></span>'; document.body.appendChild(overlay); }
  }

  function setStatus(message, error = false) { const node = $('#mpServerStatus'); if (node) { node.textContent = message || ''; node.classList.toggle('error', !!error); } }
  function showPresence(title, body, transient = false, duration = 0) { injectUi(); const overlay = $('#networkPresenceOverlay'); if (!overlay) return; $('#networkPresenceTitle').textContent = title || ''; $('#networkPresenceBody').textContent = body || ''; overlay.classList.remove('hidden'); overlay.classList.toggle('transient', transient); clearTimeout(showPresence.timer); if (duration) showPresence.timer = setTimeout(() => overlay.classList.add('hidden'), duration); }
  function hidePresence() { clearTimeout(showPresence.timer); $('#networkPresenceOverlay')?.classList.add('hidden'); }

  function updatePresenceSnapshot(snapshot) {
    if (!Array.isArray(snapshot)) return; mp.presence = snapshot; clearInterval(mp.presenceTimer);
    const redraw = () => { const down = mp.presence.filter((entry) => !entry.connected || entry.botActive); if (!down.length) { if (mp.inGame) hidePresence(); return; } const item = down[0]; const name = item?.nickname || 'Gracz'; if (item?.botActive) { showPresence(text().botTook(name), text().botTookBody); return; } const seconds = Math.max(0, Math.ceil(((Number(item?.graceDeadline) || Date.now()) - Date.now()) / 1000)); showPresence(text().lostPlayer(name), text().grace(seconds)); };
    redraw(); if (mp.presence.some((entry) => !entry.connected && !entry.botActive)) mp.presenceTimer = setInterval(redraw, 500);
  }

  function updateNetworkPill(connected = true) { const pill = $('#networkPill'); if (!pill) return; pill.classList.toggle('visible', !!mp.inGame || !!mp.room); pill.classList.toggle('offline', !connected); const label = $('#networkPillText'); if (label) label.textContent = mp.room ? `QQND · ${mp.room}` : 'QQND'; if (mp.inGame && $('#brandOver')) $('#brandOver').textContent = `MULTIPLAYER · ${mp.room}`; }
  function localizeResult(state) { if (state?.phase === 'done' && state.resultKind === 'contract-made') state.result = `${Game.tr('contractMade')} ${state.raw?.[0] ?? 0} - ${state.raw?.[1] ?? 0}.`; if (state?.phase === 'done' && state.resultKind === 'contract-failed') state.result = Game.tr('contractFailed'); return state; }
  function applyAuthoritativeState(message) { if (!message || message.type !== 'game.state' || !message.state) return; if (message.authoritative !== true) { showPresence(text().authorityError, text().authorityBody); return; } mp.inGame = true; mp.room = message.roomId || mp.room; if (Number.isInteger(message.viewerSeat)) mp.viewerSeat = message.viewerSeat; updatePresenceSnapshot(message.presence || mp.presence); const state = localizeResult(structuredClone(message.state)); state.multiplayer = true; state.botTimer = 0; Game.setState(state); $('#mainMenu')?.classList.add('hidden'); $('#multiplayerModal')?.classList.add('hidden'); Game.render(); Game.syncResultModal?.(); updateNetworkPill(true); }

  const roomHumans = () => mp.roomData?.players?.length || 0;
  const maxBotCount = () => Math.max(0, 4 - roomHumans());

  function renderRoomList() { const list = $('#mpPublicRooms'); if (!list) return; if (!mp.rooms.length) { list.innerHTML = `<div class="qqnd-status">${escapeHtml(text().noRooms)}</div>`; return; } list.innerHTML = mp.rooms.map((room) => `<button class="qqnd-room" data-mp-action="join-public" data-room-id="${escapeHtml(room.id)}"><span><b>${escapeHtml(room.name || 'Belote')}</b><small>${escapeHtml(room.id)}</small></span><b>${room.players?.length || 0}/4</b></button>`).join(''); }

  function renderLobby() {
    const setup = $('#mpSetup'), lobby = $('#mpLobby'); if (!mp.roomData || !setup || !lobby) return;
    setup.classList.add('hidden'); lobby.classList.remove('hidden'); mp.room = mp.roomData.id || mp.room; mp.role = mp.roomData.ownerSessionId === mp.client?.session?.id ? 'host' : 'guest';
    $('#mpRoomDisplay').textContent = mp.room || '—'; $('#mpRoomMeta').textContent = `${mp.roomData.visibility === 'public' ? text().public : text().private} · ${roomHumans()}/4`;
    const players = mp.roomData.players || [], seats = [];
    for (let seat = 0; seat < 4; seat += 1) { const player = players[seat], botPlanned = !player && seat < players.length + mp.botCount, label = player?.nickname || (botPlanned ? `${text().bot} ${seat + 1}` : text().openSeat), status = player ? (player.connected === false ? text().disconnected : text().connected) : (botPlanned ? text().bot : text().waiting); seats.push(`<div class="lobby-seat ${player?.connected !== false && (player || botPlanned) ? 'connected' : ''}"><b>${escapeHtml(label)}</b><small>${seat === 0 && player ? `${text().host} · ${status}` : status}</small></div>`); }
    $('#mpLobbySeats').innerHTML = seats.join(''); const maxBots = maxBotCount(); mp.botCount = Math.min(mp.botCount, maxBots); const botSelect = $('#mpBotCount'); if (botSelect) { botSelect.innerHTML = Array.from({ length: maxBots + 1 }, (_, count) => `<option value="${count}">${count === 0 ? text().bots0 : `${count} ${text().bot}`}</option>`).join(''); botSelect.value = String(mp.botCount); botSelect.disabled = mp.role !== 'host'; }
    if ($('#mpGoal')) $('#mpGoal').disabled = mp.role !== 'host'; if ($('#mpDifficulty')) $('#mpDifficulty').disabled = mp.role !== 'host'; const start = $('#mpStartButton'); if (start) start.disabled = !(mp.role === 'host' && roomHumans() + mp.botCount === 4 && players.every((player) => player.connected !== false)); $('#mpHostControls')?.classList.toggle('hidden', mp.role !== 'host'); updateNetworkPill(true);
  }

  function renderModal() {
    injectUi(); const modal = $('#multiplayerModal'); if (!modal) return; const c = text();
    modal.innerHTML = `<section class="modal-card multiplayer-card" aria-labelledby="multiplayerTitle"><header class="modal-head"><div><div class="eyebrow">${escapeHtml(c.eyebrow)}</div><h2 id="multiplayerTitle">${escapeHtml(c.title)}</h2></div><button class="icon" data-mp-action="close" aria-label="Zamknij">×</button></header><p class="multiplayer-lead">${escapeHtml(c.lead)}</p><div class="multiplayer-notice">${escapeHtml(c.notice)}</div><div id="mpSetup" class="multiplayer-grid"><section class="multiplayer-section"><label class="multiplayer-field"><span>${escapeHtml(c.nick)}</span><input id="mpNick" maxlength="20" autocomplete="nickname" value="${escapeHtml($('#playerName')?.value || 'Gracz')}"></label><label class="multiplayer-field"><span>${escapeHtml(c.roomName)}</span><input id="mpRoomName" maxlength="40" value="Belote"></label><label class="multiplayer-field"><span>${escapeHtml(c.visibility)}</span><select id="mpVisibility"><option value="public">${escapeHtml(c.public)}</option><option value="private">${escapeHtml(c.private)}</option></select></label><div class="multiplayer-actions"><button id="mpCreateButton" class="action primary" data-mp-action="create">${escapeHtml(c.create)}</button></div></section><section class="multiplayer-section"><label class="multiplayer-field"><span>${escapeHtml(c.joinCode)}</span><input id="mpRoomCode" maxlength="12" autocomplete="off" spellcheck="false" placeholder="ABCD-EFGH"></label><div class="multiplayer-actions"><button id="mpJoinButton" class="action primary" data-mp-action="join">${escapeHtml(c.join)}</button><button class="action secondary" data-mp-action="refresh">${escapeHtml(c.refresh)}</button></div><h3>${escapeHtml(c.openRooms)}</h3><div id="mpPublicRooms" class="qqnd-room-list"></div></section></div><section id="mpLobby" class="multiplayer-section multiplayer-lobby hidden"><div class="room-summary"><div><div id="mpRoomDisplay" class="room-code">—</div><div id="mpRoomMeta" class="room-meta"></div></div><button class="action secondary" data-mp-action="copy">${escapeHtml(c.copy)}</button></div><div id="mpLobbySeats" class="lobby-seats"></div><div id="mpHostControls" class="qqnd-lobby-tools"><label class="multiplayer-field"><span>${escapeHtml(c.fillBots)}</span><select id="mpBotCount"></select></label><label class="multiplayer-field"><span>${escapeHtml(c.goal)}</span><select id="mpGoal"><option value="301">301</option><option value="501" selected>501</option><option value="1001">1001</option></select></label><label class="multiplayer-field"><span>${escapeHtml(c.difficulty)}</span><select id="mpDifficulty"><option value="calm">${escapeHtml(c.calm)}</option><option value="smart" selected>${escapeHtml(c.smart)}</option></select></label><div class="qqnd-policy"><b>${escapeHtml(c.autoTakeover)}</b><br>${escapeHtml(c.takeoverValue)}</div></div><p id="mpServerStatus" class="qqnd-status" aria-live="polite"></p><footer class="modal-actions"><button class="action secondary" data-mp-action="leave">${escapeHtml(c.leave)}</button><button id="mpStartButton" class="action primary" data-mp-action="start" disabled>${escapeHtml(c.start)}</button></footer></section></section>`;
    renderRoomList(); if (mp.roomData) renderLobby();
  }

  function validateNick(value) { const nickname = String(value || '').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\s+/g, ' ').trim(); const length = Array.from(nickname).length; if (length < 3 || length > 20) throw new Error('nickname_length'); if (/https?:|www\.|[<>@]/iu.test(nickname) || /[^\p{L}\p{N} _-]/u.test(nickname)) throw new Error('nickname_invalid'); return nickname; }

  function bindClient(client) {
    client.addEventListener('connection', (event) => { const detail = event.detail || {}; updateNetworkPill(detail.connected === true); if (!detail.connected && mp.inGame) showPresence(text().lostServer, text().retrying); if (detail.connected && !mp.presence.some((entry) => !entry.connected || entry.botActive)) hidePresence(); });
    client.addEventListener('session', (event) => { setStatus(text().ready); const rooms = event.detail?.rooms || [], active = rooms.find((room) => room.game === GAME_ID); if (active) { mp.roomData = active; mp.room = active.id; mp.inGame = active.status === 'in_game'; renderLobby(); if (mp.inGame) client.getState(active.id); } client.listRooms(); });
    client.addEventListener('rooms', (event) => { mp.rooms = event.detail?.rooms || []; renderRoomList(); });
    client.addEventListener('room', (event) => { const room = event.detail?.room; if (!room || room.game !== GAME_ID) return; mp.roomData = room; mp.room = room.id; renderLobby(); if (event.detail?.event === 'room.created') setStatus(text().created); if (event.detail?.event === 'room.joined') setStatus(text().joined); });
    client.addEventListener('room-left', () => { mp.room = ''; mp.roomData = null; mp.inGame = false; mp.viewerSeat = null; updateNetworkPill(false); renderModal(); });
    client.addEventListener('game-started', (event) => { const message = event.detail || {}; mp.inGame = true; mp.roomData = message.room || mp.roomData; mp.room = mp.roomData?.id || message.roomId || mp.room; mp.viewerSeat = Number.isInteger(message.seat) ? message.seat : mp.viewerSeat; updatePresenceSnapshot(message.presence || []); $('#mainMenu')?.classList.add('hidden'); $('#multiplayerModal')?.classList.add('hidden'); updateNetworkPill(true); client.getState(mp.room); });
    client.addEventListener('game-state', (event) => applyAuthoritativeState(event.detail));
    client.addEventListener('presence', (event) => { const message = event.detail || {}; if (message.type === 'game.presence') updatePresenceSnapshot(message.presence || []); if (message.type === 'game.player.connection') { if (message.connected) { showPresence(text().returned(message.nickname || 'Gracz'), text().returnedBody, true, 1800); mp.presence = mp.presence.map((entry) => entry.sessionId === message.sessionId ? { ...entry, connected: true, botActive: false, graceDeadline: null } : entry); } else { const existing = mp.presence.find((entry) => entry.sessionId === message.sessionId) || {}; updatePresenceSnapshot([...mp.presence.filter((entry) => entry.sessionId !== message.sessionId), { ...existing, ...message, botActive: false }]); } } if (message.type === 'game.player.bot_takeover') { const name = message.nickname || 'Gracz'; showPresence(text().botTook(name), text().botTookBody); mp.presence = mp.presence.map((entry) => entry.sessionId === message.sessionId ? { ...entry, connected: false, botActive: true } : entry); } });
    client.addEventListener('server-error', (event) => { mp.lastServerError = event.detail; const code = event.detail?.code || 'server_error'; setStatus(`${text().serverError}: ${code}`, true); if (mp.inGame) Game.toast?.(code); });
  }

  async function ensureClient() { injectUi(); const nickname = validateNick($('#mpNick')?.value || $('#playerName')?.value || 'Gracz'); if (!mp.client) { mp.client = new QQNDMultiplayerClient({ game: GAME_ID }); bindClient(mp.client); } await mp.client.connect(nickname); return mp.client; }
  async function openMultiplayer() { renderModal(); $('#multiplayerModal')?.classList.remove('hidden'); try { const client = await ensureClient(); client.listRooms(); if (mp.roomData) renderLobby(); } catch (error) { setStatus(String(error?.message || error), true); } }
  async function createRoom() { try { const client = await ensureClient(); client.createRoom(($('#mpRoomName')?.value || 'Belote').trim() || 'Belote', $('#mpVisibility')?.value || 'public'); setStatus(text().connecting); } catch (error) { setStatus(String(error?.message || error), true); } }
  async function joinRoom(roomId = $('#mpRoomCode')?.value) { try { const client = await ensureClient(); client.joinRoom(roomId); setStatus(text().connecting); } catch (error) { setStatus(String(error?.message || error), true); } }
  async function copyRoom() { if (!mp.room) return; try { await navigator.clipboard.writeText(mp.room); Game.toast?.(text().copied); } catch (_) { Game.toast?.(mp.room); } }
  function startGame() { if (!mp.client || mp.role !== 'host') return; mp.botCount = Number($('#mpBotCount')?.value || 0); mp.goal = Number($('#mpGoal')?.value || 501); mp.botDifficulty = $('#mpDifficulty')?.value === 'calm' ? 'calm' : 'smart'; if (roomHumans() + mp.botCount !== 4) { setStatus(text().roomFull, true); return; } mp.client.startGame(mp.botCount, { goal: mp.goal, botDifficulty: mp.botDifficulty }); }
  function sendGameAction(action, payload = {}) { if (!mp.inGame || !mp.client) return false; try { mp.client.action(action, payload); return true; } catch (error) { Game.toast?.(String(error?.message || error)); return false; } }

  document.addEventListener('change', (event) => { if (event.target?.id === 'mpBotCount') { mp.botCount = Number(event.target.value || 0); renderLobby(); } if (event.target?.id === 'mpGoal') mp.goal = Number(event.target.value || 501); if (event.target?.id === 'mpDifficulty') mp.botDifficulty = event.target.value === 'calm' ? 'calm' : 'smart'; }, true);
  document.addEventListener('click', (event) => {
    const mpButton = event.target.closest?.('[data-mp-action]');
    if (mpButton) { event.preventDefault(); event.stopImmediatePropagation(); const action = mpButton.dataset.mpAction; if (action === 'close') $('#multiplayerModal')?.classList.add('hidden'); else if (action === 'create') createRoom(); else if (action === 'join') joinRoom(); else if (action === 'join-public') joinRoom(mpButton.dataset.roomId); else if (action === 'refresh') mp.client?.listRooms(); else if (action === 'copy') copyRoom(); else if (action === 'leave') mp.client?.leaveRoom(mp.room); else if (action === 'start') startGame(); return; }
    const action = event.target.closest?.('[data-action]')?.dataset.action;
    if (action === 'share') { event.preventDefault(); event.stopImmediatePropagation(); openMultiplayer(); return; }
    if (!mp.inGame) return;
    const card = event.target.closest?.('[data-card]');
    if (card) { event.preventDefault(); event.stopImmediatePropagation(); const state = Game.getState(), player = Number(card.closest('[data-player]')?.dataset.player); if (player === 0 && state?.active === 0 && state?.phase === 'play') sendGameAction('play', { cardId: card.dataset.card }); return; }
    const bidButton = event.target.closest?.('[data-bid]');
    if (bidButton) { event.preventDefault(); event.stopImmediatePropagation(); const state = Game.getState(); if (state?.active === 0 && state?.phase === 'bid') sendGameAction('bid', { suit: bidButton.dataset.bid }); return; }
    if (action === 'next-hand') { event.preventDefault(); event.stopImmediatePropagation(); if (Game.getState()?.phase === 'done') sendGameAction('next-hand', {}); }
  }, true);

  injectUi();
  window.QQNDMultiplayerClient = QQNDMultiplayerClient;
  window.BeloteMultiplayerRuntime = { stateChanged: () => {}, isBotControlled: () => false, open: openMultiplayer, debug: { applyState: (message) => applyAuthoritativeState(message), presence: (message) => { if (message?.type === 'game.presence') updatePresenceSnapshot(message.presence || []); else if (message?.type === 'game.player.bot_takeover') showPresence(text().botTook(message.nickname || 'Gracz'), text().botTookBody); }, snapshot: () => ({ room: mp.room, inGame: mp.inGame, viewerSeat: mp.viewerSeat, botCount: mp.botCount, presence: structuredClone(mp.presence), lastServerError: mp.lastServerError }), client: () => mp.client, sendAction: (action, payload) => sendGameAction(action, payload) } };
})();
