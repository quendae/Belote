# Belote — Offline

**Samowystarczalna przeglądarkowa wersja Belote z botami, grą lokalną i bezpośrednim multiplayerem P2P.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md)

Cała gra mieści się w jednym pliku: [`belote_offline_single.html`](belote_offline_single.html). Wystarczy go pobrać i otworzyć w nowoczesnej przeglądarce — bez instalacji i bez procesu budowania.

## Funkcje

- Klasyczne Belote dla czterech graczy w stałych parach: **Północ/Południe kontra Zachód/Wschód**
- Talia 32 kart: **7, 8, 9, 10, walet, dama, król, as**
- Gra przeciwko **3 botom**
- **4 graczy lokalnie** na jednym urządzeniu
- **Multiplayer WebRTC P2P dla 4 graczy** bez dedykowanego serwera gry
- Prywatne pokoje P2P z opcjonalnym hasłem
- Dwa style botów: **Spokojne** i **Sprytne**
- Cele partii: **301, 501 lub 1001 punktów**
- Wbudowany **samouczek** i szybka ściąga z zasad
- Dziennik stołu i podgląd ostatniej lewy
- Automatyczny zapis lokalny oraz opcja **Kontynuuj partię**
- Języki interfejsu: **polski, angielski i niemiecki**
- Klasyczne czerwono-czarne kolory kart lub wariant czterokolorowy
- Opcjonalne dźwięki i animacje kart
- Responsywny interfejs przeglądarkowy

## Jak uruchomić

1. Pobierz [`belote_offline_single.html`](belote_offline_single.html).
2. Otwórz plik w nowoczesnej przeglądarce.
3. Wybierz tryb stołu:
   - **Ty + 3 boty**
   - **4 graczy lokalnie**
   - **Multiplayer P2P**
4. Wybierz cel punktowy partii i rozpocznij rozdanie.

Tryb z botami i gra lokalna działają całkowicie offline po pobraniu pliku.

## Multiplayer P2P

Gra zdalna korzysta z **WebRTC**. Nie ma osobnego serwera Belote: jeden z graczy jest gospodarzem, tasuje karty i pilnuje stanu gry, a każdy gość otrzymuje wyłącznie karty przypisane do swojego miejsca przy stole.

Połączenie konfiguruje się ręcznie:

1. Gospodarz tworzy prywatny pokój i przekazuje kod pokoju.
2. Każdy gość generuje kod dołączenia i wysyła go gospodarzowi przez dowolny komunikator.
3. Gospodarz akceptuje kod i odsyła wygenerowaną odpowiedź.
4. Gość wkleja odpowiedź i nawiązuje połączenie.
5. Po zajęciu wszystkich czterech miejsc można rozpocząć partię.

Pokój może być dodatkowo chroniony hasłem. Do gry zdalnej wymagane jest połączenie z internetem oraz obsługa WebRTC w przeglądarce.

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

W atucie:

`J > 9 > A > 10 > K > Q > 8 > 7`

Punkty w atucie:

- J — 20
- 9 — 14
- A — 11
- 10 — 10
- K — 4
- Q — 3
- 8 / 7 — 0

Poza atutem:

`A > 10 > K > Q > J > 9 > 8 > 7`

Punkty poza atutem:

- A — 11
- 10 — 10
- K — 4
- Q — 3
- J — 2
- 9 / 8 / 7 — 0

Ostatnia lewa daje dodatkowe **10 punktów**, więc w zwykłym rozdaniu do zdobycia są łącznie **162 punkty**.

Jeśli para, która wybrała atut, nie zdobędzie więcej punktów niż przeciwnicy, kontrakt jest przegrany, a rywale otrzymują **162 punkty** za rozdanie.

## Zapis i prywatność

Bieżąca partia oraz ustawienia są zapisywane lokalnie w przeglądarce przy użyciu `localStorage`.

Zapis obejmuje stan gry oraz ustawienia takie jak język, kolory kart, dźwięki i animacje. Wyczyszczenie danych witryny w przeglądarce może usunąć zapis partii.

W trybie P2P dane rozgrywki są przesyłane bezpośrednio między graczami przez WebRTC. Dedykowany serwer gry nie jest wymagany.

## Informacje techniczne

Projekt jest celowo prosty w uruchomieniu i dystrybucji:

- jeden samowystarczalny plik HTML;
- czysty HTML, CSS i JavaScript;
- bez frameworka;
- bez instalowania pakietów;
- bez procesu budowania do samego grania;
- WebRTC do bezpośrednich połączeń multiplayer;
- `localStorage` do zapisu stanu.

## Wymagania przeglądarki

Zalecana jest aktualna przeglądarka na komputerze lub urządzeniu mobilnym. Gra zdalna wymaga dodatkowo obsługi WebRTC oraz Web Crypto.
