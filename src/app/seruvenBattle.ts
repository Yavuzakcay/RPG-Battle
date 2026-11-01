/**
 * Kuyruk 31: Serüven düğümü ↔ savaş. Yolculuğun parçaları yeniden kullanılır: düğümün durağı (`nodeStop`) tek duraklı
 * bir yolculuk durumuna konur, katılımcılar ve XP `stopParticipants`, savaş `createMapBattle`, sonuç
 * `battleResultCommand` (karakter durumları `applyBattleResult`). Gece seçiliyse haritanın gece varyantı (ya da düğümün
 * gece senaryosu); "keşfe devam" açıksa savaş `explore` ile kurulur (çıkış = parti başlangıç altıgenleri).
 */
import type { BattleState } from '../battle';
import { goalsFromData } from '../battle/goals';
import { getMap } from '../map/maps';
import type { Rng } from '../rules/dice';
import type { JourneyState } from '../journey/types';
import { linkById, nodeKapiAt, nodeKey, nodeStop, pageById, toggleOn, type HapisBulgu, type SeruvenCommand, type SeruvenNode, type SeruvenState } from '../journey/seruven';
import { HAPIS, confiscated, sucById } from '../journey/hapishane';
import { combatantFromMonster, type Combatant } from '../battle';
import { getMonster } from '../data';
import { characterTokenFile } from '../battle/avatar';
import { SCENARIOS, enemiesAt } from '../sim/balance';
import { GM_CONTEXT, dispatch } from '../ui/session';
import { battleResultCommand, stopParticipants } from './journeyBattle';
import { kapiAt, varis, yerlesimById, yerlesimHarita } from '../yerlesim/yerlesim';
import { createMapBattle } from './setup';
import type { Session } from '../ui/session';

export function seruvenNode(s: SeruvenState, nodeId: string): SeruvenNode | undefined {
  return pageById(s.page)?.nodes.find((n) => n.id === nodeId);
}
export const isNight = (s: SeruvenState, nodeId: string) => s.night.includes(nodeKey(s.page, nodeId));

/** Düğümün tek duraklı yolculuk durumu (yolculuk savaş parçalarına verilir). */
export function nodeJourney(s: SeruvenState, nodeId: string): JourneyState | null {
  const node = seruvenNode(s, nodeId);
  const stop = node ? nodeStop(node, s.level, isNight(s, nodeId)) : null;
  if (!stop) return null;
  return {
    id: `seruven:${s.id}`, route: { id: 'seruven', name: { tr: 'Serüven', en: 'Adventure' }, level: s.level, stops: [stop] },
    seed: s.seed, difficulty: 'normal', progression: 'milestone', stop: 0, stopDone: false, hour: 0, lastLongRest: 0, shortRests: 0,
    gold: s.gold, potions: s.potions, xp: s.xp, level: s.level, party: s.party, result: null, flags: s.flags,
  };
}

/** Haritanın gece varyantı var mı (düğümde gündüz/gece anahtarı). */
export function nightVariant(s: SeruvenState, nodeId: string): string | null {
  const node = seruvenNode(s, nodeId);
  const j = node ? nodeJourney({ ...s, night: [] }, nodeId) : null;
  const p = j ? stopParticipants(j) : null;
  if (!node || !p?.scenario.map) return null;
  if (node.gece) return 'gece';
  const m = getMap(p.scenario.map.mapId);
  return m.variants.some((v) => v.id === 'gece') ? 'gece' : null;
}

/** Düğümün savaş oturumu (kurulumda; Game Master yerine oyuncu yerleştirir ve başlatır). */
export function seruvenBattleSession(s: SeruvenState, nodeId: string, rng: Rng): Session | null {
  if (s.hapis && s.page === HAPIS.sayfa) return hapisSession(s, nodeId, rng);
  const j = nodeJourney(s, nodeId);
  const p = j ? stopParticipants(j) : null;
  if (!j || !p?.scenario.map) return null;
  const stop = j.route.stops[0];
  const night = isNight(s, nodeId) && !seruvenNode(s, nodeId)?.gece && nightVariant(s, nodeId) === 'gece';
  const goals = stop?.goals ? goalsFromData(stop.goals) : undefined;
  const partyStart = stop?.partyStart?.map(([c, r]) => ({ col: c - 1, row: r - 1 }));
  const map = getMap(p.scenario.map.mapId, { variantId: night ? 'gece' : p.scenario.map.variantId });
  const exits = partyStart ?? map.startZones.players;
  return createMapBattle(p.participants, {
    ...p.scenario.map, ...(night ? { variantId: 'gece' } : {}), mirrored: false, ...(goals ? { goals } : {}),
    ...(partyStart ? { partyStart } : {}),
    ...(toggleOn(s, 'kesfeDevam') ? { explore: { exits } } : {}),
  }, rng);
}

/**
 * Kuyruk 35: "Savaşları atla (önizleme)": savaş oynanmadan kazanılmış sayılır. XP ve ödül normal yoldan (düğümün
 * düşmanlarının XP'si, durak ödülü); parti durumu değişmez; olayda `skipped`.
 */
export function seruvenSkipCommand(s: SeruvenState, nodeId: string) {
  const j = nodeJourney(s, nodeId);
  const p = j ? stopParticipants(j) : null;
  if (!p) return null;
  const statuses = Object.fromEntries(s.party.map((m) => [m.id, m.status]));
  // Kuyruk 36: adada atlanan düğümün nesneleri de alınmış sayılır (emanet sandığı, tasma anahtarı).
  const objs = s.hapis ? getMap(p.scenario.map?.mapId ?? '').objects ?? [] : [];
  const hapisBulgu: HapisBulgu | undefined = s.hapis ? { iade: objs.some((o) => o.id === 'emanet'), tasmaAnahtari: objs.some((o) => o.id === 'tasmaAnahtari') } : undefined;
  return { type: 'battle_result' as const, node: nodeId, outcome: 'won' as const, statuses, xp: p.xp, skipped: true, ...(hapisBulgu ? { hapisBulgu } : {}) };
}

/** Biten savaştan Serüven komutu. */
export function seruvenResultCommand(s: SeruvenState, nodeId: string, final: BattleState) {
  const j = nodeJourney(s, nodeId);
  if (!j) return null;
  const r = battleResultCommand(j, final);
  if (r.type !== 'battle_result') return null;
  return { type: 'battle_result' as const, node: nodeId, outcome: r.outcome, statuses: r.statuses, xp: r.xp, ...(r.flags ? { flags: r.flags } : {}) };
}

/**
 * Kuyruk 32: bağlantı koridoru (yeraltı nehri). Savaşsız "keşfe devam" yürüyüşü: parti bulunduğu ucun altıgenlerinden
 * başlar, karşı ucun altıgenleri çıkıştır. "Koridor pususu" açıksa senaryonun seviyedeki 1–2 SRD yaratığıyla savaş olur;
 * kapalıyken düşman yok (savaş başlar başlamaz biter, keşif kipi açılır).
 */
export function linkSession(s: SeruvenState, linkId: string, rng: Rng): Session | null {
  const link = linkById(linkId);
  if (!link) return null;
  const fromA = s.page === link.a.page && s.at === link.a.node;
  const start = (fromA ? link.uclar.a : link.uclar.b).map(([c, r]) => ({ col: c - 1, row: r - 1 }));
  const exits = (fromA ? link.uclar.b : link.uclar.a).map(([c, r]) => ({ col: c - 1, row: r - 1 }));
  const j = nodeJourney({ ...s, night: [] }, s.at);
  const shim = j ? { ...j, route: { ...j.route, stops: [{ id: link.id, kind: 'battle' as const, name: { tr: link.id, en: link.id }, travelHours: 0, scenario: link.scenario }] } } : null;
  const p = shim ? stopParticipants(shim) : null;
  if (!p?.scenario.map) return null;
  const party = p.participants.filter((c) => c.side === 'party');
  const ambush = toggleOn(s, 'koridorPususu');
  return createMapBattle(ambush ? p.participants : party, { ...p.scenario.map, mirrored: false, partyStart: start, explore: { exits } }, rng);
}

/** Biten koridordan Serüven komutu: bir parti üyesi çıkış altıgenine vardıysa geçiş, yoksa null (Serüven'de kalınır). */
export function linkCrossCommand(s: SeruvenState, linkId: string, final: BattleState) {
  const exits = new Set((final.explore?.exits ?? []).map((h) => `${h.col},${h.row}`));
  const out = Object.values(final.combatants).some((c) => c.side === 'party' && c.hp > 0 && c.pos && exits.has(`${c.pos.col},${c.pos.row}`));
  if (!out) return null;
  const j = nodeJourney({ ...s, night: [] }, s.at);
  const r = j ? battleResultCommand(j, final) : null;
  return { type: 'link_cross' as const, link: linkId, ...(r?.type === 'battle_result' ? { statuses: r.statuses, ...(r.flags ? { flags: r.flags } : {}) } : {}) };
}


/**
 * Kuyruk 34b: yerleşim haritasında keşif (düşmansız) oturumu. Parti gelinen kapının varış altıgenlerinde (yoksa haritanın
 * parti başlangıcında) başlar; çıkışlar kapı altıgenleri (kapı geçişi kapalıysa yalnızca hub'a dönüş: başlangıç
 * altıgenleri). HP, kaynak ve durumlar parti durumundan.
 */
export function yerlesimSession(s: SeruvenState, rng: Rng): Session | null {
  const cur = s.yerlesim;
  const y = cur ? yerlesimById(cur.id) : undefined;
  const h = y && cur?.map ? yerlesimHarita(y, cur.map) : undefined;
  if (!cur || !h) return null;
  const j = { ...partyJourney(s), route: { id: 'seruven', name: { tr: 'Serüven', en: 'Adventure' }, level: s.level, stops: [{ id: h.id, kind: 'battle' as const, name: { tr: h.id, en: h.id }, travelHours: 0, scenario: 'dungeon' }] } };
  const p = stopParticipants(j);
  if (!p) return null;
  const party = p.participants.filter((c) => c.side === 'party' && !c.civilian);
  const map = getMap(h.mapId, { variantId: h.variantId });
  const start = varis(h, cur.from) ?? map.startZones.players;
  const doors = toggleOn(s, 'yerlesimKapi') ? h.kapilar.flatMap((k) => k.hexes.map(([c, r]) => ({ col: c - 1, row: r - 1 }))) : [];
  const exits = doors.length ? doors : start;
  // Kuyruk 35: varış altıgenleri partiden azsa kalanlar haritanın parti bölgesine; kapı altıgenine kimse konmaz
  // (yoksa çıkışta hemen geri dönülürdü).
  const onDoor = (o: { col: number; row: number }) => doors.some((d) => d.col === o.col && d.row === o.row);
  const partyStart = [...start, ...map.startZones.players.filter((o) => !onDoor(o) && !start.some((x) => x.col === o.col && x.row === o.row))];
  return createMapBattle(party, { mapId: h.mapId, variantId: h.variantId, mirrored: false, partyStart, explore: { exits } }, rng);
}

/** Yerleşim haritasından dönüş: kapıya varıldıysa hedef haritaya (null = hub), varılmadıysa hub'a; durumlar korunur. */
export function yerlesimCrossCommand(s: SeruvenState, final: BattleState) {
  const cur = s.yerlesim;
  const y = cur ? yerlesimById(cur.id) : undefined;
  const h = y && cur?.map ? yerlesimHarita(y, cur.map) : undefined;
  if (!cur || !h) return null;
  // Keşif oturumu düşmansız olduğundan savaş bitmiş sayılmayabilir: parti durumu her durumda okunur.
  const r = battleResultCommand(partyJourney(s), { ...final, status: 'finished' });
  const statuses = r.type === 'battle_result' ? r.statuses : undefined;
  const at = toggleOn(s, 'yerlesimKapi') ? Object.values(final.combatants).find((c) => c.side === 'party' && c.hp > 0 && c.pos && kapiAt(h, c.pos)) : undefined;
  const door = at?.pos ? kapiAt(h, at.pos) : undefined;
  return door?.to
    ? { type: 'yerlesim_map' as const, map: door.to, via: 'kapi' as const, ...(statuses ? { statuses } : {}) }
    : { type: 'yerlesim_map' as const, map: null, ...(statuses ? { statuses } : {}) };
}

/** Parti durumu için tek duraklı yolculuk kabuğu (sonuç komutu, katılımcılar). */
function partyJourney(s: SeruvenState): JourneyState {
  return {
    id: `seruven:${s.id}`, route: { id: 'seruven', name: { tr: 'Serüven', en: 'Adventure' }, level: s.level, stops: [{ id: 'yerlesim', kind: 'battle', name: { tr: 'Yerleşim', en: 'Settlement' }, travelHours: 0, scenario: 'dungeon' }] },
    seed: s.seed, difficulty: 'normal', progression: 'milestone', stop: 0, stopDone: false, hour: 0, lastLongRest: 0, shortRests: 0,
    gold: s.gold, potions: s.potions, xp: s.xp, level: s.level, party: s.party, result: null, flags: s.flags,
  };
}

// ——— Kuyruk 36: Hapishane Adası ve Büyük suç savaşları ———

/** Senaryodan tek duraklı yolculuk (Büyük suç savaşları; düğümsüz). */
function scenarioJourney(s: SeruvenState, scenario: string, enemies?: Record<string, number>): JourneyState {
  return {
    id: `seruven:${s.id}`, route: { id: 'seruven', name: { tr: 'Serüven', en: 'Adventure' }, level: s.level,
      stops: [{ id: scenario, kind: 'battle', name: { tr: scenario, en: scenario }, travelHours: 0, scenario, ...(enemies ? { enemies } : {}) }] },
    seed: s.seed, difficulty: 'normal', progression: 'milestone', stop: 0, stopDone: false, hour: 0, lastLongRest: 0, shortRests: 0,
    gold: s.gold, potions: s.potions, xp: s.xp, level: s.level, party: s.party, result: null, flags: s.flags,
  };
}

/** Büyük suç zincirinin sıradaki savaşı (ön savaş ya da muhafız baskını). */
export function sucSession(s: SeruvenState, rng: Rng): Session | null {
  const suc = s.suc ? sucById(s.suc.id) : undefined;
  if (!s.suc || !suc) return null;
  const j = scenarioJourney(s, s.suc.asama === 'on' ? suc.scenario : HAPIS.baskin);
  const p = stopParticipants(j);
  return p?.scenario.map ? createMapBattle(p.participants, { ...p.scenario.map, mirrored: false }, rng) : null;
}
/** Büyük suç savaşından komut. */
export function sucResultCommand(s: SeruvenState, final: BattleState): SeruvenCommand | null {
  const suc = s.suc ? sucById(s.suc.id) : undefined;
  if (!s.suc || !suc) return null;
  const j = scenarioJourney(s, s.suc.asama === 'on' ? suc.scenario : HAPIS.baskin);
  const r = battleResultCommand(j, final);
  return r.type === 'battle_result' ? { type: 'suc_sonuc', outcome: r.outcome, statuses: r.statuses, xp: r.xp } : null;
}

/** Adadaki düğümün düşmanları: senaryonun seviyedeki listesi, kolayda eksik, alarm başına takviye; geçilmiş düğümde yok. */
export function hapisEnemies(s: SeruvenState, node: SeruvenNode): Record<string, number> {
  if (s.done.includes(nodeKey(HAPIS.sayfa, node.id))) return {};
  const sc = SCENARIOS.find((x) => x.id === node.scenario);
  if (!sc) return {};
  const list = { ...enemiesAt(sc, s.level) };
  if (toggleOn(s, 'hapishaneKolay')) {
    let left = HAPIS.kolay.eksik;
    for (const id of Object.keys(list).sort((a, b) => (a === 'guard' ? -1 : b === 'guard' ? 1 : 0))) {
      while (left > 0 && (list[id] ?? 0) > 0 && Object.values(list).reduce((a, b) => a + b, 0) > 1) { list[id] = (list[id] ?? 0) - 1; left--; }
    }
  }
  const extra = Math.min(HAPIS.takviye.enCok, (s.hapis?.alarm ?? 0) * HAPIS.takviye.alarmBasina);
  if (extra > 0) list[HAPIS.takviye.monster] = (list[HAPIS.takviye.monster] ?? 0) + extra;
  return Object.fromEntries(Object.entries(list).filter(([, n]) => n > 0));
}

/**
 * Kuyruk 41b: mahkûm görünümü (turuncu ton): Hapishane kurallarıyla ekipman emanetteyken ve tasma takılıyken. Tasma
 * çıkınca, emanet iade edilince ya da ada bitince (durumda `hapis` yok) normal görünüm.
 */
export const prisonerLook = (s: Pick<SeruvenState, 'hapis' | 'tasma'>): boolean => !!s.hapis?.kurallar && !s.hapis.iade && !!s.tasma;

/** Mahkûm kıyafeti: sınıfın yerine Keşiş jetonu (aynı tür, cinsiyet ve soy rengi) + turuncu hale. */
function prisonerAvatar(c: Combatant, sheet: SeruvenState['party'][number]['sheet']): Combatant {
  if (sheet.avatar) return { ...c, avatar: { ...c.avatar, outfit: 'mahkum' } };
  return { ...c, avatar: { ...c.avatar, src: `characters/${characterTokenFile(sheet.raceId, sheet.gender, HAPIS.kostum.sinif)}`, fallbacks: [c.avatar.src, ...(c.avatar.fallbacks ?? [])], outfit: 'mahkum' } };
}
/** Büyü bastırıcı tasma: savaşçının büyüleri yok (sınıf özellikleri, kaynaklar ve silahsız saldırılar kalır). */
function collared(c: Combatant): Combatant {
  const { freeSpells: _f, spellStats: _s, ...rest } = c;
  return { ...rest, spellNames: [] };
}
function npc(id: string, monster: string, name: string, ownerId: string | null, hp?: number): Combatant {
  const c = combatantFromMonster(getMonster(monster), { id, name });
  return { ...c, side: 'party', ownerId, ...(hp ? { hp, maxHp: hp } : {}) };
}

/**
 * Adadaki düğümün savaşı: Hapishane kuralları açıksa ekipman emanette (iade edilene dek), tasma büyüleri keser,
 * mahkûm kıyafeti; mahkûm (hücre bloğu geçilene dek hedef hücrede, sonra partiyle) ve hücre arkadaşı (veride
 * düğümlerde) partinin yanında; çıkışlar kapı altıgenleri, varış gelinen düğümün girişi.
 */
export function hapisSession(s: SeruvenState, nodeId: string, rng: Rng): Session | null {
  const node = seruvenNode(s, nodeId);
  const h = s.hapis;
  if (!node || !h) return null;
  const kural = h.kurallar;
  const armed = !kural || !!h.iade;
  const party = s.party.map((m) => ({ ...m, sheet: armed ? m.sheet : confiscated(m.sheet) }));
  const j = { ...scenarioJourney({ ...s, party }, node.scenario ?? '', hapisEnemies(s, node)) };
  const p = stopParticipants(j);
  if (!p?.scenario.map) return null;
  const sheets = new Map(s.party.map((m) => [m.id, m.sheet]));
  const owner = p.participants.find((c) => c.side === 'party')?.ownerId ?? null;
  const list = p.participants.map((c) => {
    if (c.side !== 'party' || !kural) return c;
    const sh = c.ownerId ? sheets.get(c.ownerId) : undefined;
    let x = s.tasma ? collared(c) : c;
    if (prisonerLook(s) && sh) x = prisonerAvatar(x, sh);
    return x;
  });
  const freed = s.done.includes(nodeKey(HAPIS.sayfa, HAPIS.baslangic));
  const M = HAPIS.mahkum, A = HAPIS.hucreArkadasi;
  list.push(npc(M.id, M.monster, M.tr, owner, M.hp));
  if (A.dugumler.includes(node.id)) list.push(npc(A.id, A.monster, A.tr, owner));
  const map = getMap(p.scenario.map.mapId, { variantId: p.scenario.map.variantId });
  const doors = (node.kapilar ?? []).flatMap((k) => k.hexes.map(([c, r]) => ({ col: c - 1, row: r - 1 })));
  const arrive = (h.from ? node.girisler?.[h.from] : undefined)?.map(([c, r]) => ({ col: c - 1, row: r - 1 }));
  const start = arrive ?? map.startZones.players;
  const onDoor = (o: { col: number; row: number }) => doors.some((d) => d.col === o.col && d.row === o.row);
  const partyStart = [...start, ...map.startZones.players.filter((o) => !onDoor(o) && !start.some((x) => x.col === o.col && x.row === o.row))];
  let ss = createMapBattle(list, { ...p.scenario.map, mirrored: false, partyStart, ...(toggleOn(s, 'kesfeDevam') && doors.length ? { explore: { exits: doors } } : {}) }, rng);
  // Hücre bloğu geçilmeden mahkûm hedef hücrede; hücre arkadaşı kendi hücresinde.
  const place = (id: string, at: [number, number]) => { const next = dispatch(ss, { type: 'place', actorId: id, at: { col: at[0] - 1, row: at[1] - 1 } }, rng, GM_CONTEXT); if (!next.error) ss = next; };
  if (!freed && node.id === HAPIS.baslangic) place(M.id, M.hucre);
  if (node.id === HAPIS.baslangic && !freed) place(A.id, A.yer);
  return ss;
}

/** Adadaki bulgular: nöbetçiler alarm verdi mi, emanet sandığı ya da tasma anahtarı parti üyesinde mi. */
export function hapisBulgu(final: BattleState): HapisBulgu {
  const carried = (id: string) => {
    const o = final.map?.objects?.find((x) => x.id === id);
    const c = o?.carriedBy ? final.combatants[o.carriedBy] : undefined;
    return !!c && c.side === 'party';
  };
  return { alarm: (final.groups ?? []).some((g) => g.state === 'alarmed'), iade: carried('emanet'), tasmaAnahtari: carried('tasmaAnahtari') };
}

/**
 * Adadaki savaştan komutlar: ilk kez oynanan düğümde `battle_result` (bulgularla); kazanılmış ya da geçilmiş düğümde
 * bir parti üyesi kapı altıgenindeyse `hapis_kapi` (komşu düğüm ya da kaçış), değilse durumlar için `hapis_kapi` (kal).
 */
export function hapisResultCommands(s: SeruvenState, nodeId: string, final: BattleState): SeruvenCommand[] {
  const node = seruvenNode(s, nodeId);
  if (!node || !s.hapis) return [];
  const cleared = s.done.includes(nodeKey(HAPIS.sayfa, nodeId));
  // Bitmemiş savaştan çıkış sonuç sayılmaz (geçilmiş düğümde keşif oturumu her zaman sayılır).
  if (!cleared && final.status !== 'finished') return [];
  const j = scenarioJourney(s, node.scenario ?? '', hapisEnemies(s, node));
  const finished = cleared ? { ...final, status: 'finished' as const, winner: 'party' as const } : final;
  const r = battleResultCommand(j, finished);
  if (r.type !== 'battle_result') return [];
  const bulgu = hapisBulgu(final);
  const out: SeruvenCommand[] = [];
  if (!cleared) out.push({ type: 'battle_result', node: nodeId, outcome: r.outcome, statuses: r.statuses, xp: r.xp, hapisBulgu: bulgu, ...(r.flags ? { flags: r.flags } : {}) });
  if (r.outcome !== 'won') return out;
  // Birden çok kapıda parti varsa mahkûmun durduğu kapı (kurtarılan onunla gider), yoksa ilk bulunan.
  const onDoor = Object.values(final.combatants).filter((c) => c.side === 'party' && c.hp > 0 && c.pos && nodeKapiAt(node, c.pos));
  const at = onDoor.find((c) => c.id === HAPIS.mahkum.id) ?? onDoor[0];
  const door = at?.pos ? nodeKapiAt(node, at.pos) : undefined;
  if (door) out.push({ type: 'hapis_kapi', to: door.to, ...(cleared ? { statuses: r.statuses, hapisBulgu: bulgu } : {}) });
  else if (cleared) out.push({ type: 'hapis_kapi', to: nodeId, statuses: r.statuses, hapisBulgu: bulgu });
  return out;
}
