# Joben: plan de backlinks (12 săptămâni)

Creat: 2026-10-16. Completează secțiunea 3 din `PLAYBOOK.md`. Trackerul este în `backlink-tracker.csv`.

## 1. Punctul de plecare (date OpenSEO, 2026-10-16)

| Indicator | Valoare |
|---|---|
| Backlinks totale | 51 |
| Domenii de referință | 47 |
| Domenii de referință non-spam | 2 (`producthunt.com`, `phshort.com`) |
| Spam score al backlink-urilor | 56 |
| Evoluție | 295 backlinks în feb. 2026, 59 în mar. 2026 (238 pierdute), 44 în sept. 2026 |

Citire: aproape toate cele 47 de domenii sunt filtrate ca spam de furnizor. Profilul real de autoritate este practic gol, deci nu avem ce pierde dacă greșim și avem mult de câștigat dintr-un număr mic de linkuri bune. Scăderea din martie arată linkuri de calitate slabă care au dispărut singure.

De făcut o dată: în Search Console, la Links, verifică „Top linking sites”. Nu face disavow decât dacă există o acțiune manuală sau un val clar de linkuri toxice. Google ignoră de regulă linkurile spam.

## 2. Principii

1. Puține linkuri bune. Un domeniu relevant (carieră, joburi, studenți, startup-uri RO) valorează mai mult decât zece directoare slabe.
2. Fiecare cerere de link vine cu ceva util: o resursă gratuită, date sau un articol.
3. Fără linkuri cumpărate, rețele private de bloguri, schimburi în masă sau anchor exact repetat. Politicile Google le tratează ca spam și un domeniu nou nu își permite penalizarea.
4. Mențiunile fără link contează și ele (citări în AI și în căutare), deci le numărăm separat.
5. Verificăm condițiile fiecărei platforme în ziua trimiterii. Informațiile despre directoare se schimbă; ce e marcat „de verificat” mai jos nu a fost confirmat.

## 3. Active pe care le putem oferi (deja în producție)

| Activ | URL | De ce atrage linkuri |
|---|---|---|
| Scaner ATS gratuit, fără cont | `/ro/free-ats-checker`, `/en/free-ats-checker` | Instrument util, ușor de recomandat într-un articol |
| Șabloane CV gratuite DOCX (3 stiluri, RO + EN) | `/ro/sabloane-cv`, `/en/cv-templates` | Resursă descărcabilă, cerută de universități și bloguri |
| Ghiduri (32), glosar (26), comparații (3) | `/ro/ghiduri`, `/ro/glosar`, `/en/guides` | Conținut citabil, cu răspuns direct la început |
| Pagini de rol (54) | `/ro/resume-examples/...` | Resurse de nișă pentru fiecare meserie |

**Activ viitor, cel mai puternic:** raportul „Starea CV-urilor în România”, din date agregate și anonimizate din scanări. Se publică doar când sunt peste ~500 de scanări reale. Pregătire: o interogare agregată pe `anonymous_scans` (procent de CV-uri cu coloane, fără contact în corp, PDF din imagine, scor mediu pe categorii). Nu se publică nimic care identifică persoane.

## 4. Calendar (12 săptămâni, ~3-4 ore pe săptămână)

**Săptămânile 1-2: fundația**
- [ ] Actualizează profilele existente (LinkedIn company page, Instagram, Facebook, Product Hunt) cu linkul către `/ro` și o descriere coerentă (textele din secțiunea 6).
- [ ] Trimite Joben la 5-6 directoare de unelte AI/SaaS, bine completate (vezi lista din secțiunea 5.1).
- [ ] Creează profil de companie Crunchbase (verifică ce informații cere și dacă e gratuit) și, dacă ai cod public, o organizație GitHub cu linkul în profil.
- [ ] Adaugă linkul către site în bio-ul contului tău personal de LinkedIn și în pagina de experiență.

**Săptămânile 3-4: resurse către universități**
- [ ] Lista de 10 centre de carieră (secțiunea 5.3). Verifică pe site-ul fiecăruia numele persoanei de contact.
- [ ] Trimite 5 mesaje (șablonul A din secțiunea 6) cu linkul către șabloane și scaner. Cere explicit: o mențiune în pagina de resurse pentru studenți sau în newsletter.
- [ ] Propune un workshop online de 45 de minute „CV pentru ATS” (fără cost), care generează de obicei o pagină de eveniment cu link.

**Săptămânile 5-6: articole și presă**
- [ ] Alege 8 bloguri și publicații (secțiunea 5.2). Verifică pagina de contact și dacă acceptă articole de la invitați.
- [ ] Trimite 4 propuneri de articol (șablonul B), fiecare cu un unghi diferit: „de ce îți respinge ATS-ul CV-ul”, „CV fără experiență”, „ce spune un scanner despre 100 de CV-uri” (doar când ai date).
- [ ] Scrie un articol complet pentru fiecare propunere acceptată, cu linkul în biografia autorului sau în text, dacă politica publicației o permite.

**Săptămânile 7-8: comunități**
- [ ] Participă util pe r/Romania, r/romania_ro, r/resumes și r/cscareerquestionsEU, în fire în care există întrebări despre CV și ATS. Răspunde complet, fără link, în primele 2 săptămâni. Linkul apare doar când este relevant și cu disclosure (șablonul C).
- [ ] Respectă regulile fiecărei comunități; multe interzic autopromovarea. Citește regulile înainte de orice postare.
- [ ] Notează în tracker mențiunile fără link.

**Săptămânile 9-10: parteneriate**
- [ ] 3 bootcamp-uri sau programe de formare (secțiunea 5.4): propune o resursă comună (șablon de CV pentru absolvenți) cu link către pagina de șabloane.
- [ ] 2 newslettere de carieră sau de startup-uri, cu o ofertă de conținut exclusiv (de exemplu o listă de greșeli frecvente din scanări).

**Săptămânile 11-12: măsurare și ajustare**
- [ ] Reia raportul OpenSEO de backlinks și compară cu valorile din secțiunea 1.
- [ ] Reia verificarea de vizibilitate AI (prompturi RO/EN) ca să vezi dacă mențiunile noi apar în răspunsuri.
- [ ] Oprește ce nu a produs nimic după 2 încercări și dublează ce a funcționat.

## 5. Ținte

### 5.1 Directoare de unelte (fiecare completat integral: descriere, categorii, capturi, link)

Notă: o analiză a 341 de directoare a găsit că doar o parte au trimitere reală fără cont, iar altele nu acceptă toate tipurile de produse. Cinci-șase trimise bine valorează mai mult decât cincizeci trimise superficial.

| Ținta | Ce se știe | Stare |
|---|---|---|
| Product Hunt | Profil existent pentru Joben, linkul apare deja în OpenSEO | Actualizează descrierea și pregătește o lansare sau un update cu scanerul și șabloanele |
| There's An AI For That | Sursele din research indică trimitere gratuită și link dofollow, plus opțiune plătită de grăbire | De verificat pe pagina curentă de submit |
| FutureTools | Sursele indică trimitere gratuită, linkuri nofollow | De verificat; valoare mai ales de descoperire |
| AI Tools Directory | Trimitere gratuită cu upgrade-uri plătite | De verificat; nu plăti upgrade-ul |
| AlternativeTo | Nu a fost confirmat în research | De verificat, util pentru „alternative la Zety/Resume.io” |
| SaaSHub | Nu a fost confirmat în research | De verificat |

### 5.2 Publicații și bloguri (RO)

Niciuna nu a fost confirmată ca acceptând articole de la invitați. Verifică „Contact”, „Colaborează” sau „Scrie pentru noi” pe fiecare, înainte de mesaj.

- Hipo.ro, Undelucram.ro: au resurse despre CV; verifică dacă există pagini care pot adăuga o resursă externă.
- StartupCafe.ro, Wall-Street.ro, Business Review, Economica.net, Ziarul Financiar (secțiunea de startup-uri): presă de business și startup-uri.
- Bloguri de carieră și HR: caută „blog recrutare România”, „blog carieră România” și alege cele active în ultimele 3 luni.

### 5.3 Universități și centre de carieră (RO)

Politehnica București, Universitatea Babeș-Bolyai (Cluj), Universitatea „Alexandru Ioan Cuza” (Iași), ASE București, Universitatea de Vest din Timișoara, Universitatea din București, Universitatea Tehnică din Cluj-Napoca. UBB are un centru de carieră cu pagini de resurse pe domeniul `ubbcluj.ro`. Cere: o mențiune în pagina de resurse pentru studenți și un slot într-un eveniment.

### 5.4 Bootcamp-uri și programe

Alege 3 programe active (IT și non-IT) din București, Cluj și online. Oferă șablonul de student și ghidul de portofoliu pentru dezvoltatori ca resursă pentru absolvenți.

### 5.5 Comunități

r/Romania, r/romania_ro, r/resumes, r/cscareerquestionsEU, grupuri de joburi pe Facebook și LinkedIn, comunități de dezvoltatori. Doar contribuții reale.

## 6. Texte pregătite

### Descriere scurtă (directoare, 140 caractere)
- RO: Scanează gratuit un CV și află cum îl citește un ATS: scor de la 0 la 100 și punctele de reparat, fără cont. Plus șabloane de CV și constructor cu AI.
- EN: Scan a resume for free and see how an ATS reads it: a 0 to 100 score and the points to fix, no account. Plus CV templates and an AI builder.

### Descriere lungă (directoare, ~100 cuvinte)
- RO: Joben este un constructor de CV și scrisori de intenție cu AI, creat pentru piața din România și UE. Scanerul ATS gratuit îți arată în câteva secunde cum citește un sistem de recrutare fișierul tău și ce trebuie reparat. Editorul folosește un șablon pe o singură coloană, cu text selectabil, iar AI-ul ajută la formularea punctelor și la adaptarea CV-ului la un anunț. Site-ul oferă ghiduri, exemple pe meserii și șabloane DOCX gratuite, în română și engleză. Există un plan gratuit; planurile plătite sunt afișate pe pagina de prețuri.
- EN: Joben is an AI resume and cover letter builder made for the Romanian and EU market. The free ATS scan shows you in seconds how a recruiting system reads your file and what to fix. The editor uses a single-column template with selectable text, and the AI helps phrase bullets and tailor a resume to a posting. The site offers guides, examples by trade and free DOCX templates, in Romanian and English. There is a free plan; paid plans are shown on the pricing page.

### Șablon A: mesaj către un centru de carieră
> Bună ziua, [Nume]. Sunt [numele tău] de la Joben. Am pregătit șabloane de CV gratuite (DOCX, pe o coloană, în română și engleză) și un scaner gratuit care arată cum citește un ATS un CV. Cred că sunt utile studenților dumneavoastră: [link către /sabloane-cv]. Ați putea să le menționați în pagina de resurse sau în newsletterul pentru studenți? Pot susține și un workshop online de 45 de minute despre CV pentru ATS, fără cost.

### Șablon B: propunere de articol
> Bună, [Nume]. Citesc [publicația] și mi-a plăcut [articol concret]. Propun un articol despre [unghi], cu exemple concrete și o listă de verificare pentru cititori. Nu cer nimic în schimb în afară de o biografie de autor cu link. Pot trimite un rezumat și structura. Dacă articolul nu se potrivește, spune-mi ce subiecte vă lipsesc.

### Șablon C: disclosure pe Reddit sau în comunități
> Răspuns complet la întrebarea ta, apoi la final: „Lucrez la Joben, care are un scaner ATS gratuit; îl menționez doar pentru că întrebi despre verificarea CV-ului. Poți ignora linkul: [link].”

### Șablon D: mesaj către un blog pentru adăugarea unei resurse
> Bună, [Nume]. Am citit [pagina]. Avem o resursă care s-ar potrivi cu [secțiune]: șabloane de CV gratuite, optimizate pentru ATS, în română și engleză: [link]. Dacă vi se pare utilă, o puteți adăuga. Mulțumesc pentru timp.

## 7. Tracker

Fișier: `docs/seo/backlink-tracker.csv`. Coloane: ținta, tip, URL, persoana de contact, data trimiterii, stare (de trimis, trimis, răspuns, publicat, respins), link obținut (da/nu), tip link (dofollow/nofollow/mențiune), URL-ul linkului, note.

## 8. KPI

| Indicator | Ținta la 12 săptămâni |
|---|---|
| Domenii de referință non-spam | 10-15 (acum 2) |
| Directoare completate | 5-6 |
| Centre de carieră cu răspuns | 3 |
| Articole publicate cu link | 2 |
| Mențiuni fără link | 5 |
| Trafic de referral în GA4 din aceste surse | măsurat, fără țintă fixă |

Ritmul este modest dintr-un motiv: un domeniu nou câștigă autoritate prin câteva surse relevante.
