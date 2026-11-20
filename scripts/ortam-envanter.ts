/** Kuyruk KQ6-9: harita × ortam canavar sayısı envanteri (salt okur; `--json` ham çıktı). */
import { maps } from '../src/map/maps';
import { MONSTER_ENVS } from '../src/data/monsterEnv';

const count = new Map<string, string[]>();
for (const e of MONSTER_ENVS) for (const o of e.ortam) { if (!count.has(o)) count.set(o, []); count.get(o)!.push(e.id); }
const rows = maps.map((m) => ({ id: m.id, ad: m.name, bolge: (m as { bolge?: string }).bolge ?? '', gizli: !!m.gizli, n: (count.get(m.id) ?? []).length }));
console.log(JSON.stringify({ toplam: MONSTER_ENVS.length, rows, digerOrtamlar: [...count.keys()].filter((k) => !maps.some((m) => m.id === k)).map((k) => [k, count.get(k)!.length]) }));
