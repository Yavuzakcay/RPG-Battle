/**
 * Görev WS91 (kural sürümü 91; `shape91Surum.ts`): Wild Shape ve Polymorph biçiminin canavar parçası.
 *
 * SRD 5.2.1 s. 43 (Wild Shape, "Game Statistics"): "Your game statistics are replaced by the Beast's stat block, but you
 * retain your creature type; Hit Points; Hit Point Dice; Intelligence, Wisdom, and Charisma scores; class features;
 * languages; and feats." s. 153 (Polymorph): "The target's game statistics are replaced by the stat block of the chosen
 * Beast, but the target retains its alignment, personality, creature type, Hit Points, and Hit Point Dice."
 *
 * 87–89'da aktarılanlar (AC, hız, uçuş, boyut, yetenekler, kurtarmalar, beceriler, saldırılar, yüzme) `druid.ts`
 * `shapeStats`'ta kalır. Burada stat bloğunun kalanı: biçim, savaş başındaki canavar kurulumunun tek girişinden
 * (`monsterSetup.ts` `setupMonster`: `monsterTraitSetup` + `monsterAbilitySetup`; ikinci kopya yok) geçirilen geçici bir
 * canavar savaşçısıdır; ondan duyular (Darkvision, Blindsight, Tremorsense, Truesight), direnç/bağışıklık/zayıflık, durum
 * bağışıklığı ve diğer canavar özellikleri (etkiler: Spider Climb, Web Walker, Magic Resistance…; işaretler: Flyby,
 * Agile…; Pack Tactics), kazma, tepkiler, yetenek hakları ve save'li/şarjlı saldırılar (Wild Shape'te; Web) alınır.
 *
 * Ayrım (⚠ DECISIONS WS91): Wild Shape'te sınıf özellikleri ve feat'ler korunur; savaşçıda tür ve sınıf kaynaklı direnç
 * ve işaretler ayrılamadığı için direnç/bağışıklık/zayıflık ve işaretler birleşir (kendi ∪ biçim), duyular ve Darkvision
 * yalnız tür kaynaklı olduğundan biçiminkiyle değişir. Polymorph'ta hepsi biçimden; canavar hedefin kendi canavar işaretleri,
 * etkileri ve kaynakları (Legendary Resistance, yetenek ve büyü hakları) biçim süresince kalkar. Saf.
 */
import type { Monster } from '../data';
import { combatantFromMonster } from './create';
import { setupMonster } from './monsterSetup';
import { bicimYuzmeOn } from './wildShape87Surum';
import { shape91On } from './shape91Surum';
import type { BattleState, Combatant, CombatantAttack, ShapeMonster } from './types';
export { formMonsterId } from './shapeMonsterCore';

/** Canavar kurulumunun savaşçıya yazdığı etki kimlikleri (`monsterTraits.ts`, `monsterAbilities.ts`). */
const monsterEffectIds = (id: string): string[] => [`srd19:${id}:traits`, `srd19:${id}:passive`];
/** Canavar kurulumundan gelen kaynaklar (Legendary Resistance, yetenek hakları, canavar büyüleri). */
const monsterResource = (k: string): boolean => k === 'legendaryResistance' || k.startsWith('mab:') || k.startsWith('mspell');
const union = (a: string[] | undefined, b: string[] | undefined): string[] => [...new Set([...(a ?? []), ...(b ?? [])])];

/** Biçimden önceki (asıl) değerler: biçimdeyse `prev.mon`, değilse savaşçının kendisi. */
function ownOf(c: Combatant): Combatant {
  const m = c.shape?.prev.mon;
  if (!m) return c;
  const { effects: _e, resources: _r, ...fields } = m;
  return { ...c, ...fields };
}

/**
 * Biçimin canavar parçası ve biçimin canavar saldırıları (olay anında; savaşın kural sürümündeki veriyle). 90 ve altı: null.
 * `kind` `wild`: Wild Shape (sınıf özellikleri korunur), `poly`: Polymorph.
 */
export function shapeMonsterPart(state: BattleState, target: Combatant, m: Monster, kind: 'wild' | 'poly'): { monster: ShapeMonster; attacks: CombatantAttack[]; multiattack: boolean } | null {
  if (!shape91On(state)) return null;
  const v = state.kuralSurumu ?? 1;
  const b0 = combatantFromMonster(m, { id: target.id, name: target.name, kuralSurumu: v });
  const b = setupMonster(state, { ...b0, side: target.side }, m).combatant;
  const own = ownOf(target);
  // Yüzme hızı 87'den beri Game Master anahtarı `bicimYuzme` ile (biçimin yüzme hızı ve çok derin su).
  const beastTraits = (b.traits ?? []).filter((t) => t !== 'gift-of-the-depths' || bicimYuzmeOn(state));
  const ids = monsterEffectIds(target.id);
  const effects = (b.effects ?? []).filter((e) => ids.includes(e.id));
  const monsterTarget = kind === 'poly' && !!target.monsterId;
  const resources: Record<string, number> = {};
  if (monsterTarget) for (const k of Object.keys(own.resources)) if (monsterResource(k)) resources[k] = 0;
  for (const [k, n] of Object.entries(b.resources)) if (monsterResource(k)) resources[k] = n;
  const keepOwn = kind === 'wild';
  const monster: ShapeMonster = {
    resistances: keepOwn ? union(own.resistances, b.resistances) : [...b.resistances],
    immunities: keepOwn ? union(own.immunities, b.immunities) : [...b.immunities],
    vulnerabilities: keepOwn ? union(own.vulnerabilities, b.vulnerabilities) : [...b.vulnerabilities],
    darkvision: b.darkvision,
    ...(b.senses ? { senses: { ...b.senses } } : {}),
    packTactics: b.packTactics,
    // Polymorph'ta canavar hedefin işaretleri bütünüyle canavar kaynaklı (kalkar); oyuncu hedefte sınıf işaretleri kalır.
    traits: monsterTarget ? beastTraits : union(own.traits, beastTraits),
    effects,
    dropEffects: ids,
    resources,
    ...(b.burrowFt ? { burrowFt: b.burrowFt } : {}),
    ...(b.phase ? { phase: b.phase } : {}),
    ...(b.reactions?.length || (!monsterTarget && own.reactions?.length) ? { reactions: [...(monsterTarget ? [] : own.reactions ?? []), ...(b.reactions ?? [])] } : {}),
    ...(b.reactionUses || (!monsterTarget && own.reactionUses) ? { reactionUses: { ...(monsterTarget ? {} : own.reactionUses ?? {}), ...(b.reactionUses ?? {}) } } : {}),
    bonusActions: monsterTarget ? [...b.bonusActions] : [...new Set([...own.bonusActions, ...b.bonusActions])],
  };
  // Wild Shape: saldırı zarlı saldırılar silah seçeneği (`shapeStats`); save'li ya da şarjlı eylemler (Web) canavar saldırısı.
  const attacks = kind === 'wild' ? b.attacks.filter((a) => a.save || a.recharge !== undefined) : b.attacks;
  return { monster, attacks, multiattack: kind === 'wild' ? false : b.multiattack };
}
