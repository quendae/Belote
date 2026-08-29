# Belote

**Przeglądarkowa gra w Belote z botami offline oraz prywatnym, host-autorytatywnym multiplayerem WebRTC.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md)

Do grania nie jest wymagany framework ani proces budowania. Główna gra pozostaje w [`belote_offline_single.html`](belote_offline_single.html), multiplayer online jest wydzielony do [`belote_multiplayer.js`](belote_multiplayer.js), a mała opcjonalna usługa sygnalizacyjna znajduje się w [`cloudflare-signaling/`](cloudflare-signaling/).

## Funkcje

- Klasyczne Belote dla czterech graczy w stałych parach: **Północ/Południe kontra Zachód/Wschód**
- Talia 32 kart: **7, 8, 9, 10, walet, dama, król, as**
- Gra offline przeciwko **3 botom**
- Prywatny **multiplayer WebRTC P2P** dla czterech miejsc przy stole
- Dołączanie krótkim kodem pokoju zamiast ręcznego przeklejania SDP/ICE
- Opcjonalne hasło do pokoju
- Stoły hybrydowe: **host + gość/goście online + boty działające u hosta**
- Host-autorytatywne zasady i filtrowanie ukrytych informacji osobno dla każdego miejsca
- Dwa style botów: **Spokojne** i **Sprytne**
- Cele partii: **301, 501 lub 1001 punktów**
- Wbudowany samouczek, ściąga z zasad, dziennik stołu i podgląd ostatniej lewy
- Automatyczny zapis gry offline z opcją **Kontynuuj partię**
- Interfejs po polsku, angielsku i niemiecku
- Klasyczne czerwono-czarne kolory kart lub wariant czterokolorowy
- Opcjonalne dźwięki i animacje
- Responsywny interfejs na komputerze, tablecie i telefonie

Dawny tryb lokalnego multiplayera typu pass-and-play został usunięty. Multiplayer oznacza teraz grę na oddzielnych urządzeniach lub w oddzielnych przeglądarkach połączonych online.

## Gra offline

1. Otwórz [`belote_offline_single.html`](belote_offline_single.html) w aktualnej przeglądarce.
2. Wybierz **Ty + 3 boty**.
3. Ustaw cel punktowy i styl botów.
4. Rozpocznij rozdanie.

Gra z botami pozostaje dostępna bez usługi sygnalizacyjnej, a jej stan jest zapisywany lokalnie.

## Multiplayer online

Rozgrywka online używa modelu **host-authoritative P2P**. Przeglądarka gospodarza uruchamia właściwą symulację: tasuje, posiada jedyny autorytatywny stan gry, sprawdza każdą licytację i zagranie oraz uruchamia boty zajmujące wolne miejsca. Goście wysyłają akcje, a nie zmodyfikowane stany gry.

Każdy gość otrzymuje stan przefiltrowany dla swojego miejsca. Tożsamości kart w rękach przeciwników oraz przyszła kolejność kart w zapasie nie są wysyłane do jego przeglądarki.

### Tworzenie stołu

1. Otwórz **Multiplayer online**.
2. Podaj nick, opcjonalne hasło, cel partii i poziom botów.
3. Wybierz **Utwórz pokój**.
4. Przekaż znajomym krótki kod pokoju.
5. W razie potrzeby wypełnij pozostałe wolne miejsca botami.
6. Rozpocznij grę, gdy wszystkie wymagane miejsca są gotowe. Wymagany jest co najmniej jeden zdalny gracz-człowiek.

### Dołączanie

1. Otwórz **Multiplayer online**.
2. Wpisz nick i kod pokoju.
3. Jeśli gospodarz ustawił hasło, wpisz je również.
4. Wybierz **Dołącz** i zaczekaj w synchronizowanym lobby.

Usługa sygnalizacyjna służy wyłącznie do automatycznej wymiany tymczasowych danych potrzebnych do zestawienia WebRTC. Po otwarciu DataChannel rozgrywka jest przesyłana bezpośrednio pomiędzy przeglądarkami. Gdy gracz rozłączy się podczas partii, obecna wersja wstrzymuje stół zamiast próbować kruchego automatycznego reconnectu.

> Architektura jest przeznaczona do prywatnych, towarzyskich rozgrywek. Host posiada pełny stan gry, więc złośliwy gospodarz technicznie mógłby podejrzeć ukryte karty. Do odpornej na oszustwa gry rankingowej potrzebny byłby zaufany serwer gry.

## Zaimplementowane zasady

Gra używa 32-kartowej talii Belote i czterech stałych miejsc przy stole w dwóch parach.

### Rozdawanie i wybór atu

Każdy gracz otrzymuje najpierw pięć kart. Jedna karta jest odkrywana przed pierwszą rundą licytacji.

- W **pierwszej rundzie** można przyjąć kolor odkrytej karty jako atut albo spasować.
- Jeśli wszyscy spasują, rozpoczyna się **druga runda**, w której można wybrać inny kolor.
- Jeśli ponownie wszyscy spasują, następuje nowe rozdanie.
- Po wyborze atu każdy gracz otrzymuje łącznie osiem kart.

### Rozgrywanie lew

Implementacja pilnuje podstawowych obowiązków Belote:

- trzeba dołożyć do koloru, jeśli jest to możliwe;
- jeśli gracz nie ma koloru wyjścia, a partner nie wygrywa aktualnie lewy, trzeba zagrać atutem, jeśli jest dostępny;
- jeśli lewę wygrywa już atut, należy przebić go wyższym atutem, jeśli to możliwe;
- zwycięzca lewy wychodzi do następnej.

### Kolejność i wartości kart

W atucie: `J > 9 > A > 10 > K > Q > 8 > 7`

Punkty w atucie: J — 20, 9 — 14, A — 11, 10 — 10, K — 4, Q — 3, 8 / 7 — 0.

Poza atutem: `A > 10 > K > Q > J > 9 > 8 > 7`

Punkty poza atutem: A — 11, 10 — 10, K — 4, Q — 3, J — 2, 9 / 8 / 7 — 0.

Ostatnia lewa daje dodatkowe **10 punktów**, więc w zwykłym rozdaniu do zdobycia są łącznie **162 punkty**. Jeśli para, która wybrała atut, nie zdobędzie więcej punktów niż przeciwnicy, kontrakt jest przegrany, a rywale otrzymują **162 punkty** za rozdanie.

## Zapis i prywatność

Partie offline oraz preferencje są zapisywane w `localStorage` przeglądarki. Obiekty aktywnego połączenia i sesji multiplayer nie trafiają do zwykłego slotu zapisu offline.

Backend sygnalizacyjny przechowuje jedynie krótkotrwałe dane pokoju i dane potrzebne do zestawienia WebRTC. Nie zawiera silnika zasad Belote.

## Wdrożenie

Dla multiplayera online serwuj razem:

- `belote_offline_single.html`
- `belote_multiplayer.js`

oraz wdróż Worker z katalogu `cloudflare-signaling/`. Dołączona konfiguracja Wrangler zakłada trasę `belote.qqnd.fyi/api/*`; jeśli gra działa pod inną domeną, zmień tę trasę.

Szczegółowa instrukcja Cloudflare Worker/Durable Object, health check, opis architektury i komendy testowe znajdują się w [`DEPLOY_MULTIPLAYER.md`](DEPLOY_MULTIPLAYER.md).

## Testy

Repozytorium zawiera testy regresyjne Playwright dla produkcyjnych zasad Belote, routingu akcji multiplayer, filtrowania ukrytych informacji, stołów human/bot oraz pełnych rozdań multiplayer. GitHub Actions sprawdza także Worker sygnalizacyjny.

```bash
npm install
npx playwright install chromium
npm run test:multiplayer
npm run test:rules
npm run test:design
```

## Wymagania przeglądarki

Zalecana jest aktualna przeglądarka na komputerze lub urządzeniu mobilnym. Multiplayer online wymaga w produkcji HTTPS, WebRTC, Web Crypto i dostępu do trasy sygnalizacyjnej. Domyślny klient korzysta ze STUN; szczególnie restrykcyjne sieci NAT/firewall mogą w przyszłości wymagać serwera TURN.
