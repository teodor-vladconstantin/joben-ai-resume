# Postări automate Facebook + Instagram (n8n)

Specificație pentru workflow-ul n8n care publică caruseluri 1:1 (1080x1080) pe Pagina de Facebook și pe contul de Instagram Joben. Nu conține cod de producție: imaginile vin din `GET /api/social/slide` (vezi `src/lib/social-slide.tsx`), iar n8n rulează în afara acestui repo.

## 0. Test obligatoriu înainte de orice: PNG pe Instagram

Documentația Meta pentru Content Publishing spune că **JPEG este singurul format de imagine acceptat**. Endpoint-ul nostru întoarce PNG. Surse terțe susțin că PNG trece, dar nu e garantat.

1. Creezi manual un container IG cu o singură imagine PNG de la endpoint (pasul 5.2, primul apel).
2. Dacă răspunde `id` și `status_code` ajunge `FINISHED`, PNG e acceptat și nu faci nimic.
3. Dacă îl respinge, se adaugă în endpoint un parametru `format=jpg` (conversie PNG→JPEG, probabil cu `sharp`, deja dependență a lui Next, pe runtime Node). Decizia se ia după test.

## 1. Sursa: Google Sheet

Un rând = o postare. Coloane:

| Coloană | Valori | Note |
|---|---|---|
| `data` | `YYYY-MM-DD` | ziua publicării, fusul Europe/Bucharest |
| `platforma` | `fb` \| `ig` \| `both` | |
| `tip` | text liber | etichetă internă (hook, listă etc.) |
| `slide1` … `slide5` | JSON | parametrii endpoint-ului, ex. `{"type":"hook","title":"CV-ul tău este citit în **6 secunde**"}`. Sloturile goale se sar. |
| `caption_fb` | text RO cu diacritice | obligatoriu dacă platforma e `fb`/`both` |
| `caption_ig` | text RO cu diacritice | obligatoriu dacă platforma e `ig`/`both`, max 2200 caractere |
| `status` | `draft` \| `approved` \| `posted` \| `failed` | doar `approved` se publică |

Coloane scrise de workflow: `post_id_fb`, `post_id_ig`, `eroare`, `publicat_la`.

Parametrii unui slide (JSON): `type` (hook, text, list, beforeafter, score, steps, cta), `title`, `body`, `items` (listă de texte), `before`, `after`, `note`, opțional `n` și `total`. `token` NU se pune în Sheet.

## 2. Workflow

```
Schedule 18:50 (Europe/Bucharest)
  -> Google Sheets: citește rândurile
  -> Filter: status = "approved" ȘI data = azi
  -> (pentru fiecare rând) Code: validează + construiește URL-urile
  -> IF platforma in (fb, both) și post_id_fb gol  -> ramura Facebook
  -> IF platforma in (ig, both) și post_id_ig gol  -> ramura Instagram
  -> Google Sheets: scrie ids, status, publicat_la
  -> la orice eroare: scrie status=failed + eroare, trimite notificare
```

- **Timp:** cron `50 18 * * *`, setarea de timezone a workflow-ului pe `Europe/Bucharest`.
- **Zile fără rând approved:** filtrul nu întoarce nimic și workflow-ul se oprește fără efect.
- **Nu se postează nimic cu alt status:** filtrul `status = approved` este primul nod după citire, iar nodul Code re-verifică `status === 'approved'` înainte de orice apel Meta (a doua plasă de siguranță).

### 2.1 Nodul Code: validare + URL-uri

```js
const BASE = 'https://joben.eu/api/social/slide';
const row = $json;
if (row.status !== 'approved') throw new Error('status nu este approved');

const slides = [1, 2, 3, 4, 5]
  .map((i) => row[`slide${i}`])
  .filter((v) => v && String(v).trim())
  .map((v) => JSON.parse(v));
if (slides.length < 2) throw new Error('minim 2 slide-uri');

const urls = slides.map((s, i) => {
  const q = new URLSearchParams({ ...s, n: s.n ?? i + 1, total: s.total ?? slides.length, token: $env.SOCIAL_SLIDE_TOKEN });
  if (s.items && typeof s.items !== 'string') q.set('items', JSON.stringify(s.items));
  return `${BASE}?${q}`;
});

const plat = row.platforma;
if ((plat === 'fb' || plat === 'both') && !row.caption_fb) throw new Error('lipsește caption_fb');
if ((plat === 'ig' || plat === 'both') && !row.caption_ig) throw new Error('lipsește caption_ig');
return { ...row, urls };
```

Un URL de slide invalid întoarce 400 cu motivul în corp; testează-le cu un nod HTTP (GET, fără descărcare) înainte de publicare dacă vrei verificare suplimentară.

## 3. Facebook (Pagina)

Fiecare apel folosește tokenul de pagină. `{V}` = versiunea Graph API (verifică versiunea curentă în changelog-ul Meta și fixează-o în workflow; documentația e în tranziție între v25 și v26).

1. Pentru fiecare URL: `POST https://graph.facebook.com/{V}/{PAGE_ID}/photos` cu `url={URL}`, `published=false`, `access_token`. Răspuns: `{ "id": "<photo_id>" }`. Pozele nepublicate rămân pe serverele Facebook cca. 24 h, deci pasul 2 trebuie să urmeze imediat.
2. `POST https://graph.facebook.com/{V}/{PAGE_ID}/feed` cu `message={caption_fb}`, `attached_media=[{"media_fbid":"<id1>"},{"media_fbid":"<id2>"},…]` (un singur JSON array), `access_token`. Răspuns: `{ "id": "<post_id>" }`, care se scrie în `post_id_fb`.

(Combinația `published=false` + `attached_media` este cea documentată pentru postări multi-foto; verific-o o dată în Graph API Explorer înainte de a porni workflow-ul.)

## 4. Instagram (cont Business/Creator legat de Pagină)

1. Pentru fiecare URL: `POST https://graph.facebook.com/{V}/{IG_USER_ID}/media` cu `image_url={URL}`, `is_carousel_item=true`. Răspuns: container `id`.
2. Containerul de carusel: `POST …/{IG_USER_ID}/media` cu `media_type=CAROUSEL`, `children=<id1>,<id2>,…` (max 10), `caption={caption_ig}`.
3. Așteaptă: `GET …/{container_id}?fields=status_code` până la `FINISHED` (reîncercări la 5 s, maxim 10). `ERROR` sau `EXPIRED` = eșec.
4. Publică: `POST …/{IG_USER_ID}/media_publish` cu `creation_id={container_carusel}`. Răspunsul `id` merge în `post_id_ig`.

## 5. Permisiuni Meta

Necesare:

- `pages_manage_posts` (postare pe Pagină)
- `pages_read_engagement` (citirea Paginii și a tokenului ei)
- `instagram_basic` (acces la contul IG legat)
- `instagram_content_publish` (publicare pe IG)

Probabil necesară în plus: `pages_show_list`, pentru `GET /me/accounts` (obținerea tokenului de pagină). Dacă Pagina e gestionată prin Business Manager poate fi cerută și `business_management`. Confirmă lista în Graph API Explorer: dacă un apel răspunde cu eroare de permisiune, mesajul numește permisiunea lipsă.

Pentru propriile conturi (tu ești admin al aplicației, al Paginii și al contului IG), aplicația poate rămâne în modul Development; App Review este necesar doar pentru conturi străine.

## 6. Pașii de configurare

1. **Cont IG:** convertește-l în Business sau Creator și leagă-l de Pagina Joben (Setări Pagină → Conturi conectate).
2. **Aplicația:** `developers.facebook.com` → Create App (tip Business). Adaugă produsele Facebook Login (for Business) și Instagram. Anotează `APP_ID` și `APP_SECRET`.
3. **Token scurt:** Graph API Explorer → alege aplicația → User Token → bifează permisiunile din §5 → Generate Access Token.
4. **Token lung (≈60 zile):** `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={TOKEN_SCURT}`.
5. **Token de pagină:** cu tokenul lung, `GET /me/accounts` returnează fiecare Pagină cu `id` și `access_token`. Un token de pagină obținut dintr-un token de utilizator de lungă durată nu expiră în mod obișnuit; verifică-l cu `GET /debug_token?input_token={TOKEN_PAGINA}` (câmpul `expires_at` = 0 înseamnă fără expirare).
6. **ID IG:** `GET /{PAGE_ID}?fields=instagram_business_account&access_token={TOKEN_PAGINA}` → `instagram_business_account.id` este `IG_USER_ID`.
7. **n8n:** pune `PAGE_ID`, `IG_USER_ID`, tokenul de pagină și `SOCIAL_SLIDE_TOKEN` în credentials / variabile de mediu n8n (niciodată în Sheet sau în repo). Același `SOCIAL_SLIDE_TOKEN` se setează în Vercel (Production).

## 7. Limite

- **Instagram carusel:** 2–10 imagini (2 este regula noastră, Meta documentează maximul de 10); imaginile se decupează după prima (1:1 la noi); imaginea trebuie la un **URL public** pe care serverele Meta îl pot încărca (endpoint-ul nostru este public, cu token în query).
- **Format:** vezi §0 (JPEG documentat, PNG de testat).
- **Rată:** Meta documentează 50 de postări publicate prin API în 24 h per cont IG; un carusel contează ca o postare. Ne trebuie 1-2 pe zi.
- **Caption IG:** maxim 2200 de caractere, maxim 30 de hashtaguri.
- **Poze FB nepublicate:** se șterg după cca. 24 h dacă nu sunt atașate unei postări.

## 8. Siguranță și idempotență

- **Fără dubluri:** pentru `both`, ramurile rulează independent. Dacă FB reușește și IG eșuează, `post_id_fb` rămâne completat, statusul devine `failed`, iar după ce repari cauza pui din nou `approved`: workflow-ul sare peste platforma care are deja id și publică doar ce lipsește.
- **Eșec = oprire pe rând:** `failed` nu se reîncearcă automat. Notificarea (email sau Telegram, la alegerea ta) conține data, platforma, mesajul Meta și rândul din Sheet.
- **Tokenul de slide** este în URL-uri, deci apare în logurile n8n și în cererile Meta. Este un secret de valoare mică (permite doar generarea de imagini); rotește-l schimbând `SOCIAL_SLIDE_TOKEN` în Vercel și în n8n.
- **Conținut:** workflow-ul nu modifică textele. Caption-urile rămân în română cu diacritice exact cum sunt în Sheet.
