/**
 * Görev D (yalnız arayüz): "bırak / al" düğmeleri, günlük ve Game Master grup adlarında ham kimlik görünmez.
 * Wild Shape biçimindeki druidin saldırı kimliği `beast:giant-frog` düğmede canavarın adıyla ("Giant Frog bırak").
 */
import { afterEach, describe, expect, it } from 'vitest';
import { heldItemName, groupName } from './heldItemName';
import { setLang, t } from '../i18n';
import { describeEvent as lineText } from './log';
import { startBattle } from '../battle/create';
import { mk } from '../battle/fixtures';
import type { BattleEvent } from '../battle/types';

afterEach(() => setLang('tr'));

/** Ham kimlik görünümü: iki nokta üst üste ile önek (`beast:`), küçük harfli tireli kimlik, deve hörgücü grup kimliği. */
const RAW = /\b(beast|karadul):[a-z-]+|\blongsword\b|\bquarterstaff\b|\bgiant-frog\b|iskeleNobeti/;

describe('Görev D: okunur eşya adı', () => {
  it('silah kimliği silah adına (İngilizce ad, SD4)', () => {
    expect(heldItemName('longsword')).toBe('Longsword');
    expect(heldItemName('quarterstaff')).toBe('Quarterstaff');
  });
  it('Wild Shape biçim saldırısı canavarın adına; Karadul biçimi ve bilinmeyen kimlik ham görünmez', () => {
    expect(heldItemName('beast:giant-frog')).toBe('Giant Frog');
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      expect(heldItemName('karadul:spider')).toBe(t().battle.held.spider);
      expect(heldItemName('pk-bilinmez:xyz')).toBe(t().battle.held.unknown);
      // Saldırı seçeneği varsa onun adı.
      expect(heldItemName('pk-bilinmez:xyz', [{ weaponId: 'pk-bilinmez:xyz', label: 'Gölge Kılıcı' }])).toBe('Gölge Kılıcı');
    }
  });
  it('düğme etiketi TR ve EN: "Giant Frog bırak" / "Drop Giant Frog"', () => {
    setLang('tr');
    expect(t().battle.s2.drop(heldItemName('beast:giant-frog'))).toBe('Giant Frog bırak');
    setLang('en');
    expect(t().battle.s2.drop(heldItemName('beast:giant-frog'))).toBe('Drop Giant Frog');
    expect(t().battle.s2.pick(heldItemName('longsword'))).toBe('Pick up Longsword');
  });
  it('günlükte bırakılan eşya okunur adla (TR ve EN)', () => {
    const s = startBattle('b', 'd', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5).state;
    const ev = { type: 'item_dropped', actorId: 'A', item: 'beast:giant-frog', label: 'bıraktı', options: [] } as unknown as BattleEvent;
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      const line = lineText(ev, s);
      expect(line).toContain('Giant Frog');
      expect(line).not.toMatch(RAW);
    }
  });
});

describe('Görev D: okunur grup adı', () => {
  it('bilinen grup kimlikleri çeviri tablosundan, bilinmeyen sözcüklere ayrılır', () => {
    setLang('tr');
    expect(groupName('iskeleNobeti')).toBe('İskele nöbeti');
    expect(groupName('kogus')).toBe('Koğuş');
    expect(groupName('yeniGrupAdi')).toBe('Yeni grup adi');
    setLang('en');
    expect(groupName('iskeleNobeti')).toBe('Pier watch');
    expect(groupName('devriye')).toBe('Patrol');
  });
  it('alarm düğmesi ve günlük satırı ham kimliksiz', () => {
    setLang('tr');
    expect(t().alarm.gm.alarm(groupName('iskeleNobeti'))).not.toMatch(RAW);
    const s = startBattle('b', 'd', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5).state;
    const ev = { type: 'group_alarmed', groupId: 'iskeleNobeti', reason: 'gürültü', round: 1, initiatives: {}, order: [], turnIndex: 0 } as unknown as BattleEvent;
    expect(lineText(ev, s)).toContain('İskele nöbeti');
    expect(lineText(ev, s)).not.toMatch(RAW);
  });
});
