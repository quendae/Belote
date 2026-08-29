# Belote

**Belote im Browser mit Offline-Bots und privatem, host-autoritativem WebRTC-Mehrspieler.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md)

Zum Spielen sind weder Framework noch Build-Schritt erforderlich. Das Kernspiel bleibt in [`belote_offline_single.html`](belote_offline_single.html), der Online-Mehrspieler ist in [`belote_multiplayer.js`](belote_multiplayer.js) getrennt, und der kleine optionale Signalisierungsdienst befindet sich unter [`cloudflare-signaling/`](cloudflare-signaling/).

## Funktionen

- Klassisches Belote für vier Spieler in festen Partnerschaften: **Nord/Süd gegen West/Ost**
- 32 Karten: **7, 8, 9, 10, Bube, Dame, König, Ass**
- Offline-Spiel gegen **3 Bots**
- Privater **WebRTC-P2P-Mehrspieler** für vier Sitzplätze
- Beitritt mit kurzem Raumcode statt manuellem Austausch von SDP/ICE-Blöcken
- Optional passwortgeschützte Räume
- Hybride Tische: **Host + Online-Gast/Gäste + Bots auf dem Host**
- Host-autoritative Regeln und sitzplatzbezogene Filterung geheimer Informationen
- Zwei Bot-Stile: **Ruhig** und **Klug**
- Partieziele: **301, 501 oder 1001 Punkte**
- Tutorial, Regelübersicht, Tischprotokoll und letzter Stich
- Automatische Offline-Speicherung mit **Partie fortsetzen**
- Deutsch, Englisch und Polnisch
- Klassisches Rot/Schwarz oder Vierfarben-Deck
- Optionale Sounds und Animationen
- Responsive Oberfläche für Desktop, Tablet und Smartphone

Der frühere lokale Pass-and-Play-Modus wurde entfernt. Mehrspieler bedeutet jetzt Online-Spiel auf getrennten Geräten oder in getrennten Browsern.

## Offline spielen

1. [`belote_offline_single.html`](belote_offline_single.html) in einem aktuellen Browser öffnen.
2. **Du + 3 Bots** wählen.
3. Punkteziel und Bot-Stil einstellen.
4. Das Geben starten.

Das Bot-Spiel funktioniert weiterhin ohne Signalisierungsdienst und wird lokal gespeichert.

## Online-Mehrspieler

Das Online-Spiel verwendet ein **host-autoritatives P2P-Modell**. Der Browser des Gastgebers führt die echte Simulation aus: Er mischt, besitzt den einzigen autoritativen Spielzustand, prüft jedes Gebot und jede gespielte Karte und steuert alle Bot-Sitzplätze. Gäste senden Aktionen, keine ersetzten Spielzustände.

Jeder Gast erhält eine für seinen Sitzplatz gefilterte Ansicht. Die Identitäten der gegnerischen Handkarten und die zukünftige Reihenfolge des Kartenstapels werden nicht an seinen Browser übertragen.

### Tisch erstellen

1. **Online-Mehrspieler** öffnen.
2. Nickname, optionales Passwort, Punkteziel und Bot-Stufe eingeben.
3. **Raum erstellen** wählen.
4. Den kurzen Raumcode mit Freunden teilen.
5. Verbleibende freie Plätze bei Bedarf mit Bots füllen.
6. Starten, sobald alle erforderlichen Plätze bereit sind. Mindestens ein menschlicher Online-Gast ist erforderlich.

### Beitreten

1. **Online-Mehrspieler** öffnen.
2. Nickname und Raumcode eingeben.
3. Falls der Gastgeber ein Passwort gesetzt hat, dieses ebenfalls eingeben.
4. **Beitreten** wählen und in der synchronisierten Lobby warten.

Der Signalisierungsdienst dient ausschließlich zum automatischen Austausch der temporären WebRTC-Verbindungsdaten. Nach dem Aufbau der DataChannels läuft die Partie direkt zwischen den Browsern. Wird während einer Partie die Verbindung eines Spielers getrennt, pausiert die aktuelle Version den Tisch, statt eine fragile automatische Wiederverbindung zu versuchen.

> Diese Architektur ist für private und freundschaftliche Partien gedacht. Da der Host den vollständigen autoritativen Zustand besitzt, könnte ein böswilliger Gastgeber technisch versteckte Karten einsehen. Für betrugssicheres Ranglistenspiel wäre ein vertrauenswürdiger Spielserver erforderlich.

## Implementierte Regeln

Das Spiel verwendet ein 32-Karten-Belote-Deck und vier feste Sitzplätze in zwei Partnerschaften.

### Geben und Trumpfwahl

Jeder Spieler erhält zunächst fünf Karten. Vor der ersten Bietrunde wird eine Karte offen aufgedeckt.

- In der **ersten Runde** kann die Farbe der offenen Karte als Trumpf angenommen oder gepasst werden.
- Passen alle, beginnt eine **zweite Runde**, in der eine andere Farbe gewählt werden kann.
- Passen erneut alle, wird neu gegeben.
- Nach der Trumpfwahl erhält jeder Spieler insgesamt acht Karten.

### Stichspiel

Die Implementierung erzwingt die wichtigsten Belote-Pflichten:

- die ausgespielte Farbe muss bedient werden, wenn möglich;
- wer die Farbe nicht hat und dessen Partner den Stich nicht aktuell gewinnt, muss wenn möglich trumpfen;
- wenn bereits ein Trumpf den Stich gewinnt, muss wenn möglich mit einem höheren Trumpf überstochen werden;
- der Gewinner eines Stichs spielt zum nächsten Stich aus.

### Kartenreihenfolge und Punkte

Trumpfreihenfolge: `J > 9 > A > 10 > K > Q > 8 > 7`

Trumpfwerte: J — 20, 9 — 14, A — 11, 10 — 10, K — 4, Q — 3, 8 / 7 — 0.

Reihenfolge außerhalb des Trumpfs: `A > 10 > K > Q > J > 9 > 8 > 7`

Nicht-Trumpfwerte: A — 11, 10 — 10, K — 4, Q — 3, J — 2, 9 / 8 / 7 — 0.

Der letzte Stich bringt zusätzlich **10 Punkte**, sodass in einem normalen Geben insgesamt **162 Punkte** verfügbar sind. Erzielt das Team, das den Trumpf gewählt hat, nicht mehr Punkte als die Gegner, ist der Kontrakt verloren und die Gegner erhalten **162 Punkte**.

## Speicherung und Datenschutz

Offline-Partien und Einstellungen werden im `localStorage` des Browsers gespeichert. Objekte einer laufenden Mehrspieler-Verbindung oder Sitzung werden nicht in den normalen Offline-Spielstand geschrieben.

Das Signalisierungs-Backend speichert nur kurzlebige Raumdaten und Informationen zum Aufbau von WebRTC. Es enthält keine Belote-Spielregeln.

## Bereitstellung

Für Online-Mehrspieler müssen gemeinsam ausgeliefert werden:

- `belote_offline_single.html`
- `belote_multiplayer.js`

Zusätzlich wird der Worker aus `cloudflare-signaling/` bereitgestellt. Die enthaltene Wrangler-Konfiguration verwendet standardmäßig `belote.qqnd.fyi/api/*`; bei einer anderen Domain muss diese Route angepasst werden.

Siehe [`DEPLOY_MULTIPLAYER.md`](DEPLOY_MULTIPLAYER.md) für Cloudflare Worker/Durable Object, Health Check, Architekturhinweise und Testbefehle.

## Tests

Das Repository enthält Playwright-Regressionstests für die produktiven Belote-Regeln, das Routing von Mehrspieleraktionen, die Filterung geheimer Informationen, hybride Mensch/Bot-Tische und vollständige Mehrspieler-Geben. GitHub Actions prüft außerdem den Signalisierungs-Worker.

```bash
npm install
npx playwright install chromium
npm run test:multiplayer
npm run test:rules
npm run test:design
```

## Browser-Unterstützung

Empfohlen wird ein aktueller Desktop- oder Mobilbrowser. Online-Mehrspieler benötigt in Produktion HTTPS, WebRTC, Web Crypto und Zugriff auf die Signalisierungsroute. Der Standardclient verwendet STUN; besonders restriktive NAT-/Firewall-Umgebungen können künftig einen TURN-Dienst erfordern.
