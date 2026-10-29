# VCF Cleaner / VCF-rensare

A standalone tool for cleaning up, editing and merging contacts in `.vcf` files (vCard 2.1 / 3.0 / 4.0). Open `vcf-rensare.html` in any browser – no installation, no dependencies, no connection needed. **All processing happens 100 % locally in the browser; no data leaves your computer.**

The tool is available in **Swedish** and **English**. The language is detected from the browser, or can be chosen with the switch in the header, via `?lang=sv` / `?lang=en`, or via the paths `/sv/` and `/en/`.

## Live demo (GitHub Pages)

Once this repository is merged to `main`, the tool is published automatically via GitHub Actions:

- English: `https://jfrenil.github.io/vcf-rensare/en/`
- Swedish: `https://jfrenil.github.io/vcf-rensare/sv/`

Everything still runs 100 % locally in the visitor's browser – the page only serves static files, no data is ever uploaded.

---

Ett fristående verktyg för att städa, redigera och slå ihop kontakter i `.vcf`-filer (vCard 2.1 / 3.0 / 4.0). Öppna `vcf-rensare.html` i valfri webbläsare – ingen installation, inga beroenden, ingen uppkoppling. **All bearbetning sker 100 % lokalt i webbläsaren; ingen data lämnar din dator.**

Verktyget finns på **svenska** och **engelska**. Språket väljs automatiskt från webbläsaren, eller via växlaren i sidhuvudet, `?lang=sv` / `?lang=en`, eller sökvägarna `/sv/` och `/en/`.

## Live-demo (GitHub Pages)

När repot mergas till `main` publiceras verktyget automatiskt via GitHub Actions:

- Engelska: `https://jfrenil.github.io/vcf-rensare/en/`
- Svenska: `https://jfrenil.github.io/vcf-rensare/sv/`

Allt körs fortfarande 100 % lokalt i besökarens webbläsare – sidan servar bara statiska filer, ingen data laddas någonsin upp.

## Användning / Usage

1. Öppna `vcf-rensare.html` i webbläsaren (dubbelklicka eller högerklicka → Öppna med).
2. Dra in en eller flera `.vcf`-filer (t.ex. gamla exporter från telefonen).
3. Växla mellan flikarna:
   - **Kontakter** – sök, redigera, markera och flytta oönskade kontakter till papperskorgen.
   - **Föreslagna dubbletter** – grupperade förslag med säkerhetsnivå (Hög/Medel/Låg). Välj själv vilka kort som ska slås ihop och vilken som blir primär. Det finns även en knapp för att automatiskt slå ihop alla grupper med hög säkerhet.
   - **Papperskorg** – återställ eller radera permanent.
4. Exportera resultatet: **Ladda ner renad VCF** eller **Exportera CSV**.

## Funktioner

- Parser för vCard 2.1, 3.0 och 4.0 (vikta rader, quoted-printable, grupperade fält som `item1.TEL`, base64-fält som foton)
- Dubblettsökning med normalisering: `+46 70 123 45 67` = `0701234567` = `00461701234567`, e-post utan skiftläge, namn utan diakriter (`Åsa` = `Asa`)
- Sammanslagning utan dataförlust – unika telefoner, e-poster, adresser m.m. från alla kort i gruppen behålls
- Redigering av namn, telefoner, e-post, organisation, titel och anteckningar
- Papperskorg – inget raderas permanent direkt; efter en sammanslagning ligger originalkorten kvar där
- Export till renad VCF (standardenlig: CRLF, radvikning vid 75 tecken, korrekt escaping) eller CSV

## Säkerhetstips

Spara alltid en säkerhetskopia av din ursprungliga `.vcf` innan du städar – även om verktyget bara arbetar i papperskorgen.

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `vcf-rensare.html` | Själva verktyget (öppnas i webbläsaren) – innehåller både svenska och engelska |
| `index.html` | Omdirigerar till verktyget |
| `sv/index.html` · `en/index.html` | Språkstubbar: omdirigerar till `?lang=sv` / `?lang=en` |
| `exempel-kontakter.vcf` | Exempelfil att prova med – innehåller blandade vCard-versioner och dubbletter |
| `test-vcf-cleaner.js` | Testsvit för kärnlogiken (parser, dubbletter, sammanslagning, export, i18n) |

## Köra testerna

Kräver [Node.js](https://nodejs.org/):

```bash
node test-vcf-cleaner.js
```

Testsviten extraherar automatiskt JavaScript-kärnan ur `vcf-rensare.html`, så verktyget och testerna kan aldrig gå ur synk.

## Licens

MIT
