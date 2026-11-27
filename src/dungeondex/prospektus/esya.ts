/**
 * Eşya prospektüsü (silah, zırh, donanım, sihirli eşya): kayıt → bölüm listesi. Veriden gelen bölümler (hasar, menzil,
 * özellikler, DC, kurtarma, alan, süre, uyum, yük, nadirlik, maliyet, ağırlık, oyundaki durum) otomatik; "Ne işe yarar",
 * "Riskler", "Kimler kullanamaz" paragrafları `data/prospektus/esya-<tür>.json` (SRD 5.2.1'den Türkçe özet).
 * Saf modül: React, DOM, localStorage yok; metinler parametreyle gelen dil tablosundan. SRD'nin İngilizce ham metni
 * (`Item.text`) ve sayfa numarası hiç kullanılmaz.
 */
import { aciklamaOf, armor, isMagicItem, items, katalogMonsters, trAciklama, weapons } from '../../data';
import type { Armor, Item, Monster, Weapon } from '../../data';
import type { Lang, Strings } from '../../i18n';
import silahJson from '../../../data/prospektus/esya-silah.json';
import zirhJson from '../../../data/prospektus/esya-zirh.json';
import donanimJson from '../../../data/prospektus/esya-donanim.json';
import sihirliJson from '../../../data/prospektus/esya-sihirli.json';
import siniflandirma from '../../../data/esya-siniflandirma.json';
import { PRO_ORDER, type ProKey, type ProRow, type ProSection, type ProText, type ProTone } from './types';

export type ProStrings = Strings['dex']['pro'];
export type EsyaTur = 'silah' | 'zirh' | 'donanim' | 'sihirli';

interface SilahKayit extends ProText { maliyet?: string; ustalik?: string }
interface ZirhKayit extends ProText { maliyet?: string; giyDk?: number; cikarDk?: number; dex?: boolean; dexMax?: number }
interface DonanimKayit extends ProText { maliyet?: string }
interface SihirliKayit extends ProText { nadirlik?: string; /** Oyun verisinin SRD'den ayrıştığı yer (Türkçe not). */ oyunFarki?: string }
interface ProFile<K> { kayitlar: Record<string, K>; ozellik?: Record<string, string> }

export const ESYA_DATA = {
  silah: silahJson as unknown as ProFile<SilahKayit>,
  zirh: zirhJson as unknown as ProFile<ZirhKayit>,
  donanim: donanimJson as unknown as ProFile<DonanimKayit>,
  sihirli: sihirliJson as unknown as ProFile<SihirliKayit>,
};
const GM = (siniflandirma as unknown as { gm: Record<string, string> }).gm;

/** Zırh kimliği (SRD kimliği; `armor.json` kaydında `srd: "armor:<kimlik>"`). */
const armorId = (a: Armor & { srd?: string }) => (a.srd ? String(a.srd).split(':')[1] : undefined);

/** Kimliğin eşya türü ve oyun kaydı (yoksa null). */
export function findEsya(id: string): { tur: EsyaTur; weapon?: Weapon; armor?: Armor; item?: Item } | null {
  const w = weapons.find((x) => x.id === id);
  if (w) return { tur: 'silah', weapon: w };
  const a = (armor as Array<Armor & { srd?: string }>).find((x) => armorId(x) === id);
  if (a) return { tur: 'zirh', armor: a };
  const i = items.find((x) => x.id === id);
  if (i) return { tur: isMagicItem(i) ? 'sihirli' : 'donanim', item: i };
  return null;
}

/** Bütün eşya kimlikleri (kapsam testi ve kabuk için): silah, zırh, donanım, sihirli eşya. */
export function esyaIds(): Record<EsyaTur, string[]> & { katalog: string[] } {
  return {
    silah: weapons.map((w) => w.id),
    zirh: (armor as Array<Armor & { srd?: string }>).flatMap((a) => armorId(a) ?? []),
    donanim: items.filter((i) => !isMagicItem(i)).map((i) => i.id),
    // Görev KATALOG-1: özgün katalog eşyaları ayrı (prospektüsleri `Item.katalog`'dan; SRD paragraf dosyasında yok).
    sihirli: items.filter((i) => isMagicItem(i) && !i.katalog).map((i) => i.id),
    katalog: items.filter((i) => !!i.katalog).map((i) => i.id),
  };
}

/**
 * Görev MUHUR-TASI-PROSPEKTUS: eşya bir Mühür taşıysa taşa hapsedilmiş Mühür Ruhu (`data/bosslar-muhur.json` kaydında
 * `ganimet` bu kimlik; kademe 1 Çatlak, 2 Uyanmış, 3 Sv.3 taşı). Canavarlar yüklenmemişse ya da taş değilse null.
 */
export function muhurRuhu(id: string): { id: string; name: string; kademe: number } | null {
  const m = katalogMonsters.find((x) => (x as Monster & { ganimet?: string }).ganimet === id) as (Monster & { kademe?: number }) | undefined;
  return m && m.kademe ? { id: m.id, name: m.name, kademe: m.kademe } : null;
}

/** Silah özelliği → `ozellik` anahtarı. */
const weaponProps = (w: Weapon): string[] => [
  w.light && 'light', w.finesse && 'finesse', w.thrown && 'thrown', w.versatileDamage && 'versatile', w.reach && 'reach',
  (w.twoHanded || w.twoHandedUnlessMounted) && 'two-handed', w.heavy && 'heavy', w.loading && 'loading', w.ammunition && 'ammunition',
].filter((x): x is string => !!x);
const PROP_NAME: Record<string, string> = {
  light: 'Light', finesse: 'Finesse', thrown: 'Thrown', versatile: 'Versatile', reach: 'Reach', 'two-handed': 'Two-Handed', heavy: 'Heavy', loading: 'Loading', ammunition: 'Ammunition',
};

/**
 * Eşya prospektüsü. `L` dil tablosunun `dex.pro` bölümü, `lang` Türkçe yazılmış içeriğin İngilizce arayüzde
 * işaretlenmesi için. Bilinmeyen kimlikte null.
 */
export function esyaProspektus(id: string, L: ProStrings, lang: Lang): ProSection[] | null {
  const hit = findEsya(id);
  if (!hit) return null;
  const tr = lang === 'en';
  const par = (text: string | undefined): ProRow[] => (text && text.trim() ? [{ text: text.trim(), trOnly: tr || undefined }] : []);
  const row = (label: string, text: string | undefined | false, trOnly = false): ProRow[] => (text ? [{ label, text, trOnly: (tr && trOnly) || undefined }] : []);
  const dmg = (dice: string, type?: string) => `${dice}${type ? ` ${L.dmg[type.toLowerCase()] ?? type}` : ''}`;
  const S: Record<ProKey, ProRow[]> = { ne: [], nasil: [], etken: [], risk: [], kimler: [], maliyet: [], durum: [] };
  let tone: ProTone = 'none';
  let weight: number | undefined;
  let approx = false;

  if (hit.weapon) {
    const w = hit.weapon;
    const k = ESYA_DATA.silah.kayitlar[id] ?? {};
    const oz = ESYA_DATA.silah.ozellik ?? {};
    const props = weaponProps(w);
    S.ne.push(...par(k.ne));
    S.nasil.push(...par(k.nasil));
    for (const p of props) S.nasil.push(...row(PROP_NAME[p]!, oz[p], true));
    S.etken.push(...row(L.l.category, `${w.category === 'martial' ? L.v.martial : L.v.simple} (${w.ranged ? L.v.ranged : L.v.melee})`));
    S.etken.push(...row(L.l.damage, `${dmg(w.damage, w.damageType)}${w.versatileDamage ? ` (${L.l.twoHand} ${w.versatileDamage})` : ''}`));
    if (w.range) S.etken.push(...row(L.l.range, `${w.range[0]}/${w.range[1]} ft`));
    if (w.reach) S.etken.push(...row(L.l.reach, '10 ft'));
    if (props.length) S.etken.push(...row(L.l.props, props.map((p) => PROP_NAME[p]).join(', ')));
    if (w.ammo) S.etken.push(...row(L.l.props, L.v.ammo(w.ammo)));
    if (k.ustalik) S.etken.push(...row(L.l.mastery, k.ustalik));
    for (const p of props.filter((x) => x === 'heavy' || x === 'loading')) S.risk.push(...row(PROP_NAME[p]!, oz[p], true));
    S.risk.push(...par(k.risk));
    S.kimler.push(...par(k.kimler));
    S.maliyet.push(...row(L.l.cost, k.maliyet));
    weight = w.weight;
    tone = 'ok';
  } else if (hit.armor) {
    const a = hit.armor;
    const k = ESYA_DATA.zirh.kayitlar[id] ?? {};
    const oz = ESYA_DATA.zirh.ozellik ?? {};
    S.ne.push(...par(k.ne));
    S.nasil.push(...par(k.nasil));
    if (k.giyDk !== undefined && k.cikarDk !== undefined) S.nasil.push(...row(L.l.don, L.v.minutes(k.giyDk, k.cikarDk)));
    S.etken.push(...row(L.l.ac, `${a.baseAc}${k.dex ? ` + ${k.dexMax !== undefined ? L.v.dexMax(k.dexMax) : L.v.dexMod}` : ''}`));
    if (a.stealthDisadvantage) S.risk.push(...row(L.l.stealth, L.v.stealthDis));
    if (a.strength) S.risk.push(...row(L.l.strength, L.v.strReq(a.strength)));
    if (a.strength) S.risk.push(...par(oz['guc-sarti']));
    S.risk.push(...par(k.risk));
    S.kimler.push(...par(oz['zirhsiz-giyme']));
    S.kimler.push(...par(k.kimler));
    S.maliyet.push(...row(L.l.cost, k.maliyet));
    weight = a.weight;
    tone = 'ok';
  } else if (hit.item?.katalog) {
    // Görev KATALOG-1: özgün katalog eşyası. Bölümler PDF'ten birebir (`Item.katalog`); her güç durum etiketiyle.
    const it = hit.item;
    const k = it.katalog!;
    const T = true;
    S.ne.push(...par(k.ozet));
    // Görev MUHUR-TASI-PROSPEKTUS: Mühür taşı = taşa hapsedilmiş Mühür Ruhu (yalnız bilgi). Ruh ve kademe tek kaynaktan
    // (`data/bosslar-muhur.json` `ganimet`; `loadMonsters` doldurur), paragraf `aciklamalar-tr/en.json` `muhurTasi`.
    const ruh = muhurRuhu(id);
    if (ruh) {
      S.ne.push(...row(L.muhur.kademe, L.muhur.tier[ruh.kademe] ?? String(ruh.kademe)));
      S.ne.push(...row(L.muhur.ruh, ruh.name));
      const bilgi = aciklamaOf('muhurTasi', id, lang);
      if (bilgi) S.ne.push({ text: bilgi });
      else S.ne.push(...par(trAciklama('muhurTasi', id)));
    }
    for (const o of k.ozellikler) S.nasil.push({ label: `${o.ad} · ${L.katDurum[o.durum] ?? o.durum}`, text: o.not ? `${o.metin} (${o.not})` : o.metin, trOnly: tr || undefined });
    S.etken.push(...row(L.l.category, k.yuva, T));
    S.etken.push(...row(L.l.rarity, L.katNadirlik[k.nadirlik] ?? k.nadirlik));
    if (it.attunement) S.etken.push(...row(L.l.attune, k.uyumKosulu ? `${L.v.attune} (${k.uyumKosulu})` : L.v.attune, !!k.uyumKosulu));
    S.etken.push(...row(L.l.bonus, k.bonus, T));
    S.etken.push(...row(L.l.damage, k.hasar, T));
    S.etken.push(...row(L.l.range, k.menzil, T));
    if (k.silahOzellikleri?.length) S.etken.push(...row(L.l.props, k.silahOzellikleri.join(', ')));
    S.etken.push(...row(L.l.mastery, k.ustalik));
    S.etken.push(...row(L.l.base, k.taban));
    S.etken.push(...row(L.l.baseDiff, k.tabanFarki, T));
    if (it.charges) S.etken.push(...row(L.l.charges, String(it.charges)));
    S.risk.push(...par(k.riskler));
    S.kimler.push(...par(k.kimlerKullanamaz));
    S.maliyet.push(...row(L.l.cost, k.fiyatGp === null ? L.priceless : `${k.fiyatGp} GP`));
    weight = it.weight;
    const n = k.ozellikler.length, ok = k.ozellikler.filter((o) => o.durum === 'calisir').length;
    tone = n === 0 || ok === n ? 'ok' : ok > 0 || k.ozellikler.some((o) => o.durum === 'kismi') ? 'part' : 'none';
    S.durum.push({ label: L.l.source, text: L.katKaynak(k.ref) });
  } else if (hit.item) {
    const it = hit.item;
    const magic = hit.tur === 'sihirli';
    const k: SihirliKayit & DonanimKayit = (magic ? ESYA_DATA.sihirli.kayitlar[id] : ESYA_DATA.donanim.kayitlar[id]) ?? {};
    S.ne.push(...par(k.ne));
    S.nasil.push(...par(k.nasil));
    if (it.attunement) S.nasil.push(...row(L.l.attune, L.v.attune));
    const u = it.use;
    if (u) {
      const act = L.action[(u as { action?: string }).action ?? 'action'] ?? '';
      if (u.kind === 'throw') {
        S.nasil.push(...row(L.l.range, k.nasil ? `${u.rangeFt} ft` : L.v.throwUse(u.rangeFt)));
        if (u.damage) S.etken.push(...row(L.l.damage, dmg(u.damage, u.damageType)));
        const ab = L.ab[u.save] ?? u.save;
        S.etken.push(...row(L.l.save, u.dc ? L.v.dc(ab, u.dc) : `${ab}, ${L.v.dcFormula('DEX')}`));
        if (u.radiusFt) S.etken.push(...row(L.l.area, `${u.radiusFt} ft`));
        if (u.burning) S.etken.push(...row(L.l.burning, dmg(u.burning, u.damageType)));
        if (u.grants?.length) S.etken.push(...row(L.l.conditions, u.grants.join(', ')));
        if (u.escapeDc) S.etken.push(...row(L.l.escape, `DC ${u.escapeDc}`));
        if (u.vs?.length) S.kimler.push(...row(L.l.damage, L.v.vs(u.vs.join(', '))));
      } else if (u.kind === 'heal') {
        S.nasil.push(...row(L.action[u.action] ?? '', L.v.healUse(act, u.reachFt)));
        S.etken.push(...row(L.l.heal, u.dice));
      } else if (u.kind === 'effect') {
        S.nasil.push(...row(L.action[u.action] ?? '', L.v.effectUse(act, u.reachFt)));
        if (u.tempHp) S.etken.push(...row(L.l.tempHp, u.tempHp));
        if (u.damage) S.etken.push(...row(L.l.damage, dmg(u.damage, u.damageType)));
        if (u.save) S.etken.push(...row(L.l.save, L.v.dc(L.ab[u.save.ability] ?? u.save.ability, u.save.dc)));
        if (u.rounds) S.etken.push(...row(L.l.duration, L.v.rounds(u.rounds)));
      } else if (u.kind === 'coat') {
        S.nasil.push(...row(L.l.coat, L.v.coatUse(act)));
        S.etken.push(...row(L.l.damage, dmg(u.dice, u.damageType)));
        if (u.rounds) S.etken.push(...row(L.l.duration, L.v.rounds(u.rounds)));
      }
    }
    const b = it.bonus;
    if (b?.weapon) S.etken.push(...row(L.l.bonus, L.v.weapon(b.weapon)));
    if (b?.armor || b?.shield) S.etken.push(...row(L.l.bonus, L.v.armor((b.armor ?? 0) + (b.shield ?? 0))));
    if (b?.spell) S.etken.push(...row(L.l.bonus, L.v.spell(b.spell)));
    const e = it.effects ?? {};
    const ac = (e.acBonus ?? 0) + (e.armorAcBonus ?? 0) + (e.shieldAcBonus ?? 0);
    if (ac && !b?.armor && !b?.shield) S.etken.push(...row(L.l.bonus, L.v.armor(ac)));
    if (e.saveBonus) S.etken.push(...row(L.l.bonus, L.v.save(e.saveBonus)));
    if (e.unarmoredAcBonus) S.etken.push(...row(L.l.bonus, L.v.unarmored(e.unarmoredAcBonus)));
    for (const [ab, v] of Object.entries(e.setAbility ?? {})) if (v !== undefined) S.etken.push(...row(L.l.setAbility, `${L.ab[ab] ?? ab} ${v}`));
    if (it.onHit && it.onHit.dice !== '0') {
      const extra = [it.onHit.vs?.length ? L.v.vs(it.onHit.vs.join(', ')) : '', it.onHit.critOnly ? L.v.critOnly : ''].filter(Boolean).join('; ');
      S.etken.push(...row(L.l.onHit, `${dmg(it.onHit.dice, it.onHit.type)}${extra ? ` (${extra})` : ''}`));
    }
    if (it.spells?.length) S.etken.push(...row(L.l.spells, it.spells.map((s) => (s.cost ? `${s.name} (${L.v.perCast(s.cost)})` : s.name)).join(', ')));
    if (it.charges) S.etken.push(...row(L.l.charges, String(it.charges)));
    if (it.dc) S.etken.push(...row(L.l.fixedDc, `DC ${it.dc}`));
    S.risk.push(...par(k.risk));
    S.kimler.push(...par(k.kimler));
    if (!magic) S.maliyet.push(...row(L.l.cost, k.maliyet));
    if (magic && k.nadirlik) S.maliyet.push(...row(L.l.rarity, L.rarity[k.nadirlik] ?? k.nadirlik));
    weight = it.weight;
    approx = !!it.weightApprox;
    const mech = Object.keys(e).length > 0 || !!(it.use || it.spells?.length || it.bonus || it.onHit || it.attack || it.paket || (it.passive && Object.keys(it.passive).length));
    tone = it.offCombat ? 'off' : GM[id] ? 'gm' : mech ? 'ok' : 'none';
    const note = it.offCombat ?? GM[id];
    if (note) S.durum.push({ label: L.l.reason, text: note, trOnly: tr || undefined });
    if (k.oyunFarki) S.durum.push({ label: L.l.diff, text: k.oyunFarki, trOnly: tr || undefined });
  }
  if (weight) S.maliyet.push(...row(L.l.weight, approx ? L.v.approx(`${weight} lb`) : `${weight} lb`));

  return PRO_ORDER.flatMap((key): ProSection[] => {
    if (key === 'durum') return [{ key, title: L.sec[key] ?? key, rows: S.durum, badge: { tone, text: L.badge[tone] ?? tone } }];
    return S[key].length ? [{ key, title: L.sec[key] ?? key, rows: S[key] }] : [];
  });
}
