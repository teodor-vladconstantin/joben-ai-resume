# DPIA light: procesarea CV-urilor cu AI

Data: 2026-11-06. [DE VERIFICAT DE AVOCAT] Decizia de mai jos.

## Este necesară o DPIA completă (art. 35)?
Criterii uzuale ale ghidurilor WP248/ANSPDCP: evaluare/scoring, decizii automate cu efecte, date sensibile, scară mare, grupuri vulnerabile, tehnologii noi, combinări de seturi, împiedicarea exercitării drepturilor.
- **Evaluare/scoring:** da (scor ATS), dar orientativ, fără efecte juridice, nu este trimis angajatorilor.
- **Tehnologie nouă:** da (LLM terț).
- **Scară mare / date sensibile / minori / monitorizare sistematică:** nu în prezent (volum mic; categorii speciale descurajate în politică; 16+; analitice doar cu consimțământ).
- **Decizii automate (art. 22):** nu.

**Decizie:** o DPIA completă nu este obligatorie acum (sub două criterii substanțiale cumulate cu risc ridicat). Se face totuși această evaluare ușoară și se reexaminează dacă: volumul devine mare, se adaugă filtrare pentru recruiteri, se procesează date speciale intenționat sau se trimit date către alți furnizori AI.

## Riscuri și măsuri
| Risc | Probabilitate | Impact | Măsuri existente | Măsuri propuse |
|---|---|---|---|---|
| CV complet (nume, telefon, adresă) ajunge la furnizorul AI în SUA | sigură | mediu | DPA/SCC, fără antrenare, retenție 30 zile, nu se trimit datele de cont | anonimizare opțională a contactului (M2), ZDR dacă e disponibil, regiune UE Supabase |
| Date speciale incluse accidental | medie | mare | avertisment în politică, consimțământ explicit art. 9(2)(a), ștergere la cerere | detectare simplă de cuvinte-cheie sensibile în UI (opțional) |
| Acces neautorizat la CV | scăzută | mare | autorizare `user_id` pe toate rutele, RLS, rate limiting, reverificare Clerk la ștergere | test automat de izolare între useri (M7) |
| Scurgere prin loguri/Sentry | scăzută | mediu | body Sentry eliminat, cookie/headere eliminate, loguri parser fără nume | revizuire periodică |
| Scor înșelător luat drept decizie | medie | scăzut | notă AI în UI, politică art. 22 | notă și în alte funcții AI |
| Păstrare excesivă | scăzută | scăzut | cron retenție, conturi inactive 24 luni | confirmare rulare cron (secrete) |

Concluzie: risc rezidual **acceptabil** cu măsurile existente; măsurile propuse în ordinea efortului în CHECKLIST.md.
