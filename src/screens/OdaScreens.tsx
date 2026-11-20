/**
 * Görev OD1: yerel "Oda kur" (Game Master) ve "Odaya katıl" (oyuncu) ekranları, ağ yok, tek cihaz. Oda verisi `src/oda/`
 * katmanında (saf model + saklama); bu dosya yalnız çizer ve komut verir. Oda kur, eski Game Master kurulumunun yerini alır:
 * kurulum içeriği (`GmScreen`) oda düzenleyicisinin içinde; oda ayarları üstte `RoomPanel`'de. Sonraki çevrimiçi aşama aynı
 * ekranlara bağlanacak.
 */
import { useState } from 'react';
import { t, getLang } from '../i18n';
import { classes } from '../data';
import { GmScreen } from './GmScreen';
import { RoomRules } from '../ui/settings/RoomRules';
import { SegRow } from '../ui/settings/SegRow';
import { DICE_MODES, type DiceMode } from '../rules/manualDice';
import { HP_VIS, setRoomOverlay, type HpVis, type RoomOverlay } from '../oda/active';
import { overlayOf, rulesSummary, cleanName, ODA_AD_MAX, type AiDiff, type Oda, type OdaKurallar } from '../oda/model';
import { createRoom, deleteRoom, isLocked, joinRoom, leaveRoom, loadRooms, renameRoom, saveRooms, unlockRoom, updateRoom } from '../oda/store';
import { alignmentEnabled, journeyEnabled } from '../app/features';
import { storedCarryRule } from '../ui/carrySetting';
import { loadSettings } from '../app/discovery';
import { hasSavedBattle } from '../app/saveKey';
import { MAX_PARTY } from '../app/limits';
import { characterProblems, type SavedCharacter } from '../rules/builder';
import { alignmentAutoOnly, alignmentMoralEnabled, alignmentRace } from '../app/features';
import type { Session } from '../ui/session';
import type { GoalsDraft } from '../oda/hedef';

/** Yeni odanın kuralları: cihazın o anki genel değerlerinin kopyası (oda kaydı kendi kopyasını taşır). */
export function globalRules(): OdaKurallar {
  const pv = loadSettings();
  return {
    tasima: storedCarryRule(), hizalanma: alignmentEnabled(), hizalanmaIrk: alignmentRace(),
    hizalanmaYalnizOtomatik: alignmentAutoOnly(), hizalanmaMoral: alignmentMoralEnabled(), kesif: pv.discovery, ipucu: pv.hints, yolculuk: journeyEnabled(),
  };
}

const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;
const dateText = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Oda listesi hesabı: kilit yalnız kayıtlı savaş varken geçerli; kalmadıysa kendiliğinden açılır. */
function useRooms(): [Oda[], (fn: (l: Oda[]) => Oda[]) => void] {
  const [rooms, setRooms] = useState<Oda[]>(() => {
    const saved = hasSavedBattle();
    const l = loadRooms();
    return l.some((o) => o.kilit && !saved) ? l.map((o) => (o.kilit && !saved ? unlockRoom(o) : o)) : l;
  });
  const commit = (fn: (l: Oda[]) => Oda[]) => setRooms((cur) => { const next = fn(cur); saveRooms(next); return next; });
  return [rooms, commit];
}

function RoomLine(props: { room: Oda }) {
  const O = t().oda;
  return (
    <span className="oda-line">
      <small className="mute">{O.lineGm(props.room.gmAdi)} · {O.lineParty(props.room.parti.length)} · {O.lineLast(dateText(props.room.sonSavas?.zaman))}</small>
    </span>
  );
}

/** Oda adı ve Game Master adı (yeniden adlandırma). */
function NameForm(props: { room: Oda; onSave: (ad: string, gm: string) => void; disabled?: boolean }) {
  const O = t().oda;
  const [ad, setAd] = useState(props.room.ad);
  const [gm, setGm] = useState(props.room.gmAdi);
  return (
    <div className="oda-name">
      <label>{O.roomName} <input value={ad} maxLength={ODA_AD_MAX} aria-label={O.roomName} onChange={(e: { target: { value: string } }) => setAd(e.target.value)} /></label>
      <label>{O.gmName} <input value={gm} maxLength={ODA_AD_MAX} aria-label={O.gmName} placeholder={O.gmNamePlaceholder} onChange={(e: { target: { value: string } }) => setGm(e.target.value)} /></label>
      <button type="button" className="ghost" disabled={!cleanName(ad) || (cleanName(ad) === props.room.ad && gm.trim() === props.room.gmAdi)} onClick={() => props.onSave(ad, gm)}>{O.save}</button>
    </div>
  );
}

/** Game Master'ın oda ayarları: zar modu, düşman HP görünürlüğü, yapay zekâ zorluğu, oda kuralları; savaş sürerken kilitli. */
export function RoomPanel(props: { room: Oda; locked: boolean; onChange: (fn: (o: Oda) => Oda) => void; onRename: (ad: string, gm: string) => void;
  onUnlock: () => void; onBackToBattle?: () => void }) {
  const O = t().oda, G = t().gm, D = t().dice;
  const a = props.room.ayarlar;
  const set = (p: Partial<typeof a>) => props.onChange((o) => ({ ...o, ayarlar: { ...o.ayarlar, ...p } }));
  const aiLabel = (k: AiDiff): string => G.aiDifficulty[k] ?? k;
  return (
    <section className="panel oda-panel">
      <NameForm key={`${props.room.ad}|${props.room.gmAdi}`} room={props.room} onSave={props.onRename} />
      {props.locked && (
        <div className="oda-lock-note" role="status">
          <strong>{O.locked}</strong> <span className="mute">{O.lockedHelp}</span>
          <div className="set-btns">
            {props.onBackToBattle && <button type="button" className="cta" onClick={props.onBackToBattle}>{O.backToBattle}</button>}
            <button type="button" className="ghost" title={O.unlockWarn} onClick={props.onUnlock}>{O.unlock}</button>
          </div>
        </div>
      )}
      <fieldset className="oda-lock" disabled={props.locked}>
        <h2>{O.settings}</h2>
        <p className="mute">{O.settingsHelp}</p>
        <SegRow label={D.mode.label} help={a.zarModu !== 'auto' ? D.mode.note : undefined} value={a.zarModu} options={DICE_MODES.map((m) => ({ value: m, label: D.mode[m] }))} onChange={(v: DiceMode) => set({ zarModu: v })} />
        <SegRow label={O.hpVis} help={O.hpVisHelp[a.hpGorunurluk]} value={a.hpGorunurluk} options={HP_VIS.map((m) => ({ value: m, label: O.hp[m] ?? m }))} onChange={(v: HpVis) => set({ hpGorunurluk: v })} />
        {(['party', 'enemies'] as const).map((side) => (
          <SegRow key={side} label={`${G.aiDifficulty.label}: ${G.aiDifficulty[side]}`} value={a.zorluk[side]}
            options={(['kolay', 'normal', 'usta'] as const).map((k) => ({ value: k, label: aiLabel(k) }))} onChange={(v: AiDiff) => set({ zorluk: { ...a.zorluk, [side]: v } })} />
        ))}
        <RoomRules value={a.kurallar} disabled={props.locked} onChange={(kurallar) => set({ kurallar })} />
      </fieldset>
    </section>
  );
}

/** Oda kur: oda listesi + oda düzenleyicisi (eski Game Master kurulumu içinde). */
export function OdaKur(props: {
  characters: SavedCharacter[]; onBack: () => void; onStart: (s: Session, odaId: string, goalDraft?: GoalsDraft) => void;
  onUpdateCharacters?: (list: SavedCharacter[]) => void; onSefer?: (id: string) => void;
  /** Kayıtlı savaşa bu odadan dön (App kaydı yükler). */
  onResume?: (odaId: string) => void; roomId?: string;
}) {
  const O = t().oda, C = t().common;
  const [rooms, commit] = useRooms();
  const [sel, setSel] = useState<string | null>(props.roomId ?? null);
  const [name, setName] = useState('');
  const [gm, setGm] = useState('');
  const [rename, setRename] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const room = sel ? rooms.find((r) => r.id === sel) ?? null : null;
  // Etkin oda kuralları (cihaz ayarının üstüne biner); liste görünümünde genel değerler.
  setRoomOverlay(room ? overlayOf(room) : null);

  if (room) {
    const locked = isLocked(room, hasSavedBattle());
    const change = (fn: (o: Oda) => Oda) => commit((l) => updateRoom(l, room.id, fn));
    return (
      <GmScreen characters={props.characters} room={room} locked={locked} onRoomChange={change}
        onBack={() => setSel(null)} backLabel={O.back} title={`${O.createTitle}: ${room.ad}`}
        onStart={(s, gd) => { change((o) => ({ ...o, kilit: { baslangic: new Date().toISOString() } })); props.onStart(s, room.id, gd); }}
        {...(props.onUpdateCharacters ? { onUpdateCharacters: props.onUpdateCharacters } : {})} {...(props.onSefer ? { onSefer: props.onSefer } : {})}
        roomPanel={<RoomPanel room={room} locked={locked} onChange={change}
          onRename={(ad, g) => commit((l) => updateRoom(renameRoom(l, room.id, ad), room.id, (o) => ({ ...o, gmAdi: g.trim().slice(0, ODA_AD_MAX) })))}
          onUnlock={() => change((o) => unlockRoom(o))}
          {...(props.onResume && locked ? { onBackToBattle: () => props.onResume?.(room.id) } : {})} />} />
    );
  }
  return (
    <div className="menu-screen">
      <main className="app wide">
        <header><h1>{O.createTitle}</h1><button className="ghost" onClick={props.onBack}>{C.home}</button></header>
        <section className="panel">
          <h2>{O.newRoom}</h2>
          <div className="oda-name">
            <label>{O.roomName} <input value={name} maxLength={ODA_AD_MAX} placeholder={O.defaultName} aria-label={O.roomName} onChange={(e: { target: { value: string } }) => setName(e.target.value)} /></label>
            <label>{O.gmName} <input value={gm} maxLength={ODA_AD_MAX} placeholder={O.gmNamePlaceholder} aria-label={O.gmName} onChange={(e: { target: { value: string } }) => setGm(e.target.value)} /></label>
            <button type="button" className="cta" onClick={() => {
              const made = createRoom(rooms, name || O.defaultName, globalRules(), new Date().toISOString(), gm);
              commit(() => made.list); setName(''); setGm(''); setSel(made.room.id);
            }}>{O.create}</button>
          </div>
        </section>
        <section className="panel">
          <h2>{O.rooms}</h2>
          {rooms.length === 0 && <p className="empty-state">{O.roomsEmpty}</p>}
          <ul className="oda-list">
            {rooms.map((r) => (
              <li key={r.id} className="oda-card">
                {rename === r.id
                  ? <NameForm room={r} onSave={(ad, g) => { commit((l) => updateRoom(renameRoom(l, r.id, ad), r.id, (o) => ({ ...o, gmAdi: g.trim().slice(0, ODA_AD_MAX) }))); setRename(null); }} />
                  : <div className="oda-card-text"><strong>{r.ad}</strong><RoomLine room={r} /></div>}
                <div className="set-btns">
                  <button type="button" className="cta" onClick={() => setSel(r.id)}>{O.open}</button>
                  <button type="button" className="ghost" onClick={() => setRename(rename === r.id ? null : r.id)}>{O.rename}</button>
                  {del === r.id
                    ? <span className="confirm"><button type="button" className="danger" onClick={() => { commit((l) => deleteRoom(l, r.id)); setDel(null); }}>{O.confirmDelete}</button><button type="button" className="ghost" onClick={() => setDel(null)}>{C.cancel}</button></span>
                    : <button type="button" className="ghost" onClick={() => setDel(r.id)}>{O.del}</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

/** Oda kuralları salt okunur özet satırı. */
function RulesReadOnly(props: { rules: OdaKurallar }) {
  const O = t().oda, R = t().roomRules, K = t().carry;
  const label: Record<string, string> = { tasima: R.carry, hizalanma: R.align, kesif: R.discovery, ipucu: R.hints, yolculuk: R.journey };
  return (
    <ul className="oda-rules-read" aria-label={O.joinRules}>
      {rulesSummary(props.rules).map((r) => (
        <li key={r.id} className={r.value === true ? 'on' : ''}>
          <span>{label[r.id]}</span>: <b>{typeof r.value === 'boolean' ? (r.value ? O.ruleOn : O.ruleOff) : K.rule[r.value] ?? r.value}</b>
        </li>
      ))}
    </ul>
  );
}

/** Odaya katıl: oda seç, kendi karakterini seç ("Hazır"); oda kuralları yalnız okunur. */
export function OdaKatil(props: { characters: SavedCharacter[]; onBack: () => void; roomId?: string; /** Odanın kurallarıyla karakter oluşturucuyu aç. */ onBuild?: (roomId: string, overlay: RoomOverlay) => void }) {
  const O = t().oda, C = t().common;
  const [rooms, commit] = useRooms();
  const [sel, setSel] = useState<string | null>(props.roomId ?? null);
  const room = sel ? rooms.find((r) => r.id === sel) ?? null : null;
  setRoomOverlay(null);
  const valid = props.characters.filter((c) => characterProblems(c).length === 0);
  const full = !!room && room.parti.length >= MAX_PARTY;
  return (
    <div className="menu-screen">
      <main className="app">
        <header><h1>{O.joinTitle}</h1>
          <button className="ghost" onClick={room ? () => setSel(null) : props.onBack}>{room ? O.back : C.home}</button></header>
        {!room && (
          <section className="panel">
            <h2>{O.joinPick}</h2>
            {rooms.length === 0 && <p className="empty-state">{O.joinEmpty}</p>}
            <ul className="oda-list">
              {rooms.map((r) => (
                <li key={r.id} className="oda-card">
                  <div className="oda-card-text"><strong>{r.ad}</strong><RoomLine room={r} /></div>
                  <button type="button" className="cta" onClick={() => setSel(r.id)}>{O.open}</button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {room && (
          <>
            <section className="panel">
              <h2>{room.ad}</h2>
              <RoomLine room={room} />
              <h3>{O.joinRules}</h3>
              <RulesReadOnly rules={room.ayarlar.kurallar} />
              <p className="mute">{O.joinWait}</p>
            </section>
            <section className="panel">
              <h2>{O.joinChars} <small className="mute">{O.joinCount(room.parti.filter((id) => valid.some((c) => c.id === id)).length, MAX_PARTY)}</small></h2>
              {props.onBuild && <div className="set-btns"><button type="button" className="cta" onClick={() => props.onBuild?.(room.id, overlayOf(room))}>{O.joinBuild}</button><small className="mute">{O.joinBuildHelp}</small></div>}
              {valid.length === 0 && <p className="empty-state">{O.joinNoChars}</p>}
              {full && <p className="mute">{O.joinFull(MAX_PARTY)}</p>}
              <ul className="oda-list">
                {valid.map((c) => {
                  const ready = room.parti.includes(c.id);
                  return (
                    <li key={c.id} className="oda-card">
                      <div className="oda-card-text"><strong>{c.sheet.name}</strong> <small className="mute">{className(c.sheet.classId)} {c.sheet.level}</small></div>
                      {ready && <span className="chip on oda-ready">{O.joinReady}</span>}
                      {ready
                        ? <button type="button" className="ghost" onClick={() => commit((l) => updateRoom(l, room.id, (o) => leaveRoom(o, c.id)))}>{O.joinLeave}</button>
                        : <button type="button" className="cta" disabled={full} onClick={() => commit((l) => updateRoom(l, room.id, (o) => joinRoom(o, c.id)))}>{O.joinAdd}</button>}
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
