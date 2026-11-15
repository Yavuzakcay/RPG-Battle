/**
 * SD7: slot seçicinin hedef başına satırları. Hedef seçiliyse mevcut kuru çalıştırmadan (`previewCommand`, ikinci hesap kodu yok)
 * zarın ne kadarının işleyeceği: tam, save'le yarım, direnç/zayıflık/bağışıklık, siper, avantaj/dezavantaj, menzil dışı.
 * Zar metni slot seviyesindeki mevcut `upcast` verisinden (`diceAtSlot`). Saf; durum değişmez.
 */
import type { Spell } from '../../data';
import { previewCommand } from '../../battle/ai/preview';
import type { BattleEvent, BattleState, Command, CommandContext } from '../../battle/types';
import { diceAtSlot, halfDice } from '../slotInfo';

export interface SlotTargetText {
  full: (name: string, dice: string) => string; fullHeal: (name: string, dice: string) => string;
  half: (name: string, dice: string) => string; saveNone: (name: string) => string;
  resist: (name: string, type: string) => string; vulnerable: (name: string, type: string) => string; immune: (name: string) => string;
  outRange: (name: string | null) => string; cannot: (why: string) => string; plain: (name: string) => string;
  cover: (kind: 'half' | 'three', save: boolean) => string; mode: (adv: boolean, reasons: string[]) => string; join: string;
}

type Tagged = BattleEvent & { targetId?: string; damageNote?: string | null; damageType?: string; cover?: 2 | 5; mode?: string; reasons?: string[] };

/** `cmd`: bu slotla yapılacak büyü komutu (hedef/nokta seçili); null ise (hedef yok) satır yok. */
export function slotTargetLines(state: BattleState, cmd: Command | null, ctx: CommandContext, spell: Spell, slotLevel: number, tx: SlotTargetText, nameOf: (id: string) => string): string[] {
  if (!cmd) return [];
  const p = previewCommand(state, cmd, ctx);
  if (!p.ok) return [/menzil|uzak|range/i.test(p.error ?? '') ? tx.outRange(null) : tx.cannot(p.error ?? '')];
  const m = spell.mechanics;
  const dice0 = diceAtSlot(spell, slotLevel);
  // Işınlı büyüde (Magic Missile) zar ışın başına: "3 × 1d4+1" (aynı veriden, `rays` + `upcast.rays`).
  const rays = m.rays !== undefined ? m.rays + (m.upcast?.applied && m.upcast.rays ? m.upcast.rays * Math.max(0, slotLevel - spell.level) : 0) : 0;
  const dice = dice0 && rays > 1 ? { ...dice0, text: `${rays} × ${dice0.text}` } : dice0;
  const out: string[] = [];
  for (const t of p.targets) {
    const name = nameOf(t.id);
    const evs = p.events.filter((e): e is Tagged => (e as Tagged).targetId === t.id);
    const note = evs.find((e) => e.damageNote === 'immune' || e.damageNote === 'vulnerable' || e.damageNote === 'resistant');
    const type = (note?.damageType ?? m.damageType ?? '').toLowerCase();
    const heal = dice?.heal ?? false;
    let head: string;
    if (note?.damageNote === 'immune') head = tx.immune(name);
    else if (note?.damageNote === 'vulnerable') head = tx.vulnerable(name, type);
    else if (note?.damageNote === 'resistant') head = tx.resist(name, type);
    else if (dice && !dice.extra && m.save && m.halfOnSave && !heal) head = tx.half(name, halfDice(dice.text));
    else if (dice && !dice.extra && m.save && !m.halfOnSave && !heal) head = tx.saveNone(name);
    else if (dice && !dice.extra) head = (heal ? tx.fullHeal : tx.full)(name, dice.text);
    else head = tx.plain(name);
    const notes: string[] = [];
    const cov = evs.find((e) => e.cover);
    if (cov?.cover) notes.push(tx.cover(cov.cover === 5 ? 'three' : 'half', cov.type === 'save_resolved'));
    const md = evs.find((e) => e.mode && e.mode !== 'normal');
    if (md) notes.push(tx.mode(md.mode === 'advantage', md.reasons ?? []));
    out.push([head, ...notes].join(tx.join));
  }
  return out;
}
