'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const html = fs.readFileSync(path.join(__dirname, 'vcf-rensare.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('Ingen <script>-tagg hittades i vcf-rensare.html'); process.exit(1); }
const corePath = path.join(os.tmpdir(), 'vcf-core-under-test.js');
fs.writeFileSync(corePath, scriptMatch[1]);
require(corePath);
const V = globalThis.VCFCleaner;
V.setLang('sv');

let passed = 0, failed = 0;
function ok(name, cond, extra) {
  if (cond) { passed++; console.log('  PASS ' + name); }
  else { failed++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}
function eq(name, a, b) { ok(name, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' !== ' + JSON.stringify(b)); }

console.log('== Parser ==');
const vcf1 = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Anna Andersson',
  'N:Andersson;Anna;;;',
  'TEL;TYPE=CELL:+46 70 123 45 67',
  'TEL;TYPE=HOME:08-555 12 34',
  'EMAIL;TYPE=INTERNET:Anna@Example.se',
  'ORG:Acme AB;Utveckling',
  'NOTE:Första raden',
  '  fortsätter här',
  'ADR;TYPE=HOME:;;Storgatan 1;Borås;;411 00;Sverige',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:2.1',
  'FN:Bertil Bertilsson',
  'TEL;CELL;VOICE:0701112233',
  'EMAIL;INTERNET:bertil@example.se',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Cecilia',
  'END:VCARD'
].join('\r\n');
const cards1 = V.parseVCF(vcf1);
eq('antal kort', cards1.length, 3);
ok('vikta rader slås ihop (NOTE)', V.getValues(cards1[0], 'NOTE')[0].indexOf('Första raden fortsätter här') !== -1, V.getValues(cards1[0], 'NOTE')[0]);
eq('FN', V.contactName(cards1[0]), 'Anna Andersson');
eq('telefonantal', V.contactPhones(cards1[0]).length, 2);
eq('epost liten bokstav', V.contactEmails(cards1[0]), ['anna@example.se']);
eq('org', V.contactOrg(cards1[0]), 'Acme AB, Utveckling');
eq('version 2.1', V.contactVersion(cards1[1]), '2.1');
eq('namn utan mellanslag', V.contactName(cards1[2]), 'Cecilia');

console.log('== Parser: quoted-printable + encoding ==');
const vcfQP = [
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N;ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8:Andersson;Ann=C3=A9;;;',
  'FN;ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8:Ann=C3=A9 Andersson',
  'TEL;CELL:0701234567',
  'END:VCARD'
].join('\r\n');
const qp = V.parseVCF(vcfQP);
eq('QP-avkodad FN', V.contactName(qp[0]), 'Ann\u00e9 Andersson');

console.log('== Parser: QP med mjuka radbrytningar ==');
const vcfQPFold = [
  'BEGIN:VCARD',
  'VERSION:2.1',
  'FN;ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8:Ann=C3=A9 Andersson med ett l=C3=A5ngt namn so=',
  'm ska vikas korrekt h=C3=A4r',
  'END:VCARD'
].join('\r\n');
const qpFold = V.parseVCF(vcfQPFold);
eq('QP mjukt bruten rad', V.contactName(qpFold[0]), 'Ann\u00e9 Andersson med ett långt namn som ska vikas korrekt här');

console.log('== Parser: grupp-prefix (item1.TEL) ==');
const vcfGroup = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:David Davidsson',
  'item1.TEL;TYPE=CELL:0739998888',
  'item1.EMAIL:david@example.se',
  'END:VCARD'
].join('\r\n');
const gc = V.parseVCF(vcfGroup);
eq('grupp-prefix telefon', V.contactPhones(gc[0]), ['0739998888']);
eq('grupp-prefix epost', V.contactEmails(gc[0]), ['david@example.se']);

console.log('== Normalisering ==');
eq('telefon normalisering', V.normPhone('+46 70-123 45 67'), '46701234567');
eq('telefon sista 9', V.phoneKey('+46701234567'), '701234567');
eq('telefon samma key olika format', V.phoneKey('+46 70 123 45 67') === V.phoneKey('0701234567'), true);
eq('telefon samma key 0046', V.phoneKey('00461701234567') === V.phoneKey('0701234567'), true);
eq('namn utan diakriter', V.normName('Åsa Öberg Éliz'), 'asa oberg eliz');
eq('kort nummer ger ingen key', V.phoneKey('123'), '');

console.log('== Dubblettmatchning ==');
const mk = (fn, tels, emails, org) => V.parseVCF([
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:' + fn,
  tels.map(t => 'TEL;TYPE=CELL:' + t).join('\r\n'),
  emails.map(e => 'EMAIL:' + e).join('\r\n'),
  org ? 'ORG:' + org : '',
  'END:VCARD'
].filter(Boolean).join('\r\n'))[0];

const a = mk('Anna Andersson', ['0701234567'], ['anna@example.se'], 'Acme');
const a2 = mk('Anna A Andersson', ['+46 70 123 45 67'], ['Anna@Example.SE'], 'Acme');
const b = mk('Bertil Bertilsson', ['0701112233'], ['bertil@example.se']);
const c = mk('Cecilia Carlsson', ['0739999999'], ['cecilia@example.se']);

let s = V.pairScore(V.contactKey(a), V.contactKey(a2));
ok('samma person: hög score', s.score >= 5, 'score=' + s.score);
ok('samma person: orsaker nämner e-post', s.reasons.some(r => r.indexOf('e-post') !== -1));
s = V.pairScore(V.contactKey(a), V.contactKey(b));
ok('olika personer: låg score', s.score < 3, 'score=' + s.score);
s = V.pairScore(V.contactKey(a), V.contactKey(c));
ok('olika personer utan överlapp: noll', s.score === 0, 'score=' + s.score);

console.log('== Dubblettgrupper ==');
const contacts = [a, a2, b, c];
const groups = V.findDuplicateGroups(contacts);
eq('en dubblettgrupp', groups.length, 1);
eq('gruppen innehåller båda', groups[0].contacts.length, 2);
eq('konfidens hög', groups[0].confidence, 'high');

console.log('== Sammanslagning ==');
const m = V.mergeContacts([a, a2]);
const mPhones = V.contactPhones(m);
const mEmails = V.contactEmails(m);
eq('telefon från båda korten', mPhones.length, 2, mPhones.join(','));
eq('båda telefonerna med', mPhones.indexOf('0701234567') !== -1 && mPhones.indexOf('+46 70 123 45 67') !== -1, true);
eq('epost dedup', mEmails.length, 1);
eq('epost normaliserad', mEmails[0], 'anna@example.se');
eq('primärt namn behålls', V.contactName(m), 'Anna Andersson');
eq('N syntetiseras från FN', V.getValues(m, 'N')[0], 'Andersson;Anna');
ok('inget dubblett-TEL', m.props.filter(p => p.name === 'TEL').length === 2);
ok('ORG inte duplicerad', m.props.filter(p => p.name === 'ORG').length === 1);

const cardsWithN = V.parseVCF([
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:Erik Eriksson', 'N:Eriksson;Erik;;;', 'TEL:0701111111', 'END:VCARD',
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:Erik Eriksson', 'TEL:0702222222', 'EMAIL:erik@example.se', 'END:VCARD'
].join('\r\n'));
const mN = V.mergeContacts(cardsWithN);
eq('befintligt N behålls vid merge', V.getValues(mN, 'N')[0], 'Eriksson;Erik;;;');
eq('merge behåller nya fält från båda', V.contactEmails(mN), ['erik@example.se']);
eq('merge behåller båda telefoner', V.contactPhones(mN).length, 2);

console.log('== Serialisering ==');
const out = V.serializeVCF([m, b]);
ok('innehåller BEGIN/END', out.indexOf('BEGIN:VCARD') !== -1 && out.indexOf('END:VCARD') !== -1);
ok('har VERSION:3.0', out.indexOf('VERSION:3.0') !== -1);
ok('CRLF-radbrytningar', out.indexOf('\r\n') !== -1);
const reparsed = V.parseVCF(out);
eq('roundtrip: antal kontakter', reparsed.length, 2);
eq('roundtrip: namn', V.contactName(reparsed[0]), 'Anna Andersson');
eq('roundtrip: telefoner', V.contactPhones(reparsed[0]).length, 2);
eq('roundtrip: syntetiserat N', V.getValues(reparsed[0], 'N')[0], 'Andersson;Anna');

console.log('== Serialisering: strukturerade fält, vikning, specialtecken ==');
const out1 = V.serializeVCF([cards1[0]]);
const rep1 = V.parseVCF(out1);
eq('roundtrip: org strukturerat', V.contactOrg(rep1[0]), 'Acme AB, Utveckling');
eq('roundtrip: ADR-komponenter', V.getValues(rep1[0], 'ADR')[0], ';;Storgatan 1;Borås;;411 00;Sverige');
eq('roundtrip: N', V.getValues(rep1[0], 'N')[0], 'Andersson;Anna;;;');
eq('roundtrip: NOTE vikning', V.getValues(rep1[0], 'NOTE')[0], 'Första raden fortsätter här');

const nlCard = V.parseVCF('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Erik\r\nNOTE:Raden ett\\nRaden två\r\nEND:VCARD')[0];
eq('escaped newline parsas', V.contactNote(nlCard), 'Raden ett\nRaden två');
const outNl = V.serializeVCF([nlCard]);
ok('notering escapas vid export', outNl.indexOf('NOTE:Raden ett\\nRaden två') !== -1, outNl.match(/NOTE:[^\r\n]*/));
eq('notering roundtrip', V.contactNote(V.parseVCF(outNl)[0]), 'Raden ett\nRaden två');

const longName = 'Detta Är Ett Mycket Långt Kontaktnamn Som Absolut Måste Vikas Över Flera Rader För Att Följa Vcard Standarden Korrekt';
const longCard = mk(longName, ['0701234567'], ['x@y.se']);
const outLong = V.serializeVCF([longCard]);
ok('vikta rader börjar med mellanslag', outLong.split('\r\n').some(l => l.charAt(0) === ' '));
const reparsedLong = V.parseVCF(outLong);
eq('vikning roundtrip namn', V.contactName(reparsedLong[0]), longName);

const trashed = V.parseVCF(vcf1)[0];
trashed.trashed = true;
const outTrash = V.serializeVCF([trashed, b]);
eq('papperskorg exporteras inte', V.parseVCF(outTrash).length, 1);

console.log('== CSV ==');
V.setLang('sv');
const csv = V.serializeCSV([cards1[0], b]);
const csvLines = csv.split('\r\n');
eq('csv rubrikrad (sv)', csvLines[0], 'Namn,Förnamn,Efternamn,Telefon,E-post,Organisation,Anteckning');
eq('csv antal rader', csvLines.filter(Boolean).length, 3);
ok('csv citerar fält med komma', csv.indexOf('"Acme AB, Utveckling"') !== -1, csvLines[1]);
ok('csv förnamn/efternamn', csvLines[1].split(',')[1] === 'Anna' && csvLines[1].split(',')[2] === 'Andersson', csvLines[1]);

console.log('== Flerspråkighet (i18n) ==');
V.setLang('en');
eq('språk sätts till en', V.getLang(), 'en');
const gEn = V.findDuplicateGroups(contacts);
ok('engelska orsaker', gEn[0].reasons.some(r => r === 'same phone number') && gEn[0].reasons.some(r => r === 'same email'), gEn[0].reasons.join('|'));
const csvEn = V.serializeCSV([b]).split('\r\n');
eq('csv rubrikrad (en)', csvEn[0], 'Name,First name,Last name,Phone,Email,Organization,Note');
eq('engelsk titel-sträng', V.t('doc_title'), 'VCF Cleaner – tidy up and merge contacts (local)');
eq('engelsk parameteriserad sträng', V.t('stats', 5, 2, 1), '5 contacts · 2 duplicate suggestions · 1 in trash');
V.setLang('sv');
eq('tillbaka till svenska', V.t('doc_title'), 'VCF-rensare – städa och slå ihop kontakter (lokalt)');
eq('parameteriserad sträng (sv)', V.t('toast_loaded', 3, 10), '3 kontakter inlästa (10 totalt).');
const gSv = V.findDuplicateGroups(contacts);
ok('svenska orsaker', gSv[0].reasons.some(r => r === 'samma telefonnummer'), gSv[0].reasons.join('|'));
ok('ordlistor har samma nycklar', JSON.stringify(Object.keys(V.I18N.sv).sort()) === JSON.stringify(Object.keys(V.I18N.en).sort()),
  'nycklar skiljer sig mellan sv och en');

console.log('== Edge cases ==');
eq('tom fil ger inga kort', V.parseVCF('').length, 0);
eq('trasig fil ger inga kort', V.parseVCF('BEGIN:VCARD\r\n').length, 0);
const onlyBegin = V.parseVCF('BEGIN:VCARD\r\nFN:X\r\n');
eq('ofullständigt kort kastas', onlyBegin.length, 0);
const special = mk('O\'Brien, Jr.; Test\\\\Namn', ['0701234567'], ['a@b.se']);
eq('indata: \\\\ avkodas till backslash', V.contactName(special), 'O\'Brien, Jr.; Test\\Namn');
const outSpec = V.serializeVCF([special]);
const repSpec = V.parseVCF(outSpec);
eq('specialtecken roundtrip', V.contactName(repSpec[0]), 'O\'Brien, Jr.; Test\\Namn');

const semi = mk('Komma, Efternamn; Extra', ['0701234567'], ['a@b.se']);
eq('semikolon i FN roundtrip', V.contactName(V.parseVCF(V.serializeVCF([semi]))[0]), 'Komma, Efternamn; Extra');
const many = [];
for (let i = 0; i < 500; i++) many.push(mk('Person ' + i, ['07012345' + String(i % 100).padStart(2, '0')], ['p' + i + '@x.se']));
const t0 = Date.now();
const gMany = V.findDuplicateGroups(many);
const dt = Date.now() - t0;
ok('500 kontakter: grupper hittas på rimlig tid (' + dt + ' ms)', dt < 5000);
eq('rätt antal dubblettgrupper vid 500 kontakter', gMany.length, 100);

console.log('\n' + passed + ' godkända, ' + failed + ' misslyckade');
process.exit(failed ? 1 : 0);
