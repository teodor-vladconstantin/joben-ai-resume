# Procedură: incident de securitate cu date personale

Bazată pe GDPR art. 33-34. Notificarea către ANSPDCP se face fără întârzieri nejustificate și, dacă este posibil, **în 72 de ore** de la luarea la cunoștință, cu excepția cazului în care este improbabil să genereze risc. Verifică formularul curent și canalul de notificare pe dataprotection.ro (nu am verificat portalul de notificare). [DE VERIFICAT DE AVOCAT]

## Primele 72 de ore
| Moment | Acțiune | Responsabil |
|---|---|---|
| T+0 | Înregistrează ora la care ai aflat. Deschide un jurnal de incident (ce, când, cine, ce date). | Owner |
| T+0-2h | **Conține:** revocă chei/tokenuri expuse (Supabase service role, Clerk, Stripe, Resend, Anthropic, Upstash, `IP_HASH_SECRET`), blochează accesul, ia snapshot de dovezi (loguri Vercel, Sentry, Supabase). | Owner |
| T+2-12h | **Evaluează:** ce categorii de date (CV, email, plată), câte persoane, dacă datele erau criptate/accesibile, risc pentru persoane (fraudă, furt de identitate). | Owner |
| T+12-48h | **Decide** notificarea: risc probabil → ANSPDCP; risc ridicat → și persoanele afectate. Documentează decizia chiar dacă nu notifici (art. 33(5)). | Owner + avocat |
| ≤ T+72h | Notifică ANSPDCP (natura încălcării, categorii și număr aproximativ, contact, consecințe, măsuri). Poți completa în etape. | Owner |
| fără întârziere | Dacă risc ridicat, anunță utilizatorii pe email (limbaj clar, ce s-a întâmplat, ce date, ce să facă, contact privacy@joben.eu). | Owner |
| după | Notifică procesatorul/clientul relevant (dacă incidentul e la un furnizor, el trebuie să te anunțe fără întârziere; verifică DPA). Remediază, post-mortem, actualizează ROPA/DPIA. | Owner |

## Șablon notificare utilizatori (RO)
Subiect: Incident de securitate care îți poate afecta datele.
Corp: Am aflat la [data, ora] că [descriere scurtă]. Au fost afectate [categorii de date]. Nu au fost afectate [ce nu a fost]. Am făcut: [măsuri]. Îți recomandăm: [acțiuni, ex. schimbă parola, atenție la phishing]. Întrebări: privacy@joben.eu. Putem fi contactați și pentru plângeri la ANSPDCP (dataprotection.ro).

## Contacte
ANSPDCP: B-dul G-ral Gheorghe Magheru 28-30, București, anspdcp@dataprotection.ro. Furnizori: vezi /subprocessors.
