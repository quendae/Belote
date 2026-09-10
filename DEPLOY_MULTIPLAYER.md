# Wdrożenie Belote — QQND Card Room

Belote korzysta ze wspólnego backendu `qqnd-game-server`. Produkcyjny klient łączy się wyłącznie z:

```text
wss://api.qqnd.fyi/api/v1/ws
```

Nie wdrażaj per-game Cloudflare Workera, WebRTC, STUN ani sygnalizacji SDP. Katalog `cloudflare-signaling/` jest tymczasowo pozostawiony w repo tylko jako rollback historyczny do czasu zakończenia live smoke i nie należy do runtime produkcyjnego.

## Runtime frontendu

Wgraj wyłącznie pliki wymienione w `DEPLOY_RUNTIME.md`. Entry pointem jest `index.html`.

Klient obsługuje:

- `session.create` / `session.resume`,
- publiczne i prywatne pokoje,
- listę publicznych pokojów,
- start stołu czteroosobowego z opcjonalnymi botami na wolnych seatach,
- ruchy wyłącznie jako `game.action`,
- prywatne projekcje `game.state` z backendu,
- `game.presence`, reconnect i bot takeover.

## Model autorytetu

Belote jest `server-authoritative`:

- backend posiada talię, ręce, kolejność kart, aktywny seat, legalność licytacji i zagrań oraz punktację;
- klient nie wysyła `game.state.commit` ani `game.state.publish`;
- seat wynika z uwierzytelnionej sesji;
- cudze ręce i stock są ukrywane po stronie serwera;
- po rozłączeniu aktywna gra zachowuje seat przez 60 sekund;
- po grace period substitute bot przejmuje dokładnie ten seat i bieżącą rękę;
- po późniejszym `session.resume` gracz odbiera seat botowi i kontynuuje zastany stan bez cofania ruchów.

## Kolejność wdrożenia

Najpierw backend:

```bash
cd /opt/qqnd-game-server
git pull
npm install
npm run typecheck
npm test
npm run build
systemctl restart qqnd-game-server
curl https://api.qqnd.fyi/api/v1/health
npx wscat -c wss://api.qqnd.fyi/api/v1/ws
```

Dopiero po zielonym backendzie wdrażaj frontend. Po skopiowaniu runtime sprawdź `https://belote.qqnd.fyi/` w co najmniej dwóch niezależnych profilach/przeglądarkach.

## Test live wymagany przed cleanupem legacy

Sprawdź kolejno:

1. publiczny i prywatny pokój;
2. pełne rozdanie 4 ludzi;
3. pełne rozdanie 2 ludzi + 2 boty;
4. rozłączenie krótsze niż 60 s i odzyskanie tego samego seata;
5. rozłączenie dłuższe niż 60 s, bot takeover, kilka ruchów bota i późny reconnect/reclaim;
6. brak wycieku cudzych rąk w ruchu WebSocket;
7. brak `game.state.commit` / `game.state.publish` wysyłanych przez klienta.

Po pozytywnym live smoke można usunąć `cloudflare-signaling/` i pozostałe martwe fragmenty legacy P2P z monolitycznego HTML-a w osobnym cleanup commicie.

## Testy repo

```bash
npm install
npx playwright install chromium
npm run test:multiplayer
npm run test:rules
npm run test:design
npm test
```
