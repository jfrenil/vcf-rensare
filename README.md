# VCF-rensare

Ett fristående verktyg för att städa, redigera och slå ihop kontakter i `.vcf`-filer (vCard 2.1 / 3.0 / 4.0). Öppna `vcf-rensare.html` i valfri webbläsare – ingen installation, inga beroenden, ingen uppkoppling. **All bearbetning sker 100 % lokalt i webbläsaren; ingen data lämnar din dator.**

## Användning

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
| `vcf-rensare.html` | Själva verktyget (öppnas i webbläsaren) |
| `exempel-kontakter.vcf` | Exempelfil att prova med – innehåller blandade vCard-versioner och dubbletter |
| `test-vcf-cleaner.js` | Testsvit för kärnlogiken (parser, dubbletter, sammanslagning, export) |

## Köra testerna

Kräver [Node.js](https://nodejs.org/):

```bash
node test-vcf-cleaner.js
```

Testsviten extraherar automatiskt JavaScript-kärnan ur `vcf-rensare.html`, så verktyget och testerna kan aldrig gå ur synk.

## Licens

MIT
