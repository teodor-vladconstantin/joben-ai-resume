# Încadrare AI Act (Reg. (UE) 2024/1689)

Verificat 2026-11-06 (vezi SOURCES.md). Nu este aviz juridic. [DE VERIFICAT DE AVOCAT] la punctele marcate.

## 1. Rolul Joben
- Modelul (Claude, Anthropic) este un model de uz general al unui terț. Joben **nu antrenează si nu modifică substanțial** modelul, deci este în principal **deployer** al unui sistem terț.
- Joben pune pe piață propriul produs (editor CV cu funcții AI) sub nume propriu. Pentru art. 50(2) (marcare machine-readable a continutului sintetic) trebuie evaluat dacă Joben devine **furnizor** al unui sistem care generează text. [DE VERIFICAT DE AVOCAT] Atenuare: art. 50(2) exceptează funcțiile de asistență la editare standard și sistemele care nu modifică substanțial datele de intrare; rescrierea unui text al utilizatorului pentru uzul propriu al utilizatorului se apropie de această exceptie.

## 2. Nivel de risc
- Joben servește **candidatul** (uz personal): scor ATS orientativ, rescriere, scrisori. Nu ia decizii de angajare, nu este trimis angajatorilor, nu are efecte juridice asupra persoanei.
- Nu se încadrează la practici interzise (art. 5). Nu se încadrează la sisteme cu risc ridicat (Anexa III pct. 4: recrutare/selecție/evaluare candidați **de către angajator**).
- Concluzie: **risc limitat**, cu obligații de transparență.

## 3. Ce s-ar schimba dacă produsul ar servi recruiterii
Dacă Joben (sau planul "Recrutare") ar fi folosit de angajatori/recruiteri pentru filtrarea, clasarea sau evaluarea candidaților, sistemul ar intra la **risc ridicat** (Anexa III pct. 4). Ar apărea: sistem de management al riscului, guvernanța datelor, documentație tehnică, jurnalizare, supraveghere umană, informarea persoanelor vizate, evaluare de conformitate. Conform Reg. (UE) 2026/1744, obligațiile pentru sistemele Anexa III se aplică de la **2 decembrie 2027** (Anexa I: 2 august 2028). Planul numit "Recrutare" din Termeni este un abonament de 6 luni pentru candidat; Termenii (secț. 2) interzic uzul comercial fără acord. **Nu lansa funcții de filtrare de candidați fără o reevaluare.**

## 4. Obligații relevante azi
| Obligație | Aplicabilitate | Stare |
|---|---|---|
| Art. 50(1): informare că interacționezi cu AI (sisteme destinate interacțiunii directe) | din 2.08.2026 | Produsul nu este un chatbot; scorurile/rescrierile sunt evident AI. Nota din UI acoperă oricum. |
| Art. 50(2): marcare machine-readable a textului sintetic | 2.08.2026; sisteme deja pe piată înainte: 2.12.2026 (art. 111(4) nou) | Neimplementată. Posibil neaplicabilă (vezi pct. 1). [DE VERIFICAT DE AVOCAT] |
| Art. 50(4): divulgare conținut generat pentru public în probleme de interes public | din 2.08.2026 | Neaplicabil (CV-uri și scrisori private). |
| Art. 4: măsuri de alfabetizare AI (după Reg. 2026/1744: "măsuri de sprijin") | în vigoare | Echipă mică; documentează în ROPA/politici interne. |

## 5. Implementat în UI
- Nota `AiNotice` (messages `AiNotice.text`) deasupra rezultatului analizei AI (`/ai-review/[id]`): scorul și sugestiile sunt generate de AI, orientative, pot conține erori.
- Politica de confidențialitate secț. 3: procesare AI, fără decizii automate cu efecte juridice (art. 22 GDPR), fără antrenare pe CV-uri.
- Nu există încă nota în editorul de scrisori de intenție și în funcția de adaptare la job; se recomandă adăugarea (efort mic) folosind `<AiNotice />`.

## 6. Deschis
- Confirmarea rolului de furnizor/deployer pentru art. 50(2).
- Textul final al art. 4 modificat și orice clauză tranzitorie (nu a fost citit integral).
