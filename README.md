# Månadskalender

Genererar en A4-PDF (liggande) med **nästa månads** kalender och mejlar den till
mig **17:00 UTC den näst sista dagen i månaden**. Körs som ett schemalagt
GitHub Actions-jobb. Mejl skickas via [Resend](https://resend.com).

Ren kalender: svenska veckodagar, ISO-veckonummer, inga egna dagar/helgdagar
(kan läggas på senare).

## Kör lokalt

```bash
npm install

# Förhandsgranska en specifik månad → skriver ./out/kalender-2026-08.pdf, inget mejl
node src/generate.js --month 2026-08 --dry-run

# Testa hela kedjan inkl. mejl (kräver env nedan)
RESEND_API_KEY=... MAIL_TO=du@exempel.se node src/generate.js --force
```

| Flagga / env | Betydelse |
|--------------|-----------|
| `--month YYYY-MM` | Rendera en specifik månad (annars nästa månad) |
| `--dry-run` | Skriv PDF till `./out/`, skicka inget mejl |
| `--force` | Ignorera "näst sista dagen"-kollen |
| `--out <path>` | Sökväg för PDF vid dry-run |
| `RESEND_API_KEY` | Resend-nyckel (obligatorisk för mejl) |
| `MAIL_TO` | Mottagaradress |
| `MAIL_FROM` | Avsändare (default `onboarding@resend.dev`) |

## Sätt upp i GitHub

1. Skapa ett repo och pusha den här koden.
2. Skaffa en API-nyckel på [resend.com](https://resend.com) (gratisnivå räcker).
   - Utan egen domän: låt `MAIL_FROM` vara `onboarding@resend.dev`. Resend
     tillåter då att skicka **till din egen verifierade adress** — perfekt för
     ett personligt en-mottagare-jobb.
   - Med egen domän: verifiera den i Resend och sätt `MAIL_FROM` till t.ex.
     `kalender@min-domän.se`.
3. Lägg till repo-secrets (Settings → Secrets and variables → Actions):
   - `RESEND_API_KEY`
   - `MAIL_TO`
   - `MAIL_FROM` (valfri)
4. Testa direkt via **Actions → Månadskalender → Run workflow** (kör oavsett datum).
5. Därefter går det av sig självt 17:00 UTC näst sista dagen varje månad.

### Bra att veta

- **UTC:** 17:00 UTC = 18:00 (vinter) / 19:00 (sommar) svensk tid.
- **60-dagarsregeln:** GitHub pausar schemalagda workflows efter 60 dagars
  inaktivitet i repot – att jobbet *kör* räknas inte, bara pushar. Workflowen
  har därför ett **keepalive-steg**: har det gått 30+ dagar sedan senaste
  commiten skriver den en tidsstämpel till `.github/keepalive` och pushar.
  Eftersom jobbet går varje dag sker det ungefär en gång i månaden, och
  varningsmejlet från GitHub ska aldrig dyka upp igen.
  - Steget har `continue-on-error: true` – om pushen misslyckas skickas
    kalendermejlet ändå, och nästa dag görs ett nytt försök.
  - Kräver att Actions får skriva: **Settings → Actions → General →
    Workflow permissions**. Workflowen begär `contents: write` själv, men står
    repot på *"Read repository contents permission"* kan pushen ändå nekas.
