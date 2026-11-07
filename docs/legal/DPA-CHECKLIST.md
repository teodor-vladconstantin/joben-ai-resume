# Checklist DPA cu procesatorii

Verificat 2026-11-07 pe paginile oficiale ale furnizorilor (citate scurte, fără semnătură necesară acolo unde DPA face parte din termeni). Nu este aviz juridic. Pentru fiecare: DPA incorporat sau acceptat, mecanism de transfer, regiune.

| Procesator | DPA incorporat automat? | Acțiune | Transfer declarat de furnizor | Pagină oficială |
|---|---|---|---|---|
| Anthropic | Da: DPA "incorporated into these Terms by reference" (Commercial Terms §C) | Niciuna. Verifică ZDR și dacă modelul e "covered". | SCC 2021/914 (Module 2/3) | anthropic.com/legal/data-processing-addendum |
| Supabase | Da: face parte din Terms of Service; acceptarea Termenilor are efectul semnării SCC (§12.2) | Niciuna pentru DPA. Importator: Supabase Pte. Ltd. | SCC 2021/914 | supabase.com/legal/dpa |
| Clerk | Da: "incorporated into and forms part of the Agreement" | Niciuna (Termenii Clerk nu au fost citiți integral). | DPF (certificat), SCC ca rezervă | clerk.com/legal/dpa |
| Stripe | Da: incorporat prin referință în acord | Niciuna; Data Transfers Addendum inclus. | DPF, SCC, UK IDTA | stripe.com/legal/dpa |
| Resend | Da, obligatoriu la intrarea în acord; copie executată în dashboard | Descarcă copia din dashboard și arhiveaz-o. | DPF, SCC | resend.com/legal/dpa |
| Vercel | Parțial: DPA vizează planurile Enterprise și Pro; Hobby nu e menționat | Joben este pe Hobby: cere DPA în scris la suport sau treci pe Pro. [DE VERIFICAT DE AVOCAT] | SCC 2021 | vercel.com/legal/dpa |
| Sentry | Nu: acceptare electronică explicită | **Făcut 2026-11-07:** DPA v5.1.0 acceptat în joben.sentry.io > Settings > Legal & Compliance (regiune de stocare UE). | DPF, SCC | sentry.io/legal/dpa |
| PostHog | Nedeterminat (pagina nu a putut fi citită) | Verifică în Settings > Organization sau cere DPA. | De confirmat | posthog.com/dpa |
| Google (GA4 prin GTM) | Nu automat: acceptare prin clic în contul GA4 | **Deja acceptat 2024-04-03** (GA4 Admin > Account settings > Data Processing Terms, cont 308940066). | SCC/alte | business.safety.google |
| Upstash | Nedeterminat (PDF) | Citește trust.upstash.com/dpa și confirmă. | De confirmat | upstash.com/trust/dpa.pdf |
| Oracle Cloud (VPS) | Necitibil (HTTP 403) | Citește OCI DPA în consola Oracle. | De confirmat | oracle.com/legal/data-processing-agreement |
| Contabil | Acord de confidențialitate | Cu contabilul. | n/a | n/a |

Prioritate rămasă: Vercel (Hobby), apoi PostHog, Upstash, Oracle. Arhivă: folder privat `legal/dpa/` în afara repo-ului.
