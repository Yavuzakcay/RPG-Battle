/**
 * Görev MC2 "eski = yeni" derlemi: tek sınıflı karakterlerin türetme, dinlenme ve oluşturucu sonuçları. Yalnız MC2 öncesinde
 * de var olan API'leri kullanır; aynı dosya MC2 öncesi commit'te (`cdc8c2a0`) çalıştırılarak `mc2-eski-yeni.json` altın
 * değerleri üretildi (her durumun JSON'unun FNV-1a özeti). Test (`src/rules/mc2.test.ts`) bugünkü kodla aynı özetleri bekler.
 *
 * Yeniden üretmek (yalnız bilinçli bir davranış değişikliğinde):
 *   npx vite-node scripts/mc2-eski-yeni.ts   (betik bu yardımcıyı çağırıp JSON'u yazar)
 */
import { partyAt, PARTY_KINDS } from '../../sim/balance';
import { deriveStats, finalScores, spellSlotsFor, type CharacterSheet } from '../stats';
import { currentStatus, fullStatus, longRestStatus, shortRestStatus } from '../characterRest';
import { advancementProblems, advancementSlots, casterCtx } from '../advancement';
import { characterIssues, classScoped, newCharacter, type SavedCharacter } from '../builder';
import { masteryOptions } from '../mastery';
import { demoCharacters } from '../../screens/fixtures';
import { classes } from '../../data';

/** FNV-1a 32 bit (onaltılık). */
export function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/** Sabit tohumlu basit Rng (dinlenme zarları). */
const lcg = (seed: number) => { let x = seed; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };

const safe = (f: () => unknown): unknown => { try { return f(); } catch (e) { return { hata: e instanceof Error ? e.message : String(e) }; } };

function sheetCase(sheet: CharacterSheet): unknown {
  return {
    derived: safe(() => deriveStats(sheet)),
    scores: safe(() => finalScores(sheet)),
    slots: safe(() => spellSlotsFor(sheet.classId, sheet.level)),
    full: safe(() => fullStatus(sheet)),
    rest: safe(() => {
      const f = fullStatus(sheet);
      const hurt = { ...f, hp: Math.max(1, Math.floor(f.hp / 3)), hitDiceSpent: Math.min(sheet.level, 1), slots: f.slots.map((n) => Math.max(0, n - 1)) };
      const short = shortRestStatus(sheet, hurt, 2, lcg(sheet.level * 7 + sheet.name.length));
      return { current: currentStatus(sheet, hurt), short, long: longRestStatus(sheet, short.status, lcg(3)) };
    }),
    adv: safe(() => advancementSlots(sheet.classId, sheet.level, sheet.subclassId)),
    advProblems: safe(() => advancementProblems(sheet, { scores: finalScores({ ...sheet, advancements: [] }), ...casterCtx(sheet.classId, sheet.level, sheet.subclassId) })),
    scoped: safe(() => classScoped(sheet)),
    mastery: safe(() => masteryOptions(sheet).map((w) => w.id)),
  };
}

function savedCase(c: SavedCharacter): unknown {
  return { issues: safe(() => characterIssues(c)), sheet: sheetCase(c.sheet) };
}

/** Durum anahtarı → JSON metni. Sim üyeleri (her parti, 1–20. seviye), örnek karakterler, her sınıf için yeni karakter. */
export function mc2Corpus(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const kind of Object.keys(PARTY_KINDS)) {
    for (let level = 1; level <= 20; level++) {
      let sheets: CharacterSheet[];
      try { sheets = partyAt(level, kind); } catch { continue; }
      for (const s of sheets) {
        const key = `sim/${s.name}/${s.classId}/${level}`;
        if (!(key in out)) out[key] = JSON.stringify(sheetCase(s));
      }
    }
  }
  demoCharacters().forEach((c, i) => { out[`demo/${i}/${c.sheet.name}`] = JSON.stringify(savedCase({ ...c, id: `demo-${i}` })); });
  for (const k of classes) {
    const c = newCharacter(`yeni-${k.id}`);
    for (const level of [1, 3, 5, 11, 20]) {
      const sheet = { ...c.sheet, classId: k.id, level };
      out[`yeni/${k.id}/${level}`] = JSON.stringify(savedCase({ ...c, sheet }));
    }
  }
  return out;
}

/** Derlemin özetleri (fikstür biçimi). */
export const mc2Hashes = (): Record<string, string> => Object.fromEntries(Object.entries(mc2Corpus()).map(([k, v]) => [k, fnv(v)]));
