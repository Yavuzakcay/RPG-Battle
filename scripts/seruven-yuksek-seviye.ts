// Serüven 6–20 seviye düşman seçimi tablosu (2026-11-19): 74 senaryo × seviye 1–20, önce (eski `enemiesAt`) / sonra
// (`journey/seruvenEnemies` planı, Serüven'deki kullanımına göre özel/sıradan). Yalnız rapor.
// `npx vite-node scripts/seruven-yuksek-seviye.ts` → harita/belgeler/SERUVEN-YUKSEK-SEVIYE.md
import fs from 'node:fs';
import { loadMonsters } from '../src/data';
import { SCENARIOS, DEFAULT_LEVEL } from '../src/sim/balance';
import { lowerList, scenarioRegion, seruvenEnemyPlan, type EnemySource } from '../src/journey/seruvenEnemies';
import { regionMonsters } from '../src/journey/encounter';
import seruven from '../data/seruven.json';
import hapis from '../data/hapishane.json';
import boss from '../data/sim-boss.json';
import seferler from '../data/seferler.json';

await loadMonsters();
type Kullanim = 'düğüm' | 'boss' | 'sefer' | 'hapishane' | 'suç' | 'koridor' | 'yok';
const use = new Map<string, Kullanim>();
const set = (id: string | undefined, k: Kullanim) => { if (id && !use.has(id)) use.set(id, k); };
const bossSet = new Set((boss as { bosslar: Array<{ senaryo: string }> }).bosslar.map((b) => b.senaryo));
for (const p of (seruven as { pages: Array<{ id: string; nodes: Array<{ scenario?: string; gece?: string; boss?: boolean; sefer?: string }> }> }).pages) {
  for (const n of p.nodes) {
    const k: Kullanim = p.id === (hapis as { sayfa: string }).sayfa ? 'hapishane' : n.boss || bossSet.has(n.scenario ?? '') ? 'boss' : 'düğüm';
    set(n.scenario, k); set(n.gece, k);
  }
}
for (const s of (seferler as { seferler: Array<{ nodes: Array<{ scenario?: string }> }> }).seferler) for (const d of s.nodes) set(d.scenario, 'sefer');
for (const s of (hapis as { suclar: Array<{ scenario: string }> }).suclar) set(s.scenario, 'suç');
set((hapis as { baskin: string }).baskin, 'suç');
for (const l of (seruven as { baglantilar: Array<{ scenario: string }> }).baglantilar) set(l.scenario, 'koridor');
for (const b of bossSet) set(b, 'boss');

const K: Record<EnemySource, string> = { liste: 'L', altListe: 'A', uretec: 'Ü', bes: '5' };
const L: string[] = ['# Serüven 6–20 seviye düşman seçimi', '',
  'Üretim: `npx vite-node scripts/seruven-yuksek-seviye.ts` (yalnız rapor). Kod `src/journey/seruvenEnemies.ts`, bağlantı `src/app/seruvenBattle.ts` `seruvenEnemies`.', '',
  'Kurallar (6+ seviye): el yazması tam liste (**L**) → en yakın alt 6+ liste (**A**, 8 → 7, 12 → 11; 5. seviyeye inmez) → yalnız sıradan',
  'düğümde ve haritanın ortam havuzu varsa bölge karşılaşma üreteci (**Ü**, `regionEncounter`: SRD XP bütçesi parti seviyesine göre, lider CR ≤ seviye, en çok 6) →',
  'yoksa 5. seviye listesi (**5**). Özel savaşlar (boss, sefer, Hapishane, Büyük suç, koridor) üreteç almaz. 1–5. seviye değişmedi (2 ve 4 için eskisi gibi 5. seviye listesi).', '',
  'Sefer düğümlerinde durağın kendi `dusmanlar` listesi varsa (en yakın sefer seviyesinden) o kullanılır; yoksa aşağıdaki senaryo satırı.', '',
  '| Senaryo | Serüven kullanımı | Önce 1–20 | Sonra 1–20 | 6+ 5. seviye yedeği (önce → sonra) |', '|---|---|---|---|---|'];
let b0 = 0, b1 = 0, cells = 0;
const sum: Record<string, number> = {};
for (const sc of SCENARIOS) {
  const k = use.get(sc.id) ?? 'yok';
  const ozel = k !== 'düğüm' && k !== 'yok';
  const before = Array.from({ length: 20 }, (_, i) => { const lv = i + 1; return lv === DEFAULT_LEVEL || sc.byLevel?.[lv] ? 'L' : '5'; }).join('');
  const after = Array.from({ length: 20 }, (_, i) => K[seruvenEnemyPlan(sc, i + 1, { ozel, partySize: 4, seed: `tablo:${sc.id}` }).kaynak]).join('');
  const n0 = [...before.slice(5)].filter((c) => c === '5').length, n1 = [...after.slice(5)].filter((c) => c === '5').length;
  b0 += n0; b1 += n1; cells += 15;
  for (const c of after.slice(5)) sum[c] = (sum[c] ?? 0) + 1;
  L.push(`| ${sc.id} | ${k} | \`${before}\` | \`${after}\` | ${n0} → ${n1} |`);
}
const pool = SCENARIOS.filter((s) => { const r = scenarioRegion(s); return r && regionMonsters(r).length > 0; }).length;
L.splice(10, 0, `Özet (74 senaryo × 6–20 = ${cells} hücre): 5. seviye yedeği ${b0} → ${b1}; sonra L ${sum.L ?? 0}, A ${sum.A ?? 0}, Ü ${sum['Ü'] ?? 0}, 5 ${sum['5'] ?? 0}. Ortam havuzu olan senaryo: ${pool}/74.`, '');
void lowerList;
fs.writeFileSync('harita/belgeler/SERUVEN-YUKSEK-SEVIYE.md', L.join('\n') + '\n');
console.log(L[10]);
