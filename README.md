# Belote

**A browser-based Belote game with offline bots and private host-authoritative WebRTC multiplayer.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md)

No framework or build step is required to play. The core game remains in [`belote_offline_single.html`](belote_offline_single.html); online multiplayer is isolated in [`belote_multiplayer.js`](belote_multiplayer.js), with a tiny optional signaling service under [`cloudflare-signaling/`](cloudflare-signaling/).

## Features

- Classic four-player Belote in fixed partnerships: **North/South vs West/East**
- 32-card deck: **7, 8, 9, 10, Jack, Queen, King, Ace**
- Offline single-player against **3 bots**
- Private **WebRTC P2P multiplayer** for four seats
- Join with a short room code instead of manually exchanging SDP/ICE blobs
- Optional password-protected rooms
- Hybrid tables: **host + online guest(s) + host-side bots**
- Host-authoritative rules and per-seat filtering of hidden information
- Two bot styles: **Relaxed** and **Sharp**
- Match targets: **301, 501 or 1001 points**
- Built-in tutorial, quick rules, table log and last-trick summary
- Automatic offline save with **Continue game**
- English, Polish and German UI
- Classic red/black or four-colour deck
- Optional sounds and animations
- Responsive desktop, tablet and phone UI

The former pass-and-play local multiplayer mode has been removed. Multiplayer now means separate devices/browsers connected online.

## Play offline

1. Open [`belote_offline_single.html`](belote_offline_single.html) in a current browser.
2. Choose **You + 3 bots**.
3. Select the match target and bot style.
4. Start the deal.

The bot game remains available without the signaling service and its match state is saved locally.

## Online multiplayer

Online play uses a **host-authoritative P2P model**. The host browser runs the real simulation: it shuffles, owns the authoritative state, validates every bid and card play, and runs any bot seats. Guests send actions, not replacement game states.

Each guest receives a seat-filtered view. Opponent card identities and the future stock/deck order are not sent to that browser.

### Creating a table

1. Open **Online multiplayer**.
2. Enter a nickname, optional password, match target and bot difficulty.
3. Choose **Create room**.
4. Share the short room code with your friends.
5. Fill any remaining empty seats with bots if desired.
6. Start when all required seats are ready. At least one remote human guest is required.

### Joining

1. Open **Online multiplayer**.
2. Enter your nickname and the room code.
3. Enter the password if the host set one.
4. Choose **Join** and wait in the synchronized lobby.

The signaling service is used only to exchange the temporary WebRTC setup information. Once the DataChannels are established, gameplay is sent directly between browsers. If a player disconnects during the game, the current implementation pauses the table rather than attempting fragile automatic reconnection.

> This architecture is intended for friendly/private games. Because the host owns the full authoritative state, a malicious host could inspect hidden cards. Cheating-resistant ranked play would require a trusted game server.

## Implemented rules

The game uses a 32-card Belote deck and four fixed seats in two partnerships.

### Dealing and bidding

Each player first receives five cards. One card is turned face up for the first bidding round.

- In the **first round**, players may accept the suit of the turned-up card as trump or pass.
- If everyone passes, a **second round** begins in which another suit may be chosen.
- If everyone passes again, the cards are redealt.
- Once trump is chosen, every player receives a total of eight cards.

### Trick play

The implementation enforces the core Belote obligations:

- follow the led suit whenever possible;
- if void in the led suit and your partner is not currently winning, play a trump if possible;
- when a trump is already winning the trick, overtrump when possible;
- the winner of a trick leads the next one.

### Card order and points

Trump order: `J > 9 > A > 10 > K > Q > 8 > 7`

Trump values: J — 20, 9 — 14, A — 11, 10 — 10, K — 4, Q — 3, 8 / 7 — 0.

Non-trump order: `A > 10 > K > Q > J > 9 > 8 > 7`

Non-trump values: A — 11, 10 — 10, K — 4, Q — 3, J — 2, 9 / 8 / 7 — 0.

The last trick is worth an additional **10 points**, for **162 points** available in a normal deal. If the team that selected trump does not score more than the opponents, the contract fails and the opponents receive **162 points** for the deal.

## Saving and privacy

Offline matches and preferences are stored in browser `localStorage`. Live multiplayer connection/session objects are not written into the normal offline save slot.

The signaling backend stores only temporary room and WebRTC-establishment data. It contains no Belote rule engine.

## Deployment

For online multiplayer, serve both:

- `belote_offline_single.html`
- `belote_multiplayer.js`

and deploy the signaling Worker from `cloudflare-signaling/`. The included Wrangler configuration targets `belote.qqnd.fyi/api/*`; change the route if the game is hosted elsewhere.

See [`DEPLOY_MULTIPLAYER.md`](DEPLOY_MULTIPLAYER.md) for the Cloudflare Worker/Durable Object setup, health check, architecture notes and test commands.

## Tests

The repository includes Playwright regression coverage for the production Belote rules, multiplayer action routing, hidden-information filtering, hybrid human/bot tables and complete multiplayer deals. GitHub Actions also checks the signaling Worker.

```bash
npm install
npx playwright install chromium
npm run test:multiplayer
npm run test:rules
npm run test:design
```

## Browser support

A current desktop or mobile browser is recommended. Online multiplayer requires HTTPS in production, WebRTC, Web Crypto and access to the signaling route. The default client uses STUN; particularly restrictive NAT/firewall environments may require a TURN service in the future.
