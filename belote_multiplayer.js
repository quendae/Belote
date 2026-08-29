(() => {
  'use strict';

  const Game = window.BeloteNetworkBridge;
  if (!Game) return;

  const PROTOCOL = 2;
  const SIGNAL_TIMEOUT_MS = 12000;
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const COPY = {
    pl: {
      menu: 'Multiplayer online', eyebrow: 'PRYWATNY MULTIPLAYER ONLINE', title: 'Multiplayer P2P',
      lead: 'Utwórz pokój albo dołącz ośmioznakowym kodem. Sygnalizacja służy tylko do zestawienia WebRTC.',
      notice: 'Gospodarz tasuje, sprawdza wszystkie ruchy i wysyła każdemu graczowi tylko dozwolony widok stołu.',
      createTitle: 'Utwórz prywatny pokój', joinTitle: 'Dołącz do pokoju', nick: 'Twój nick', password: 'Hasło (opcjonalne)',
      passwordHelp: 'Puste hasło oznacza pokój chroniony samym kodem.', room: 'Kod pokoju', goal: 'Cel partii',
      botDifficulty: 'Poziom botów', create: 'Utwórz pokój', join: 'Dołącz', copy: 'Kopiuj kod', leave: 'Opuść pokój', start: 'Rozpocznij grę',
      host: 'Gospodarz', open: 'Wolne miejsce', connected: 'Połączono', connecting: 'Łączenie…', private: 'Pokój prywatny', protected: 'Pokój z hasłem',
      bot: 'Bot', addBot: 'Dodaj bota', removeBot: 'Usuń bota', calm: 'Spokojny', smart: 'Sprytny',
      hint: 'Wolne miejsca możesz wypełnić botami. Do startu multiplayera wymagany jest co najmniej jeden gość online.',
      roomFull: 'Brak wolnego miejsca — usuń bota albo poczekaj na wolny fotel.', paused: 'Gra wstrzymana: utracono połączenie z graczem.',
      badNick: 'Nick musi mieć 3–20 znaków i nie może zawierać linków.', badRoom: 'Wpisz pełny kod pokoju.', creating: 'Tworzenie pokoju…', joining: 'Łączenie z pokojem…',
      created: 'Pokój gotowy. Udostępnij znajomym tylko kod pokoju.', joined: 'Połączono z gospodarzem. Czekamy na start.',
      noSignal: 'Multiplayer online wymaga uruchomienia gry przez HTTPS i wdrożonej trasy /api/.', signalFail: 'Nie udało się połączyć z usługą sygnalizacyjną.',
      badAuth: 'Nieprawidłowy kod pokoju lub hasło.', expired: 'Pokój nie istnieje albo wygasł.', timeout: 'Usługa sygnalizacyjna nie odpowiedziała na czas.'
    },
    en: {
      menu: 'Online multiplayer', eyebrow: 'PRIVATE ONLINE MULTIPLAYER', title: 'P2P multiplayer',
      lead: 'Create a room or join with an eight-character code. Signaling is used only to establish WebRTC.',
      notice: 'The host shuffles, validates every action and sends each player only the table view they are allowed to see.',
      createTitle: 'Create private room', joinTitle: 'Join room', nick: 'Your nickname', password: 'Password (optional)',
      passwordHelp: 'Leave it empty to protect the room only with its code.', room: 'Room code', goal: 'Match target', botDifficulty: 'Bot level',
      create: 'Create room', join: 'Join', copy: 'Copy code', leave: 'Leave room', start: 'Start game', host: 'Host', open: 'Open seat', connected: 'Connected', connecting: 'Connecting…',
      private: 'Private room', protected: 'Password room', bot: 'Bot', addBot: 'Add bot', removeBot: 'Remove bot', calm: 'Relaxed', smart: 'Sharp',
      hint: 'Open seats may be filled with bots. At least one online guest is required to start multiplayer.', roomFull: 'No open seat — remove a bot or wait for a seat.',
      paused: 'Game paused: a player connection was lost.', badNick: 'Nickname must be 3–20 characters and cannot contain links.', badRoom: 'Enter the complete room code.',
      creating: 'Creating room…', joining: 'Joining room…', created: 'Room ready. Share only the room code with your friends.', joined: 'Connected to host. Waiting for the game to start.',
      noSignal: 'Online multiplayer requires HTTPS and a deployed /api/ signaling route.', signalFail: 'Could not connect to the signaling service.', badAuth: 'Invalid room code or password.',
      expired: 'Room does not exist or has expired.', timeout: 'The signaling service timed out.'
    },
    de: {
      menu: 'Online-Mehrspieler', eyebrow: 'PRIVATER ONLINE-MEHRSPIELER', title: 'P2P-Mehrspieler',
      lead: 'Erstelle einen Raum oder tritt mit einem achtstelligen Code bei. Die Signalisierung dient nur zum Aufbau von WebRTC.',
      notice: 'Der Gastgeber mischt, prüft jede Aktion und sendet jedem Spieler nur die erlaubte Tischansicht.',
      createTitle: 'Privaten Raum erstellen', joinTitle: 'Raum beitreten', nick: 'Dein Nickname', password: 'Passwort (optional)',
      passwordHelp: 'Leer lassen, wenn nur der Raumcode schützen soll.', room: 'Raumcode', goal: 'Partieziel', botDifficulty: 'Bot-Stufe',
      create: 'Raum erstellen', join: 'Beitreten', copy: 'Code kopieren', leave: 'Raum verlassen', start: 'Spiel starten', host: 'Gastgeber', open: 'Freier Platz',
      connected: 'Verbunden', connecting: 'Verbindung…', private: 'Privater Raum', protected: 'Passwortraum', bot: 'Bot', addBot: 'Bot hinzufügen', removeBot: 'Bot entfernen',
      calm: 'Ruhig', smart: 'Klug', hint: 'Freie Plätze können mit Bots gefüllt werden. Zum Start ist mindestens ein Online-Gast nötig.',
      roomFull: 'Kein freier Platz – entferne einen Bot oder warte auf einen Platz.', paused: 'Spiel pausiert: Verbindung zu einem Spieler verloren.',
      badNick: 'Der Nickname muss 3–20 Zeichen lang sein und darf keine Links enthalten.', badRoom: 'Gib den vollständigen Raumcode ein.', creating: 'Raum wird erstellt…', joining: 'Raum wird verbunden…',
      created: 'Raum bereit. Teile nur den Raumcode mit deinen Freunden.', joined: 'Mit Gastgeber verbunden. Warten auf den Start.',
      noSignal: 'Online-Mehrspieler benötigt HTTPS und eine bereitgestellte /api/-Signalisierungsroute.', signalFail: 'Verbindung zum Signalisierungsdienst fehlgeschlagen.',
      badAuth: 'Ungültiger Raumcode oder falsches Passwort.', expired: 'Raum existiert nicht oder ist abgelaufen.', timeout: 'Zeitüberschreitung beim Signalisierungsdienst.'
    }
  };

  const mp = {
    role: null, room: '', auth: '', hostToken: '', nick: '', seat: null,
    peers: new Map(), guestPc: null, guestChannel: null, signalSocket: null, signalClosing: false,
    names: ['', '', '', ''], connectedSeats: new Set(), botSeats: new Set(), botDifficulty: 'smart', goal: 501,
    inGame: false, paused: false, revision: 0, lastRevision: 0, seenActions: new Set(), broadcastQueued: false, testMode: false
  };

  const $ = (s) => document.querySelector(s);
  const text = () => COPY[Game.prefs.lang] || COPY.en;
  const escapeHtml = (value) => { const el = document.createElement('span'); el.textContent = String(value ?? ''); return el.innerHTML; };
  const status = (id, message, error = false) => { const el = document.getElementById(id); if (!el) return; el.textContent = message || ''; el.classList.toggle('error', !!error); };
  const safeClose = (target) => { try { target?.close(); } catch {} };
  const sendChannel = (channel, value) => { if (channel?.readyState === 'open') channel.send(JSON.stringify(value)); };

  function normalizeNick(value) {
    return String(value || '').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  }
  function validNick(value) {
    const nick = normalizeNick(value);
    return Array.from(nick).length >= 3 && Array.from(nick).length <= 20 && !/https?:|www\.|[<>@]/iu.test(nick) && /^[\p{L}\p{N} _-]+$/u.test(nick);
  }
  function normalizeRoom(value) {
    const raw = String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
    return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : '';
  }
  function randomRoom() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8); crypto.getRandomValues(bytes);
    const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  async function roomVerifier(room, password) {
    const enc = new TextEncoder();
    const material = await crypto.subtle.importKey('raw', enc.encode(password || ''), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(`belote-p2p-v2|${room}`), iterations: 120000, hash: 'SHA-256' }, material, 256);
    return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  function signalingBase() {
    const configured = String(document.querySelector('meta[name="belote-signaling-url"]')?.content || '').trim().replace(/\/$/, '');
    if (configured) return configured;
    return ['http:', 'https:'].includes(location.protocol) ? location.origin : '';
  }
  async function signalFetch(path, options = {}) {
    const base = signalingBase();
    if (!base) throw new Error('signaling-unavailable');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SIGNAL_TIMEOUT_MS);
    try {
      return await fetch(new URL(path, base), { ...options, signal: controller.signal, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
    } finally { clearTimeout(timer); }
  }
  function signalError(error) {
    const raw = String(error?.message || error || ''); const c = text();
    if (/4009|full|rejected/i.test(raw)) return c.roomFull;
    if (/4003|auth|password/i.test(raw)) return c.badAuth;
    if (/404|expired/i.test(raw)) return c.expired;
    if (/abort|timeout/i.test(raw)) return c.timeout;
    if (/signaling-unavailable/i.test(raw)) return c.noSignal;
    return c.signalFail;
  }
  function signalSend(message) {
    if (mp.signalSocket?.readyState === WebSocket.OPEN) mp.signalSocket.send(JSON.stringify(message));
  }
  function waitForIce(pc) {
    if (pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; pc.removeEventListener('icegatheringstatechange', check); resolve(); };
      const check = () => { if (pc.iceGatheringState === 'complete') finish(); };
      pc.addEventListener('icegatheringstatechange', check); setTimeout(finish, 6500);
    });
  }

  function renderModal() {
    const modal = $('#multiplayerModal'); if (!modal) return;
    const c = text();
    modal.dataset.mpVersion = '2';
    modal.innerHTML = `<section class="modal-card multiplayer-card" aria-labelledby="multiplayerTitle">
      <header class="modal-head"><div><div class="eyebrow">${c.eyebrow}</div><h2 id="multiplayerTitle">${c.title}</h2></div><button class="icon" data-mp-action="close" aria-label="Close">×</button></header>
      <p class="multiplayer-lead">${c.lead}</p><div class="multiplayer-notice">${c.notice}</div>
      <div id="multiplayerSetup" class="multiplayer-grid">
        <section class="multiplayer-section"><h3>${c.createTitle}</h3>
          <label class="multiplayer-field"><span>${c.nick}</span><input id="mpHostNick" maxlength="20" autocomplete="nickname" value="Gracz 1"></label>
          <label class="multiplayer-field"><span>${c.password}</span><input id="mpHostPassword" type="password" maxlength="64" autocomplete="new-password"><small>${c.passwordHelp}</small></label>
          <label class="multiplayer-field"><span>${c.goal}</span><select id="mpGoal"><option value="301">301</option><option value="501" selected>501</option><option value="1001">1001</option></select></label>
          <label class="multiplayer-field"><span>${c.botDifficulty}</span><select id="mpBotDifficulty"><option value="calm">${c.calm}</option><option value="smart" selected>${c.smart}</option></select></label>
          <div class="multiplayer-actions"><button class="action primary" data-mp-action="create">${c.create}</button></div><p id="mpHostStatus" class="multiplayer-status" aria-live="polite"></p>
        </section>
        <section class="multiplayer-section"><h3>${c.joinTitle}</h3>
          <label class="multiplayer-field"><span>${c.nick}</span><input id="mpGuestNick" maxlength="20" autocomplete="nickname" value="Gracz 2"></label>
          <label class="multiplayer-field"><span>${c.room}</span><input id="mpRoomCode" maxlength="9" autocomplete="off" spellcheck="false" placeholder="ABCD-EFGH"></label>
          <label class="multiplayer-field"><span>${c.password}</span><input id="mpGuestPassword" type="password" maxlength="64" autocomplete="current-password"></label>
          <div class="multiplayer-actions"><button class="action primary" data-mp-action="join">${c.join}</button></div><p id="mpGuestStatus" class="multiplayer-status" aria-live="polite"></p>
        </section>
      </div>
      <section id="multiplayerLobby" class="multiplayer-section multiplayer-lobby hidden"><div class="room-summary"><div><div id="mpRoomDisplay" class="room-code">-</div><div id="mpRoomMeta" class="room-meta"></div></div><button class="action secondary" data-mp-action="copy">${c.copy}</button></div><p class="multiplayer-lead lobby-hint">${c.hint}</p><div id="mpLobbySeats" class="lobby-seats"></div><p id="mpLobbyStatus" class="multiplayer-status" aria-live="polite"></p><footer class="modal-actions"><button class="action secondary" data-mp-action="leave">${c.leave}</button><button class="action primary" data-mp-action="start" id="mpStartButton" disabled>${c.start}</button></footer></section>
    </section>`;
  }

  function botName(seat) { const c = text(); return `${c.bot} ${seat} · ${mp.botDifficulty === 'calm' ? c.calm : c.smart}`; }
  function connectedHumanCount() { return [1, 2, 3].filter((seat) => mp.peers.get(seat)?.connected).length; }
  function seatReady(seat) { return mp.botSeats.has(seat) || !!mp.peers.get(seat)?.connected; }
  function canStart() { return mp.role === 'host' && !mp.paused && connectedHumanCount() > 0 && [1, 2, 3].every(seatReady); }
  function lobbyPacket(type = 'lobby', seat = null) {
    return { v: PROTOCOL, type, room: mp.room, seat, names: [...mp.names], botSeats: [...mp.botSeats], botDifficulty: mp.botDifficulty, goal: mp.goal, connectedSeats: [0, ...[1,2,3].filter((s) => mp.peers.get(s)?.connected)] };
  }
  function broadcastLobby() {
    if (mp.role !== 'host') return;
    mp.peers.forEach((peer, seat) => { if (peer.connected) sendChannel(peer.channel, lobbyPacket('lobby', seat)); });
  }
  function renderLobby() {
    const setup = $('#multiplayerSetup'), lobby = $('#multiplayerLobby'); if (!lobby) return;
    setup?.classList.add('hidden'); lobby.classList.remove('hidden');
    $('#mpRoomDisplay').textContent = mp.room || '-';
    $('#mpRoomMeta').textContent = `${mp.passwordProtected ? text().protected : text().private} · ${mp.goal}`;
    const c = text();
    $('#mpLobbySeats').innerHTML = [0,1,2,3].map((seat) => {
      const peer = mp.peers.get(seat), isBot = mp.botSeats.has(seat), self = seat === mp.seat;
      const connected = seat === 0 || (mp.role === 'host' ? !!peer?.connected : mp.connectedSeats.has(seat));
      const label = mp.names[seat] || (seat === 0 ? c.host : c.open);
      const info = seat === 0 ? c.host : isBot ? `${c.bot} · ${mp.botDifficulty === 'calm' ? c.calm : c.smart}` : connected ? c.connected : peer ? c.connecting : c.open;
      const toggle = mp.role === 'host' && seat > 0 && !peer ? `<button class="lobby-bot-toggle" data-mp-action="bot" data-seat="${seat}">${isBot ? c.removeBot : c.addBot}</button>` : '';
      return `<div class="lobby-seat ${connected || isBot ? 'connected' : ''} ${self ? 'self' : ''}"><b>${escapeHtml(label)}</b><small>${escapeHtml(info)}</small>${toggle}</div>`;
    }).join('');
    const start = $('#mpStartButton'); if (start) start.disabled = !canStart();
  }
  function applyLobby(packet) {
    if (!packet || packet.v !== PROTOCOL) return;
    if (Array.isArray(packet.names)) mp.names = packet.names.slice(0,4);
    mp.botSeats = new Set(Array.isArray(packet.botSeats) ? packet.botSeats : []);
    mp.connectedSeats = new Set(Array.isArray(packet.connectedSeats) ? packet.connectedSeats : []);
    if (packet.botDifficulty) mp.botDifficulty = packet.botDifficulty;
    if (packet.goal) mp.goal = packet.goal;
    if (Number.isInteger(packet.seat)) mp.seat = packet.seat;
    renderLobby();
  }

  function reset(clearGame = false) {
    mp.peers.forEach((peer) => { safeClose(peer.channel); safeClose(peer.pc); }); mp.peers.clear();
    safeClose(mp.guestChannel); safeClose(mp.guestPc); mp.signalClosing = true; safeClose(mp.signalSocket);
    Object.assign(mp, { role:null, room:'', auth:'', hostToken:'', nick:'', seat:null, guestPc:null, guestChannel:null, signalSocket:null, signalClosing:false, names:['','','',''], connectedSeats:new Set(), botSeats:new Set(), botDifficulty:'smart', goal:501, inGame:false, paused:false, revision:0, lastRevision:0, seenActions:new Set(), broadcastQueued:false, testMode:false, passwordProtected:false });
    updateNetworkPill(false);
    if (clearGame && Game.getState()?.multiplayer) { Game.setState(Game.fresh('bots', 501, 'smart', 'Ty')); Game.render(); $('#mainMenu')?.classList.remove('hidden'); }
  }

  function openSignaling(role, credentials) {
    const base = signalingBase(); if (!base) return Promise.reject(new Error('signaling-unavailable'));
    const socketUrl = new URL(`/api/rooms/${encodeURIComponent(mp.room)}/socket`, base); socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(socketUrl.href); mp.signalSocket = socket; mp.signalClosing = false;
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => { if (!settled) { settled = true; safeClose(socket); reject(new Error('timeout')); } }, SIGNAL_TIMEOUT_MS);
      const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); fn(value); };
      socket.onopen = () => {};
      socket.onerror = () => finish(reject, new Error('signaling-error'));
      socket.onclose = (event) => { if (!settled) finish(reject, new Error(`${event.code}:${event.reason || 'closed'}`)); else if (!mp.signalClosing && !mp.inGame) status('mpLobbyStatus', signalError(`${event.code}:${event.reason}`), true); };
      socket.onmessage = async (event) => {
        let msg; try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type === 'auth-required') { socket.send(JSON.stringify({ type:'authenticate', role, ...credentials })); return; }
        if (msg.type === 'authenticated') { finish(resolve, msg); if (role === 'host' && Array.isArray(msg.guests)) for (const guest of msg.guests) if (guest.offer) await hostAcceptOffer(guest.id, guest.nick, guest.offer); return; }
        if (role === 'host') await handleHostSignal(msg); else await handleGuestSignal(msg);
      };
    });
  }

  async function createRoom() {
    const c = text(), nickInput = $('#mpHostNick'), passInput = $('#mpHostPassword');
    const nick = normalizeNick(nickInput?.value); if (!validNick(nick)) return status('mpHostStatus', c.badNick, true);
    if (!window.RTCPeerConnection || !crypto?.subtle) return status('mpHostStatus', c.signalFail, true);
    status('mpHostStatus', c.creating); reset(); mp.role='host'; mp.seat=0; mp.nick=nick; mp.names[0]=nick; mp.goal=Number($('#mpGoal')?.value)||501; mp.botDifficulty=$('#mpBotDifficulty')?.value==='calm'?'calm':'smart';
    const password = passInput?.value || ''; mp.passwordProtected = !!password;
    try {
      let response, payload;
      for (let attempt=0; attempt<4; attempt++) {
        mp.room=randomRoom(); mp.auth=await roomVerifier(mp.room,password);
        response=await signalFetch('/api/rooms',{method:'POST',body:JSON.stringify({room:mp.room,nick:mp.nick,auth:mp.auth,passwordProtected:mp.passwordProtected})});
        if (response.status !== 409) break;
      }
      if (!response?.ok) throw new Error(String(response?.status || 'create-failed'));
      payload=await response.json(); mp.hostToken=payload.hostToken;
      await openSignaling('host',{token:mp.hostToken}); renderLobby(); status('mpLobbyStatus',c.created);
    } catch (error) { status('mpHostStatus',signalError(error),true); reset(); }
  }

  async function joinRoom() {
    const c=text(), nick=normalizeNick($('#mpGuestNick')?.value), room=normalizeRoom($('#mpRoomCode')?.value);
    if(!validNick(nick)) return status('mpGuestStatus',c.badNick,true); if(!room) return status('mpGuestStatus',c.badRoom,true);
    if(!window.RTCPeerConnection||!crypto?.subtle) return status('mpGuestStatus',c.signalFail,true);
    status('mpGuestStatus',c.joining); reset(); mp.role='guest'; mp.nick=nick; mp.room=room; mp.names[0]=c.host; mp.passwordProtected=!!($('#mpGuestPassword')?.value||'');
    try { mp.auth=await roomVerifier(mp.room,$('#mpGuestPassword')?.value||''); await openSignaling('guest',{auth:mp.auth,nick:mp.nick}); renderLobby(); await guestCreateOffer(); } catch(error){ status('mpGuestStatus',signalError(error),true); reset(); }
  }

  async function guestCreateOffer() {
    const pc=new RTCPeerConnection(RTC_CONFIG); mp.guestPc=pc; const channel=pc.createDataChannel('belote',{ordered:true}); attachGuestChannel(channel);
    pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState)&&mp.inGame) pauseGame();};
    const offer=await pc.createOffer(); await pc.setLocalDescription(offer); await waitForIce(pc); signalSend({type:'offer',sdp:pc.localDescription});
  }
  async function hostAcceptOffer(guestId,nick,sdp) {
    if(mp.peers.size>=3) return signalSend({type:'reject',guestId,reason:'room_full'});
    const seat=[1,2,3].find((candidate)=>!mp.botSeats.has(candidate)&&!mp.peers.has(candidate));
    if(!seat) return signalSend({type:'reject',guestId,reason:'room_full'});
    const pc=new RTCPeerConnection(RTC_CONFIG); const peer={guestId,nick,pc,channel:null,connected:false}; mp.peers.set(seat,peer); mp.names[seat]=nick;
    pc.ondatachannel=(event)=>attachHostChannel(seat,event.channel); pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState)){peer.connected=false;if(mp.inGame)pauseGame();else{mp.peers.delete(seat);mp.names[seat]='';renderLobby();broadcastLobby();}}};
    try { await pc.setRemoteDescription(sdp); const answer=await pc.createAnswer(); await pc.setLocalDescription(answer); await waitForIce(pc); signalSend({type:'answer',guestId,seat,sdp:pc.localDescription}); renderLobby(); }
    catch { mp.peers.delete(seat); mp.names[seat]=''; safeClose(pc); signalSend({type:'reject',guestId,reason:'webrtc_failed'}); }
  }
  async function handleHostSignal(msg) {
    if(msg.type==='guest-joined') { renderLobby(); return; }
    if(msg.type==='offer') return hostAcceptOffer(msg.guestId,msg.nick,msg.sdp);
    if(msg.type==='guest-left'){ const entry=[...mp.peers.entries()].find(([,peer])=>peer.guestId===msg.guestId); if(entry){const [seat,peer]=entry;safeClose(peer.channel);safeClose(peer.pc);mp.peers.delete(seat);mp.names[seat]='';if(mp.inGame)pauseGame();else{renderLobby();broadcastLobby();}} }
  }
  async function handleGuestSignal(msg) {
    if(msg.type==='answer'&&mp.guestPc){mp.seat=msg.seat;mp.names[mp.seat]=mp.nick;await mp.guestPc.setRemoteDescription(msg.sdp);return;}
    if(msg.type==='rejected') throw new Error(msg.reason||'rejected');
    if(msg.type==='room-closed'&&!mp.inGame) status('mpLobbyStatus',text().expired,true);
  }

  function attachHostChannel(seat,channel) {
    const peer=mp.peers.get(seat); if(!peer)return; peer.channel=channel;
    channel.onopen=()=>{peer.connected=true;mp.connectedSeats.add(seat);sendChannel(channel,lobbyPacket('welcome',seat));renderLobby();broadcastLobby();};
    channel.onclose=()=>{peer.connected=false;mp.connectedSeats.delete(seat);if(mp.inGame)pauseGame();else{renderLobby();broadcastLobby();}};
    channel.onerror=()=>{if(mp.inGame)pauseGame();};
    channel.onmessage=(event)=>{if(typeof event.data!=='string'||event.data.length>65536)return;let msg;try{msg=JSON.parse(event.data)}catch{return}if(msg.v!==PROTOCOL)return;if(msg.type==='hello'){if(msg.room!==mp.room)return safeClose(channel);sendChannel(channel,lobbyPacket('welcome',seat));return;}if(msg.type==='action'&&mp.inGame&&typeof msg.id==='string'&&!mp.seenActions.has(msg.id)){mp.seenActions.add(msg.id);if(mp.seenActions.size>400)mp.seenActions=new Set([...mp.seenActions].slice(-200));if(!executeHostAction(seat,msg.action,msg.payload||{}))sendChannel(channel,{v:PROTOCOL,type:'error',code:'ILLEGAL_ACTION',message:'Action rejected by host.'});}};
  }
  function attachGuestChannel(channel) {
    mp.guestChannel=channel;
    channel.onopen=()=>{sendChannel(channel,{v:PROTOCOL,type:'hello',room:mp.room,nick:mp.nick});signalSend({type:'connected'});status('mpLobbyStatus',text().joined);updateNetworkPill(true);};
    channel.onclose=()=>{if(mp.inGame)pauseGame();}; channel.onerror=()=>{if(mp.inGame)pauseGame();};
    channel.onmessage=(event)=>{if(typeof event.data!=='string'||event.data.length>250000)return;let msg;try{msg=JSON.parse(event.data)}catch{return}if(msg.v!==PROTOCOL)return;if(msg.type==='welcome'||msg.type==='lobby')applyLobby(msg);else if(msg.type==='start')$('#multiplayerModal')?.classList.add('hidden');else if(msg.type==='state')applyRemoteState(msg.state,msg.revision);else if(msg.type==='pause')pauseGame(msg.message);else if(msg.type==='error')Game.toast(msg.message||'Action rejected');};
  }

  function toggleBot(seat) {
    if(mp.role!=='host'||mp.inGame||![1,2,3].includes(seat)||mp.peers.has(seat))return;
    if(mp.botSeats.has(seat)){mp.botSeats.delete(seat);mp.names[seat]='';}else{mp.botSeats.add(seat);mp.names[seat]=botName(seat);} renderLobby();broadcastLobby();
  }

  function hiddenCards(player,count){return Array.from({length:count},(_,i)=>({id:`hidden-${player}-${i}`,hidden:true}));}
  function mapSeat(value,order){return Number.isInteger(value)?order.indexOf(value):value;}
  function stateForSeat(source,seat){
    const order=[0,1,2,3].map((offset)=>(seat+offset)%4),view=JSON.parse(JSON.stringify(source));
    view.hands=order.map((player)=>player===seat?source.hands[player].map((card)=>({...card})):hiddenCards(player,source.hands[player].length));
    view.names=order.map((player)=>source.names[player]);view.stock=[];
    if(seat%2){view.scores=[source.scores[1],source.scores[0]];view.raw=[source.raw[1],source.raw[0]];view.tricks=[source.tricks[1],source.tricks[0]];}
    ['dealer','bidder','active','lastWinner'].forEach((key)=>view[key]=mapSeat(source[key],order));
    view.trick=(source.trick||[]).map((item)=>({...item,p:mapSeat(item.p,order),card:{...item.card}}));
    if(source.lastTrick)view.lastTrick={...source.lastTrick,winner:mapSeat(source.lastTrick.winner,order),cards:source.lastTrick.cards.map((item)=>({...item,p:mapSeat(item.p,order),card:{...item.card}}))};
    delete view.botTimer;view.mode='network-guest';view.multiplayer=true;return view;
  }
  function stateChanged(){if(mp.role!=='host'||!mp.inGame||mp.broadcastQueued)return;mp.broadcastQueued=true;queueMicrotask(()=>{mp.broadcastQueued=false;broadcastState();});}
  function broadcastState(){const source=Game.getState();if(mp.role!=='host'||!mp.inGame||!source)return;mp.revision++;mp.peers.forEach((peer,seat)=>{if(peer.connected)sendChannel(peer.channel,{v:PROTOCOL,type:'state',revision:mp.revision,state:stateForSeat(source,seat)});});}
  function applyRemoteState(snapshot,revision){if(mp.role!=='guest'||!snapshot||!Number.isInteger(revision)||revision<=mp.lastRevision)return;mp.lastRevision=revision;mp.inGame=true;mp.paused=false;Game.setState(snapshot);Game.render();$('#mainMenu')?.classList.add('hidden');$('#multiplayerModal')?.classList.add('hidden');Game.syncResultModal();updateNetworkPill(true);}

  function executeHostAction(seat,action,payload={}){
    if(mp.paused)return false;const state=Game.getState();if(!state)return false;
    if(action==='next-hand'){if(state.phase!=='done')return false;nextNetworkHand();return true;}
    if(seat!==state.active)return false;
    if(action==='bid'){if(state.phase!=='bid'||typeof payload.suit!=='string'||!(payload.suit==='pass'||Game.bidSuits().includes(payload.suit)))return false;Game.bid(seat,payload.suit);return true;}
    if(action==='play'){if(state.phase!=='play'||typeof payload.cardId!=='string'||!state.hands[seat]?.some((card)=>card.id===payload.cardId)||!Game.legal(seat).some((card)=>card.id===payload.cardId))return false;Game.play(seat,payload.cardId);return true;}
    return false;
  }
  function sendGuestAction(action,payload={}){if(mp.guestChannel?.readyState!=='open'||mp.paused)return false;sendChannel(mp.guestChannel,{v:PROTOCOL,type:'action',action,payload,id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,revision:mp.lastRevision});return true;}
  function handleLocalNetworkAction(action,payload={}){if(!mp.inGame)return false;if(mp.paused){Game.toast(text().paused);return true;}if(mp.role==='host'){executeHostAction(0,action,payload);return true;}sendGuestAction(action,payload);return true;}

  function startGame(){
    if(!canStart())return;mp.inGame=true;mp.paused=false;mp.names[0]=mp.nick;mp.botSeats.forEach((seat)=>mp.names[seat]=botName(seat));
    const state=Game.fresh('network-host',mp.goal,mp.botDifficulty,mp.nick);state.names=[...mp.names];state.multiplayer=true;Game.setState(state);
    $('#mainMenu')?.classList.add('hidden');$('#multiplayerModal')?.classList.add('hidden');updateNetworkPill(true);mp.peers.forEach((peer)=>{if(peer.connected)sendChannel(peer.channel,{v:PROTOCOL,type:'start'});});
    Game.deal();stateChanged();signalSend({type:'close-room'});mp.signalClosing=true;
  }
  function nextNetworkHand(){const state=Game.getState();$('#resultModal')?.classList.add('hidden');if(state.scores.some((score)=>score>=state.goal)){const next=Game.fresh('network-host',state.goal,mp.botDifficulty,mp.names[0]);next.names=[...mp.names];next.multiplayer=true;Game.setState(next);}Game.deal();stateChanged();}
  function pauseGame(custom){if(!mp.inGame)return;mp.paused=true;const state=Game.getState();if(state)state.botTimer++;updateNetworkPill(false);status('mpLobbyStatus',custom||text().paused,true);$('#multiplayerModal')?.classList.remove('hidden');renderLobby();if(mp.role==='host')mp.peers.forEach((peer)=>{if(peer.connected)sendChannel(peer.channel,{v:PROTOCOL,type:'pause',message:custom||text().paused});});}
  function updateNetworkPill(connected=true){const pill=$('#networkPill');if(!pill)return;pill.classList.toggle('visible',!!mp.inGame);pill.classList.toggle('offline',!connected||mp.paused);const label=$('#networkPillText');if(label)label.textContent=mp.room?`P2P · ${mp.room}`:'P2P';}
  function leave(){if(mp.role==='guest')signalSend({type:'leave'});else if(mp.role==='host'&&!mp.inGame)signalSend({type:'close-room'});reset(true);$('#multiplayerModal')?.classList.add('hidden');}

  async function copyRoom(){if(!mp.room)return;try{await navigator.clipboard.writeText(mp.room);Game.toast(Game.t('copied'));}catch{const area=document.createElement('textarea');area.value=mp.room;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();}}

  function openMultiplayer(){renderModal();$('#multiplayerModal')?.classList.remove('hidden');if(mp.role)renderLobby();}

  document.addEventListener('click',(event)=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='share'){event.preventDefault();event.stopImmediatePropagation();openMultiplayer();return;}
    if(action==='new-local'){event.preventDefault();event.stopImmediatePropagation();return;}
    if(mp.inGame){
      const card=event.target.closest('[data-card]');if(card){event.preventDefault();event.stopImmediatePropagation();handleLocalNetworkAction('play',{cardId:card.dataset.card});return;}
      const bid=event.target.closest('[data-bid]');if(bid){event.preventDefault();event.stopImmediatePropagation();handleLocalNetworkAction('bid',{suit:bid.dataset.bid});return;}
      if(action==='next-hand'){event.preventDefault();event.stopImmediatePropagation();handleLocalNetworkAction('next-hand');return;}
    }
    const mpAction=event.target.closest('[data-mp-action]')?.dataset.mpAction;if(!mpAction)return;event.preventDefault();event.stopImmediatePropagation();
    if(mpAction==='close')$('#multiplayerModal')?.classList.add('hidden');else if(mpAction==='create')createRoom();else if(mpAction==='join')joinRoom();else if(mpAction==='copy')copyRoom();else if(mpAction==='leave')leave();else if(mpAction==='start')startGame();else if(mpAction==='bot')toggleBot(Number(event.target.closest('[data-seat]')?.dataset.seat));
  },true);

  function installStyle(){const style=document.createElement('style');style.id='belote-multiplayer-v2-style';style.textContent=`.lobby-seat.self{box-shadow:inset 0 0 0 1px #d7b45e55}.lobby-bot-toggle{margin-top:9px;width:100%;min-height:34px;border:1px solid #d7b45e44;border-radius:9px;background:#d7b45e12;color:#ead496;font-size:9px;font-weight:850;cursor:pointer}.lobby-bot-toggle:hover{background:#d7b45e22}.multiplayer-field select{width:100%;padding:11px 12px;border:1px solid #ffffff21;border-radius:10px;color:#edf5ef;background:#0b1711}.lobby-hint{margin-bottom:8px}@media(max-height:460px) and (orientation:landscape){#multiplayerModal{place-items:start center;padding:8px}.multiplayer-card{max-height:calc(100dvh - 16px);padding:13px 16px;border-radius:18px}.multiplayer-card .modal-head h2{font-size:21px}.multiplayer-lead,.multiplayer-notice{margin-bottom:8px;line-height:1.35}.multiplayer-grid{gap:8px}.multiplayer-section{padding:9px}.multiplayer-field{margin:6px 0}.multiplayer-field input,.multiplayer-field select{padding:7px 9px}.lobby-seats{grid-template-columns:repeat(4,1fr);margin:7px 0}.lobby-seat{min-height:52px;padding:7px}.lobby-bot-toggle{min-height:28px;margin-top:5px}.modal-actions{margin-top:8px}}`;document.head.appendChild(style);}

  const Runtime = window.BeloteMultiplayerRuntime = {
    isBotControlled(player){const state=Game.getState();if(!Number.isInteger(player))return false;if(!state?.multiplayer)return player!==0;return mp.role==='host'&&mp.inGame&&!mp.paused&&mp.botSeats.has(player);},
    stateChanged,
    active(){return mp.inGame;},
    debug: {
      startHost({humanSeats=[1],botSeats=[2,3],difficulty='smart',goal=301}={}){reset();window.__BELOTE_TEST_FAST__=true;Game.prefs.animations=false;Game.prefs.sound=false;mp.role='host';mp.seat=0;mp.nick='Host';mp.room='TEST-ROOM';mp.inGame=true;mp.testMode=true;mp.botDifficulty=difficulty;mp.goal=goal;mp.names=['Host','','',''];for(const seat of humanSeats){mp.peers.set(seat,{connected:true,channel:{readyState:'open',send(){}},pc:null,guestId:`test-${seat}`});mp.names[seat]=`Human ${seat}`;}mp.botSeats=new Set(botSeats);mp.botSeats.forEach((seat)=>mp.names[seat]=botName(seat));const state=Game.fresh('network-host',goal,difficulty,'Host');state.names=[...mp.names];state.multiplayer=true;Game.setState(state);Game.deal();return true;},
      state(){return JSON.parse(JSON.stringify(Game.getState()));},view(seat){return stateForSeat(Game.getState(),seat);},legal(seat){return Game.legal(seat).map((card)=>card.id);},bidChoices(){return Game.bidSuits();},action(seat,action,payload){return executeHostAction(seat,action,payload);},lobby(){return{ready:canStart(),botSeats:[...mp.botSeats],humans:connectedHumanCount(),names:[...mp.names]};},session(){return{role:mp.role,seat:mp.seat,paused:mp.paused,revision:mp.revision,lastRevision:mp.lastRevision};}
    }
  };

  installStyle();
  const localButton=document.querySelector('[data-action="new-local"]');localButton?.remove();
  const localOption=document.querySelector('#mode option[value="local"]');localOption?.remove();
  const current=Game.getState();if(current?.mode==='local'){current.mode='bots';Game.render();Game.persist();}
})();
