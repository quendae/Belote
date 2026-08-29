# Belote — Offline

**A self-contained Belote card game for the browser, with bots, local play and direct P2P multiplayer.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md)

The entire game lives in a single file: [`belote_offline_single.html`](belote_offline_single.html). Download it and open it in a modern browser — no installation or build step is required.

## Features

- Classic four-player Belote in fixed partnerships: **North/South vs West/East**
- 32-card deck: **7, 8, 9, 10, Jack, Queen, King, Ace**
- Play against **3 bots**
- **4-player local** pass-and-play mode on one device
- **4-player WebRTC P2P multiplayer** without a dedicated game server
- Optional password-protected private P2P rooms
- Two bot styles: **Relaxed** and **Sharp**
- Match targets: **301, 501 or 1001 points**
- Built-in **tutorial** and quick rules reference
- Table log and last-trick summary
- Automatic local save with a **Continue game** option
- Interface languages: **English, Polish and German**
- Classic red/black card colours or a four-colour deck
- Optional sounds and card animations
- Responsive browser interface

## Play

1. Download [`belote_offline_single.html`](belote_offline_single.html).
2. Open it in a modern browser.
3. Choose one of the available table modes:
   - **You + 3 bots**
   - **4 players local**
   - **P2P multiplayer**
4. Choose the match target and start dealing.

Bot and local modes can be played entirely offline after the file has been downloaded.

## P2P multiplayer

Remote multiplayer uses **WebRTC**. There is no dedicated Belote game server: one player acts as the host, shuffles the cards and validates the game state, while each guest receives only the cards belonging to their own seat.

Connection setup is intentionally manual:

1. The host creates a private room and shares its room code.
2. Each guest creates a join code and sends it to the host through any messenger.
3. The host accepts it and sends the generated answer code back.
4. The guest pastes the answer and connects.
5. The match can start after all four seats are connected.

A room may additionally be protected with a password. Internet connectivity and browser WebRTC support are required for remote P2P play.

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

In trump:

`J > 9 > A > 10 > K > Q > 8 > 7`

Trump values:

- J — 20
- 9 — 14
- A — 11
- 10 — 10
- K — 4
- Q — 3
- 8 / 7 — 0

Outside trump:

`A > 10 > K > Q > J > 9 > 8 > 7`

Non-trump values:

- A — 11
- 10 — 10
- K — 4
- Q — 3
- J — 2
- 9 / 8 / 7 — 0

The last trick is worth an additional **10 points**, for **162 points** available in a normal deal.

If the team that selected trump does not score more than the opponents, the contract fails and the opponents receive **162 points** for the deal.

## Saving and privacy

The current match and preferences are stored locally in the browser using `localStorage`.

Saved data includes the current game state and preferences such as language, card colours, sounds and animations. Clearing browser site data may remove the saved match.

In P2P mode, gameplay data is exchanged directly between players through WebRTC. No dedicated game server is required.

## Technical notes

The project is deliberately simple to distribute:

- one self-contained HTML file;
- plain HTML, CSS and JavaScript;
- no framework;
- no package installation;
- no build process required to play;
- WebRTC for direct multiplayer connections;
- browser `localStorage` for persistence.

## Browser support

A current desktop or mobile browser is recommended. Remote multiplayer additionally requires WebRTC and Web Crypto support.
