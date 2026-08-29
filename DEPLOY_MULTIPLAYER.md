# Wdrożenie Belote i multiplayera P2P

Belote pozostaje grą przeglądarkową. Logika rozgrywki nie trafia na serwer gry: po zestawieniu połączeń gracze komunikują się przez WebRTC DataChannels, a mały Cloudflare Worker obsługuje wyłącznie sygnalizację.

## Elementy wdrożenia

| Element | Miejsce |
| --- | --- |
| `belote_offline_single.html` | serwer WWW |
| `belote_multiplayer.js` | ten sam katalog WWW |
| `cloudflare-signaling/` | Cloudflare Workers + Durable Objects |

Domyślna konfiguracja Workera zakłada domenę `belote.qqnd.fyi` i trasę `belote.qqnd.fyi/api/*`. Jeżeli gra działa pod inną domeną, zmień `routes[].pattern` w `cloudflare-signaling/wrangler.jsonc`.

## 1. Wdrożenie plików gry

Wgraj do tego samego katalogu publicznego:

- `belote_offline_single.html`
- `belote_multiplayer.js`

Tryb z botami nadal działa bez sygnalizacji. Multiplayer jest inicjalizowany dopiero po otwarciu jego okna.

## 2. Pierwszy deploy sygnalizacji

W katalogu `cloudflare-signaling`:

```powershell
npm install
npx wrangler login
npm run deploy
```

Worker używa Durable Object `SignalingRoom`. Pokój żyje maksymalnie 30 minut i przechowuje jedynie tymczasowe informacje potrzebne do zestawienia WebRTC: identyfikator pokoju, uwierzytelnienie, oferty i odpowiedzi SDP oraz przydział miejsca.

## 3. Sprawdzenie usługi

Po deployu otwórz:

```text
https://belote.qqnd.fyi/api/health
```

Oczekiwana odpowiedź:

```json
{"ok":true,"service":"belote-signaling"}
```

Następnie:

1. Otwórz Belote w dwóch niezależnych przeglądarkach lub urządzeniach.
2. Gospodarz wybiera **Multiplayer online → Utwórz pokój**.
3. Gość wpisuje wyłącznie krótki kod pokoju, nick i ewentualne hasło.
4. SDP/ICE jest wymieniane automatycznie przez Worker — użytkownik nie kopiuje żadnych długich kodów.
5. Gospodarz może wypełnić pozostałe wolne miejsca botami.
6. Po starcie Worker zamyka pokój sygnalizacyjny; bieżąca rozgrywka pozostaje P2P.

## 4. Model bezpieczeństwa i autorytetu

- gospodarz posiada jedyny autorytatywny stan gry;
- goście wysyłają wyłącznie intencje (`bid`, `play`, `next-hand`);
- gospodarz sprawdza turę, legalność karty i parametry akcji;
- stan wysyłany do gościa jest filtrowany dla jego miejsca;
- ręce przeciwników oraz kolejność kart w zapasie nie są wysyłane;
- boty w stole multiplayer działają wyłącznie u gospodarza;
- obiekty WebRTC i dane pokoju nie są zapisywane do lokalnego save'a.

To rozwiązanie jest przeznaczone do prywatnych gier. Gospodarz technicznie zna pełny stan stołu; do rywalizacji odpornej na oszustwa potrzebny byłby zaufany serwer autorytatywny.

## 5. Sieci restrykcyjne

Konfiguracja klienta używa publicznych serwerów STUN. Większość domowych i mobilnych sieci powinna zestawić P2P bez dodatkowej infrastruktury. Sieci z restrykcyjnym NAT/firewallem mogą wymagać w przyszłości serwera TURN.

## 6. Testy

Klient:

```powershell
npm install
npx playwright install chromium
npm run test:multiplayer
npm run test:rules
npm run test:design
```

Worker:

```powershell
cd cloudflare-signaling
npm install
npm run check
npm run test:static
```

Test multiplayera nie wymaga publicznego Workera: korzysta z minimalnych hooków testowych, uruchamia autorytatywnego hosta, symuluje stoły human/bot i sprawdza pełne rozdania oraz filtrowanie ukrytych informacji.
