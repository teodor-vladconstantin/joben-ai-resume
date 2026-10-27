# Distribuție Joben: stare, decizii și informații adunate

Fișier de context pentru orice instanță Claude Code care lucrează la distribuție. Actualizează secțiunile 1, 8 și 9 la sfârșitul fiecărei sesiuni. Fără secrete aici.

Ultima actualizare: 2026-10-25.

## 1. Obiectiv și constrângeri
- Obiectiv: primii utilizatori plătitori, prin distribuție. Țintă pe săptămână: 20 de scanări ATS începute și 5 înscrieri.
- Timp disponibil: aproximativ 30 de minute pe zi pentru postări, plus aproximativ 5 ore pe săptămână în total (Joben e proiect secundar).
- Public țintă (ipoteză, de validat): studenți și juniori români care aplică la joburi sau internshipuri în engleză.
- Prețuri live: Gratuit 0 RON, Pass Interviu 39 RON (plată unică, 14 zile Pro), Pro 59 RON/lună, Recrutare 299 RON/6 luni.
- Stare comercială: zero plăți reale. Toate `checkout_started` istorice vin din conturile de test ale owner-ului.

## 2. Reguli de comunicare și de proiect
- Limba: română pentru owner, scurt și direct. Fără em dashes, fără contrast de tip „nu X, ci Y”, fără auto-etichetări de tip „ca founder”.
- Nu se automatizează comentarii, like-uri, DM-uri sau cereri de conexiune pe LinkedIn, nici postări pe Reddit sau în grupuri de Facebook. Postarea o face owner-ul, manual. Claude scrie textele.
- **Claude in Chrome nu poate deschide `reddit.com`** („This site is not allowed due to safety restrictions”). Nu căuta ocolișuri. Pentru reguli de comunități: bara laterală a subredditului (citită de owner) sau WebSearch.
- **Contul Reddit `u/dukuconstantin1` este banat (2026-10-25, ban la nivel de cont, văzut deconectat).** Apelul se face la `reddit.com/appeal`. Nu se creează cont nou și nu se evită banul (ban evasion). Planul de Reddit e suspendat până la rezultatul apelului. Reddit rămâne sursă de cercetare doar prin fire citite deconectat și lipite de owner în conversație.
- Orice publicare, trimitere sau schimbare de setări cere acordul explicit al owner-ului pentru acea acțiune.
- Nu citi adrese de email ale utilizatorilor din baza de producție (acțiunea a fost refuzată de sistem).

## 3. Ce e live (PR #43 - #48, mergeuite în `main`)
- `payment_completed` din webhook-ul Stripe doar pentru plăți unice (Pass); abonamentele raportează din `invoice.paid`. `checkout_started` doar din client.
- Poarta de email în `/free-ats-checker`: scorul și prima corecție gratis, restul după email.
- Email ziua 10 pentru cumpărătorii de Pass: `/api/cron/pass-day10` (GitHub Actions zilnic 10:30 UTC). Neverificat pe achiziție reală.
- UTM: `node scripts/utm.mjs <sursa> <id-postare> [cale]` (pe Git Bash pune `MSYS_NO_PATHCONV=1` pentru căi care încep cu `/en`).
- Raport săptămânal pe sursă: `.github/workflows/weekly-report.yml` (luni 07:00 UTC), `scripts/weekly-report.mjs`, `docs/growth/weekly-report.sql`. Trimite emailul la `duku.constantin@gmail.com`. Testat cu succes pe 2026-10-25.
- Sondaj PostHog „Welcome to Joben” (3 întrebări: sursă, intenție, obiectiv), lansat, apare pe `/dashboard`, limba din URL (`override_display_language`).
- `template_downloaded` în PostHog la descărcarea șabloanelor.
- `sign_up` (la primul load al unui cont nou, sub 2 minute) și `generate_lead` (cerere de raport pe email) în `dataLayer`. GTM Version 7 le trimite spre GA4 (publicat 2026-10-25 12:29).

## 4. Identificatori și unde sunt datele
- PostHog: proiect 163757, regiunea EU (`eu.posthog.com`). Interogări prin MCP PostHog (HogQL: `first` și `last` sunt cuvinte rezervate, folosește alte alias-uri).
- GA4: proprietatea `G-PGLHWSE720` (id 430719787), cont Google `duku.constantin@joben.eu` (`authuser=3`). Key events: ats_scan_completed, begin_checkout, plan_cta_click, purchase. Pending: sign_up, generate_lead (se marchează după primele hit-uri).
- GTM: container `GTM-MJ5VPX6J`. **Workspace-ul „Default Workspace” (nr. 6) are 31 de modificări vechi nepublicate care șterg tag-uri live. Nu publica din el.** Lucrează în workspace-uri noi, cu import de container JSON în modul Merge (`docs/gtm/ga4-signup-lead.json`).
- Supabase de producție: `vdgjx...`. Resend: audience „General”, zero broadcasturi; emailurile pleacă din cod (11 tipuri, toate 147 `sent` din `email_events`, 0 eșuate).
- Secrete GitHub setate: `CRON_SECRET`, `PROD_APP_URL`, `RESEND_API_KEY`, `POSTHOG_PERSONAL_API_KEY`. `POSTHOG_API_KEY` e un duplicat neutilizat.

## 5. Informații adunate
### 5.1 Fir r/careerguidance (2026-10-25, postare de discuție, fără link)
Rezultat: 33K vizualizări, 48 de comentarii, 17 voturi, zero trafic măsurat pe site (fără link, regula „No Advertising”).
Teme, după ponderea voturilor:
1. Sarcini în loc de realizări (cel mai votat: 35 de voturi).
2. „AI word salad / AI slop” respins de hiring managers.
3. Greșeli de scriere, formatare inconsecventă, CV-uri prea lungi (9 pagini).
4. Joburi și skill-uri irelevante, prea multe diplome și certificări.
5. Fotografie și date personale (stare civilă, copii, grupă sanguină): dependent de țară. Relevant pentru CV-urile românești.
6. Nivel de limbă: cer CEFR sau scor de examen, nu „very good”.
7. Salut generic în scrisori.
8. „Progressive disclosure”: rolul și valoarea în primele rânduri (comentariu „Top 1%”).
Observație: candidații cred că „AI scanează primul”, iar hiring managerii descriu respingeri după lectura umană. Ipoteză de poziționare: „testul de 10 secunde al unui recruiter” bate „scor ATS”. Evită „AI scrie CV-ul” în mesaje.

### 5.2 Cercetare externă (resume builders)
- Rezi: șablon ATS pe Reddit, apoi SEO pe mai mulți ani, localizare.
- Jobscan: căutare organică, conținut, newsletter, optimizare pentru AI search.
- Teal: recomandări de la utilizatori.
- Product Hunt aduce un vârf, nu creștere constantă. Câteva directoare relevante bat sute de trimiteri spam. Evidențele externe sunt în mare parte auto-raportate.

### 5.3 Directoare gratuite (de verificat înainte de trimitere)
AlternativeTo, SaaSHub, There's An AI For That, Toolify, Indie Hackers, Peerlist, BetaList (așteptare lungă). Text diferit în fiecare listare, linkuri UTM per directoriu. Futurepedia pare plătit.

### 5.4 Șabloane de CV
`/ro/sabloane-cv` și `/en/cv-templates`: 9 vizualizări și 7 vizitatori în 30 de zile. Lista de marketing din șabloane amânată până la 30 de zile de date (prag: peste 20-30 de vizitatori pe lună). Texte legale pregătite pentru politica de confidențialitate (secțiunile 2, 4, 6), neaplicate.

### 5.5 ICP (ipoteză)
Student sau junior de 20-26 de ani din România, aplică la internshipuri sau primul job în engleză, folosește șabloane Canva sau Word, primește puține răspunsuri. Validare: 5 conversații de 15 minute, sondajul din dashboard, răspunsurile de pe Reddit.

## 6. Plan săptămâna 26 oct - 1 nov (30 min pe zi, cont de 8 zile, prudent)
| Zi | Acțiune |
|---|---|
| Lun 26 | Răspunsuri în firul r/careerguidance; 5 comentarii în r/resumes și r/Resume; link în bio; 5 DM (`dm-01…05`) |
| Mar 27 | Postare de discuție în r/programare (RO); 3 comentarii în r/cscareerquestionsEU; 5 DM (`dm-06…10`) |
| Mie 28 | Postare în r/csMajors (EN); 3 comentarii; 5 DM |
| Joi 29 | Fără postare nouă; rezumat al răspunsurilor; 5 DM |
| Vin 30 | Dacă karma peste ~50: postare de continuare în r/SideProject (titlu fără „resume”, cu link). Altfel amânată |
| Sâm 31 | Doar răspunsuri |
| Dum 1 | Revizuire: raportul pe sursă din PostHog |

## 7. Lucruri învățate (gotchas)
- `gh secret set` în `!` nu are terminal: valoarea rămâne goală. Folosește `grep ... | gh secret set NAME` sau `Get-Clipboard | gh secret set NAME`, fără să copiezi altceva între timp (clipboard-ul se suprascrie).
- `!` rulează în bash: pune comenzile PowerShell cu `$` în ghilimele simple.
- Browserul extensiei Claude in Chrome este Brave: Shields blochează GTM și GA, deci Preview-ul GTM nu se poate verifica din el. Folosește un Chrome obișnuit sau un profil fără blocante.
- Playwright MCP nu pornește aici (Chrome lipsește de la calea așteptată).
- `file_upload` din extensie respinge fișiere din repo; conținutul se poate construi ca `File` în pagină din text scris de Claude.
- Un commit împins pe o ramură după merge-ul PR-ului nu ajunge în `main`. Verifică cu `git ls-tree origin/main`.
- Limita ATS checker: o scanare gratuită pe zi pe IP. Nu o ocoli în teste.
- Turnstile (poarta de template-uri): `NEXT_PUBLIC_TURNSTILE_SITE_KEY` și `TURNSTILE_SECRET_KEY` trebuie setate în Vercel Production. Cheia publică se inline-ază la build, deci după setare e nevoie de redeploy. Fără ele, fiecare descărcare eșuează cu „Captcha verification failed". Widgetul cere `joben.eu` și `www.joben.eu` în domeniile permise din Cloudflare.

## 8. De făcut (în ordine)
1. Owner: postează textele de luni și marți (în conversația Claude), notează rezultatele aici (secțiunea 9).
2. După trafic nou: „verifică GA4”, marchează `sign_up` și `generate_lead` ca key events dacă apar.
3. Test sondaj în română pe `/ro/dashboard` cu browser în engleză.
4. Test poartă de email cu un CV cu 2 sau mai multe probleme.
5. Posibile verificări noi în checker, din firul de pe Reddit: titlu și rezumat în primele rânduri, fotografie și date personale, nivel de limbă fără CEFR, lungime.
6. Ghid „CV românesc vs CV internațional” (SEO), după verificarea indexării din GSC.
7. Reclame plătite doar după câteva plăți reale și UTM peste tot.

## 9. Jurnal (adaugă la sfârșit)
| Data | Ce s-a făcut | Rezultat |
|---|---|---|
| 2026-10-24 | Postare de discuție în r/careerguidance | 33K vizualizări, 48 comentarii, zero trafic măsurat |
| 2026-10-25 | PR #43-#48 live, sondaj lansat, GTM Version 7 publicat, raport de luni testat | GA4 nu are încă `sign_up` și `generate_lead` (fără trafic) |
| 2026-10-25 | Postarea din r/careerguidance eliminată de filtrele Reddit, apoi contul `u/dukuconstantin1` banat | Apel de depus. Planul Reddit suspendat; se pivotează pe DM, centre de carieră, Facebook/WhatsApp manual, LinkedIn manual, directoare |
| 2026-10-27 | Descărcările de template-uri au eșuat din deploy-ul PR #58 (aprox. 26 oct, seara) până la fix: cheile Turnstile lipseau din Vercel. Descoperit într-un replay PostHog | Chei adăugate, redeploy făcut, testat manual de owner. Leadurile din interval sunt pierdute. PR #65: eroare clară și raport Sentry când lipsește cheia |
