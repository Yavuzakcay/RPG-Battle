// Görev S1: SRD 5.2.1 0–3. seviye büyü denetimi → docs/harita/BUYU-DENETIMI.md.
// Durum data/spells.json'dan: tam (mekanik var, sapma notu yok), kısmi (`approx` notu ya da elle uygulanan
// tepki dışı yardımcı), yok (kayıt yok, `unsupported`, ya da yalnızca "elle uygulanır"). Eksik sistem: elle
// atanmış (MANUAL) yoksa SRD metninden anahtar sözcüklerle tahmin. Çalıştırma: node scripts/buyu-denetimi.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srd = JSON.parse(fs.readFileSync(path.join(root, 'data/srd/spells.json'), 'utf8')).spells;
const game = JSON.parse(fs.readFileSync(path.join(root, 'data/spells.json'), 'utf8'));
const byId = new Map(game.map((s) => [s.srd, s]));

/** Eksik sistem adları (B grubu görevlerinin kaynağı). */
const SYS = {
  teleport: 'ışınlanma', fly: 'uçuş', light: 'aydınlatma/karanlık', zone: 'kalıcı zemin etkisi', wall: 'geçici engel hex\'i',
  push: 'itme/çarpma', size: 'boyut', detect: 'algılama/bilgi', illusion: 'yanılsama', offcombat: 'savaş dışı (mekân/zaman)',
  object: 'nesne etkileşimi', control: 'zihin kontrolü/davranış', terrainShape: 'zemin şekillendirme', summon: 'çağırma',
  reaction: 'tepki tetiği', ongoing: 'süreli tekrar (tur başı/sonu)', heal: 'iyileştirme', buff: 'süren etki', misc: 'özel mekanik',
};
/** Elle atanan eksik sistemler (anahtar sözcük tahmini yetmeyenler). */
const MANUAL = {
  'spells:darkness': 'light', 'spells:light': 'light', 'spells:dancing-lights': 'light', 'spells:daylight': 'light', 'spells:faerie-fire': 'light',
  'spells:fog-cloud': 'zone', 'spells:web': 'zone', 'spells:grease': 'zone', 'spells:spike-growth': 'zone', 'spells:sleet-storm': 'zone', 'spells:stinking-cloud': 'zone',
  'spells:moonbeam': 'zone', 'spells:silence': 'zone', 'spells:hunger-of-hadar': 'zone', 'spells:plant-growth': 'zone', 'spells:cloud-of-daggers': 'zone',
  'spells:wind-wall': 'wall', 'spells:blade-ward': 'buff', 'spells:mirror-image': 'illusion', 'spells:blur': 'buff', 'spells:blink': 'offcombat',
  'spells:enlarge-reduce': 'size', 'spells:gust-of-wind': 'push', 'spells:thunderwave': 'push', 'spells:gaseous-form': 'fly', 'spells:levitate': 'fly', 'spells:fly': 'fly',
  'spells:misty-step': 'teleport', 'spells:dimension-door': 'teleport', 'spells:magic-circle': 'offcombat', 'spells:counterspell': 'reaction', 'spells:dispel-magic': 'misc',
  'spells:bestow-curse': 'misc', 'spells:remove-curse': 'misc', 'spells:hypnotic-pattern': 'control', 'spells:fear': 'control', 'spells:confusion': 'control',
  'spells:suggestion': 'control', 'spells:command': 'control', 'spells:charm-person': 'control', 'spells:animal-friendship': 'control', 'spells:calm-emotions': 'control',
  'spells:heat-metal': 'ongoing', 'spells:acid-arrow': 'ongoing', 'spells:melfs-acid-arrow': 'ongoing', 'spells:call-lightning': 'ongoing', 'spells:flaming-sphere': 'ongoing',
  'spells:beacon-of-hope': 'buff', 'spells:protection-from-energy': 'buff', 'spells:haste': 'buff', 'spells:slow': 'buff', 'spells:true-strike': 'buff',
  'spells:conjure-animals': 'summon', 'spells:animate-dead': 'summon', 'spells:find-familiar': 'summon', 'spells:find-steed': 'summon', 'spells:spiritual-weapon': 'summon',
  'spells:shillelagh': 'buff', 'spells:mage-hand': 'object', 'spells:spare-the-dying': 'heal', 'spells:lesser-restoration': 'heal', 'spells:revivify': 'heal',
  'spells:mass-healing-word': 'heal', 'spells:sleep': 'control', 'spells:hideous-laughter': 'control', 'spells:mirror-image ': 'illusion',
};

function guess(s) {
  const t = `${s.text} ${s.higherLevel ?? ''}`.toLowerCase();
  const ct = (s.castingTime ?? '').toLowerCase();
  if (/minute|hour/.test(ct) || s.ritual && !/action/.test(ct)) return 'offcombat';
  if (/teleport/.test(t)) return 'teleport';
  if (/fly speed|you can fly|flying/.test(t)) return 'fly';
  if (/\bwall\b|barrier/.test(t)) return 'wall';
  if (/darkness|bright light|dim light|sheds light/.test(t)) return 'light';
  if (/difficult terrain|starts (its|their) turn in|enters the (area|spell)|for the duration.*area|area.*for the duration/.test(t)) return 'zone';
  if (/pushed|push (it|the target|each)|knocked/.test(t)) return 'push';
  if (/illusion|illusory|image of/.test(t)) return 'illusion';
  if (/\bsize\b|larger|smaller/.test(t)) return 'size';
  if (/charmed|frightened|command|obey/.test(t)) return 'control';
  if (/detect|sense|you learn|you know|telepathic|scrying|aware of/.test(t)) return 'detect';
  if (/object|door|lock|rope|water|food/.test(t)) return 'object';
  if (/reaction/.test(ct)) return 'reaction';
  if (/regain.*hit points/.test(t)) return 'heal';
  if (/each of your turns|start of each of its turns|end of each of its turns/.test(t)) return 'ongoing';
  return 'misc';
}

const rows = [];
for (const s of srd.filter((x) => x.level <= 3).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))) {
  const id = `spells:${s.id}`;
  const g = byId.get(id);
  const m = g?.mechanics;
  let status; let note = '';
  if (!g) { status = 'yok'; note = 'oyunda kayıt yok'; }
  else if (m.unsupported) { status = 'yok'; note = m.unsupported; }
  else if (m.kind === 'utility' && !m.reaction && !g.utilityHandled) { status = 'yok'; note = 'yalnızca günlüğe yazılır ("etki elle uygulanır")'; }
  else if (m.approx) { status = 'kısmi'; note = m.approx; }
  else status = 'tam';
  const sys = status === 'tam' ? '' : SYS[MANUAL[id] ?? guess(s)];
  rows.push({ level: s.level, name: s.name, id: s.id, status, sys, note, kind: m?.kind ?? '' });
}
const count = (st) => rows.filter((r) => r.status === st).length;
const bySys = {};
for (const r of rows.filter((x) => x.status !== 'tam')) bySys[r.sys] = (bySys[r.sys] ?? 0) + 1;
const out = [];
out.push('# Büyü denetimi: SRD 5.2.1, 0–3. seviye (Görev S1)', '');
out.push('`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`\'dan üretilir (elle düzenleme; betiği çalıştır). Durum: **tam** (mekanik var, sapma notu yok), **kısmi** (oyunda var, SRD\'den sapma `approx` notunda), **yok** (kayıt yok, `unsupported` ya da yalnızca "etki elle uygulanır"). "Eksik sistem" kısmi ve yok büyülerde hangi motor parçasının eksik olduğu; B grubu ve sınıf görevlerinin kaynağı. Sınıf listesi SRD\'den, büyü sınıftan bağımsız hazırlanır.', '');
out.push(`**Özet:** ${rows.length} büyü — tam ${count('tam')}, kısmi ${count('kısmi')}, yok ${count('yok')}.`, '');
out.push('| Eksik sistem | Büyü sayısı (kısmi + yok) |', '|---|---:|');
for (const [k, v] of Object.entries(bySys).sort((a, b) => b[1] - a[1])) out.push(`| ${k} | ${v} |`);
out.push('');
for (const lv of [0, 1, 2, 3]) {
  const list = rows.filter((r) => r.level === lv);
  out.push(`## ${lv === 0 ? 'Cantrip (0)' : `${lv}. seviye`} — tam ${list.filter((r) => r.status === 'tam').length}, kısmi ${list.filter((r) => r.status === 'kısmi').length}, yok ${list.filter((r) => r.status === 'yok').length}`, '');
  out.push('| Büyü | Kimlik | Durum | Eksik sistem | Not |', '|---|---|---|---|---|');
  for (const r of list) out.push(`| ${r.name} | \`spells:${r.id}\` | ${r.status} | ${r.sys} | ${r.note.replace(/\|/g, '/')} |`);
  out.push('');
}
fs.writeFileSync(path.join(root, 'docs/harita/BUYU-DENETIMI.md'), out.join('\n'));
console.log(`tam ${count('tam')}, kısmi ${count('kısmi')}, yok ${count('yok')}`, bySys);
