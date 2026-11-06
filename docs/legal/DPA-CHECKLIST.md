# Checklist DPA cu procesatorii (acțiune manuală)

Pentru fiecare: (1) DPA acceptat/semnat și arhivat, (2) mecanism de transfer (DPF/SCC), (3) lista subprocesatorilor, (4) regiune setată, (5) notificare incident. Bifează și notează data.

| Procesator | DPA | Cum se obține | Regiune/transfer de verificat | Stare |
|---|---|---|---|---|
| Anthropic | Commercial Terms + DPA | Console / termenii comerciali | SUA; verifică ZDR și dacă modelul folosit e "covered" | [ ] |
| Supabase | DPA | dashboard org > Legal / supabase.com/legal/dpa | proiect în us-east-1; vezi SUPABASE-EU-MIGRATION.md | [ ] |
| Clerk | DPA | clerk.com/legal/dpa | SUA, DPF | [ ] |
| Stripe | DPA incorporat în Services Agreement | Dashboard > Settings > Compliance | rol dublu (procesator + operator) | [ ] |
| Resend | DPA | resend.com/legal/dpa | regiune cont (SUA/UE) | [ ] |
| Upstash | DPA | upstash.com/trust | alege regiune UE pentru Redis | [ ] |
| Vercel | DPA | vercel.com/legal/dpa | funcții în regiune UE (fra1) dacă e posibil | [ ] |
| Oracle Cloud (VPS) | DPA | contract OCI | regiunea VPS, retenția fișierelor temporare | [ ] |
| Sentry | DPA | sentry.io/legal/dpa | instanța UE | [ ] |
| PostHog | DPA | posthog.com/dpa | instanța UE | [ ] |
| Google (GA4/GTM) | Data Processing Terms | Admin GA4 > Data collection | retenție 14 luni, anonimizare IP | [ ] |
| Contabil | acord de confidențialitate/DPA | cu contabilul | acces la facturi | [ ] |

Arhivă recomandată: folder privat `legal/dpa/` în afara repo-ului, cu PDF și data acceptării.
