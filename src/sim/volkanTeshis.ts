/**
 * Volkan teşhisi (başsız): büyücü ve savaşçı başlangıç altıgenlerinden, her büyü için "atılabilir mi,
 * değilse neden" ve her atlama hedefi için "geçerli mi, değilse neden". Kod değiştirmez.
 * Çalıştırma: `npx vite-node src/sim/volkanTeshis.ts`
 */
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet, execute } from '../battle';
import type { BattleState, Command } from '../battle';
import { getMonster } from '../data';
import { DEMO_SHEETS } from '../demo';
import { economyBlock } from '../battle/economy';
import { attackChoices, allHexes } from '../ui/mapView';
import { hasSlotFor, spellMenu } from '../ui/hud';
import { contextFor } from '../ui/session';
import { hexLabel, terrainAt } from '../battle/movement';
import { hexKey, type Offset } from '../rules/hex';

const gm = { playerId: 'gm', isGm: true };
const rng = () => 0.5;

function battle(variantId: string): BattleState {
  const party = Object.values(DEMO_SHEETS).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }));
  const foes = ['wyvern', 'troll', 'wolf', 'wolf'].map((id, i) => combatantFromMonster(getMonster(id), { id: `${id}-${i}` }));
  const s = createMapBattle([...party, ...foes], { mapId: 'volkan', variantId, mirrored: false }, rng).state;
  const r = execute(s, { type: 'start_battle' }, gm, rng);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const tryCmd = (s: BattleState, cmd: Command) => {
  const r = execute(s, cmd, contextFor(s, 'actorId' in cmd ? cmd.actorId : ''), rng);
  return r.ok ? 'tamam' : r.error;
};

for (const variantId of ['varsayilan', 'uyuyan-ejderha']) {
  const s0 = battle(variantId);
  const pcs = Object.values(s0.combatants).filter((c) => c.side === 'party' && !c.civilian);
  const wizard = pcs.find((c) => c.spellNames.length > 0 && c.weaponOptions.every((o) => o.spell || o.ranged || true) && c.casterTag.includes('wizard')) ?? pcs.find((c) => c.spellNames.length > 0);
  const fighter = pcs.find((c) => c.casterTag.includes('fighter'));
  const foes = Object.values(s0.combatants).filter((c) => c.side === 'enemies' && c.pos);
  console.log(`\n=== Volkan / ${variantId} ===`);
  if (wizard?.pos) {
    const s = turnOf(s0, wizard.id);
    console.log(`Büyücü ${wizard.name} @ ${hexLabel(wizard.pos)} (${terrainAt(s, wizard.pos).name}); büyüler: ${wizard.spellNames.join(', ')}; slotlar ${wizard.spellSlots.join('/')}`);
    for (const { spell, kind } of spellMenu(wizard)) {
      const slot = hasSlotFor(wizard, spell);
      const why = economyBlock(s, wizard, { type: 'cast_spell', actorId: wizard.id, spellName: spell.name });
      const menu = !slot ? 'MENÜDE KAPALI: slot yok' : why ? `MENÜDE KAPALI: ${why}` : 'menüde açık';
      const per: string[] = [];
      for (const f of foes) {
        if (kind === 'target') {
          const ch = attackChoices(s, wizard.id, f.id).find((c) => c.id === `s-${spell.name}`);
          const res = tryCmd(s, { type: 'cast_spell', actorId: wizard.id, spellName: spell.name, targetId: f.id });
          per.push(`${f.name}: ${ch?.command ? 'hedeflenir' : `hedeflenmez (${ch?.detail ?? 'seçenek yok'})`} / komut: ${res}`);
        } else if (kind === 'area') {
          per.push(`${f.name} altıgenine: ${tryCmd(s, { type: 'cast_spell', actorId: wizard.id, spellName: spell.name, targetHex: f.pos as Offset })}`);
        }
      }
      if (kind === 'self') per.push(`hedefsiz: ${tryCmd(s, { type: 'cast_spell', actorId: wizard.id, spellName: spell.name })}`);
      console.log(`- ${spell.name} [${kind}, ${spell.rangeFt} ft] ${menu}`);
      for (const p of per) console.log(`    ${p}`);
    }
  }
  if (fighter?.pos) {
    const s = turnOf(s0, fighter.id);
    console.log(`Savaşçı ${fighter.name} @ ${hexLabel(fighter.pos)}`);
    const reasons = new Map<string, string[]>();
    for (const h of allHexes()) {
      if (hexKey(h) === hexKey(fighter.pos)) continue;
      const t = terrainAt(s, h);
      if (t.movement === 'deadly' || t.movement === 'blocked') continue;
      const res = tryCmd(s, { type: 'jump', actorId: fighter.id, to: h });
      const list = reasons.get(res) ?? [];
      list.push(`${h.col + 1},${h.row + 1}`);
      reasons.set(res, list);
    }
    for (const [why, hs] of reasons) console.log(`  ${why === 'tamam' ? 'GEÇERLİ' : `geçersiz: ${why}`} (${hs.length}): ${hs.join(' ')}`);
  }
}
