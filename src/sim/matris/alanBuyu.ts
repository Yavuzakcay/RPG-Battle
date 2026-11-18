/**
 * Mekanik matris: kalıcı alan ve çağırma büyüleri. Yapım anı (SRD: belirince save, yapımda saldırı ya da etkisiz kurulum),
 * alanın/çağrının kurulması, tetik (hedefin tur başı ya da sonu) ve Counterspell. Yapımda save/saldırı olan büyüler
 * çekirdek bağlamları (`damageRows`) özel tablonun parçalarıyla yeniden kullanır.
 */
import type { Spell } from '../../data/types';
import type { ActiveEffect, BattleState, Combatant, Command } from '../../battle/types';
import type { Offset } from '../../rules/hex';
import type { SrdSpell } from './srd';
import { OZEL, type Ozel } from './ozel';
import { A_ROW, hex } from './kurulum';
import { SAVE_FAIL, SAVE_OK, exprTotal } from './zar';
import { adjust, alan, type Gozlem, type Satir } from './ortak';
import { classify, counterRows, damageRows, geometry, mechOf, runCtx, type Geo } from './buyu';

export const zoneGeo = (sp: Spell, s: SrdSpell): Geo => {
  const g = geometry(s, sp);
  if (!OZEL[s.id]?.bitisik) return g;
  // Çağrı/alan hedefin bitişiğindeki boş altıgende (hedef iki altıgen öteye kayar ki çağrı arada kalsın).
  const t = hex(Math.max(g.t.row, A_ROW + 3));
  return { ...g, kind: 'point', t, aim: hex(t.row - 1), u: null, ff: null, coverT: null, bandRows: null };
};

/** Bağlam komutu: alan nişanı ya da yaratık. */
export function zoneCmd(sp: Spell, geo: Geo, s?: SrdSpell): Partial<Extract<Command, { type: 'cast_spell' }>> {
  const sec = s ? OZEL[s.id]?.secim ?? OZEL[s.id]?.yapim?.choice : undefined;
  return { ...(geo.kind === 'single' ? { targetId: 'T' } : geo.aim ? { targetHex: geo.aim } : {}), ...(sp.level > 0 ? { slotLevel: sp.level } : {}), ...(sec ? { choice: sec } : {}) };
}

/** Konsantrasyon değişimi: büyücü Bless sürdürüyor (dostta Bless etkisi); yeni konsantrasyon büyüsü öncekini bitirir. */
export function concSwapRow(sp: Spell, s: SrdSpell, geo: Geo, cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>>, mech: string, extra: Combatant[] = [], noT = false, tPos?: Offset, bPos?: Offset): Satir {
  // Önceki konsantrasyon büyüsü: Bless (yapılan büyü Bless ise Heroism).
  const [old, oldId] = sp.name === 'Bless' ? ['Heroism', 'spells:heroism'] : ['Bless', 'spells:bless'];
  const fx: ActiveEffect = { id: oldId, name: old, sourceId: 'A', until: 99, concentration: old, dice: { die: '1d4', sign: 1, on: ['attack', 'save'] } } as ActiveEffect;
  const prep = (st: BattleState): BattleState => ({ ...st, combatants: { ...st.combatants,
    A: { ...(st.combatants.A as Combatant), concentration: { spell: old, slotLevel: 1, turn: '0:0' } },
    B: { ...(st.combatants.B as Combatant), effects: [fx] } } });
  return runCtx(sp, s, geo, { ad: `konsantrasyon değişimi (${old} sürerken)`, kategori: 'konsantrasyon', extra, noT, ...(tPos ? { tPos } : {}), ...(bPos ? { bPos } : {}), prep, p: { saves: { T: [SAVE_FAIL] } },
    bek: (g) => [alan('büyücünün konsantrasyonu', sp.name, g.after?.combatants.A?.concentration?.spell ?? null),
      alan(`${old} etkisi dostta`, false, !!g.after?.combatants.B?.effects?.some((e) => e.id === oldId))] }, cmdBase, mech, classify(sp, s, 'konsantrasyon'));
}

/** Alanın tetiği: hedef alanda; büyücü turunu bitirir (tur başı), hedef turunu bitirir (tur sonu). */
function triggerRows(sp: Spell, s: SrdSpell, o: Ozel, geo: Geo, cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>>, mech: string): Satir[] {
  const t = o.tetik;
  if (!t) return [];
  const y = o.yapim;
  const post: Command[] = [{ type: 'end_turn', actorId: 'A' }, ...(t.olay === 'end' ? [{ type: 'end_turn', actorId: 'T' } as Command] : [])];
  const trigDmg = (ok: boolean, prof: { res?: string[]; vul?: string[]; imm?: string[] }) => (t.dmg ?? []).reduce((n, d) => {
    const raw = exprTotal(d.dice);
    const v = t.save ? (ok ? (t.half ? Math.floor(raw / 2) : 0) : raw) : raw;
    return n + adjust(v, d.type, prof);
  }, 0);
  const rows: Satir[] = [];
  const type = t.dmg?.[0]?.type ?? '';
  const mk = (ad: string, ok: boolean, prof: { res?: string[]; vul?: string[]; imm?: string[] }, kat: string) => runCtx(sp, s, geo, {
    ad, kategori: kat, post, targetX: { resistances: prof.res ?? [], vulnerabilities: prof.vul ?? [], immunities: prof.imm ?? [] },
    // Yapım save'i (varsa) başarısız; tetik save'i bağlamın sonucu (motor yapımda da save attırıyorsa varsayılan tetikle aynı).
    p: { saves: { T: y?.tur === 'save' ? [SAVE_FAIL] : [] }, saveDefault: ok ? SAVE_OK : SAVE_FAIL },
    bek: (g) => {
      // Tetik: ilk komuttan (yapım) sonraki olaylar ve HP değişimi.
      const later = g.olaylar.slice(g.ilkSay).filter((e) => e.type === 'save_resolved' && e.targetId === 'T').length;
      const hpLater = (g.ilk?.combatants.T?.hp ?? 0) - (g.after?.combatants.T?.hp ?? 0);
      const condsLater = (g.after?.combatants.T?.conditions ?? []).filter((c) => t.conds?.includes(c)).sort();
      return [
        ...(t.save ? [alan('tetik save', 1, later)] : []),
        alan('tetik hasarı', trigDmg(ok, prof), hpLater),
        ...(t.conds?.length && !ok ? [alan('durum', [...t.conds].sort(), condsLater)] : []),
        ...(g.sonraHata ? [alan('tur sonu', 'kabul', g.sonraHata)] : []),
      ];
    },
  }, cmdBase, mech, classify(sp, s, kat));
  rows.push(mk(`tetik: hedefin tur ${t.olay === 'start' ? 'başı' : 'sonu'} (save başarısız)`, false, {}, 'alan'));
  if (t.save) rows.push(mk(`tetik: hedefin tur ${t.olay === 'start' ? 'başı' : 'sonu'} (save başarılı)`, true, {}, 'save'));
  if (t.dmg?.length) {
    rows.push(mk(`tetik: direnç (${type})`, false, { res: [type] }, 'hasar türü'));
    rows.push(mk(`tetik: bağışıklık (${type})`, false, { imm: [type] }, 'hasar türü'));
  }
  return rows;
}

export function zoneRows(sp: Spell, s: SrdSpell): Satir[] {
  const o = OZEL[s.id] ?? {};
  const m = mechOf(sp);
  const mech = `${m.kind}${m.zone ? '+alan' : ''}${sp.area ? `(${sp.area.shape})` : ''}`;
  const geo = zoneGeo(sp, s);
  const cmdBase = zoneCmd(sp, geo, s);
  const rows: Satir[] = [];
  const y = o.yapim;
  if (y && (y.tur === 'save' || y.tur === 'attack' || y.tur === 'auto')) {
    rows.push(...damageRows(sp, s, y));
  } else {
    // Yapımda etki yok (ya da karar): kurulum, slot, konsantrasyon; hedefe yapımda dokunulmaz.
    // Kurulum: alan, çağrı, süren etki ya da büyücüyle yürüyen aura (konsantrasyon; Spirit Guardians).
    const zoneOrSummon = (g: Gozlem) => g.olaylar.some((e) => e.type === 'zone_created' || e.type === 'summoned' || e.type === 'effect_added') || (s.concentration && g.kons === sp.name);
    rows.push(runCtx(sp, s, geo, { ad: 'yapım (SRD: yapımda hedefe etki yok)', kategori: 'yapım', p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('alan/çağrı kuruldu', true, zoneOrSummon(g)), alan('hedef save', 0, g.saveler.filter((x) => x.hedef === 'T').length),
        alan('hedef hasarı', 0, g.hp.T ?? 0), alan('slot', sp.level > 0 ? [sp.level] : null, g.slot.length ? g.slot : null), alan('kons', s.concentration ? sp.name : null, g.kons)] },
    cmdBase, mech, (g, d) => (o.karar ? { sonuc: 'karar bekliyor', not: o.karar } : classify(sp, s, 'yapım')(g, d))));
    rows.push(...counterRows(sp, s, geo, cmdBase, mech, (k) => classify(sp, s, k)));
  }
  rows.push(...triggerRows(sp, s, o, geo, cmdBase, mech));
  if (o.secim) {
    const tur = (g: Gozlem) => ((g.after?.map?.zones ?? []).find((z) => z.casterId === 'A') as { damageType?: string } | undefined)?.damageType ?? 'yok';
    rows.push(runCtx(sp, s, geo, { ad: 'seçimsiz yapım (SRD: element seçilmeli)', kategori: 'yapım', p: {}, cmd: { choice: undefined },
      bek: (g) => [alan('alan hasar türü SRD seçeneklerinden', true, ['lightning', 'thunder', 'fire', 'cold'].includes(tur(g)))], not: 'Seçim verilmezse motor ilk seçeneği (lightning) kullanıyor.' },
    cmdBase, mech, (g) => (!g.kabul ? { sonuc: 'doğru', not: 'Seçimsiz yapım reddedildi.' } : classify(sp, s, 'yapım')(g, []))));
  }
  if (s.concentration) rows.push(concSwapRow(sp, s, geo, cmdBase, mech));
  return rows.map((r) => (o.not && !r.not.includes(o.not) ? { ...r, not: [r.not, o.not].filter(Boolean).join(' — ') } : r));
}
