import { test, expect } from '@playwright/test';

const initialState = {
  version: 3,
  mode: 'network-server',
  multiplayer: true,
  diff: 'smart',
  goal: 501,
  names: ['Tester', 'Bot 2', 'Bot 3', 'Bot 4'],
  scores: [0, 0],
  dealer: 3,
  deal: 1,
  phase: 'bid',
  hands: [
    [{ id: 'S-7', s: 'S', r: '7' }, { id: 'H-A', s: 'H', r: 'A' }, { id: 'D-10', s: 'D', r: '10' }, { id: 'C-J', s: 'C', r: 'J' }, { id: 'S-Q', s: 'S', r: 'Q' }],
    Array.from({ length: 5 }, (_, i) => ({ id: `hidden-1-${i}`, hidden: true })),
    Array.from({ length: 5 }, (_, i) => ({ id: `hidden-2-${i}`, hidden: true })),
    Array.from({ length: 5 }, (_, i) => ({ id: `hidden-3-${i}`, hidden: true }))
  ],
  trump: null,
  bidder: null,
  bidRound: 1,
  turnup: { id: 'S-A', s: 'S', r: 'A' },
  stock: [],
  active: 0,
  passCount: 0,
  trick: [],
  tricks: [0, 0],
  raw: [0, 0],
  logs: [],
  lastTrick: null,
  lastWinner: null,
  result: '',
  resultKind: null,
  legalCardIds: [],
  bidSuits: ['S']
};

async function installFakeServer(page, { resume = false } = {}) {
  await page.addInitScript(({ state, resumeSession }) => {
    window.__qqndSent = [];
    window.__qqndSockets = [];
    if (resumeSession) localStorage.setItem('belote.qqnd.session.v1', JSON.stringify({ sessionId: 'session-1', resumeToken: 'resume-secret' }));

    class FakeWebSocket extends EventTarget {
      static OPEN = 1;
      static CLOSED = 3;
      constructor(url) {
        super();
        this.url = url;
        this.readyState = FakeWebSocket.OPEN;
        window.__qqndSockets.push(this);
        queueMicrotask(() => this.server({ type: 'hello', protocol: 1, service: 'qqnd-game-server' }));
      }
      send(raw) {
        const message = JSON.parse(raw);
        window.__qqndSent.push(message);
        if (message.type === 'session.create') {
          queueMicrotask(() => this.server({ type: 'session.created', session: { id: 'session-1', nickname: message.nickname }, resumeToken: 'resume-secret' }));
        } else if (message.type === 'session.resume') {
          queueMicrotask(() => this.server({ type: 'session.resumed', session: { id: 'session-1', nickname: 'Tester' }, rooms: [] }));
        } else if (message.type === 'rooms.list') {
          queueMicrotask(() => this.server({ type: 'rooms.list', rooms: [{ id: 'PUB1-ROOM', game: 'belote', name: 'Publiczny stół', visibility: 'public', status: 'waiting', ownerSessionId: 'other', players: [{ nickname: 'Alice', connected: true }] }] }));
        } else if (message.type === 'room.create') {
          queueMicrotask(() => this.server({ type: 'room.created', room: { id: 'TEST-ROOM', game: 'belote', name: message.name, visibility: message.visibility, status: 'waiting', ownerSessionId: 'session-1', players: [{ sessionId: 'session-1', nickname: 'Tester', connected: true }] } }));
        } else if (message.type === 'game.start') {
          const room = { id: 'TEST-ROOM', game: 'belote', name: 'Belote', visibility: 'private', status: 'in_game', ownerSessionId: 'session-1', players: [{ sessionId: 'session-1', nickname: 'Tester', connected: true }] };
          queueMicrotask(() => this.server({ type: 'game.started', roomId: 'TEST-ROOM', room, game: 'belote', seat: 0, seatCount: 4, botSeats: [1, 2, 3], revision: 1, authoritative: true, presence: [{ sessionId: 'session-1', seat: 0, nickname: 'Tester', connected: true, graceDeadline: null, botActive: false }] }));
        } else if (message.type === 'game.state.get') {
          queueMicrotask(() => this.server({ type: 'game.state', roomId: 'TEST-ROOM', viewerSeat: 0, revision: 1, authoritative: true, botSeats: [1, 2, 3], presence: [{ sessionId: 'session-1', seat: 0, nickname: 'Tester', connected: true, graceDeadline: null, botActive: false }], state }));
        }
      }
      server(message) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) })); }
      close() { this.readyState = FakeWebSocket.CLOSED; this.dispatchEvent(new Event('close')); }
    }
    window.WebSocket = FakeWebSocket;
  }, { state: initialState, resumeSession: resume });
}

async function openMultiplayer(page) {
  await page.goto('/');
  await page.waitForSelector('#mainMenu');
  await page.locator('#mainMenu .menu-btn[data-action="share"]').click();
  await expect(page.locator('#multiplayerModal')).toBeVisible();
}

test('canonical / exposes QQND multiplayer room browser with real computed visibility', async ({ page }) => {
  await installFakeServer(page);
  await openMultiplayer(page);
  await expect(page.locator('#mpCreateButton')).toBeVisible();
  await expect(page.locator('#mpJoinButton')).toBeVisible();
  await expect(page.locator('#mpRoomCode')).toBeVisible();
  await expect(page.locator('#mpVisibility option[value="public"]')).toHaveCount(1);
  await expect(page.locator('#mpVisibility option[value="private"]')).toHaveCount(1);
  await expect(page.locator('#multiplayerModal textarea')).toHaveCount(0);
  const box = await page.locator('#mpCreateButton').evaluate((node) => ({ display: getComputedStyle(node).display, z: getComputedStyle(node).zIndex, width: node.getBoundingClientRect().width }));
  expect(box.display).not.toBe('none');
  expect(box.width).toBeGreaterThan(60);
  await expect(page.getByText('Publiczny stół')).toBeVisible();
});

test('host can fill three open seats with server bots and start a four-seat match', async ({ page }) => {
  await installFakeServer(page);
  await openMultiplayer(page);
  await page.locator('#mpCreateButton').click();
  await expect(page.locator('#mpLobby')).toBeVisible();
  await page.locator('#mpBotCount').selectOption('3');
  await expect(page.locator('#mpStartButton')).toBeEnabled();
  await page.locator('#mpStartButton').click();
  await expect(page.locator('#mainMenu')).toBeHidden();
  const startFrame = await page.evaluate(() => window.__qqndSent.find((frame) => frame.type === 'game.start'));
  expect(startFrame).toMatchObject({ roomId: 'TEST-ROOM', botCount: 3, settings: { goal: 501, botDifficulty: 'smart' } });
  expect(await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.snapshot().inGame)).toBe(true);
});

test('card/bid input sends game.action only and never mutates canonical state locally', async ({ page }) => {
  await installFakeServer(page);
  await openMultiplayer(page);
  await page.locator('#mpCreateButton').click();
  await page.locator('#mpBotCount').selectOption('3');
  await page.locator('#mpStartButton').click();
  await page.waitForFunction(() => window.BeloteNetworkBridge.getState()?.mode === 'network-server');

  const before = await page.evaluate(() => structuredClone(window.BeloteNetworkBridge.getState()));
  await page.locator('[data-bid="S"]').click();
  const result = await page.evaluate(() => ({ after: structuredClone(window.BeloteNetworkBridge.getState()), sent: window.__qqndSent.slice() }));
  expect(result.after.phase).toBe(before.phase);
  expect(result.after.active).toBe(before.active);
  expect(result.sent.some((frame) => frame.type === 'game.action' && frame.action === 'bid' && frame.payload?.suit === 'S')).toBe(true);
  expect(result.sent.some((frame) => frame.type === 'game.state.commit' || frame.type === 'game.state.publish')).toBe(false);
});

test('disconnect countdown, bot takeover and clean presence are persistent/recoverable from game.presence', async ({ page }) => {
  await installFakeServer(page);
  await openMultiplayer(page);
  await page.locator('#mpCreateButton').click();
  await page.locator('#mpBotCount').selectOption('3');
  await page.locator('#mpStartButton').click();
  await page.waitForFunction(() => window.BeloteMultiplayerRuntime.debug.snapshot().inGame === true);

  await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.presence({ type: 'game.presence', presence: [{ sessionId: 'other', seat: 1, nickname: 'Alice', connected: false, graceDeadline: Date.now() + 47_000, botActive: false }] }));
  await expect(page.locator('#networkPresenceOverlay')).toBeVisible();
  await expect(page.locator('#networkPresenceTitle')).toContainText('Alice');
  await expect(page.locator('#networkPresenceBody')).toContainText('Bot przejmie');

  await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.presence({ type: 'game.player.bot_takeover', sessionId: 'other', seat: 1, nickname: 'Alice' }));
  await expect(page.locator('#networkPresenceTitle')).toContainText('Bot przejął');
  await page.waitForTimeout(100);
  await expect(page.locator('#networkPresenceOverlay')).toBeVisible();

  await page.evaluate(() => window.BeloteMultiplayerRuntime.debug.presence({ type: 'game.presence', presence: [{ sessionId: 'other', seat: 1, nickname: 'Alice', connected: true, graceDeadline: null, botActive: false }] }));
  await expect(page.locator('#networkPresenceOverlay')).toBeHidden();
});

test('stored session uses session.resume instead of creating a second identity', async ({ page }) => {
  await installFakeServer(page, { resume: true });
  await openMultiplayer(page);
  const frames = await page.evaluate(() => window.__qqndSent.slice());
  expect(frames.some((frame) => frame.type === 'session.resume' && frame.sessionId === 'session-1' && frame.resumeToken === 'resume-secret')).toBe(true);
  expect(frames.some((frame) => frame.type === 'session.create')).toBe(false);
});
