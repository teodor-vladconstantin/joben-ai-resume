# Întrebări pentru avocat (prioritizate)

## Prioritate 1 (înainte de primii clienți plătitori)
1. **Retragere și conținut digital.** Renunțarea expresă de la Pass (14 zile) este valabilă conform art. 16 din OUG 34/2014? Textul cerut pentru consimțământ și recunoașterea pierderii dreptului este suficient în Stripe `custom_text`? Trebuie confirmare pe suport durabil (email) după plată?
2. **Abonamente fără renunțare.** Pro și Recrutare nu au renunțare la checkout; plata proporțională la retragere este corect formulată? Să adaug renunțarea și acolo?
3. **Funcția de retragere (art. 11¹ OUG 34/2014).** Implementarea (`/withdrawal`, confirmare în doi pași, email de confirmare) respectă cerințele? Este suficient linkul din footer + Settings pentru "vizibil pe interfață"? Se aplică și la achiziția Pass-ului dacă renunțarea nu e valabilă?
4. **Placheta SAL / ANPC.** Ce ordin ANPC se aplică în 2026 (449/2022, 330/2025, 331/2025)? Trebuie placheta în footer și ce conține?
5. **Temeiuri GDPR.** CV-ul complet către Anthropic: art. 6(1)(b) este suficient? Tratamentul datelor speciale incluse accidental (art. 9(2)(a))?

## Prioritate 2
6. **Cookie-uri.** `jb_ref` ca "strict necesar" (30 zile) este acceptabil? Jurnal server-side al consimțământului pentru cookie-uri necesar?
7. **Marketing.** Emailurile către useri cu cont pe baza art. 12(2) L.506/2004 ("produse similare") sunt ok sau cer opt-in separat?
8. **Vârstă.** Declarația "am cel puțin 16 ani" bifată la signup este suficientă fără verificare? Termenii cer 18 ani sau acord legal pentru planuri plătite: validă?
9. **AI Act.** Joben este furnizor sau deployer pentru art. 50(2)? Mențiunea din UI e suficientă?
10. **Social listening.** Stocarea postărilor publice ale terților 90 zile: temei și informare art. 14 (efort disproporționat)?

## Prioritate 3
11. Limitarea răspunderii și clauze potențial abuzive față de consumatori (Termeni secț. 13).
12. Necesitatea unui DPO sau a unui reprezentant, DPIA completă (vezi DPIA.md).
13. Clauze contractuale pentru uzul comercial/agenții de recrutare.
14. Procedura de notificare ANSPDCP (canal, formular) pentru incident.
