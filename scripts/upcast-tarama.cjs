// Görev K9b: yukarı slot taraması → docs/harita/UPCAST.md
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('data/spells.json', 'utf8'));
const srd = JSON.parse(fs.readFileSync('data/srd/spells.json', 'utf8')).spells;
const COMPLEX = {
  'Hold Person': 'Tek hedefli save büyüsü; çok hedef komut ve arayüz ister',
  'Blindness/Deafness': 'Tek hedefli save büyüsü; çok hedef komut ve arayüz ister',
  'Animate Dead': 'Yukarı slotla çok yaratık zaten (çağırma verisi `count`); SRD "iki ek Undead" ile sayı uyumu ayrı denetim',
  'Dispel Magic': 'Slot seviyesine göre otomatik bitirme `kind: dispel` kendi kuralında (B5)',
};
const PARTIAL = {
  'Chromatic Orb': 'zar ölçeği uygulanıyor; aynı zar çıkınca sıçrama (slot seviyesi kadar) yok',
};
const rows = [];
for (const x of s) {
  const r = srd.find((y) => y.id === x.id);
  if (!r?.higherLevel || x.mechanics.offCombat) continue;
  const u = x.mechanics.upcast;
  let status;
  if (u?.applied && PARTIAL[x.name]) status = `kısmen: ${PARTIAL[x.name]}`;
  else if (u?.applied) status = 'uygulanıyor';
  else if (u?.duration) status = 'savaşta etkisiz (yalnızca süre)';
  else if (COMPLEX[x.name]) status = `karar/ayrı iş: ${COMPLEX[x.name]}`;
  else status = 'uygulanmıyor';
  rows.push(`| ${x.level} | ${x.name} | ${status} | ${r.higherLevel.replace(/\s+/g, ' ').replace(/\|/g, '/').slice(0, 160)} |`);
}
const count = (k) => rows.filter((r) => r.includes(`| ${k}`)).length;
const out = `# Yukarı slot (upcast) taraması (Görev K9b)

\`data/spells.json\`'daki ve SRD 5.2.1'de "Using a Higher-Level Spell Slot" metni olan büyüler (savaş dışı olanlar hariç). Betikle üretildi
(\`node scripts/upcast-tarama.cjs\`; veri \`mechanics.upcast\`, \`applied: true\` motorun uyguladığı). Toplam ${rows.length}: uygulanıyor ${count('uygulanıyor')}, kısmen ${count('kısmen')},
savaşta etkisiz ${count('savaşta etkisiz')}, karar/ayrı iş ${count('karar/ayrı iş')}, uygulanmıyor ${count('uygulanmıyor')}.

| Seviye | Büyü | Durum | SRD |
|---|---|---|---|
${rows.join('\n')}
`;
fs.writeFileSync('docs/harita/UPCAST.md', out);
console.log(out.split('\n').slice(0, 6).join('\n'));
console.log(rows.filter((r) => r.includes('| uygulanmıyor')).join('\n'));
