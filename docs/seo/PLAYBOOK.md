# Joben: playbook SEO, GEO/AEO, CRO și backlinks

Actualizat: 2026-10-16. Planul-sursă: `~/.claude/plans/breezy-chasing-mist.md`.

## 1. Ce e livrat în cod

| Zonă | Stare |
|---|---|
| hreflang + `x-default` + canonical pe toate paginile publice | `src/lib/locale-alternates.ts` și `guideMetadata`/`hubMetadata` |
| Rute localizate | ghiduri/guides, glosar/glossary, comparatii/compare, scrisoare-intentie/cover-letter (301 de la `/en/scrisoare-intentie/*`) |
| Pagini | 38 roluri, 10 scrisori, 17 ghiduri, 14 termeni de glosar, 3 comparații, 3 hub-uri, toate în ro + en |
| Sitemap | include hub-urile și toate paginile, cu alternates |
| robots | permite Googlebot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended |
| AI discovery | `/llms.txt`, `/llms-en.txt`, `/llms-full.txt`, `/llms-full-en.txt`, `/ai/*.json`, `/.well-known/ai.txt`, markdown pe `Accept: text/markdown` |
| OG per pagină | `opengraph-image.tsx` pe roluri, scrisori, ghiduri, glosar, comparații |
| Analytics CRO | `cta_click` (cta_id, destination), `plan_cta_click` (plan), `pricing_viewed`, plus evenimentele ATS existente |

Adăugarea unei pagini noi: un obiect în `src/data/guides-more*.ts` (ghid), `glossary*.ts`, `comparisons.ts`, `resume-roles-more*.ts` sau `seo-jobs-more.ts`. Pagina, metadata, JSON-LD, sitemap, llms și OG apar automat.

## 2. De făcut de tine (nu poate fi automatizat din cod)

1. **GTM**: adaugă în containerul GTM triggere Custom Event pentru `cta_click`, `plan_cta_click`, `pricing_viewed` și taguri GA4 Event cu parametrii `cta_id`, `destination`, `plan`. Fără ele evenimentele nu ajung în GA4. Marchează `plan_cta_click` ca eveniment cheie.
2. **Search Console**: trimite `https://joben.eu/sitemap.xml` din interfață (API-ul a dat eroare), apoi URL Inspection > Request indexing pe hub-uri: `/ro/ghiduri`, `/en/guides`, `/ro/glosar`, `/en/glossary`, `/ro/comparatii`, `/en/compare`.
3. **IndexNow**: după fiecare deploy cu pagini noi, trimite lista de URL-uri noi (Bing/Copilot/ChatGPT Search se bazează parțial pe indexul Bing).
4. **Bing Webmaster Tools**: importă proprietatea din Search Console.
5. **Social proof**: când ai date reale, adaugă pe homepage numărul de CV-uri scanate (din `anonymous_scans`) și 3-5 citate cu acord scris. Nu publica cifre rotunjite artificial.
6. **Recenzii**: colectează primele 5-10 recenzii reale (Trustpilot, Google Business, Product Hunt). Abia după ele adaugă `AggregateRating` în JSON-LD.

## 3. Backlinks: plan pe 6 luni (5-10 linkuri relevante pe lună)

Principiu: puține linkuri bune, din surse relevante pentru joburi, carieră, studenți și startup-uri din România și UE.

### Luna 1: fundația (linkuri de profil și directoare)
- Product Hunt (profilul există; lansează un produs/update cu un asset concret, de exemplu scanerul ATS gratuit)
- AlternativeTo, SaaSHub, Futurepedia, There's An AI For That, Toolify, Indie Hackers, BetaList
- LinkedIn company page, Facebook page, Instagram: profilele există. Adaugă linkul către `/ro` și `/en` în bio.
- Crunchbase (profil de companie), GitHub organization dacă există cod public

### Luna 2-3: linkable assets
1. **Scanerul ATS gratuit** ca resursă: scrie un articol "Cum verifici dacă ATS-ul îți citește CV-ul" și propune-l către blogurile de carieră.
2. **Raport "Starea CV-urilor în România"**: publică-l doar când ai peste 500 de scanări reale. Agregă anonim: procent de CV-uri cu coloane, fără date de contact în corp, PDF din imagine, scor mediu pe categorii. Datele proprii sunt cel mai bun magnet de linkuri și citări AI.
3. **Șabloane CV descărcabile gratuit** (ATS-safe), cu pagină dedicată (`/cv-templates`, neconstruită încă, intră în backlog). Linkable de universități și bloguri.

### Luna 3-6: relații și presă
- Presă și bloguri RO: Hipo.ro, Undelucram.ro, StartupCafe.ro, Wall-Street.ro, Business Review, Tehnologie/Start-up din Digi24 și Economica.net. Pitch cu date din raport.
- Universități și centre de carieră: Politehnica București, UBB Cluj, UAIC Iași, ASE, UVT Timișoara. Propune un workshop gratuit "CV pentru ATS" și o pagină de resurse cu link către ghiduri.
- Comunități: r/Romania, r/romania_ro, r/resumes, r/cscareerquestionsEU, grupuri Facebook de joburi, comunități Discord de dev. Doar contribuții reale, cu disclosure, în linie cu sistemul de social listening existent.
- Parteneriate: bootcamp-uri (Cluj, București), comunități de freelanceri, newslettere de carieră.
- Digital PR: răspunsuri la cereri de experți (Qwoted, Featured, Help a B2B Writer).

### Ce evităm
PBN-uri, pachete de linkuri plătite, schimburi reciproce în masă, anchor exact repetat, comentarii spam. Câteva linkuri de calitate slabă pot afecta un domeniu nou.

### Șabloane de outreach

**RO, către un blog de carieră**
> Bună, [Nume]. Am citit articolul [titlu] și mi-a plăcut ideea cu [detaliu concret]. La Joben am construit un scaner ATS gratuit, fără cont, care arată în 20 de secunde ce probleme de format are un CV. Dacă ți se pare util cititorilor, îl poți menționa ca resursă la secțiunea despre ATS: [link]. Pot trimite și date agregate din scanări, dacă te ajută la articol.

**EN, către un newsletter sau blog**
> Hi [Name], I enjoyed [article] and especially [specific detail]. We built a free ATS checker (no account) that shows in about 20 seconds what formatting issues a resume has. If it fits your readers, it could be a useful resource next to your section on ATS: [link]. Happy to share aggregated scan data if it helps your piece.

## 4. GEO/AEO: monitorizare și actualizare

- **Lunar**: rulează `run_ai_visibility_check` (OpenSEO) cu 20 de prompturi RO și 20 EN: "cel mai bun scaner ATS gratuit", "cum scriu un CV fără experiență", "model scrisoare de intenție contabil", "free ATS resume checker", "Zety alternative". Notează în ce prompturi apare Joben și ce surse sunt citate.
- **Referrer-e AI în GA4**: segment pe sursele chatgpt.com, perplexity.ai, copilot.microsoft.com, gemini.google.com, claude.ai.
- **Reîmprospătare conținut**: ghidurile se actualizează la 90 de zile (bump `dateModified`), pentru că actualitatea contează pentru sistemele de răspuns.
- **Format care se citează**: răspuns direct de 40-60 de cuvinte sub H1, H2 sub formă de întrebare, liste și tabele, FAQ cu răspunsuri complete. Toate paginile noi respectă formatul.
- **Prezență terță**: mențiunile pe Reddit, LinkedIn, Product Hunt și liste "best of" cântăresc mult în citările AI. Ținta: 10 mențiuni neutre sau pozitive în 90 de zile.

## 5. CRO: experimente în ordine

Rulează unul la un moment dat, minimum 2 săptămâni sau 500 de vizitatori pe variantă, cu PostHog feature flags.

| # | Experiment | Metrică primară |
|---|---|---|
| 1 | Hero: CTA "Scanează CV-ul gratuit" vs "Construiește CV-ul" | `cta_click` home_hero, apoi `ats_scan_started` |
| 2 | Scaner inline pe homepage (încărcare fișier în hero) vs buton spre pagină | rata de scanări pe vizitator |
| 3 | Pricing: Interview Pass (39 RON) evidențiat vs Pro (59 RON) evidențiat | `plan_cta_click` și `begin_checkout` |
| 4 | Pagini de rol/ghid: CTA scaner deasupra vs dedesubtul conținutului | `cta_click` pe `*_ats_cta` |
| 5 | Social proof sub hero (număr real de scanări) | rata de scanări |
| 6 | Email după scanare: subiect cu scorul vs fără | rata de deschidere, `signup_started_from_ats` |

Funnel de urmărit în GA4/PostHog: pagină SEO > `ats_scan_started` > `ats_result_viewed` > `sign_up_started` > `begin_checkout` > `purchase`.

## 6. Backlog de conținut (următoarele pagini)

Făcut în lotul 2 (2026-10-17): ghiduri pentru schimbare de carieră, pauză în carieră, freelancer, CV vs LinkedIn, răspuns la "Povestește-mi despre tine", referințe, scrisoare fără experiență, portofoliu de dezvoltator; roluri: farmacist, inginer mecanic, specialist achiziții, tehnician IT, manager de magazin, arhitect, curier, contabil-șef; glosar: KPI, onboarding, preaviz, headhunter, perioadă de probă, upskilling.

**Ghiduri rămase**: CV pentru medici/asistenți, CV pentru șoferi și curieri, CV pentru muncă în UE, scrisoare pentru schimbare de carieră, cum ceri salariul, CV cu media/GPA, certificări care contează pe domenii, CV pentru ingineri, CV pentru studenți Erasmus.

**Roluri rămase**: electrician, operator date, barista/ospătar, șofer, consultant financiar, grafician motion, project coordinator, analist cibernetic.

**Glosar rămas**: OKR, probation vs trial, reskilling în IT, ATS vs CRM, referral, employer branding.

**Comparații**: Joben vs Zety, Resume.io, Novoresume, Enhancv. Scrie-le doar după ce verifici manual funcțiile și prețurile concurenților din surse publice la data scrierii. Fiecare afirmație despre un concurent trebuie să aibă sursă.

## 7. Cadență

- Săptămânal: 2-3 pagini noi, un outreach, verificare Search Console (interogări noi, pagini cu afișări și fără click).
- Lunar: AI visibility check, raport backlinks (domenii noi), un experiment CRO încheiat.
- Trimestrial: reîmprospătare ghiduri, audit tehnic (Lighthouse, indexare, canonical, hreflang).

KPI-uri la 90 de zile: afișări GSC 10x (acum 902 în 90 de zile), 100+ click-uri, 5+ scanări organice pe zi, 15+ domenii de referință, prezență în cel puțin 5 prompturi AI din cele 40 monitorizate.
