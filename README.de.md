# Belote — Offline

**Eine eigenständige Belote-Version für den Browser – mit Bots, lokalem Spiel und direktem P2P-Mehrspieler.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md)

Das komplette Spiel befindet sich in einer einzigen Datei: [`belote_offline_single.html`](belote_offline_single.html). Einfach herunterladen und in einem modernen Browser öffnen – ohne Installation und ohne Build-Schritt.

## Funktionen

- Klassisches Belote für vier Spieler in festen Partnerschaften: **Nord/Süd gegen West/Ost**
- 32 Karten: **7, 8, 9, 10, Bube, Dame, König, Ass**
- Spiel gegen **3 Bots**
- **4 Spieler lokal** auf einem Gerät
- **WebRTC-P2P-Mehrspieler für 4 Spieler** ohne dedizierten Spielserver
- Private P2P-Räume mit optionalem Passwort
- Zwei Bot-Stile: **Ruhig** und **Klug**
- Partieziel: **301, 501 oder 1001 Punkte**
- Eingebautes **Tutorial** und kompakte Regelübersicht
- Tischprotokoll und Zusammenfassung des letzten Stichs
- Automatische lokale Speicherung mit **Partie fortsetzen**
- Oberflächensprachen: **Deutsch, Englisch und Polnisch**
- Klassische rot/schwarze Kartenfarben oder Vierfarben-Deck
- Optionale Sounds und Kartenanimationen
- Responsive Browser-Oberfläche

## Spielen

1. [`belote_offline_single.html`](belote_offline_single.html) herunterladen.
2. Die Datei in einem modernen Browser öffnen.
3. Einen Tischmodus wählen:
   - **Du + 3 Bots**
   - **4 Spieler lokal**
   - **P2P-Mehrspieler**
4. Das Punkteziel auswählen und die Karten geben.

Bot- und lokaler Modus funktionieren nach dem Herunterladen vollständig offline.

## P2P-Mehrspieler

Das Fernspiel verwendet **WebRTC**. Es gibt keinen eigenen Belote-Spielserver: Ein Spieler ist Gastgeber, mischt die Karten und verwaltet den Spielzustand. Jeder Gast erhält nur die Karten seines eigenen Sitzplatzes.

Die Verbindung wird bewusst manuell eingerichtet:

1. Der Gastgeber erstellt einen privaten Raum und teilt den Raumcode.
2. Jeder Gast erzeugt einen Beitrittscode und sendet ihn über einen beliebigen Messenger an den Gastgeber.
3. Der Gastgeber nimmt den Code an und sendet den erzeugten Antwortcode zurück.
4. Der Gast fügt die Antwort ein und verbindet sich.
5. Sobald alle vier Plätze verbunden sind, kann die Partie beginnen.

Ein Raum kann zusätzlich mit einem Passwort geschützt werden. Für P2P-Fernspiel sind eine Internetverbindung und WebRTC-Unterstützung im Browser erforderlich.

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

Im Trumpf:

`J > 9 > A > 10 > K > Q > 8 > 7`

Trumpfwerte:

- J — 20
- 9 — 14
- A — 11
- 10 — 10
- K — 4
- Q — 3
- 8 / 7 — 0

Außerhalb des Trumpfs:

`A > 10 > K > Q > J > 9 > 8 > 7`

Nicht-Trumpfwerte:

- A — 11
- 10 — 10
- K — 4
- Q — 3
- J — 2
- 9 / 8 / 7 — 0

Der letzte Stich bringt zusätzlich **10 Punkte**, sodass in einem normalen Geben insgesamt **162 Punkte** verfügbar sind.

Erzielt das Team, das den Trumpf gewählt hat, nicht mehr Punkte als die Gegner, ist der Kontrakt verloren und die Gegner erhalten **162 Punkte** für dieses Geben.

## Speicherung und Datenschutz

Die aktuelle Partie und die Einstellungen werden lokal im Browser über `localStorage` gespeichert.

Gespeichert werden unter anderem Spielstand, Sprache, Kartenfarben, Sounds und Animationen. Das Löschen der Website-Daten im Browser kann den gespeicherten Spielstand entfernen.

Im P2P-Modus werden Spieldaten direkt zwischen den Spielern über WebRTC übertragen. Ein dedizierter Spielserver ist nicht erforderlich.

## Technische Hinweise

Das Projekt ist bewusst einfach zu starten und zu verteilen:

- eine eigenständige HTML-Datei;
- reines HTML, CSS und JavaScript;
- kein Framework;
- keine Paketinstallation;
- kein Build-Prozess zum Spielen erforderlich;
- WebRTC für direkte Mehrspieler-Verbindungen;
- `localStorage` für die lokale Speicherung.

## Browser-Unterstützung

Empfohlen wird ein aktueller Desktop- oder Mobilbrowser. Für den Fernspiel-Modus werden zusätzlich WebRTC und Web Crypto benötigt.
