/**
 * Görev SD3: Donanım adımı. İki bölüm: "Seçtiklerin" (zırh, silahlar, eşyalar; her birinin dürüst sayacı) ve
 * "Zaten sende (otomatik)" (silahsız vuruş, eğitimlerin). Kurallar değişmedi (koddan doğrulandı):
 * - zırh: tam bir gövde zırhı (varsayılan Zırhsız) + isteğe bağlı kalkan; eğitimsiz kuşanmak engellenmez, ceza uyarısı;
 * - silah: sayı sınırı yok (yalnız taşıma sınırı); Weapon Mastery hakkı sınıf tablosundan (`masteryRight`), yalnız uygun silahlarda;
 * - eşya: yalnız uyum (attunement) gerektirenler sayılır, en çok `MAX_ATTUNED` (3); diğerlerinin sayı sınırı yok;
 * - taşıma: Ayarlar'daki taşıma kuralı (SRD: Güç × 15 lb aşılamaz).
 * Seçilmişler hep görünür; ekleme listeleri ("Silah ekle", "Eşya ekle") katlanır.
 */
import { useState } from 'react';
import { armor, weapons, items } from '../../data';
import { masteryDescription, propertyDescription, weaponPropertyKeys } from '../../ui/descriptions';
import { carryLoad, type CarryLoad, type CarryRule } from '../../rules/carry';
import { MAX_ATTUNED, armorProficient, type CharacterSheet } from '../../rules/stats';
import { masteryOptions, masteryRight, masteryText, masteryWorks, weaponMasteryId, weaponProficient } from '../../rules/mastery';
import { offHandOptionProblem, offHandProblem } from '../../rules/hands';
import { getClass } from '../../data';
import { ITEM_KINDS, ITEM_TIERS, itemKind, itemTier, type ItemKind, type ItemTier } from '../../rules/itemCategory';
import { armorDetail, armorSummary, itemDetail, itemSummary, weaponDetail } from '../../ui/equipmentText';
import { getLang, t } from '../../i18n';
import { Fold, InfoPop, toggle } from './shared';

type SetFn = (patch: Partial<CharacterSheet>) => void;

/** Silahın tek satırlık özeti: hasar + tür + yakın/menzilli (özellik terimleri ⓘ'de). */
function weaponLine(w: (typeof weapons)[number]): string {
  const e = t().equip;
  return `${w.damage} ${e.damageType[w.damageType] ?? w.damageType} · ${w.ranged ? e.ranged : e.melee}`;
}

/** Silahın ⓘ metni: İngilizce adı, özellik terimleri ve ustalığı (düz açıklamalarıyla). */
function weaponTip(w: (typeof weapons)[number]): string {
  const W = t().builder.wiz;
  const mid = weaponMasteryId(w.id);
  const mText = mid ? masteryText(mid) : undefined;
  const props = weaponPropertyKeys(w).map((k) => `${W.propName[k] ?? k}: ${propertyDescription(k, getLang())}`);
  const mastery = mid && mText ? [`${mText.name}: ${masteryDescription(mid, getLang())}${!masteryWorks(mid) ? ` (${W.soonTag})` : ''}`] : [];
  return [weaponDetail(w), ...props, ...mastery].filter(Boolean).join('\n');
}

export function EquipmentStep({ sheet: s, set, carryRule }: { sheet: CharacterSheet; set: SetFn; carryRule: CarryRule }) {
  const L = t();
  const T = L.builder;
  const W = T.wiz;
  const lang = getLang();
  const cls = getClass(s.classId);
  const chosenArmor = armor.find((a) => a.name === s.armorName);
  const kind = chosenArmor?.type ?? 'none';
  const right = masteryRight(s);
  const eligible = new Set(masteryOptions(s).map((w) => w.id));
  const chosenM = s.weaponMasteries ?? [];
  const trained = (k: 'light' | 'medium' | 'heavy' | 'shield') => armorProficient(s.classId, k, s.featureChoices, s);
  // Görev B1 (kuyruk 14): eğitimsiz zırh/kalkan kuşanmadan önce uyarı ve onay (engel yok; SRD 5.2.1 Armor Training).
  const [pending, setPending] = useState<{ armorName?: string; shield?: true } | null>(null);
  const wearArmor = (name: string) => {
    const a = armor.find((x) => x.name === name);
    if (name !== s.armorName && !armorProficient(s.classId, a?.type, s.featureChoices, s)) setPending({ armorName: name });
    else { setPending(null); set({ armorName: name }); }
  };
  const toggleShield = () => {
    if (!s.shield && !trained('shield')) { setPending({ shield: true }); return; }
    setPending(null);
    set({ shield: !s.shield, ...(!s.shield ? { offHand: undefined } : {}) });
  };
  const kindBtn = (k: 'none' | 'light' | 'medium' | 'heavy') => (
    <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''}
      onClick={() => { const first = armor.find((a) => (a.type ?? 'none') === k); if (first) wearArmor(first.name); }}>{W.armorKinds[k]}</button>
  );
  const allKinds = ['none', 'light', 'medium', 'heavy'] as const;
  const okKinds = allKinds.filter((k) => k === 'none' || trained(k) || kind === k);
  const noKinds = allKinds.filter((k) => !okKinds.includes(k));
  const shieldOk = trained('shield') || !!s.shield;

  const chosenWeapons = (s.weapons ?? []).map((x) => weapons.find((w) => w.name === x.name)).filter((w): w is (typeof weapons)[number] => !!w);
  const addable = weapons.filter((w) => !chosenWeapons.some((c) => c.name === w.name));
  const [onlyProficient, setOnlyProficient] = useState(true);
  const addShown = addable.filter((w) => !onlyProficient || weaponProficient(s.classId, w, s.featureChoices, s));
  const setWeapon = (w: (typeof weapons)[number], on: boolean) => set({
    weapons: on ? [...(s.weapons ?? []), { name: w.name }] : (s.weapons ?? []).filter((x) => x.name !== w.name),
    // Yan el silahı çıkarılınca ya da iki elli silah eklenince yan el boşalır.
    ...(s.offHand && ((!on && w.name === s.offHand) || (on && w.twoHanded && !w.ranged)) ? { offHand: undefined } : {}),
  });

  const attuned = s.itemNames.filter((n) => items.find((i) => i.name === n)?.attunement).length;
  const attuneFull = attuned >= MAX_ATTUNED;
  const chosenItems = s.itemNames.map((n) => items.find((i) => i.name === n)).filter((i): i is (typeof items)[number] => !!i);
  const [itemQ, setItemQ] = useState('');
  const [kindF, setKindF] = useState<ItemKind | null>(null);
  const [tierF, setTierF] = useState<ItemTier | null>(null);
  const load = carryLoad(s, carryRule);
  const lb = (w: number | undefined, approx = false) => <small className="weight">{L.carry.weight(w ?? 0, approx)}</small>;

  const lights = chosenWeapons.filter((w) => w.light);
  const handOptions = lights.filter((w) => offHandOptionProblem(s, w.name) === null);

  return (
    <>
      <CarryBar load={load} rule={carryRule} />

      <section className="eq-block eq-chosen">
        <h3>{W.eqChosen}</h3>

        {/* Zırh: tam bir seçim (1/1) + isteğe bağlı kalkan. */}
        <div className="eq-group">
          <p className="counters"><b>{T.armor}</b> <span className="ok">{W.eqCount(1, 1)}</span>{chosenArmor && <InfoPop text={`${armorDetail(chosenArmor)}${s.shield ? ` ${L.equip.shieldDetail}` : ''}`} />}</p>
          <div className="seg" role="radiogroup" aria-label={T.armor}>
            {okKinds.map(kindBtn)}
            {shieldOk && (
              <button aria-pressed={!!s.shield} className={s.shield ? 'on' : ''} title={L.equip.shieldDetail} onClick={toggleShield}>{W.shieldBtn}</button>
            )}
          </div>
          {kind !== 'none' && (
            <div className="card-grid">
              {armor.filter((a) => (a.type ?? 'none') === kind).map((a) => (
                <button key={a.name} className={`pick-card${a.name === s.armorName ? ' on' : ''}`} aria-pressed={a.name === s.armorName} title={armorDetail(a)}
                  onClick={() => wearArmor(a.name)}><b>{a.name}</b><small>{armorSummary(a)}</small>{lb(a.weight)}</button>
              ))}
            </div>
          )}
          {(noKinds.length > 0 || !shieldOk) && (
            <Fold title={W.untrainedFold} className="eq-untrained">
              <p className="mute">{W.untrainedHint}</p>
              <div className="seg" role="radiogroup" aria-label={W.untrainedFold}>
                {noKinds.map(kindBtn)}
                {!shieldOk && <button aria-pressed={!!s.shield} className={s.shield ? 'on' : ''} onClick={toggleShield}>{W.shieldBtn}</button>}
              </div>
            </Fold>
          )}
          {pending && (
            <div className="warn armor-confirm" role="alertdialog" aria-label={pending.shield ? W.shieldConfirm : W.armorConfirm}>
              <p>⚠ {pending.shield ? W.shieldConfirm : W.armorConfirm}</p>
              <button type="button" onClick={() => {
                if (pending.shield) set({ shield: true, offHand: undefined }); else if (pending.armorName) set({ armorName: pending.armorName });
                setPending(null);
              }}>{W.wearAnyway}</button>
              <button type="button" onClick={() => setPending(null)}>{L.common.cancel}</button>
            </div>
          )}
          {/* Görev K9d: eğitimsiz zırh ve kalkan uyarısı (SRD 5.2.1 Armor Training). */}
          {!armorProficient(s.classId, chosenArmor?.type, s.featureChoices, s) && <p className="warn armor-warn">{W.armorUntrained}</p>}
          {s.shield && !trained('shield') && <p className="warn armor-warn">{W.shieldUntrained}</p>}
        </div>

        {/* Silahlar: sayı sınırı yok; ustalık hakkı ayrı sayaç. */}
        <div className="eq-group">
          <p className="counters"><b>{T.weapons}</b> <span>{W.weaponsChosen(chosenWeapons.length)}</span>
            {right && <span className={chosenM.length === right.count ? 'ok' : ''}>{W.masteryCount(chosenM.length, right.count)}</span>}</p>
          {chosenWeapons.length === 0 && <p className="mute">{T.sumNoWeapon}</p>}
          <ul className="eq-list">
            {chosenWeapons.map((w) => {
              const mid = weaponMasteryId(w.id);
              const mText = mid ? masteryText(mid) : undefined;
              const mOn = chosenM.includes(w.id);
              const full = chosenM.length >= (right?.count ?? 0);
              return (
                <li key={w.name} className="eq-row on">
                  <span className="eq-main"><b>{w.name}</b><small>{weaponLine(w)}</small>{lb(w.weight)}</span>
                  <InfoPop text={weaponTip(w)} />
                  {right && eligible.has(w.id) && mText && (
                    <button className={`mastery-btn star${mOn ? ' on' : ''}`} aria-pressed={mOn} disabled={!mOn && full}
                      aria-label={mOn ? W.masteryStarOn(mText.name) : W.masteryStarOff(mText.name)}
                      title={!mOn && full ? W.limitFull(right.count) : mOn ? W.masteryStarOn(mText.name) : W.masteryStarOff(mText.name)}
                      onClick={() => set({ weaponMasteries: toggle(chosenM, w.id, !mOn) })}>{mOn ? '★' : '☆'} <small>{W.masteryWord}</small></button>
                  )}
                  <button className="ghost eq-remove" aria-label={W.removeItem(w.name)} onClick={() => setWeapon(w, false)}>×</button>
                </li>
              );
            })}
          </ul>
          {right && chosenM.length >= right.count && <p className="mute limit-note">{W.masteryFull(right.count)}</p>}
          <Fold title={W.addWeapon} summary={`(${addShown.length})`} className="eq-add">
            <label className="toggle prof-filter"><input type="checkbox" checked={onlyProficient}
              onChange={(e: { target: { checked: boolean } }) => setOnlyProficient(e.target.checked)} /> {W.onlyProficient}</label>
            <div className="card-grid weapons">
              {addShown.map((w) => (
                <button key={w.name} className="pick-card weapon" title={weaponDetail(w)} onClick={() => setWeapon(w, true)}>
                  <b>{w.name}</b><small>{weaponLine(w)}</small>
                </button>
              ))}
            </div>
          </Fold>
          {handOptions.length > 0 || s.offHand ? (
            <Fold title={T.offHand} summary={s.offHand ? s.offHand : W.noneShort} className="eq-offhand">
              <label>{T.offHand}
                <select aria-label={T.offHand} value={s.offHand ?? ''} onChange={(e: { target: { value: string } }) => set({ offHand: e.target.value || undefined })}>
                  <option value="">{T.offHandEmpty}</option>
                  {handOptions.map((w) => <option key={w.name} value={w.name}>{w.name}</option>)}
                  {s.offHand && !handOptions.some((w) => w.name === s.offHand) && <option value={s.offHand}>{s.offHand}</option>}
                </select>
              </label>
              <small className="mute">{s.offHand ? (offHandProblem(s) ?? W.offHandShort) : W.offHandShort}</small>
            </Fold>
          ) : null}
        </div>

        {/* Eşyalar: yalnız uyum gerektirenler sayılır (en çok 3). */}
        <div className="eq-group">
          <p className="counters"><b>{T.items}</b> <span>{W.itemsChosen(chosenItems.length)}</span>
            <span className={attuneFull ? 'ok' : ''}>{W.attuneCount(attuned, MAX_ATTUNED)}<InfoPop text={W.attuneInfo(MAX_ATTUNED)} /></span></p>
          {chosenItems.length === 0 && <p className="mute">{W.noItems}</p>}
          <ul className="eq-list">
            {chosenItems.map((it) => (
              <li key={it.name} className="eq-row on">
                <span className="eq-main"><b>{it.name}</b><small>{itemSummary(it)}</small>{lb(it.weight, it.weightApprox)}</span>
                <InfoPop text={itemDetail(it)} />
                <button className="ghost eq-remove" aria-label={W.removeItem(it.name)} onClick={() => set({ itemNames: toggle(s.itemNames, it.name, false) })}>×</button>
              </li>
            ))}
          </ul>
          {attuneFull && <p className="mute limit-note">{W.attuneFull(MAX_ATTUNED)}</p>}
          <Fold title={W.addItem} summary={`(${items.length})`} className="eq-add">
            <input className="item-filter" type="search" placeholder={W.itemFilter} value={itemQ} onChange={(e: { target: { value: string } }) => setItemQ(e.target.value)} />
            {/* Kuyruk K49 B6: türe ve etki seviyesine göre çip süzgeçleri; seçili eşya yukarıda görünür. */}
            <div className="chips item-kind-filter" role="group" aria-label={T.items}>
              <button type="button" className={`chip${!kindF ? ' on' : ''}`} aria-pressed={!kindF} onClick={() => setKindF(null)}>{W.itemAll}</button>
              {ITEM_KINDS.map((k) => <button key={k} type="button" className={`chip${kindF === k ? ' on' : ''}`} aria-pressed={kindF === k} onClick={() => setKindF(kindF === k ? null : k)}>{W.itemKinds[k]}</button>)}
            </div>
            <div className="chips item-tier-filter" role="group">
              <button type="button" className={`chip${!tierF ? ' on' : ''}`} aria-pressed={!tierF} onClick={() => setTierF(null)}>{W.itemAll}</button>
              {ITEM_TIERS.map((k) => <button key={k} type="button" className={`chip tier-${k}${tierF === k ? ' on' : ''}`} aria-pressed={tierF === k} onClick={() => setTierF(tierF === k ? null : k)}>{W.itemTiers[k]}</button>)}
            </div>
            {ITEM_KINDS.filter((k) => !kindF || kindF === k).map((k) => {
              const all = items.filter((it) => itemKind(it) === k);
              const list = all.filter((it) => !s.itemNames.includes(it.name) && (!tierF || itemTier(it) === tierF)
                && (!itemQ || it.name.toLowerCase().includes(itemQ.toLowerCase())));
              if (!list.length) return null;
              const filtered = !!(itemQ || tierF || kindF);
              return (
                <Fold key={k} title={W.itemKinds[k]} summary={W.itemGroupCount(list.length, all.length)} open={filtered} className="item-group">
                  <div className="chips equip-chips">
                    {list.map((it) => {
                      const locked = !!it.attunement && attuneFull;
                      return (
                        <label key={it.name} className={`chip equip tier-${itemTier(it)}`} title={locked ? W.attuneFull(MAX_ATTUNED) : itemDetail(it)}>
                          {/* Görev K4: uyum (attunement) sınırı: dördüncü uyumlu eşya seçilemez; nedeni ipucunda ve listenin üstünde. */}
                          <input type="checkbox" checked={false} disabled={locked}
                            onChange={(e: { target: { checked: boolean } }) => set({ itemNames: toggle(s.itemNames, it.name, e.target.checked) })} />
                          <span><b>{it.name}</b><small>{itemSummary(it)}</small>{it.attunement && <small className="mute">{W.attuneTag}</small>}{lb(it.weight, it.weightApprox)}</span>
                        </label>
                      );
                    })}
                  </div>
                </Fold>
              );
            })}
          </Fold>
        </div>
      </section>

      <section className="eq-block eq-auto">
        <h3>{W.eqAuto}</h3>
        <ul className="eq-list auto">
          <li className="eq-row"><span className="eq-main"><b>{W.autoUnarmed}</b><small>{W.autoUnarmedText}</small></span></li>
          <li className="eq-row"><span className="eq-main"><b>{W.autoTraining}</b>
            <small>{W.autoTrainingText(
              cls.armorTraining.length ? cls.armorTraining.map((k) => (k === 'shield' ? W.shieldBtn : W.armorKinds[k])).join(', ') : W.noneShort,
              cls.weaponProficiency === 'martial' ? W.weaponsMartial : cls.martialWeaponProperties.length ? W.weaponsSimplePlus : W.weaponsSimple)}</small></span></li>
        </ul>
      </section>
    </>
  );
}

/**
 * Görev K5: "Taşınan 82 / 120 lb" çubuğu; kademeli kuralda Yüklü ve Ağır yüklü eşikleri işaretli; aşınca kırmızı uyarı.
 */
function CarryBar(props: { load: CarryLoad; rule: CarryRule }) {
  const K = t().carry;
  const { weight, capacity, encumberedAt, heavyAt, level } = props.load;
  const pct = (v: number) => `${Math.min(100, (v / Math.max(1, capacity)) * 100)}%`;
  return (
    <div className={`carry-bar${level !== 'ok' ? ` ${level}` : ''}`} aria-label={K.bar(weight, capacity)}>
      <span className="carry-text"><b>{K.bar(weight, capacity)}</b>{level !== 'ok' ? <span className="carry-level"> · {K.level[level]}</span> : null}</span>
      <span className="meter">
        <span className="fill" style={{ width: pct(weight) }} />
        {props.rule === 'tiered' && <><i className="tick" style={{ left: pct(encumberedAt) }} /><i className="tick" style={{ left: pct(heavyAt) }} /></>}
      </span>
      {props.rule === 'tiered' && <small className="mute">{K.marks(encumberedAt, heavyAt)}</small>}
      {level === 'over' && props.rule !== 'off' && <p className="error carry-over">{K.over}</p>}
    </div>
  );
}
