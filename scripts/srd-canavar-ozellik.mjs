/**
 * Kuyruk A İş 4: SRD 5.2.1 canavar stat bloklarından özellik ve eylem listesi (ad İngilizce, tür, sıra) →
 * data/canavar-ozellik.json (elle düzenlenmez). Türkçe açıklamalar `data/aciklamalar-tr.json` `canavar` bölümünde, anahtar
 * `<canavar>/<tür>:<ad-slug>` (tür: trait | action | bonus | reaction | legendary). `--metin <yol>`: İngilizce SRD metinleriyle
 * birlikte ayrı bir dosyaya yazar (yalnız çeviri/denetim için; depoya girmez). Çalıştırma: node scripts/srd-canavar-ozellik.mjs
 */
import fs from 'node:fs';
import { readingLines } from './srd/pdf.mjs';
const HDR = /^((?:Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (?:Tiny|Small|Medium|Large|Huge|Gargantuan))*) (Swarm of (?:Tiny|Small) [A-Z][a-z]+|[A-Z][a-z]+)(?: \(([^)]*)\))?, (.+)$/;
const SECS = { Traits: 'trait', Actions: 'action', 'Bonus Actions': 'bonus', Reactions: 'reaction', 'Legendary Actions': 'legendary' };
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lines = (await readingLines(254, 364)).filter((l) => !/^\d+ System Reference Document/.test(l.text));
const starts = [];
for (let i = 1; i < lines.length - 1; i++) if (HDR.test(lines[i].text) && /^AC \d/.test(lines[i + 1].text)) starts.push(i);
const out = {};
for (let b = 0; b < starts.length; b++) {
  const i = starts[b];
  const end = b + 1 < starts.length ? starts[b + 1] - 1 : lines.length;
  const name = lines[i - 1].text;
  let j = i + 1;
  while (j < end && !/^CR /.test(lines[j].text)) j++;
  j++;
  const ents = [];
  let sec = 'trait', cur = null, intro = { trait: '', action: '', bonus: '', reaction: '', legendary: '' };
  let stop = false;
  for (; j < end && !stop; j++) {
    const l = lines[j];
    let first = true;
    for (let si = 0; si < l.spans.length; si++) {
      const sp = l.spans[si];
      // Ad ile nokta ayrı parça olabilir ("Fire Breath (Recharge 5–6)" + ".", "Lightning Absorption" + ". Whenever…").
      const nx = l.spans[si + 1];
      if (sp.kind === 'bodyBI' && first && !/\.$/.test(sp.text) && nx && /^\./.test(nx.text)) {
        cur = { kind: sec, name: sp.text, text: '' };
        ents.push(cur);
        nx.text = nx.text.replace(/^\.\s*/, '');
        first = false;
        continue;
      }
      if (SECS[sp.text] && !sp.kind.startsWith('body')) { sec = SECS[sp.text]; cur = null; first = true; continue; }
      if (['h14', 'h18', 'h26'].includes(sp.kind)) { stop = true; break; }
      if (sp.kind === 'bodyBI' && /\.$/.test(sp.text) && first) {
        cur = { kind: sec, name: sp.text.replace(/\.$/, ''), text: '' };
        ents.push(cur);
      } else if (cur) cur.text += ` ${sp.text}`;
      else intro[sec] += ` ${sp.text}`;
      first = false;
    }
  }
  for (const e of ents) { e.text = e.text.replace(/\s+/g, ' ').replace(/- (\w)/g, '$1').trim(); e.key = `${e.kind}:${slug(e.name.replace(/ \(.*$/, ''))}`; }
  out[slug(name)] = { name, page: lines[i].page, entries: ents, intro: Object.fromEntries(Object.entries(intro).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])) };
}
const metinYolu = process.argv.includes('--metin') ? process.argv[process.argv.indexOf('--metin') + 1] : null;
if (metinYolu) fs.writeFileSync(metinYolu, JSON.stringify(out, null, 1));
const liste = Object.fromEntries(Object.entries(out).map(([id, m]) => [id, m.entries.map((e) => ({ anahtar: `${id}/${e.key}`, ad: e.name, tur: e.kind }))]));
const govde = Object.entries(liste).map(([id, l]) => `  ${JSON.stringify(id)}: ${JSON.stringify(l)}`).join(',\n');
const not = 'SRD 5.2.1 canavar özellik ve eylemleri (ad İngilizce, tür, stat bloğundaki sıra); scripts/srd-canavar-ozellik.mjs docs/SRD_CC_v5.2.1.pdf s. 254–364\'ten üretir, elle düzenlenmez. Türkçe açıklama data/aciklamalar-tr.json canavar[anahtar].';
fs.writeFileSync(new URL('../data/canavar-ozellik.json', import.meta.url), `{\n "_not": ${JSON.stringify(not)},\n "canavarlar": {\n${govde}\n }\n}\n`);
console.log(Object.keys(out).length, 'blok,', Object.values(out).reduce((n, m) => n + m.entries.length, 0), 'kayıt');
