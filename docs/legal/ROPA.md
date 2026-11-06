# Registrul activităților de prelucrare (GDPR art. 30)

Operator: TETA ABC SRL (CUI 22404824, J2007001135104). Contact: privacy@joben.eu. Fără DPO desemnat (nu se încadrează în art. 37; [DE VERIFICAT DE AVOCAT]). Actualizat 2026-11-06.

| # | Activitate | Scop | Temei | Persoane vizate | Categorii de date | Destinatari / procesatori | Transfer non-SEE | Retenție |
|---|---|---|---|---|---|---|---|---|
| 1 | Cont și autentificare | creare și securizare cont | art. 6(1)(b) | utilizatori | email, nume, metodă login, limbă | Clerk, Supabase | SUA (DPF/SCC) | cât timp contul este activ; inactiv 24 luni |
| 2 | Continut CV și funcții AI | scor ATS, rescriere, scrisori, import | art. 6(1)(b); art. 9(2)(a) dacă apar date speciale | utilizatori | date de contact, istoric profesional, text liber | Supabase, Anthropic, Oracle (parser) | SUA | cât timp contul este activ |
| 3 | ATS checker fără cont | raport, anti-abuz, legare la cont | art. 6(1)(b), (f); consimțământ pentru follow-up | vizitatori | scor, raport, hash IP, jb_atsdid, email opțional | Supabase, Resend | SUA | 90 zile dacă nerevendicat |
| 4 | Plăți | încasare, contabilitate | art. 6(1)(b), (c) | clienți | id Stripe, plan, coduri promo | Stripe | SUA/UE | 5-10 ani (Legea 82/1991) |
| 5 | Emailuri de serviciu | confirmări, rapoarte, avertizări | art. 6(1)(b) | utilizatori | email, evenimente de trimitere | Resend | SUA | evenimente 12 luni |
| 6 | Emailuri follow-up / produse similare | reamintiri | art. 6(1)(a) (vizitatori), 6(1)(f) + art. 12(2) L.506/2004 (clienți) | vizitatori, utilizatori | email | Resend | SUA | listă de dezabonare cât e necesar |
| 7 | Dovada acceptării termenilor | probă consimțământ | art. 6(1)(f), art. 7(1) | utilizatori | versiune, timestamp, hash IP | Supabase | SUA | cât timp contul există |
| 8 | Retragere din contract | exercitare drept legal | art. 6(1)(c), (f) | consumatori | nume, email, contract, hash IP | Supabase, Resend | SUA | 3 ani |
| 9 | Securitate și diagnostic | rate limiting, erori | art. 6(1)(f); art. 32 | toți | hash IP, id cerere, erori | Upstash, Sentry, Vercel | UE/SUA | ore-1 lună; Sentry ~90 zile |
| 10 | Analitice și replay | înțelegerea produsului | art. 6(1)(a) | vizitatori | evenimente, replay (câmpuri mascate) | PostHog (UE), Google, Sentry Replay | SUA (Google) | PostHog 12 luni/30 zile; GA4 max 14 luni |
| 11 | Recomandări | recompense | art. 6(1)(b), (f) | utilizatori | cod, legătură invitator-invitat | Supabase | SUA | cât timp conturile există |
| 12 | Feedback | răspuns, îmbunătățire | art. 6(1)(f) | utilizatori | email, mesaj | Supabase | SUA | 24 luni |
| 13 | Monitorizare postări publice | identificare discuții relevante | art. 6(1)(f) | terți | postare publică, autor public | Supabase | SUA | 90 zile |

Măsuri tehnice și organizatorice: vezi AUDIT.md §1-§6 (RLS, hash IP cu HMAC, acces prin service role doar server-side, scrub Sentry, retenție automată, export și ștergere self-service). Evidența transferurilor: pagina /subprocessors.
