/**
 * Görev KATALOG-GUC-TAM D: mühür taşı yuvaları (konaklar, takılma kuralları, gevşek taş etkisiz, savaşçı etkileri).
 */
import { describe, expect, it } from 'vitest';
import { DEMO_SHEETS } from '../demo';
import { items } from '../data';
import { activeItemNames, type CharacterSheet } from './stats';
import { socketHosts, socketParts, socketProblem, stoneHostKinds } from './sockets';
import { combatantFromSheet } from '../battle/create';
import { damageProfile } from '../battle/common';
import { adjustDamage } from './damage';

const nm = (id: string) => (items.find((i) => i.id === id) as { name: string }).name;
const SV3 = ['ember-core', 'frost-heart', 'storm-spire', 'resonance-seal', 'dissolution-drop'];
const bor = (p: Partial<CharacterSheet>): CharacterSheet => ({ ...DEMO_SHEETS.BOR, ...p } as CharacterSheet);

describe('mühür taşı yuvaları', () => {
  it('konaklar: giyilen zırh ve kalkan kademe 1; nadir katalog zırhı kademe 2; Kaltakkıran 10 yuva (yalnız Sv.3)', () => {
    const s = bor({ armorName: 'Chain Mail', shield: true, itemNames: [nm('twilight-leather'), nm('kaltakkirans-paladin-armor')] });
    const h = socketHosts(s);
    expect(h.find((x) => x.key === '$armor')).toMatchObject({ slots: 1, tier: 1 });
    expect(h.find((x) => x.key === '$shield')).toMatchObject({ tier: 1 });
    expect(h.find((x) => x.key === 'twilight-leather')).toMatchObject({ tier: 2 });
    const k = h.find((x) => x.key === 'kaltakkirans-paladin-armor')!;
    expect(k).toMatchObject({ slots: 10, only: 3, permanent: true });
    expect(socketProblem(k, 'cracked-elemental-stone-fire')).toBe('ozel');
    expect(socketProblem(h[0]!, 'awakened-elemental-stone-fire')).toBe('kademe');
    expect(socketProblem(h[0]!, 'ember-core')).toBe('ozel');
    expect(stoneHostKinds('cracked-elemental-stone-cold')).toEqual(['zirh', 'kalkan']);
  });

  it('gevşek taş etkisiz; yuvadaki Uyanmış taş eşya etkisini verir', () => {
    const loose = bor({ itemNames: [nm('awakened-elemental-stone-fire')] });
    expect(activeItemNames(loose)).not.toContain(nm('awakened-elemental-stone-fire'));
    const set = bor({ itemNames: [nm('twilight-leather')], yuvalar: { 'twilight-leather': ['awakened-elemental-stone-fire'] } });
    expect(activeItemNames(set)).toContain(nm('awakened-elemental-stone-fire'));
  });

  it('Çatlak taş türüne −3 (direnç sonrası), savaşçı profilinde', () => {
    const s = bor({ armorName: 'Chain Mail', yuvalar: { $armor: ['cracked-elemental-stone-fire'] } });
    const c = combatantFromSheet(s, { id: 'b', ownerId: 'p' });
    const p = damageProfile(c);
    expect(adjustDamage(10, 'fire', p).amount).toBe(7);
    expect(adjustDamage(2, 'fire', p).amount).toBe(0);
    expect(adjustDamage(10, 'cold', p).amount).toBe(10);
  });

  it('Kaltakkıran: 5 Sv.3 taş → beş türe bağışıklık, AC +1, fiziksel direnç, Hükümdar Vuruşu 1d8', () => {
    const s = bor({ itemNames: [nm('kaltakkirans-paladin-armor')], yuvalar: { 'kaltakkirans-paladin-armor': SV3 } });
    const sk = socketParts(s);
    expect(sk.effects.filter((e) => (e.immuneDamage as string[] | undefined)?.length)).toHaveLength(5);
    expect(sk.effects.find((e) => e.id.endsWith(':kademe'))).toMatchObject({ ac: 1, resist: ['bludgeoning', 'piercing', 'slashing'] });
    expect(sk.hits[0]).toMatchObject({ dice: '1d8', type: 'fire' });
    const c = combatantFromSheet(s, { id: 'b', ownerId: 'p' });
    expect(damageProfile(c).immunities).toEqual(expect.arrayContaining(['fire', 'cold', 'lightning', 'thunder', 'acid']));
  });
});

describe('sabit hasar azaltma kancası (kanca listesi)', () => {
  it('Kıvılcım Yeleği kesici −1; Cehennem Ocağı Plakası her türe −2 (dirençten sonra)', () => {
    const a = damageProfile(combatantFromSheet(bor({ itemNames: [nm('sparkmesh-chain-shirt')] }), { id: 'b', ownerId: 'p' }));
    expect(adjustDamage(10, 'slashing', a).amount).toBe(9);
    expect(adjustDamage(10, 'lightning', a).amount).toBe(5);
    const h = damageProfile(combatantFromSheet(bor({ itemNames: [nm('hellforge-plate')] }), { id: 'b', ownerId: 'p' }));
    expect(adjustDamage(10, 'cold', h).amount).toBe(8);
    expect(adjustDamage(10, 'fire', h).amount).toBe(3);
  });
});
