# Cum publici o schimbare legală (și notifici toți utilizatorii)

Automatizarea trimite un email fiecărui utilizator o singură dată când se schimbă Termenii, Politica de Confidențialitate sau Politica de Cookie-uri, și le cere reacceptarea la următoarea autentificare.

## Pași
1. Modifică textul în `messages/ro.json` și `messages/en.json` (și actualizează `lastUpdated`).
2. În `src/lib/legal/versions.ts` adaugă **în capul listei** `LEGAL_CHANGELOG` o intrare nouă: `version` (data ISO), `notify: true` și lista scurtă a modificărilor în română și engleză. `LEGAL_VERSION` se calculează singur din prima intrare.
3. Fă merge în `main`.

## Ce se întâmplă după merge
- **Reacceptare:** utilizatorii autentificați a căror versiune acceptată diferă văd dialogul din `TermsReacceptance` (nu apare în Setări, ca să poată exporta sau șterge datele). Acceptarea se salvează în `users` și în `legal_acceptances`.
- **Email:** workflow-ul `.github/workflows/legal-change-notice.yml` rulează la fiecare push care atinge `versions.ts` (după ~6 minute, ca deploy-ul să fie gata) și zilnic la 11:00 UTC. Apelează `POST /api/cron/legal-change-notice`, care trimite în loturi de 20 emailuri către toți utilizatorii cu email care nu au acceptat deja versiunea nouă și nu au primit-o încă. Fiecare trimitere se înregistrează în `legal_notice_deliveries`, deci nimeni nu primește emailul de două ori, iar un eșec se reia la următoarea rulare.
- Emailul este un anunț despre contract: se trimite și adreselor dezabonate de la marketing, în limba contului (RO implicit), cu lista modificărilor și link către Termeni.

## Verificare înainte de merge
- Rulează o numărare fără trimitere: `POST /api/cron/legal-change-notice?dryRun=true` cu `Authorization: Bearer <CRON_SECRET>` (workflow dispatch nu are dryRun; folosește `curl`).
- `notify: false` înregistrează versiunea fără să trimită emailuri.

## Limite
- Nu trimite către vizitatori fără cont (lead-uri de template, scanări anonime): ei nu sunt părți la contractul de cont.
- Dacă schimbarea e doar o corectură de scriere, nu adăuga intrare nouă.
