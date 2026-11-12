import type { Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import type { DamageNote } from '../rules/damage';
import type { RollKind, RollMode } from '../rules/dice';
import type { DiceMode } from '../rules/manualDice';

/** Olaydaki zar grubu (`dice_rolled`). */
export interface DiceRoll {
  sides: number;
  values: number[];
  kind?: RollKind;
  by?: string;
  bonus?: number;
  mode?: RollMode;
  critical?: boolean;
  /** Fiziksel zarla elle girildi. */
  manual?: boolean;
}
import type { Offset } from '../rules/hex';
import type { AttackArea } from '../rules/areaParse';
import type { Skill } from '../rules/skills';
import type { CreatureSize, FeatureEffect, MasteryId, ReactionMechanic } from '../data/types';
import type { ReactionTrigger } from '../rules/reactionChoice';
import type { RolledExtra } from '../rules/attack';
import type { Scores } from '../rules/stats';

export type Side = 'party' | 'enemies';

/** Hasar uygulanırken ortaya çıkan ek sonuçlar. */
export type DamageEffect =
  | { kind: 'regen_blocked' }
  | { kind: 'regen_pending' }
  | { kind: 'undead_fortitude'; dc: number; natural: number; total: number; success: boolean }
  /** Kuyruk 41b: Death Ward 0 HP yerine 1 HP bıraktı; etki biter. */
  | { kind: 'death_ward'; effectId: string; name: string }
  /** Kuyruk 19: Relentless Rage (Barbarian 11): öfkedeyken 0 HP'de CON save; başarıda HP = 2 × seviye. */
  | { kind: 'relentless_rage'; dc: number; natural: number; total: number; success: boolean; hp: number }
  | { kind: 'relentless_endurance' }
  /** Kuyruk 19: emilen hasar (iyileşme) ve hasar türüne bağlı canavar tepkisi (Freeze, Aversion to Fire, Hydra ateşi). */
  | { kind: 'absorbed'; amount: number }
  | { kind: 'trait_fx'; name: string; effect: Partial<ActiveEffect>; headsFire?: boolean }
  /** Karakter 0 HP'ye düştü: ölüm save'lerine başlar. */
  | { kind: 'dying' }
  /** Kalan hasar maksimum HP'ye eşit veya fazla: anında ölüm. */
  | { kind: 'instant_death' }
  /** 0 HP'deki karaktere hasar: başarısız ölüm save'i sayılır. */
  | { kind: 'death_save_failed'; failures: number; died: boolean }
  /** Konsantrasyondaki yaratık hasar aldı: CON save (DC 10 veya hasarın yarısı, en çok 30). */
  | { kind: 'concentration'; spell: string; dc: number; natural: number; total: number; success: boolean; extra?: RolledExtra[] }
  /** Geçici HP hasarı karşıladı (Görev R2): emilen ve kalan. */
  | { kind: 'temp_absorbed'; amount: number; left: number }
  /** Hasar azaltma etkisi (Resistance, turda bir): zar ve düşülen. */
  | { kind: 'reduced'; label: string; effectId: string; roll: number; amount: number }
  /** Görev B3: hasar alınca etkinin kurtarma zarı (Hideous Laughter); başarıda etki biter. */
  | { kind: 'effect_save'; effectId: string; name: string; dc: number; natural: number; total: number; success: boolean };

/** Bonus eylemle yapılabilen eylemler (Rogue Cunning Action, Goblin Nimble Escape). */
export type BonusOption = 'dash' | 'disengage' | 'hide';

/**
 * Tur içi eylem ekonomisi (SRD 5.2.1): bir eylem, bir bonus eylem, bir tepki ve hareket.
 * Eylem, bonus eylem, kalan saldırılar, koşma ve ayrılma savaşçının kendi turunun başında;
 * tepki de kendi turunun başında yenilenir.
 */
/**
 * Savaşçının üzerindeki süren etki (Görev R2): kaynak (büyücü), kimlik (SRD büyü kimliği), bitiş turu (dahil) ya da
 * konsantrasyon bağı (`concentration`: kaynağın bu büyüdeki konsantrasyonu bitince biter). Etkiler: zar eklentisi
 * (`dice`; `single` ilk kullanımda biter), turda bir hasar azaltma (`reduce`; `spent` her tur geçişinde sıfırlanır),
 * her tur başı geçici HP (`tempHp`), durum bağışıklığı (`immune`), her tur başı süregelen hasar ve ardından save
 * (`ongoing`; başarıda biter), sonraki turunu kaybetme (`command`: Grovel yere düşer, Halt yalnızca bekler).
 */
/** Command büyüsünün sözcükleri (Görev R2; Görev B3: Approach, Drop, Flee). */
export type CommandWord = 'grovel' | 'halt' | 'approach' | 'drop' | 'flee';

export interface ActiveEffect {
  id: string;
  name: string;
  sourceId: string;
  /** Kuyruk K53 S5: bu etkinin sahibine bağlı aura (`src/battle/auraCore.ts`). */
  aura?: import('./auraCore').AuraSpec;
  /** Kuyruk K54: birden çok aura (Son Ders: save bonusu + tur başı Motivasyon). */
  auras?: import('./auraCore').AuraSpec[];
  /** Kuyruk K54 (sürüm 25): hareketi fırsat saldırısı doğurmaz (Çevik Yaşlı). */
  noProvoke?: boolean;
  /** Kuyruk K54b (sürüm 27): zor zemin ve zemin (yüzey) hasarı yok sayılır (Kuşbakışı Plan; `groundWard.ts`). */
  groundWard?: boolean;
  until?: number;
  /** A1: bu büyüye (SRD kimliği) karşı save'i başardı; büyü onu yeniden hedefleyemez (Eyebite `repeat.noRetarget`). */
  resisted?: string;
  concentration?: string;
  dice?: { die: string; sign: 1 | -1; on: Array<'attack' | 'save' | 'check'>; skill?: string; single?: boolean };
  reduce?: { die: string; types: string[]; spent?: boolean };
  tempHp?: number;
  immune?: string[];
  /** Kuyruk S1 (Calm Emotions): bastırılan durumlar; etki bitince reducer geri yazar (`timer`: süreli olanın sayacı, bastırıldığı turdan bu yana geçen tur düşülür; `by`: veren etki sürüyorsa). */
  /** Kuyruk S1 (Suggestion "bırak"): silahını bıraktı (silahla saldıramaz). */
  disarmed?: boolean;
  /** Kuyruk S2 (sürüm 41): Levitate (hedef havada; dikey hareketi yapan yönetir), Gaseous Form yaratık altıgeninde durma ve kapı aralığından geçme, Flame Blade bırakıldı, Phantasmal Force yanılsama alanı. */
  levitate?: boolean;
  shareSpace?: boolean;
  squeeze?: boolean;
  bladeGone?: boolean;
  /** Kuyruk P11 (paket `buyuSakla`): bekleyen büyü (yapıldı, ateşlenmedi). */
  /** Kuyruk P11 (paket `koruma.itmeDirenci`): zorla harekete karşı avantajlı STR kurtulması. */
  pkPushResist?: boolean;
  /** Kuyruk P11 (paket `zarYarisi`): bu saldırgan avantajsız Sneak Attack yapar. */
  sneakFor?: string;
  /** Kuyruk P11 (paket `cagirGuclendir.komutSaldiri`): komut turunda ek saldırı hakkı. */
  pkExtraAttack?: number;
  /** Kuyruk P12 (sürüm 43): `allies` dost da tetikleyebilir (`spell_followup.sourceId`; dostun eylem ekonomisi harcanmaz). */
  storedSpell?: { spellName: string; slotLevel: number | null; cost: 'action' | 'bonus' | 'reaction' | 'free'; allies?: boolean };
  /** Kuyruk P11 (paket `buyuIptal.calar`): çalınan büyü, slotsuz bir kez yapılır. */
  grantSpell?: { spellName: string };
  /** Kuyruk P11 (paket `gucDeposu`): biriken güç sayısı. */
  pkCharge?: number;
  /** Kuyruk P12 (paket `vertigo`): etkin vertigo sonucu (özellik anahtarı, ilkel sırası, zar yüzü; `free` ilk ışınlanma bedava). */
  pkVertigo?: { key: string; i: number; face: number; free?: boolean };
  illusionZone?: string;
  suppressed?: Array<{ condition: string; timer?: ConditionTimer; round?: number; by?: string }>;
  ongoing?: { dice: string; type: string; save: Ability; dc: number; noSave?: boolean };
  command?: CommandWord;
  /** Görev B3: her tur süren zorlama (Suggestion, Fear: kaçış, Calm Emotions: duraksama); `fleeDash` kaçarken Dash. */
  commandPersist?: boolean;
  fleeDash?: boolean;
  /**
   * Görev B3: hasar alınca biter (Suggestion, Hypnotic Pattern). Görev K2c: `'casterSide'` yalnızca koyan ya da onun
   * tarafı hasar verince (Charm Person, Animal Friendship; SRD 5.2.1); düşman, ortam ve harita hasarı bitirmez.
   */
  breakOnDamage?: boolean | 'casterSide';
  /** Kuyruk 19: başka bir büyünün hedefi olunca biter (Modify Memory). */
  breakOnSpell?: boolean;
  /** Kuyruk 19: Staggering Blow: sonraki save dezavantajlı (save atılınca biter) ve fırsat saldırısı yapamaz. */
  saveDisAll?: boolean;
  noOpportunity?: boolean;
  /** Kuyruk 19: Sundering Blow: kaynağı dışındaki bir yaratık saldırınca biter. */
  consumeOnAttacked?: boolean;
  /** Kuyruk 19: Incapacitated olunca biter (Superior Defense). */
  breakOnIncapacitated?: boolean;
  /** Kuyruk 19 (11–20): bu yaratık türlerinin etkilerine save'ler avantajlı (Holy Nimbus: fiend, undead). */
  saveAdvVs?: string[];
  /** Kuyruk 19 (sihirli eşyalar): bu durumlara/kaynaklara karşı save'ler avantajlı (`spell`: büyüler), hasar kırılganlığı, kritik vuruş normal sayılır, menzilli saldırıya AC, tur başı yenilenme, silah bonusu, STR skoru tabanı. */
  saveAdvAgainst?: string[];
  /** Kuyruk 19 (Stonecunning): süreli Tremorsense (ft). */
  tremorsense?: number;
  vulnerable?: string[];
  noCrit?: boolean;
  acRanged?: number;
  regen?: number;
  weaponPlus?: number;
  strFloor?: number;
  /** Kuyruk 19 (Basic Poison): silah isabetlerine ek hasar (süre ya da ilk hasara dek). */
  coated?: { dice: string; type: string };
  /** Kuyruk 19 (11–20): bu savaşçının turu bitince biter (Superior Hunter's Defense: "geçerli turun sonuna dek"). */
  turnEndOf?: string;
  /** Kuyruk 19 (11–20): en az yarım siper (Smite of Protection). */
  halfCover?: boolean;
  /** Kuyruk 19 (11–20): Quivering Palm titreşimi (koyan, DC, zar); koyan eylemle bitirir. */
  quivering?: { dc: number; dice: string; type: string };
  /** Görev B3: koyan (`sourceId`) tarafından büyülenmiş: ona saldıramaz, onu zararlı büyüyle hedefleyemez. */
  charm?: boolean;
  /** Görev B3: hasar alınca kurtarma zarı (Hideous Laughter; avantajlı); başarıda biter. */
  damageSave?: { ability: Ability; dc: number; advantage?: boolean };
  /** Görev B3: koyanın her turunun başında hedefe hasar (Phantasmal Force 2d8 psychic). */
  sourceTurnDamage?: { dice: string; type: string };
  /** Görev B3: yanılsama kopyaları (Mirror Image): isabette her kopya için d6, 3+ ise kopya vurulur. */
  images?: number;
  /** Görev B4: taşıyan çevresine ışık yayar (altıgen; karanlık/gece haritasında `litHexes`). */
  light?: number;
  /** Kuyruk K67a (sürüm 51): ek loş ışık (altıgen). */
  lightDim?: number;
  /**
   * Kuyruk AS1b (sürüm 71+, alt soy etkileri; `src/battle/soyEtki.ts`): `saveDisVs` bu hasar türünü ya da durumu uygulayan
   * etkinin kurtarmasında dezavantaj; `checkDisSkill` beceri (ya da yetenek) kontrolünde, koşullu (`bright` parlak ışık,
   * `darkMap` karanlık harita, `water` suda, `settlement` yerleşim haritası); `fallMult` düşme hasarı çarpanı; `teleportEnds`
   * ışınlanınca turun kalan hareketi biter; `plantWalker` bitkisel zorlu arazi yok sayılır; `zorluArazideHiz` tur başında zorlu
   * arazide duruyorsa hız farkı (ft).
   */
  saveDisVs?: Array<{ damage?: string; condition?: string }>;
  checkDisSkill?: Array<{ skill?: string; ability?: Ability; when?: 'bright' | 'darkMap' | 'water' | 'settlement' }>;
  fallMult?: number;
  teleportEnds?: true;
  plantWalker?: true;
  zorluArazideHiz?: number;
  /** Kuyruk AS1b: haritaya bağlı alt soy koşulları (savaş başında çözülür: `soyEtki.ts` `withSoy`). */
  soyHarita?: { gunisigiSaldiriDez?: boolean; icMekanSaldiri?: number; icMekanInisiyatif?: number };
  /** Kuyruk K20 (Celestial Göksel Uyanış): kendi turunda bir kez saldırı isabetine ek hasar; tur sonu aura hasarı; Kırık Kanat süzülme hızı (ft). */
  celestialStrike?: { bonus: number; type: string };
  celestialAura?: { radiusFt: number; damage: number; type: string };
  glide?: number;
  /** Görev B4: görünmez olamaz (Faerie Fire, Starry Wisp); görünmezi görür (See Invisibility); ona saldırılar avantajlı. */
  revealed?: boolean;
  seeInvisible?: boolean;
  attackedAdv?: boolean;
  /** Görev P0: yalnız bu saldırganın bu yaratığa saldırısı avantajlı (ek paket `isaret`). */
  attackedAdvBy?: string;
  /** Görev P6 (ek paket): d20 alt sınırı (`zarEtkisi.d20AltSinir`), kritik eşiği, yakın dövüş erişim eki (ft), saklı mühür zarı. */
  pkD20Min?: { value: number; on: Array<'attack' | 'save' | 'check'> };
  pkCritOn?: number;
  reachPlus?: number;
  pkMuhur?: number;
  /** Kuyruk P9: her yaratığın turunda tepki yenilenir (`tepkiHakki`). */
  pkReactive?: true;
  /** Kuyruk P9: Flurry of Blows ek vuruşu (`flurryEk`). */
  pkFlurry?: number;
  /** Kuyruk P10: bu etkiyi taşıyanın (işaretli) etkilerine karşı bu yaratığın kurtulmaları avantajlı (`isaret.kurtulmaAvantaji`). */
  pkSaveAdvFor?: string;
  /** Kuyruk 19: Divine Sense: bu türlerdeki yaratıkların yeri `ft` içinde bilinir (gizlenmiş olsa da hedef alınır). */
  senseTypes?: { types: string[]; ft: number };
  /** Görev B5: karanlık görüş (ft; Darkvision), kontrollerde avantaj (Enhance Ability), dostlara Stealth +10 yarıçapı (altıgen). */
  darkvision?: number;
  checkAdv?: Ability[];
  stealthAura?: number;
  /** CILA: Haste'in ek eylemi (`extraAction`); Slow (`slowed`: eylem ya da bonus eylem, tek saldırı); kontrollerde dezavantaj (`checkDis`; Ray of Enfeeblement STR). */
  extraAction?: boolean;
  slowed?: boolean;
  checkDis?: Ability[];
  /** CILA: save'e sabit eklenti (Slow DEX −2). */
  saveMod?: Partial<Record<Ability, number>>;
  /** CILA (Entangle, Web): eylemle STR (Athletics) kontrolüyle kurtulma (DC büyününki); başarıda etki biter. */
  escapeCheck?: { dc: number; skill?: 'athletics' | 'investigation'; allyHelp?: boolean };
  /**
   * Kuyruk A6 (sürüm 35): etkiyi taşıyan hasar verince biter (Invisibility); komşu bir yaratık eylemle sarsarak
   * bitirir (`shakeable`: Sleep, Hypnotic Pattern); bu taraftaki yaratıklara saldıramaz, kendisi ya da görüşündeki
   * dostu hasar alınca biter (`indifferentTo`: Calm Emotions); bu yaratık hedefin yerini hep bilir ve görünmezliği ona
   * işlemez (`pinpointBy`: Mind Spike).
   */
  breakOnDamageDealt?: boolean;
  /** Kuyruk A6 (Produce Flame): elde tutulan büyü (konsantrasyonsuz; `spell_followup` ile kullanılır). */
  held?: { spell: string; slotLevel: number | null };
  /** Kuyruk A6 (Alter Self): yüzme hızı (derin su, su altı saldırısı). */
  swim?: boolean;
  /** Kuyruk A6: lanet (Remove Curse kaldırır; Mummy Rot). */
  curse?: boolean;
  shakeable?: boolean;
  indifferentTo?: string;
  pinpointBy?: string;
  /** Kuyruk A7 (Faerie Fire): saldırı avantajı yalnızca hedefi gören saldırana. */
  attackedAdvSee?: boolean;
  /** Kuyruk A7 (Dragon's Breath): büyüyle verilen nefes (Magic eylemiyle; `breath.ts`). */
  breath?: BreathSpec;
  /** Kuyruk A8 (Stinking Cloud): bu turda eylem ve bonus eylem yok (tepki serbest). */
  noActBonus?: boolean;
  /** Kuyruk A8 (Gaseous Form): bu biçimde büyü yapılamaz. */
  noCastForm?: boolean;
  /** Görev S1: uçuş hızı (Fly), havada süzülme (Levitate), yürüyemez, süresince verilen durumlar (Invisibility). */
  fly?: number;
  /**
   * Kuyruk U1a (sürüm 61+, `ucus` ilkeli): bu etkinin uçuşunun irtifa sınırı (ft; `azamiIrtifaFt`), süzülme (`yeredegmez`:
   * zorlu zemin, çamur, tuzak, sığ su işlemez; lav, derin su, zemin alanları işler), zorunlu iniş (`zorunluInis`: uçuş yalnız
   * kendi turunda; ana etkide `pkGlide` = hız, alt etki kendi turunda `fly`).
   */
  flyCapFt?: number;
  hover?: true;
  pkGlide?: number;
  airborne?: boolean;
  speedZero?: boolean;
  /** Kuyruk K68a (sürüm 52, enkaz altı): uçuş dahil her hız 0; Freedom of Movement de aşamaz (yalnız 5 ft ile kurtulur). */
  pinned?: true;
  /** Görev K9c: tırmanma hızı (Spider Climb; yükseklik maliyeti yok), büyülü zıplama menzili ft (Jump; turda bir). */
  climb?: boolean;
  jumpFt?: number;
  /** Kuyruk 19: Compulsion: tur başında bu yönde (AXIAL_DIRECTIONS indeksi; yoksa büyücüden uzağa) yürür. */
  compel?: { dir?: number };
  /** Kuyruk 19: Freedom of Movement (zorlu arazi, büyülü hız düşürme yok; yüzme; 5 ft ile yakalamadan kurtulma). */
  freeMove?: true;
  /** Kuyruk 19 (SRD Web Walker): ağ (Web büyüsü, ağ yüzeyi) hareketini kısıtlamaz, ağ alanı etkilemez. */
  webWalker?: true;
  /** Kuyruk 19 (SRD Burrow hızı): yer altında ilerler; zorlu arazi ve alan zorluğu yok (yalnızca hareket). */
  burrow?: true;
  /** Kuyruk 19 (SRD Ice Walk): buz ve kar zorlu arazi sayılmaz. */
  iceWalker?: true;
  /** Kuyruk 19: Fire Shield: 5 ft içinden yakın dövüşle vurana karşılık hasarı. */
  retort?: { dice: string; type: string };
  /** Kuyruk 19: Aura of Life (taşıyanın çevresindeki dostlara direnç; 0 HP'deki dosta tur başında 1 HP). */
  auraLife?: { radiusFt: number; resist: string[]; revive: boolean };
  /** Kuyruk 19: süren etkinin bonus eylemle yaptırdıkları (Conjure Woodland Beings: Disengage). */
  bonusGrant?: Array<'hide' | 'dash' | 'disengage'>;
  /** Kuyruk 19: Water Walk (sıvı yüzeyinde yürüme; `deepWater.ts` `waterWalks`). */
  waterWalk?: true;
  grants?: string[];
  /** Görev S1: AC eklentisi (Haste +2, Slow −2), AC tabanı (Barkskin 17, Mage Armor 13 + DEX), hız çarpanı (Haste 2, Slow 0,5). */
  ac?: number;
  acMin?: number;
  speedMult?: number;
  /** Saldırınca, büyü yapınca ya da hasar verince biter (Invisibility). */
  breakOnAct?: boolean;
  /** Kuyruk 19 (Merge with Shadows): eylem, bonus eylem ya da tepki kullanınca biter. */
  breakOnAnyAct?: boolean;
  /** Hıza eklenen ft (Longstrider). */
  speedFt?: number;
  /** Görev A2: engelden geçme (yaratık ve duvar altıgenlerinden yürür; boş altıgende biter). */
  phase?: PhaseSpec;
  /** Görev A5: süre boyunca her turda bu kadar ek bonus eylem. */
  extraBonus?: number;
  /** Görev A4: tasma: `centerId` yaratığından `radius` altıgenden uzağa kendi hareketiyle gidemez (`leash.ts`). */
  leash?: { centerId: string; radius: number };
  /** Görev B1: avantajlı/dezavantajlı save'ler (Haste DEX, Beacon of Hope WIS, Gaseous Form STR/DEX/CON, Enlarge STR; Reduce STR). */
  saveAdv?: Ability[];
  saveDis?: Ability[];
  /** Görev B1: hasar direnci (Protection from Energy seçilen tür; Gaseous Form B/P/S). */
  resist?: string[];
  /** Görev B1: bu yaratığa saldırılar dezavantajlı (Blur). */
  attackedDis?: boolean;
  /** Görev B1: bu yaratığın saldırıları dezavantajlı (`melee`: yalnızca yakın dövüş; `single`: ilk saldırıdan sonra biter). */
  attackDis?: { melee?: boolean; single?: boolean; str?: boolean };
  /** Görev K9d: büyü yapılamaz (eğitimsiz zırh; SRD 5.2.1 Armor Training). */
  noCast?: boolean;
  /** Görev CLERIC: Sanctuary (hedef alan düşman WIS save; başarısızsa saldırı/büyü boşa), Warding Bond (alınan hasar `bondTo`'ya da). */
  sanctuary?: { dc: number };
  /** Görev P7: ek paket büyülü vuruş (`kendi`: sahibinin saldırıları, `cagrilanlar`: çağırdıkları); büyüsüz direnç aşılır. */
  pkMagic?: string[];
  /** Görev P7: konsantrasyon kurtulması avantajlı. */
  concAdv?: boolean;
  /** Görev P7: gerçek görüş (ft; `sight.ts` `senseSees`). */
  pkTruesight?: number;
  /** Kuyruk K63 (sürüm 47): Truesight menzili (ft; True Seeing 120); `sight.ts` `truesightRange`. */
  truesight?: number;
  /** Görev P7: meydan okuma: bu yaratık `tauntBy` dışındakilere saldırırken dezavantajlı. */
  tauntBy?: string;
  bondTo?: string;
  /** Görev CLERIC: Bestow Curse seçenekleri: koyana saldırılar dezavantajlı, tur başı WIS save ya da eylem yok, koyanın isabetlerine ek zar. */
  attackDisVs?: string;
  /** Kuyruk K54c (Hükümdar Sözü): bu kimliğe ve onun `ft` içindeki dostlarına saldırılar dezavantajlı. */
  attackDisNear?: { id: string; ft: number };
  /** Kuyruk K54c (Yıldız Falı, Ölümsüz Taht): ilk saldırı/kurtulma zarı avantajlı ya da dezavantajlı; atılınca biter. */
  firstRoll?: { mode: 'advantage' | 'disadvantage'; on: Array<'attack' | 'save'> };
  /** Kuyruk K54c (Ferman): ek eylem bir kez (Haste ek eylem yolu; kullanılınca etki biter). */
  extraActionOnce?: boolean;
  /** Kuyruk K54c (Yazgı Mührü): mühürleyenin yeterliliği (dostların isabetine ek hasar) ve turun ilk saldırısı kendiliğinden isabet. */
  fateSeal?: { pb: number };
  /** Kuyruk K54c (Alışkın Acı): düşük Moral cezaları işlemez. */
  noMoralePenalty?: boolean;
  /** Kuyruk K54c (Öfkeyle Ayakta): öfkedeyken Moral 0'da çökme ertelenir. */
  rageHoldsMoral?: boolean;
  turnSave?: { ability: 'wis'; dc: number };
  curseDamage?: { dice: string; type: string; spells?: boolean };
  /** Görev WIZARD: Blink (tur sonu d20) ve Ethereal (hedef alınamaz; sonraki turunun başında biter). */
  blink?: boolean | 'd6';
  ethereal?: boolean;
  /** Kuyruk 18 H1: taraf değiştirme (Dominate Person/Beast): etkiyi verenin tarafına geçer (`allegiance.ts`). */
  dominate?: boolean;
  /** Kuyruk K64a (sürüm 48): ele geçirilmiş beden (Ghost Possession); kaynak = ele geçiren; Dominate'ten baskın (`possession.ts`). */
  possessed?: boolean;
  /** Kuyruk K64b: Hallow alanında bastırılmış ele geçirme (taraf, Incapacitated ve beden değerleri yok; alandan çıkınca döner). */
  dormant?: boolean;
  /** Kuyruk K61 (sürüm 44): Dominate'e özgü tepki bağı (`reduce.ts`); Charm Person'da yok. */
  reactionLink?: boolean;
  /** Kuyruk 18 H2: Polymorph etkisi (biçimi konsantrasyona bağlar; `polymorph.ts`). */
  polymorph?: boolean;
  /** K17 G1: Banishment: savaştan geçici çıkış (Ethereal gibi hedef alınamaz; tur başında dönmez, konsantrasyonla biter). */
  banished?: boolean;
  /** Kuyruk 19 (SRD canavar yetenekleri, `monsterAbilities.ts`): hasar türü emme (Fire/Lightning/Acid Absorption), hasar
   * tepkisi (Freeze, Aversion to Fire), Bloodied'da avantaj, Blood Frenzy, Aura of Authority (ft), yaratık altıgenlerinden
   * geçme (Swarm, Air/Water/Fire Form), saldırılarda avantaj (War Cry), çılgınlık (Berserk), yutulma, iyileşmeme (Swarm, Mucus Cloud). */
  absorb?: string[];
  onDamageFx?: Array<{ type: string; effect: Partial<ActiveEffect>; name: string }>;
  bloodiedAdv?: { attack?: boolean; save?: boolean };
  bloodFrenzy?: boolean;
  authority?: number;
  passCreatures?: boolean;
  attackAdv?: boolean;
  berserk?: boolean;
  swallowedBy?: string;
  swallow?: { dice: string; type: string; dice2?: string; type2?: string; escapeDamage: number; escapeDc: number };
  noHeal?: boolean;
  /** Kuyruk 19 (Corrosive Form): silah başına birikmiş saldırı cezası. */
  corroded?: Record<string, number>;
  /** Kuyruk 19 (görev 3): Globe of Invulnerability (sınır büyü seviyesi, yarıçap ft), Antimagic Field (yarıçap ft), Mind Blank (hasar bağışıklığı). */
  spellGlobe?: number; globeRadiusFt?: number; antimagic?: number; immuneDamage?: string[];
  /** Kuyruk 19 (Cloud of Insects): konsantrasyon save'ine dezavantaj. */
  concDis?: boolean;
  /** Kuyruk 19: büyücünün o turdan sonraki turunun sonunda biter (Telekinesis; değer: uygulandığı tur). */
  untilSourceTurnEnd?: number;
  /** Kuyruk A4: kaynağın (`sourceId`) sonraki turunun sonunda biter (değer: uygulandığı tur; Color Spray, Starry Wisp). */
  endAfterSourceTurn?: number;
  /** Kuyruk A4: tur sonu tekrar save'i yalnızca kaynağı göremezken (Fear). */
  repeatSaveUnseen?: boolean;
  /** Kuyruk A4: Blindsight/Truesight menzilindeki saldıran için etkisiz (Blur, Mirror Image). */
  sensesPierce?: boolean;
  /** Kuyruk A4 (Holy Aura): yakın dövüşle isabet ettiren bu türdeki yaratık CON save ya da Blinded. */
  blindRetort?: { types: string[]; dc: number };
  /** Kuyruk 19: tur başında save (Conjure Elemental tutsağı): başarısızsa hasar, başarılıysa biter. */
  startSave?: { ability: Ability; dc: number; dice: string; type: string };
  /** Kuyruk 19: Gift of the Protectors (kaynak warlock) ve Gaze of Two Minds (bağlı dost). */
  giftOf?: string;
  gazeAt?: string;
  /** Kuyruk 19: Interposing Hand. */
  interpose?: boolean;
  /** Kuyruk 19: Telekinesis: havaya kaldırıldı, bırakılınca bu kadar ft düşer. */
  tkFallFt?: number;
  /** Kuyruk 19: Resilient Sphere küresini taşıyan yaratık. */
  carriedBy?: string;
  /** Kuyruk 19: Banishment tam süre sürerse yerli olmayan (Aberration, Celestial, Elemental, Fey, Fiend) geri dönmez. */
  banishForever?: boolean;
  /** K17 G1: Resilient Sphere: kürenin içinde (hasar bağışıklığı; hareket ve saldırı yok). */
  sealed?: boolean;
  /** Görev B1: silah isabetinde ek zar (Enlarge +1d4) ya da bütün hasar zarlarından düşülen zar (Reduce, Ray of Enfeeblement). */
  hitDie?: string;
  /** Görev B1: `hitDie`'ın hasar türü (True Strike: Radiant); verilmezse silahın türü. */
  hitType?: string;
  /** Görev BARD: Bardic Inspiration zarı (başarısız D20 Testinde atılır, atılınca etki biter). */
  inspire?: string;
  /** Kuyruk P11 (paket `ilham.iade`): zar başarıyı getirmezse kalır (`target`) ya da Bard'a döner (`source`). */
  inspireKeep?: 'target' | 'source';
  /** Kuyruk P11: iade edilecek Bard kaynağı. */
  inspireRes?: string;
  /** Kuyruk P11 (paket `ilham.hedefler`): ilham zarı silah hasarına ve/veya isabet alınca AC'ye eklenebilir. */
  inspireUses?: Array<'damage' | 'ac'>;
  damagePenalty?: { die: string; weaponOnly?: boolean; min?: number };
  /** Görev B1: silahta büyü yeteneği ve zar (Shillelagh: Club, Quarterstaff; d8 / seviyeyle büyür; Force seçeneği). */
  weaponOverride?: { weapons: string[]; die: string; force?: boolean; attack: number; mod: number; type?: string };
  /** Görev B1: her tur sonu kurtarma zarı; başarıda biter (Slow, Ray of Enfeeblement). */
  repeatSave?: { ability: Ability; dc: number; failDamage?: { dice: string; type: string }; /** Kuyruk K70: otomatik başaran türler. */ autoTypes?: string[]; tally?: { need: number; s: number; f: number; failGrants?: string[] } };
  /** Kuyruk 19: Contagion: verdiği durumu kaldıran etki önce bu save'i ister (başarısızsa durum kalır). */
  stubborn?: { ability: Ability; dc: number };
  /** Görev B1: hedefin sonraki turunun sonunda bir kez hasar (Acid Arrow), sonra biter. */
  delayed?: { dice: string; type: string };
  /** Görev B1: tepki alamaz (Slow), saldıramaz ve büyü yapamaz (Gaseous Form). */
  noReactions?: boolean;
  /** Kuyruk 19: bonus eylem yok (Confusion). */
  noBonus?: boolean;
  /** Kuyruk 19: Confusion: tur başında d10 davranış tablosu. */
  confused?: boolean;
  noAttack?: boolean;
  /** Görev B1: ölüm kurtarma zarında avantaj ve iyileştirmede en yüksek değer (Beacon of Hope). */
  deathSaveAdv?: boolean;
  maxHeal?: boolean;
  /** Görev B1: boyut değişimi (+1 büyür, −1 küçülür; yalnızca jeton etiketi, mekanik tek altıgen). */
  size?: 1 | -1;
  /** Görev B1: bitince uyuşukluk (Haste): bir tur Incapacitated ve hız 0. */
  lethargy?: boolean;
  /** Görev B1: süreli tekrar (Heat Metal, Call Lightning, Vampiric Touch, Gust of Wind): büyücü konsantrasyon sürerken
   *  `repeat_spell` ile büyünün etkisini slotsuz tekrarlar (maliyet büyü verisinde). */
  repeat?: { spell: string; slotLevel: number; targetId?: string };
  /** Görev B1: hedef 0 HP'ye düşünce biter (Gaseous Form). */
  dropAtZero?: boolean;
  /** Kuyruk 41b: ilk kez 0 HP'ye düşecekken 1 HP'de kalır, etki biter (Death Ward). */
  deathWard?: boolean;
  /** Görev B2: kendi turunun sonunda biter (Stinking Cloud: o turun sonuna dek Poisoned). */
  untilOwnTurnEnd?: boolean;
  /** Kuyruk 41b: Dikkat dağıt: pasif Algı cezası (gizlenme ve alarm). */
  perceptionPenalty?: number;
  /** Görev B1: jetondaki simge (seçenekli biçimde; verilmezse büyünün simgesi). */
  icon?: string;
  /** Görev B1: koyanın (`sourceId`) sonraki turunun başında biter (Heat Metal dezavantajı, Ray of Enfeeblement başarısı). */
  untilSourceTurn?: boolean;
  /** Kuyruk A2: bu yaratığın yakalaması sürdükçe (Roper, Rug of Smothering, Vortex…); yakalama bitince etki düşer. */
  whileGrappledBy?: string;
}

/** Savaşçının tepkisi (Görev R1): kimlik (SRD), ad, mekanik; tepki büyüsünde büyünün adı. */
export type ReactionSpec = ReactionMechanic & { id: string; name: string; spell?: string };

/** Süren güçlendirme (Görev P-Paladin): `until` turuna dek (o tur dahil) geçerli. */
export interface Buff {
  /** Kaynak (büyü ya da özellik adı); aynı kaynaktan ikincisi öncekinin yerine geçer. */
  source: string;
  by: string;
  until: number;
  attackBonus?: number;
  damageBonus?: number;
  /** Silah isabetinde ek zar (Divine Favor). */
  extraDamage?: string;
  damageType?: string;
  /** Yalnızca yakın dövüş silah saldırıları (Sacred Weapon). */
  meleeOnly?: boolean;
  /** Kuyruk S1 (Magic Weapon): yalnızca bu silah (silah kimliği). */
  enchantBy?: string;
  /** Hasar Radiant olabilir: hedef silahın türüne dirençliyse Radiant seçilir. */
  radiant?: boolean;
  /** Kuyruk 19 (Conjure Minor Elementals): ek zar her saldırıda (büyü dahil), yalnızca bu menzildeki hedefe, seçilebilen türler. */
  anyAttack?: boolean;
  withinFt?: number;
  extraTypes?: string[];
}

/** Savaşta kullanılabilen sınıf özelliği (kurulurken veriden kopyalanır). */
export interface UsableFeature {
  key: string;
  name: string;
  type: 'action' | 'bonus' | 'free';
  resource?: string;
  when?: 'attackAction';
  /** Kuyruk AS1b: bu zırh türlerinde kullanılamaz (Kanat Süzülüşü: orta/ağır). */
  noArmor?: Array<'medium' | 'heavy'>;
  effect: FeatureEffect;
}

export interface Economy {
  action: boolean;
  /** Kuyruk S2: bu turun serbest nesne etkileşimi (yerden alma) kullanıldı. */
  interacted?: boolean;
  bonus: boolean;
  reaction: boolean;
  /** Attack eylemiyle kalan saldırı sayısı (Extra Attack). */
  attacksLeft: number;
  /** Bu turda kaç kez koştu (Dash): her biri hızı bir kez daha ekler. */
  dashes: number;
  /** Bu tur ayrılma (Disengage) yaptı: fırsat saldırısı tetiklemez. */
  disengaged: boolean;
  /** Bu tur Action Surge kullandı (ek eylem; o eylemle büyü yapılamaz). */
  surged: boolean;
  /** Son kez slotlu büyü yaptığı tur ("tur:sıra"); turda yalnızca bir slot harcanır. */
  slotTurn: string | null;
  /** Bu tur Attack eylemiyle (yan el silahından farklı) bir Light silahla saldırdı: yan el ek saldırısı açılır (Görev P1). */
  lightAttack?: boolean;
  /** Bu tur yan el ek saldırısı yapıldı (turda bir kez). */
  offhandUsed?: boolean;
  /** Bu tur yakın dövüş silahıyla son vurduğu hedef (smite büyüleri; kritik vuruşta smite zarları iki kat). */
  meleeHit?: { targetId: string; critical: boolean; martialArts?: boolean; pact?: boolean };
  /** Görev F: bu tur son saldırılan yaratık (Horde Breaker). */
  lastTargetId?: string;
  /** Flurry of Blows'tan kalan Unarmed Strike sayısı (Görev P-Monk). */
  flurryLeft?: number;
  /** Bu tur Stunning Strike denendi (turda bir kez). */
  stunUsed?: boolean;
  /** Kuyruk 19: bu tur Tree Stride kullanıldı. */
  treeStride?: boolean;
  /** Kuyruk 19: yarı hızla fırsat saldırısı almadan serbest kayma bütçesi (altıgen; Tactical Shift, Withdraw). */
  shiftLeft?: number;
  /** CILA (Haste): bu tur Haste'in ek eylemi alındı (`hasteUsed`); `hasted` o eylem sürerken (yalnızca tek saldırı, Dash, Disengage, Hide). */
  hasted?: boolean;
  hasteUsed?: boolean;
  /** Kuyruk A6: Haste ek eylemi asıl eylemden önce alındı (o kullanılınca asıl eylem geri gelir). */
  hasteFirst?: boolean;
  /** Kuyruk A6: Conjure Animals sürüsü bu tur sahibiyle taşındı. */
  packMoved?: boolean;
  /** Kuyruk 19: bu tur çağrılanlara bonus eylemle emir verildi (Animate Objects). */
  summonCommand?: boolean;
  /** K13: kalan saldırılar Thirsting Blade'den; yalnızca pact silahıyla. */
  pactOnly?: boolean;
  /** Görev A5: bu tur kullanılan ek bonus eylem sayısı (`extraBonusOf`). */
  bonusExtraUsed?: number;
  /** Kuyruk 19 (11–20): Fleet Step ve Arcane Apotheosis bu tur kullanıldı. */
  fleetUsed?: boolean;
  apotheosisUsed?: boolean;
  loadingFired?: boolean;
}

export const FRESH_ECONOMY: Economy = {
  action: false, bonus: false, reaction: false, attacksLeft: 0, dashes: 0, disengaged: false, surged: false, slotTurn: null,
};

/** Harita kurallarının savaşçı üstündeki sayaçları. */
export interface MapStatus {
  /** Batma sayacı (batak, derin su, hendek); eşiğe ulaşınca boğulur. */
  sink: number;
  /** Bataktan çıktıktan sonra süren zehir (tur başı hasar, tur sonu CON save ile biter). */
  lingeringPoison: boolean;
  /** Kuyruk K73c (sürüm 64+): batık geçen tur (nefes tutma; SRD Suffocation). */
  breath?: number;
  /** Kuyruk K73c (sürüm 64+): boğulmadan kazanılan Exhaustion seviyeleri (nefes alınca gider). */
  suffocation?: number;
}

export const FRESH_MAP_STATUS: MapStatus = { sink: 0, lingeringPoison: false };

/**
 * Sınıf kaynaklarının kalan kullanımları: kaynak kimliği → sayı (Görev N; tanımlar data/class-features.json
 * "resources": Action Surge, Second Wind, Favored Enemy, Rage, Focus…). Savaş içinde yenilenmez; kısa ve uzun
 * dinlenme kurala göre yeniler. Olmayan kaynak 0 sayılır. Eski kayıtlarda üç alanlı nesne (sıfırlar dahil).
 */
export type Resources = Record<string, number>;

export const NO_RESOURCES: Resources = {};

/** Kaynağın kalan kullanımı (yoksa 0). */
export const resourceLeft = (c: { resources: Resources }, id: string): number => c.resources[id] ?? 0;

/**
 * Süren konsantrasyon (SRD 5.2.1): büyü, yapıldığı slot ve tur, işaretli hedef (Hunter's Mark),
 * gücün altıgeni (Spiritual Weapon), büyünün verdiği durumlar (bitince kalkar) ve yayılımın
 * bu tur kimi etkilediği (Spirit Guardians: yaratık başına turda bir save).
 */
export interface Concentration {
  spell: string;
  slotLevel: number;
  /** Yapıldığı tur ("tur:sıra"): sonraki turlarda bonus eylemle sürdürülür. */
  turn: string;
  targetId?: string;
  pos?: Offset;
  /** Büyünün koyduğu durumlar: konsantrasyon bitince kalkar. */
  conditions?: Array<{ targetId: string; condition: string }>;
  /** Yayılımın etkilediği yaratık → tur anahtarı. */
  auraHits?: Record<string, string>;
}

/**
 * Çağrılmış yaratığın bağı (Görev R3; data/summons.json): çağıran, büyü, sıradaki yeri (kendi inisiyatifi ya da
 * sahibinin hemen ardı), büyü seviyesi ve kaybolma koşulları. Kaybolan yaratık savaşçılarda kalır (`gone`; günlük
 * adları için), sırada atlanır, haritada çizilmez.
 */
/** Dragonborn Breath Weapon (SRD 5.2.1 tür özelliği). */
export interface BreathSpec {
  srd: string;
  resource: string;
  save: Ability;
  dc: number;
  dice: string;
  damageType: string;
  shapes: Array<{ shape: 'cone' | 'line'; sizeFt: number; widthFt?: number }>;
}

export type SummonVanishReason = 'hp' | 'concentration' | 'owner' | 'replaced' | 'duration' | 'dispelled' | /** Kuyruk MB7 (70+): Phantom Steed hasar alınca. */ 'damaged';

/** Kuyruk MB7 (70+): çağrılan yaratığın binek kuralı (data/summons.json `mount`, paket yaratığında `binek`). */
export interface MountRule {
  /** Yalnız çağıran biner (yoksa her dost). */
  ownerOnly?: true;
  /** Binicinin en büyük boyutu (MB1 kuralı ayrıca: binek en az bir boy büyük). */
  maxRider?: CreatureSize;
  /** Sahibin (çağıranın) seviye eşiği. */
  minLevel?: number;
}

export interface SummonInfo {
  /** Çağıranın savaşçı kimliği. */
  by: string;
  /** Büyünün kimliği (data/spells.json `id`; data/summons.json anahtarı) ve adı (konsantrasyon karşılaştırması). */
  spellId: string;
  spell: string;
  turn: 'own' | 'after-owner';
  /** Büyü seviyesi (yukarı slotta slot seviyesi; stat bloğundaki "spell's level"). */
  level: number;
  /** Seçilen yaratık türü ya da nefes hasar türü. */
  choice?: string;
  concentration?: boolean;
  /** Bu turdan sonra kaybolur (süre). */
  until?: number;
  endsOnOwnerDeath?: boolean;
  /** Saldırı yapamaz (familiar). */
  noAttack?: boolean;
  /** Görev B2: dokunulamaz nesne ya da ruh (Flaming Sphere, Conjure Animals): hedef alınmaz, alanlardan etkilenmez. */
  intangible?: boolean;
  /** CILA: kendi turu yok; sahibi bonus eylemle taşır (`summon_move`). */
  ownerBonus?: { moveFt: number; ram?: boolean };
  /** Kuyruk 19: Arcane Hand (etkileri arcaneHand.ts) ve yer kaplamaz. */
  hand?: boolean;
  noSpace?: boolean;
  /** Kuyruk 19: sahibi bonus eylemle emretmezse turunda yalnızca Kaçın (Animate Objects). */
  commandBonus?: boolean;
  /** Kuyruk A6: emrin menzili (ft; Animate Dead 60): dışındaysa emir işlemez. */
  commandFt?: number;
  /** Kuyruk A6 (Conjure Animals): sahibi bu tur yürüdüyse taşımak bonus eylem istemez; sahibine STR save avantajı. */
  withOwner?: boolean;
  /** Kuyruk MB7 (70+): binek kuralı; yoksa çağrılan yaratığa binilmez. */
  mount?: MountRule;
  /** Kuyruk MB7 (70+): hasar alınca kaybolur (Phantom Steed). */
  endsOnDamage?: true;
  gone?: boolean;
}

/** Bir canavarın saldırısı (şablondan türetilmiş). */
export interface CombatantAttack {
  name: string;
  /** Kuyruk 19: bonus eylemle (Multiattack dışı). */
  bonusAction?: boolean;
  bonus: number;
  damageDice?: string;
  damageType?: string;
  save?: { ability: Ability; dc: number; halfOnSave: boolean };
  rider?: string;
  recharge?: number;
  repeat: number;
  ranged: boolean;
  /** Yakın dövüş erişimi (ft). */
  reachFt?: number;
  /** Normal ve uzun menzil (ft). */
  range?: [number, number];
  /** Orijinal hasar metni. */
  text: string;
  /** Alanlı save saldırısı (nefes, Cone/Line…; Görev R4): metinden ya da çağırma verisinden. */
  area?: AttackArea;
}

/**
 * Soy rengi (`data/soy-renkleri.json`). Görev K8b: `select` ton aralığı + HSL hedef (yalnızca High Elf'te kaldı).
 * Görev K15: ten maskesiyle (`public/characters/maske/`) LCh kaydırma (`lch`) ya da üç duraklı gradyan haritası (`gradient`).
 */
export interface TintSpec {
  select: { hMin: number; hMax: number; sMin: number; lMin: number; lMax: number };
  to: TintTarget;
}
export type TintTarget =
  | { h: number | null; s: number; l: number }
  /** Ton `h` (Lab derece), kroma `c`; orijinal ton/kroma sapmasının korunan payı; açıklık `L' = L·gain + dL`. */
  | { lch: { h: number; c: number; /** Kuyruk AS1c: hedef ortalama açıklık (verilirse `gain`/`dL` yerine; gölge/ışık sapması korunur). */ L?: number; hueKeep?: number; chromaKeep?: number; gain?: number; dL?: number; contrast?: number } }
  /**
   * Ten açıklığı (maskede %5–%95 aralığı) gölge → orta → vurgu Lab duraklarına parçalı doğrusal eşlenir.
   * DROW-PALET: `contrast` (0–1) orta tonlarda S-eğrisi; `chromaKeep` (0–1) orijinal pikselin a/b'sinin ten
   * ortalamasından sapmasının korunan payı (gölgedeki sıcaklık, vurgudaki soğukluk). Verilmezse eski davranış.
   */
  | { gradient: Array<[number, number, number]>; contrast?: number; chromaKeep?: number };

/** Avatar: görsel yolu (`public/` altında) ve görsel yoksa yer tutucunun rengi ve yazısı. */
export interface Avatar {
  src: string;
  bg: string;
  label: string;
  /** Uyurken gösterilecek resim (varsa; yoksa `src`). Canavarlarda `monsters/<id>-uyku.webp`. */
  asleepSrc?: string;
  /** `src` yüklenemezse sırayla denenecek eski yollar; hiçbiri yoksa `label`. */
  fallbacks?: string[];
  /** Görev K8b: soy rengi (karakter jetonu çalışma anında yeniden boyanır). */
  tint?: TintSpec;
  /** Kuyruk AS1c: alt soy görünümü (yalnız çizim: oran, hale, filtre, kanat katmanı; `src/ui/lineageLook.ts` çözer). Yalnız alt soyu olan oyuncu karakteri. */
  look?: { raceId: string; classId?: string; subclassId?: string; lineageId?: string; celestialAwakening?: string; level?: number };
  /** Kuyruk 36: geçici kıyafet (mahkûm: Keşiş jetonu + turuncu hale; yalnızca görsel). */
  outfit?: 'mahkum';
  /** Görev P0: renk tonu kaydırma (derece; CSS hue-rotate) ve halka rengi (çizim anında; ek görsel yok). */
  hue?: number;
  ring?: string;
}

/** Savaştaki bir yaratık (karakter veya düşman). */
export interface Combatant {
  id: string;
  name: string;
  avatar: Avatar;
  side: Side;
  /** Karakteri oynayan oyuncunun kimliği. Düşmanlarda null (GM yönetir). */
  /** Kuyruk 18 H1: yönetiliyorsa (Dominate) asıl taraf ve sahip; `side`/`ownerId` yöneteninki. */
  allegiance?: { side: Side; ownerId: string | null };
  /** Kuyruk 18 H3: yakındaki dost Paladin'in Aura of Protection save bonusu (reducer `syncAuras` yazar). */
  auraSave?: number;
  /** Kuyruk K50: imza alt sınıfı (`data/imza.json`; pasifler, saldırı kancası). */
  imza?: string;
  /** Y1 G2: yapay zekâ rolü (Game Master `set_ai_role`; yoksa veriden türetilir, `ai/evaluate.ts`). */
  aiRole?: 'hasarci' | 'kontrolcu' | 'destek' | 'tank';
  /** Kuyruk K50: Taht Varlığı aurasından WIS kurtulma bonusu (reducer sonu `syncAuras`). */
  imzaWisSave?: number;
  /** Kuyruk K53 S5: pasif auralardan (syncAuras): durum bağışıklığı, can yenileyemez, ölüm save dezavantajı. */
  auraImmune?: string[];
  auraNoHeal?: true;
  auraDeathDis?: true;
  /** Kuyruk K54: aura ölüm save avantajı (Dar Gün Aurası). */
  auraDeathAdv?: true;
  /** Kuyruk K54b: Mevzi İşareti altıgeninde kurtulma bonusu (reducer sonu `syncAuras`). */
  wardSave?: number;
  /** Kuyruk K54b: Omuz Ver: başarısız kurtulmaya bonus verebilecek bağlı dost (reducer sonu `syncAuras`). */
  shoulderBy?: { id: string; bonus: number };
  /** Kuyruk K54c (Geride Kalan): Moral/Yıpranmanın normal üst sınırı (Yaralı Kalp tavanı üçte bir; eksik puan bundan). */
  yipranmaNormal?: number;
  /** Kuyruk 18 H4: başka kattaki savaşçı (o katın harita kimliği) ve oradaki konumu. */
  offFloor?: string;
  floorPos?: Offset;
  /** Kuyruk K64a (sürüm 48): ele geçirdiği bedenin kimliği (bu savaşçı `offFloor: 'beden'`; hedef alınmaz, sırada atlanır). */
  possessing?: string;
  /** Kuyruk K64a: bu savaşçıyı bir daha ele geçiremeyecek olanlar (savaş sonuna dek; SRD 24 saat). */
  possessionImmune?: string[];
  /** Kuyruk 18 H3: Countercharm verebilecek (30 ft, tepkisi hazır) Bard'ın kimliği (reducer `syncAuras` yazar). */
  countercharmBy?: string;
  /** Kuyruk 19: savaşta harcanabilen HP zarları (Lifedrinker); savaş sonu karaktere yazılır. */
  hitDice?: { die: number; left: number };
  /** Kuyruk 19: kalıcı azalmalar (canavar ek etkisi; Greater Restoration kaldırır): HP maksimumundan düşen. */
  maxHpLoss?: number;
  /** Kuyruk 19: Dominate: büyücünün tepkisi harcandı, yönetilen yaratık tepki veremez (türetilmiş). */
  reactionLocked?: boolean;
  /** Kuyruk 19: Investment of the Chain Master: BPS hasarı Necrotic/Radiant (hedefe en çok işleyen). */
  chainDamage?: boolean;
  /** Kuyruk 19: kendi düzlemine gönderildi (Banishment tam süre, Dispel Evil and Good: Dismissal); savaştan çıktı. */
  exiled?: boolean;
  /** Kuyruk 19: yetenek puanı azalması (puan ve değiştirici farkı; Shadow Draining Swipe). */
  abilityLoss?: Partial<Record<Ability, { amount: number; mod: number }>>;
  /** Kuyruk 19: özel duyular (ft; canavar verisinden): Blindsight, Truesight, Tremorsense. */
  /** Kuyruk K73c (sürüm 64+): kazma hızı (ft; canavar verisinden). */
  burrowFt?: number;
  /** Kuyruk K73c (sürüm 64+): yer altında (kazarak; `altitude_changed.burrow`, irtifa eksi). Hedeflenemez, saldıramaz. */
  burrowed?: true;
  senses?: { blindsight?: number; truesight?: number; tremorsense?: number };
  /** Kuyruk 19: içinde bulunduğu auranın verdiği dirençler (Aura of Life; reducer `syncAuras`). */
  auraResist?: string[];
  /** Görev P7: aura içinde kurtulmalar dezavantajlı (`syncAuras`). */
  auraSaveDis?: boolean;
  /** Kuyruk A6 (sürüm 35; `syncAuras`): Silence alanının içinde (Deafened sayılır, sözlü tepki büyüsü yok). */
  silenced?: boolean;
  /** Kuyruk A6 (sürüm 35; Conjure Animals, `syncAuras`): kendi ruh sürüsünün 5 ft içinde (STR save avantajı). */
  packStrAdv?: boolean;
  /** Kuyruk A6 (sürüm 35): bu turda (`turn`) Sanctuary save'ini kaçırdığı korunanlar: onlara yeniden yönelemez, başka hedef seçer. */
  sanctuaryLost?: { turn: string; ids: string[] };
  /** Görev P7: büyüsüz saldırılara direnç (paket yaratığı `buyusuzDirencler`). */
  nonmagicalResist?: string[];
  /** Kuyruk 19 (11–20): `featuresK19` açık ve savaşçının zar yolu özelliği var (Peerless Skill); `syncAuras` yazar. */
  k19Traits?: boolean;
  /** Kuyruk 19 (Epic Boon): Improve Fate sahibi (60 ft; dost için ve düşman için), `syncAuras` yazar. */
  fateBy?: string;
  fateFoe?: string;
  /** Kuyruk 19 (SRD denetimi): eşya isabet ekleri, yüklü büyülerin DC/saldırısı (kaynak → değer), yalnızca eşyadan bilinen büyüler. */
  itemHits?: Array<{ label: string; dice: string; type: string; vs?: string[]; ranged?: boolean; melee?: boolean; critOnly?: boolean }>;
  itemCasts?: Record<string, { dc?: number; attack?: number }>;
  itemOnlySpells?: string[];
  itemTraits?: string[];
  /** Kuyruk 19 (Mounted Combat): bindiği yaratık ve üstündeki binici. */
  riding?: string;
  rider?: string;
  /** Kuyruk 19 (SRD Ammunition): türe göre kalan cephane (savaş başında 20; kılıf/sadak). */
  ammo?: Record<string, number>;
  /** Kuyruk 19 (Irresistible Offense): artırılan yetenek skoru (doğal 20 ek hasarı). */
  boonScore?: number;
  /** Kuyruk 19: Bardic Inspiration zarı özellik işaretli savaşçıda da ikinci şans listesinde (reducer `syncAuras`, kural sürümü 16). */
  inspireFix?: true;
  /** Kuyruk K48 (sürüm 19, `bardicInspirationChain`): ilham zarı önceki ikinci şans tutmazsa da atılır (reducer `syncAuras`). */
  inspireChain?: true;
  /** Kuyruk K48: Moral tam modu (savaş başında `withMorale`; yoksa sistem kapalı): kalan ve en çok. */
  moral?: number;
  moralMax?: number;
  ownerId: string | null;
  ac: number;
  hp: number;
  maxHp: number;
  speed: number;
  initiativeBonus: number;
  /** Savaş başında atılan initiative toplamı. */
  initiative: number;
  height: Height;
  /** Haritadaki altıgeni (0 tabanlı); haritasız savaşta veya yerleşmeden önce null. */
  pos: Offset | null;
  /** Bu turda harcanan hareket (altıgen). Turu gelince sıfırlanır. */
  movementUsed: number;
  /** Kuyruk S2 (sürüm 41): zeminin (yükseklik katmanı) üstündeki irtifa (ft; yoksa 0). `vertTurn`: Levitate'in bu turdaki dikey hareketi. */
  altitudeFt?: number;
  vertTurn?: { turn: string; ft: number };
  /** Kuyruk S2: irtifa Levitate'ten (bitince süzülerek iner, hasarsız). */
  altitudeGentle?: boolean;
  /** Kuyruk K68b (sürüm 52): irtifa tırmanmadan (duvarda/tavanda; zeminden kopuk sayılır, tutunamazsa düşer). */
  climbing?: true;
  /** Kuyruk S2: elden bırakılan silah/eşya kimlikleri (elde tutulanlar = saldırı seçenekleri eksi bunlar; `hands.ts`). */
  dropped?: string[];
  /** Kuyruk S2 (paket `silahBagi`): bağlı silah kimlikleri (zorla düşmez, ele çağrılır). */
  bonded?: string[];
  /** Kuyruk P11 (paket `buyuVer.yalnizKendine`): bedava (kaynakla) yapımda yalnız kendine. */
  pkSelfOnly?: string[];
  /** Kuyruk P11 (paket `buyuDegisimi.ikiz`): Twinned Spell yolu paket kaynağıyla. */
  pkTwin?: { resource?: string; cost: number };
  /** Kuyruk P12 (paket `buyuDegisimi.ikizOkul`, sürüm 43): bu okulun tek hedefli büyüsü iki hedefe (kaynaksız). */
  pkTwinSchool?: string;
  /** Uçuş hızı (ft), yoksa 0. Uçan yaratık lav ve zorlu zeminden etkilenmez. */
  fly: number;
  /** STR skoru (uzun atlama menzili için). */
  strScore: number;
  /** Kuyruk 19: savaş başındaki kaynak tavanları (dolu değerler; Persistent Rage, Perfect Focus). */
  resourceCaps?: Record<string, number>;
  /** Kuyruk 19: DEX skoru (Second-Story Work'ün Jumper'ı: atlama mesafesi DEX ile). */
  dexScore?: number;
  /** Gizlenmişse bulunma DC'si (Stealth toplamı); değilse null. */
  hidden: { dc: number } | null;
  /** Zırhı Stealth zarında dezavantaj veriyor. */
  stealthDisadvantage: boolean;
  /** Karanlık görüş (ft); 0 ise yok. */
  darkvision: number;
  /** Korunması gereken masum (GM yönetir; `objective` kuralı). */
  civilian: boolean;
  /** Masumun görünümü (data/masumlar.json kimliği); GM kurulumda seçer, yoksa tohumlu varsayılan. */
  gorselId?: string;
  /** Oyuncu karakterinin ırkı (jetonun görsel ölçeği için; mekanik boyut değişmez). */
  raceId?: string;
  /** Görev K5: taşıma yükü (kural açıkken eşik aşıldıysa; kartta rozet). */
  load?: 'encumbered' | 'heavy' | 'over';
  /** Görev K3: karakterin soyu (savaş kartında soy yetenekleri). */
  lineageId?: string;
  /**
   * F1: kaynakla slotsuz yapılan, karakterin seçtiği büyüler (büyü adı → kaynak kimliği; Magic Initiate'in 1. seviye
   * büyüsü uzun dinlenmede bir kez). Veride sabit `freeSpell`'in karakter başına karşılığı.
   */
  freeSpells?: Record<string, string>;
  /** F1: büyü başına zorluk sınıfı ve saldırı bonusu (Magic Initiate'in seçilen yeteneği; sınıfınkinden farklıysa). */
  spellStats?: Record<string, { dc: number; attack: number }>;
  /** Görev G1: karakterin geçmişi (bilgi; Magic Initiate büyüleri `spellNames`'te). Kayıt sürümü 20'den önce yok. */
  backgroundId?: string;
  /** Görev K3: Goliath Giant Ancestry seçeneği (`giant.ts`; kaynak `giantAncestry`). */
  giant?: import('../data').GiantAncestry;
  /** Canavardan geldiyse canavar kimliği (saldırı etkileri `data/condition-effects.json` için). */
  monsterId?: string;
  /** Kuyruk 33: kalan efsanevi eylem kullanımı (yoksa tam) ve bu tur kullanılan tekrarlanmaz eylemler. */
  legendaryLeft?: number;
  /** Kuyruk 43: savaşta kullanılabilen sarf eşyaları (eşya kimliği → adet; iksirler). */
  consumables?: Record<string, number>;
  /** Kuyruk 43: Legendary Resistance bu turlar arasında kullanıldı (kendi turunun başında kalkar). */
  lrLock?: boolean;
  /** Kuyruk 19 (srdK19): 30 ft içindeki Sphinx of Wonder'ın Burst of Ingenuity'si (reducer `syncAuras` yazar). */
  burstBy?: { id: string; pool: { id: string; remaining: number } };
  legendaryUsed?: string[];
  /** Ağır zırh giyiyor (çöl sıcağı, derin suda batma). */
  heavyArmor: boolean;
  /** Kuyruk AS1b: orta zırh giyiyor (Kanatlı Tiefling uçamaz). */
  mediumArmor?: true;
  /** Kuyruk A6: zırh giyiyor (karakterde zırh türü `none` değil; canavarda bilinmez). */
  armored?: boolean;
  /** Kuyruk S2: metal zırh giyiyor (Heat Metal). */
  metalArmor?: boolean;
  /** Kuyruk A7: kalkan taşıyor (karakterde; Flame Blade boş el denetimi). */
  shieldHeld?: boolean;
  /** Harita kurallarının savaşçıya bıraktığı izler (Adım 8). */
  mapStatus: MapStatus;
  /** Harcanan eylemler (true: bu tur kullanıldı). */
  economy: Economy;
  /** Attack eylemindeki saldırı sayısı (Extra Attack ile 2 veya daha çok). */
  attacksPerAction: number;
  /** K13: pact silahıyla Attack eylemindeki saldırı sayısı (Thirsting Blade). */
  pactAttacks?: number;
  /** Bonus eylemle yapabildikleri. */
  bonusActions: BonusOption[];
  /**
   * Bu turdaki son yürüyüşün sonundaki düz koşu: yön (hex.ts AXIAL_DIRECTIONS indeksi) ve
   * art arda o yönde atılan adım sayısı. Tur başında ve atlamadan sonra null.
   */
  run: { dir: number; hexes: number } | null;
  /** Etkin durumların adları (süresizler dahil). Süreli olanların süresi `conditionTimers`'ta. */
  conditions: string[];
  /** Süreli durumlar (durum adı `conditions`'ta da bulunur; durum kalkınca sayacı da düşer). */
  conditionTimers?: ConditionTimer[];
  /**
   * Yakalandı (Grappled): yakalayan, kaçış DC'si ve kavrama sürerken Restrained mi. Süresiz; kaçış
   * eylemiyle, yakalayan düşünce/etkisiz kalınca ya da aralarındaki mesafe açılınca biter.
   */
  grapple?: { by: string; escapeDc: number; restrained: boolean };
  /** Ability modifier'ları. */
  modifiers: Scores;
  /** Save bonusları. */
  saves: Scores;
  /** Yetkin olunan becerilerin bonusları; olmayanınki ability modifier'ı (`skillBonus`). */
  skills: Partial<Record<Skill, number>>;
  /** Tırmanma kontrolü bonusu (STR veya DEX modifier'ının yükseği). */
  climbMod: number;
  spellSlots: number[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  packTactics: boolean;
  /** Karakter seviyesi (canavarlarda 0). */
  level: number;
  /** Büyü yapma ability modifier'ı. */
  spellMod: number;
  spellSaveDc: number | null;
  spellAttack: number | null;
  /** Yapabildiği büyüler. */
  spellNames: string[];
  /** Kuyruk 19: canavar büyülerinin "level N version" seviyesi (slotsuz yapımda bu seviyede). */
  castLevels?: Record<string, number>;
  /** Kuyruk 19 (Hydra Multiple Heads): canlı baş sayısı, son turundan beri ölen baş, ateş hasarı aldı mı, turun başındaki HP. */
  heads?: number; headsLost?: number; headsFire?: boolean; headsTurnHp?: number;
  /** Kuyruk 19: şarj bekleyen canavar yetenekleri (`monster_ability`) ve ölüm patlaması yapıldı mı. */
  abilityRecharge?: string[]; burstDone?: boolean;
  /** Kuyruk 19: Aura of Authority içinde (türetilir, `authority.ts`). */
  authorityAdv?: boolean;
  /** Ortam kurallarında aranan küçük harfli tarif (ırk ve sınıf). */
  casterTag: string;
  attacks: CombatantAttack[];
  multiattack: boolean;
  undeadFortitude: boolean;
  /** Tur başına yenilenen HP (Troll gibi), yoksa 0. */
  regeneration: number;
  /** Kullanılmış ve henüz yenilenmemiş (Recharge'lı) saldırıların sıra numaraları. */
  rechargeUsed: number[];
  /** Acid veya fire hasarı aldı: bir sonraki turunda yenilenemez. */
  regenBlocked: boolean;
  /** 0 HP'ye düştü ama turu başında yenilenip ayağa kalkabilir. */
  regenPending: boolean;
  /** Karakterin yaşam durumu: ayakta, ölmekte (0 HP), stabil veya ölü. */
  life: 'alive' | 'dying' | 'stable' | 'dead';
  /** Görev A5: her turda ek bonus eylem sayısı (sınıf/alt sınıf özelliği `stat: extraBonusActions`). */
  extraBonus?: number;
  /** Görev A2: doğuştan engelden geçme (Incorporeal Movement; `data/gecis.json`). */
  phase?: PhaseSpec;
  /** Görev A1: ortak can havuzu üyeliği (`BattleState.hpPools`); üyenin `hp`'si havuzun HP'sidir. */
  poolId?: string;
  /** Görev B1: öldüğü tur (Revivify: en çok 10 tur önce ölmüş olmalı). */
  diedRound?: number;
  deathSaves: { successes: number; failures: number };
  /** Karakterin silah saldırı seçenekleri (canavarlarda boş; onların `attacks` listesi var). */
  weaponOptions: AttackOption[];
  /** Süren konsantrasyon büyüsü. */
  concentration: Concentration | null;
  /** Sınıf özelliklerinin kalan kullanımları. */
  resources: Resources;
  /** Görev SORCERER: kaynak en çokları (Sorcery Point slottan dönüşte bunu aşamaz) ve seçilen Metamagic seçenekleri. */
  resourceCap?: Record<string, number>;
  /** Görev WARLOCK: slotsuz büyüler (`self`: yalnızca kendine) ve cantrip değişiklikleri (Invocation'lardan). */
  atWill?: Record<string, 'self' | 'any'>;
  cantripMods?: Record<string, { ability?: boolean; pushFt?: number; rangeFt?: number }>;
  /** Görev DRUID: Wild Shape biçimi (biçimin değerleri ve bırakınca dönülecek eski değerler) ve bilinen biçimler. */
  shape?: ShapeStats & { prev: ShapePrev };
  wildShapeForms?: string[];
  /** Görev BARD: Jack of All Trades (yetkin olunmayan beceri kontrollerine eklenen). */
  jack?: number;
  /** K11: sınıf büyüsü olarak seçilen büyüler (Innate Sorcery yalnızca bunlara; soy ve alt sınıf büyüleri değil). */
  classSpells?: string[];
  /** Seçilen Metamagic seçeneği → Sorcery Point bedeli (sınıf verisinden). */
  metamagic?: Record<string, number>;
  /** Sneak Attack zarı (d6 sayısı; haydut değilse 0). */
  sneakAttackDice: number;
  /** Sneak Attack'ın son kullanıldığı tur (turda bir kez, başkasının turu dahil). */
  sneakTurn: string | null;
  /** Boyut (itme sınırı: hedef en çok bir boyut büyük). */
  size: CreatureSize;
  /** Yetkinlik bonusu (Shove DC'si: 8 + STR + yetkinlik). */
  proficiency: number;
  /**
   * Yan el (Görev P1; eski kayıtlarda yok): Light ek saldırısının seçeneği ve yan el silahında Nick varsa ek saldırı
   * Attack eyleminin içinde (bonus eylem harcamaz).
   */
  offHandOption?: AttackOption;
  nickOffhand?: boolean;
  /**
   * Barbarian (Görev P-Barbarian; eski kayıtlarda yok): Rage bilgisi (`rageDamage` hasar bonusu, `rageResist` direnç
   * türleri), etkin Rage (`rage`: bu tur uzatıldı mı, Rage'in eklediği dirençler), avantajlı save'ler (Danger Sense),
   * Reckless Attack ve Frenzy hakkı, Rage'de STR ile yapılabilen beceriler (Primal Knowledge).
   */
  rageDamage?: number;
  rageResist?: string[];
  rageStrAdvantage?: boolean;
  rage?: { refreshed: boolean; added: string[] } | null;
  saveAdvantage?: Ability[];
  canReckless?: boolean;
  frenzy?: boolean;
  /** Frenzy'nin kullanıldığı tur ("tur:sıra"; turda bir kez). */
  frenzyTurn?: string;
  primalSkills?: Skill[];
  /**
   * Görev P-Paladin (eski kayıtlarda yok): SRD yaratık türü (canavarda; Divine Smite, Protection from Evil and Good),
   * süren güçlendirmeler (Divine Favor, Magic Weapon, Sacred Weapon) ve savaşta kullanılan sınıf özellikleri
   * (`use_feature`: Lay On Hands, Sacred Weapon).
   */
  creatureType?: string;
  buffs?: Buff[];
  features?: UsableFeature[];
  /** Görev P0: ek paket alt sınıfının ilkelleri ve yaratıkları (`src/battle/paket/`; oluşturulurken kopyalanır). */
  paket?: import('./paket/bag').PaketBag;
  /** Görev P6: menzildeki ek paket zar mührü / zorla sonuç kaynakları (reducer türetimi `syncAuras`). */
  pkSans?: import('./paket/sans').PkSans[];
  /**
   * Görev P-Monk (eski kayıtlarda yok; veriden): bonus eylemle Unarmed Strike (Martial Arts), Focus ile bonus eylemler
   * (Flurry of Blows, Patient Defense, Step of the Wind), Uncanny Metabolism, Deflect Attacks, Slow Fall, Stunning
   * Strike, Open Hand Technique.
   */
  bonusStrike?: AttackOption;
  focusActions?: Array<{ id: string; name: string; resource: string; strikes?: number; actions?: Array<'disengage' | 'dodge' | 'dash'> }>;
  metabolism?: { refill: string; die: string; resource: string; max: number };
  deflect?: { dice: string; bonus: number; types: string[]; redirect?: { resource: string; dice: string; save: Ability; dc: number } };
  fallReduction?: number;
  stunning?: { resource: string; save: Ability; dc: number; condition: string };
  openHand?: Array<'addle' | 'push' | 'topple'>;
  /**
   * Görev R1 (eski kayıtlarda yok): tepkiler (sınıf özelliği, tepki büyüsü, canavar tepkisi; fırsat saldırısı
   * herkeste ayrıca), canavar tepkisi kullanım havuzları (Protective Magic 3/Day) ve Recharge bekleyenler.
   */
  reactions?: ReactionSpec[];
  reactionUses?: Record<string, number>;
  reactionSpent?: string[];
  /** Görev R4 (eski kayıtlarda yok): türün nefesi (Dragonborn Breath Weapon; koni ya da çizgi, kaynakla). */
  breath?: BreathSpec;
  /** Görev R3 (eski kayıtlarda yok): çağrılmış yaratık (Find Familiar, Find Steed, Summon Dragon). */
  summon?: SummonInfo;
  /** Görev R2 (eski kayıtlarda yok): süren etkiler (Bless, Bane, Heroism…) ve geçici HP. */
  effects?: ActiveEffect[];
  tempHp?: number;
  /** Görev S1: bitkinlik seviyesi (Exhaustion 1–6; SRD 5.2.1: d20 Testleri −2×, hız −5 ft×, 6'da ölüm). */
  exhaustion?: number;
  /** Silah ustalığı işaretleri (Sap, Slow, Vex); eski kayıtta yok. */
  marks?: MasteryMark[];
  /** Cleave'in son kullanıldığı tur (turda bir kez). */
  cleaveTurn?: string;
  /** Uyuyor (uyuyan ejderha): turunu atlar, hareket etmez, yakın dövüş saldırıları ona avantajlı. */
  asleep?: boolean;
  /** Görev S4: uyanık ama habersiz grup üyesi (turu atlanır, alarmla sıraya girer). */
  unaware?: boolean;
  /** Görev S4: üyesi olduğu uyuyan/habersiz grup. */
  group?: string;
  /**
   * Görev F (eski kayıtlarda yok; veriden `trait`): pasif sınıf özelliği işaretleri (evasion, elusive, studied-attacks,
   * survivor, colossus-slayer…) ve kritik eşiği (Improved/Superior Critical; yoksa 20).
   */
  traits?: string[];
  critOn?: number;
  /** Görev F: Steady Aim'in kullanıldığı tur ("tur:sıra"; bu turki sonraki saldırı avantajlı, hız 0). */
  steadyAim?: string;
  /** Görev F: turda bir kez çalışan özelliklerin son kullanıldığı tur (Colossus Slayer, Horde Breaker, Superior Hunter's Prey). */
  traitTurns?: Record<string, string>;
  /** Ejderhayı uyandırma eğilimi zarının atıldığı tur ("tur:sıra") ve tuttu mu (`dragonWake: chance`). */
  rouseTurn?: string;
  rouseHit?: boolean;
}

/**
 * Silah ustalığının süreli işareti (Weapon Mastery). Sap: tutanın bir sonraki saldırısı dezavantajlı; Slow: tutanın
 * hızı `feet` azalır; Vex: tutanın `targetId`ye bir sonraki saldırısı avantajlı. `by` ustalığı uygulayan; süre onun
 * tur başı/sonu sayısıyla (`end`, `count`) düşer.
 */
/** Cunning Strike seçenekleri (SRD 5.2.1; Poison zehirci takımı ister, yok). */
export type CunningOption = 'trip' | 'withdraw' | /** Kuyruk 19: Poisoner's Kit gerekir. */ 'poison' | 'daze' | 'knock-out' | 'obscure' | /** Kuyruk 18 H3: Supreme Sneak (Thief 9). */ 'stealth';

export interface MasteryMark {
  /**
   * `reckless`: Reckless Attack (tutanın STR saldırıları avantajlı, ona yapılan saldırılar avantajlı). `shield`: Shield
   * büyüsü (Görev R1): tutanın AC'si `ac` artar, sonraki turunun başına dek.
   */
  kind: 'sap' | 'slow' | 'vex' | 'reckless' | 'shield' | 'studied' | 'mdefense';
  ac?: number;
  by: string;
  targetId?: string;
  feet?: number;
  end: 'turnStart' | 'turnEnd';
  count: number;
}

/** Haritalı savaşta haritanın durumu. Altıgenler durumda tutulur (lav yükselince değişir). */
export interface MapState {
  id: string;
  variantId: string;
  /** Kuyruk K71a (sürüm 56+): varyant `dikey` verisinin yerine geçen ezme (testler, Game Master); yoksa harita verisi. */
  dikey?: import('../map/maps').MapDikey;
  /** Kuyruk K71c: açık gök uçuş üst sınırı ezmesi (test, Game Master; yoksa varyant verisi). */
  ucusUstFt?: number;
  /** Kuyruk K72 (sürüm 60+): çöken kat döşemesi altıgenleri ("katId|sütun,satır"; Earthquake). */
  katCokuk?: string[];
  mirrored: boolean;
  /** Satır satır zemin harfleri (lav yükselmesi gibi kurallarla değişebilir). */
  tiles: string[];
  /** Açılmış isteğe bağlı kurallar (karanlık, masumları koru); GM tetiklemeli olanlar komutla. */
  options?: string[];
  /** Bir sonraki tur başında lava dönecek altıgenler (lav yükselmesi uyarısı). */
  lavaWarning?: { hexes: Offset[]; round: number };
  /** Bulunmuş veya tetiklenmiş tuzaklar ("sütun,satır" anahtarları). */
  trapsFound?: string[];
  trapsSprung?: string[];
  /**
   * Masumları koru: kaç masum var ve kaçının hayatta kalması hedefleniyor. Varsayılan bilgi
   * amaçlı (sonucu etkilemez, GM hikâyede işler); `strict` açıksa hayatta kalan `needed`ın
   * altına düşünce düşmanlar kazanır.
   */
  objective?: { total: number; needed: number; strict?: boolean };
  /** Kapı durumları ("sütun,satır" → açık/kapalı/kırık ve HP). */
  gates?: Record<string, { state: 'open' | 'closed' | 'broken'; hp: number }>;
  /**
   * Uyuyan ejderha (`sleepingDragon` kuralı): savaşçı kimliği ve yapay zekâ düşmanlarının onu
   * uyandırma kipi. `never`: asla; `chance`: her düşman turunda `chancePct` yüzdeyle; `gm`: yalnızca GM.
   */
  dragon?: { id: string; mode: DragonWakeMode; chancePct: number };
  /** Görev B2: büyülerin kalıcı zemin etkileri ve geçici engelleri (Fog Cloud, Web, Wind Wall…). */
  zones?: SpellZone[];
  /** Görev K13B: sefer haritasının açtığı ev kuralları (`data/ev-kurallari.json`, `sefer: true` olanlar). */
  seferKurallari?: string[];
  /** Görev S2: harita nesneleri (fıçı, sandık, masa, kapı, mangal; `data/nesneler.json`). */
  objects?: MapObject[];
  /** Kuyruk 24: Game Master'ın harita mekaniği anahtarları (yalnızca varsayılandan farklılar; `ruleControl.ts`). */
  ruleToggles?: Record<string, boolean>;
  /** Kuyruk 24: Game Master'ın düzenlediği kural parametreleri (kural kimliği → alan → değer). */
  ruleParams?: Record<string, Record<string, number | string>>;
  /** Kuyruk 24b: alarm boynuzunun çaldığı tur (sürekli takviye; `hornReinforce`). */
  hornRound?: number;
  /** Kuyruk 29 K28b: çığın geleceği tur (Game Master tetikler; 0 = yok). */
  avalancheRound?: number;
  /** Görev K26: çatırdamış ince buz altıgenleri ("sütun,satır"; ikinci girişte kırılır). */
  crackedIce?: string[];
  /** Kuyruk 29 K22: ani selin geleceği tur (uyarıdan sonra; 0 = geldi). */
  floodRound?: number;
  /** Kuyruk 26: yükseklik katmanı (haritadan; satır → sütun → seviye). Yalnızca katmanlı haritalarda. */
  heights?: number[][];
  /** Kuyruk 26: rampa altıgenleri ("sütun,satır"). */
  ramps?: string[];
}

/** Görev S2: nesne türleri ve durumları. */
export type ObjectKind = 'oilBarrel' | 'powderKeg' | 'chest' | 'table' | 'door' | 'gate' | 'brazier' | 'lever'
  /** Kuyruk 24: Orman mekanikleri (heykelin gözü, çadır, devrilebilir ağaç, köprü, kemik yığını; `forest.ts`). */
  | 'statueEye' | 'tent' | 'tree' | 'bridge' | 'bonePile'
  /** Kuyruk 29 K28b: yazıtlı plaka, kaya yığını, cadı kazanı, buz mühür, çatlak duvar (`wilds.ts`). */
  | 'plaque' | 'boulderPile' | 'cauldron' | 'iceSeal' | 'crackedWall'
  /** Kuyruk 36: anahtar ve doğaçlama silahlar (Hapishane Adası). */
  | 'key' | 'benchLeg' | 'chain' | 'bucket' | 'cudgel'
  /** Kuyruk P12: ek paket büyü kitabı (`buyuDegisimi.kitapCikis`; büyü kitabın altıgeninden çıkabilir). */
  | 'spellbook'
  /** Görev K26: balista, donmuş şelale. */
  | 'ballista' | 'frozenFall'
  /** Kuyruk K53 S3: zeminden çağrılan taş/enkaz (`objectMotion.ts`). */
  | 'rock'
  /** Kuyruk S2: elden düşen eşya (`heldItems.ts`). */
  | 'droppedItem';
export type ObjectState = 'open' | 'closed' | 'locked' | 'tipped' | 'burning' | 'read' | 'out'
  /** Görev K26: balista yüklü / boş. */
  | 'loaded' | 'spent';
/** Görev S2: haritadaki nesne (konum, kalan HP, durum). Yıkılınca listeden çıkar. */
export interface MapObject {
  id: string; kind: ObjectKind; at: Offset; hp: number; state?: ObjectState; lockDc?: number; /** Görev S3: taşıyan savaşçı (retrieve). */ carriedBy?: string;
  /** Kuyruk A7: nesneye yapılmış ışık büyüsü (yarıçap altıgen, büyü kimliği, yapan; Light, Continual Flame). */
  light?: number; lightSpell?: string; lightBy?: string;
  /** Kuyruk 30 D1: keşif nesnesi (oyuncudan saklı, bulunana dek); bulma DC'si (pasif Algı), bulununca keşif bayrağı. */
  gizli?: boolean; found?: boolean; findDc?: number; flag?: string;
  /** Kuyruk S1 (Faerie Fire): bu tura dek parlıyor (nesneye saldırı avantajlı). */
  outlined?: number;
  /** Kuyruk S2: irtifa (Levitate; yapan `levitatedBy`), yerdeki eşya (`item`, geri alınınca dönen `options`), boyut büyüsü (`resized`, yapan `resizedBy`, asıl HP `baseHp`). */
  altitudeFt?: number; levitatedBy?: string;
  item?: string; options?: AttackOption[];
  resized?: 'Enlarge' | 'Reduce'; resizedBy?: string; baseHp?: number;
  /** Kuyruk K68a (sürüm 52): yapı yüksekliği ezmesi (ft; yoksa nesne türünün `yukseklikFt`'i). */
  yukseklikFt?: number;
}
/** Görev S4: grup durumu ve grup (alan altıgenleri; üyeler savaş başında alanda duran düşmanlar). */
export type GroupState = 'asleep' | 'calm' | 'alarmed';
export interface SleepGroup {
  id: string; state: GroupState; hexes: Offset[]; links?: string[]; members?: string[]; alarmedRound?: number;
  /** Kuyruk 16 K16D: devriye rotası (habersiz grup sırayla bu noktalara yürür), sıradaki nokta, durak (tur) ve bekleme. */
  route?: Offset[]; routeIndex?: number; pause?: number; waitUntil?: number;
}
/** Görev S3: hedefler (harita/belgeler/SEFER-TASARIMI.md §3). */
export type GoalKind = 'defeat' | 'reach' | 'protect' | 'destroy' | 'survive' | 'retrieve' | 'veya';
export interface Goal {
  id: string; kind: GoalKind; hexes?: Offset[]; objectId?: string; ids?: string[]; rounds?: number; who?: 'any' | 'all';
  /** Kuyruk 18 V2: "VEYA" hedefi: seçeneklerden birinin bütün alt hedefleri sağlanınca biter (alt hedef kimlikleri benzersiz). */
  options?: Goal[][];
}
export type GoalFailKind = 'rounds' | 'civilians' | 'object' | 'down' | 'alarm';
export interface GoalFail { kind: GoalFailKind; rounds?: number; needed?: number; objectId?: string; ids?: string[] }
export type GoalStatus = 'open' | 'done' | 'failed';
export interface Goals { mode: 'all' | 'any'; list: Goal[]; fail?: GoalFail[]; /** Kilitlenen sonuçlar (`goal_changed`). */ status?: Record<string, GoalStatus> }
/** Görev S2: nesne kullanımı (kapı aç/kapa/kilit aç, masayı devir, mangalı bitişik altıgene dök). */
export type ObjectAction = 'open' | 'close' | 'unlock' | 'tip' | 'knock' | 'take' | 'pull'
  /** Kuyruk P12 (sürüm 43): taşınan büyü kitabını kendi altıgenine bırak. */
  | 'put'
  /** Kuyruk 24: heykelin gözünü çöz, çadırı meşaleyle tutuştur, ağacı devir, kemik yığınını dağıt. */
  | 'solve' | 'ignite' | 'fell' | 'scatter'
  /** Kuyruk 29 K28b: plakayı oku, kaya yığınını yuvarla, kazanı/mangalı söndür. */
  | 'read' | 'roll' | 'douse'
  /** Görev K26: balistayı yükle / ateşle (hedef `to`). */
  | 'load' | 'fire'
  /** A1: hafif/orta hareketli nesneyi hedef altıgene fırlat (`to`; K53 nesne hareketi). */
  | 'throw';

/**
 * Görev B2: altıgenlere bağlı süreli büyü alanı. Kuralı büyü verisinde (`mechanics.zone`); burada yalnızca nerede, kimin,
 * ne kadar. `anchorId` varsa alan o savaşçıyla yürür (`radius` altıgen; Flaming Sphere, Conjure Animals). `hits`: bu
 * turda tetiklenmiş yaratıklar (turda bir kez kuralı; değer tur anahtarı).
 */
export interface SpellZone {
  id: string;
  /** Kuyruk S2 (sürüm 41): bu taraftan gizli alan (Spike Growth); `seenBy` fark edenler. `visibleTo`: yalnız bunlara görünür (Phantasmal Force). */
  hiddenFrom?: Side;
  seenBy?: string[];
  visibleTo?: string[];
  spellId: string;
  name: string;
  casterId: string;
  side: Side;
  dc: number;
  slotLevel: number;
  hexes: Offset[];
  anchorId?: string;
  radius?: number;
  concentration?: string;
  until?: number;
  hits?: Record<string, string>;
  /** Görev Y1: yüzey (yağ, su, buz, alev, yanan ağ, buhar, zehir bulutu); kuralı `data/yuzeyler.json`, `spellId` = `surface:<tür>`. */
  surface?: SurfaceKind;
  /** Kuyruk 18 H2: alanın hasar türü büyüdeki yerine (Conjure Elemental: seçilen element). */
  damageType?: string;
  /** Kuyruk 19: kaplanan merkez altıgen (`occupy`) ve verilen toplam hasar (`budget`). */
  center?: Offset;
  dealt?: number;
  /** Kuyruk 19: Wall of Stone panel hasarı (altıgen anahtarı → hasar) ve Wall of Fire hasar yüzü. */
  panelDamage?: Record<string, number>;
  /** Kuyruk K62 (sürüm 46): Forcecage türü (kafes ya da katı kutu); alandakiler tutsak (`forcecage.ts`). */
  cage?: 'bars' | 'box';
  /** Kuyruk K64b (sürüm 48): Magic Circle / Hallow koruma alanı: seçilen türler (`types`), ters yön (`reverse`, yalnız Magic Circle). */
  ward?: { kind: 'circle' | 'hallow'; types: string[]; reverse?: boolean };
  /** Kuyruk K62 (sürüm 46): Delayed Blast Fireball boncuğu (`bead.ts`): patlama turu ve fırlatma menzili; biriken zar `dealt`. */
  bead?: { until: number; throwFt: number };
  endHexes?: Offset[];
  /** Kuyruk 19: alan bitince altıgenler bu zemine döner (Control Water). */
  restore?: Array<{ at: Offset; ch: string }>;
  /** Kuyruk 19 (11–20): özellik alanı (Holy Nimbus, Nature's Sanctuary): kural alanın içinde, sabit hasar `damage`. */
  spec?: import('../data').ZoneSpec;
  damage?: string;
  /** Kuyruk K53 S4: geçici engel (`src/battle/barriers.ts`, `data/engeller.json`). */
  barrier?: import('./barriers').BarrierSpec;
  /** Kuyruk K66a (sürüm 50): Earthquake alanında yarık hakkı (dökümde 1d6) ve yerleştirme turu (`turnKey`). */
  fissures?: { count: number; turn: string };
  /** Kuyruk K66a (sürüm 50): yarık: açık (`depthFt`, kalıcı) ya da yerleştirilmiş, büyücünün tur sonunda açılacak (`pending`). */
  fissure?: { depthFt?: number; pending?: { at: Offset; dir: number; parentId: string } };
  /** Kuyruk K54b: Mevzi İşareti / Yol Aç: sahibin tarafındaki dostlar burada zor zemini ve zemin hasarını yok sayar (`saveBonus`: kurtulma). */
  groundWard?: { saveBonus?: number };
  /** Kuyruk K68b (sürüm 52): Call Lightning bulutu: merkez `center`, yatay yarıçap (altıgen) ve taban (ft); kuralsız, yalnız sınır. */
  cloud?: { radiusHexes: number; baseFt: number;
    /** Kuyruk K73c (sürüm 64+): devralınan fırtına (yeni bulut yok): harita fırtınası ya da fırtına alanı (Storm of Vengeance). */
    storm?: { kind: 'map' } | { kind: 'zone'; zoneId: string } };
  /**
   * Kuyruk K73c (sürüm 64+): havada merkezli kalıcı alanın dikey aralığı (ft, zemine göre; küre merkez ± yarıçap, silindir
   * merkezden aşağı). Yoksa yerden tepeye (`zoneTopFt`).
   */
  air?: { loFt: number; hiFt: number };
}

/** Görev Y1: yüzey türleri (`src/battle/surfaces.ts`). */
export type SurfaceKind = 'oil' | 'water' | 'ice' | 'fire' | 'burningWeb' | 'steam' | 'poison' | 'slick'
  /** Görev K26: etkisiz tehlike uyarısı (çığ şeridi; yapay zekâ kaçınır). */
  | 'warning';
/** Görev Y1: yüzey tepkimesi (günlük için; durumu değiştirmez, değişiklik ardından gelen alan olaylarında). */
export type SurfaceReaction = 'ignite' | 'webBurn' | 'melt' | 'steam' | 'freeze' | 'explode' | 'chain' | 'douse'
  /** Kuyruk 18b */ | 'fogBurn' | 'crack' | 'condense' | 'splash' | 'dissolve' | 'wash' | 'dilute'
  /** Kuyruk K55: katmanda yerine geçme, zincir sınırı */ | 'replace' | 'chainLimit'
  /** Kuyruk K56: arazi × büyü (satır `row: arazi:<id>`) */ | 'terrain';

/**
 * Bir durumun süresi. `ownerId` kimin turunda sayıldığı (etkiyi veren ya da hedefin kendisi):
 * `end` turun başında mı sonunda mı; `count` o savaşçının kaç tur başı/sonu daha (0'a inince biter).
 * `save` varsa ("save ends"): her `end` anında hedef bu yetenek ve DC ile kurtarma zarı atar, başarıda biter.
 */
export interface ConditionTimer {
  condition: string;
  ownerId: string;
  end: 'turnStart' | 'turnEnd';
  count: number;
  save?: { ability: Ability; dc: number };
  /** Etkinin adı (günlük için: "Wyvern: Sting", "Hold Person"). */
  label: string;
  sourceId?: string;
  /** Durum sürerken hedefin her tur başında aldığı hasar (Pit Fiend zehri, cehennem yarası); tür boşsa türsüz. */
  dot?: { dice: string; type: string };
  /**
   * İki aşamalı durum (Görev WIZARD: Sleep; Görev A3: genel): tekrar save'i başarısız olunca ikinci aşamanın durumuna
   * geçilir. Eski biçim yalnızca durum adı (kalan süre, save'siz).
   */
  escalate?: string | StageSpec;
  /** Hasar alınca durum ve sayaç biter (Sleep). */
  wakeOnDamage?: boolean;
}

/**
 * Görev A3: iki aşamalı durumun ikinci aşaması. `condition` B durumu; `rounds` süresi (tur; verilmezse A'nın kalan
 * süresi); `saveEnds` B'de de her tur sonu aynı save (aynı yetenek ve DC: A'nın kaynağı); yoksa save'siz.
 */
export interface StageSpec {
  condition: string;
  rounds?: number;
  saveEnds?: boolean;
}

export type DragonWakeMode = 'never' | 'chance' | 'gm';

export interface BattleState {
  /** Kuyruk 19 (Time Stop): kimin kaç ek turu kaldı. */
  timeStop?: { actorId: string; left: number };
  /** Kuyruk 19 (Time Stop): kaçıncı ek tur (turda bir kuralları için). */
  timeStopTurn?: number;
  /** Kuyruk 19 (11–20): Thief's Reflexes: yansıma turundan sonra sıranın süreceği yer ve ikinci turunu kullananlar. */
  reflexResume?: number;
  reflexDone?: string[];
  id: string;
  environmentId: string;
  /** Haritalı savaş `setup` (yerleştirme) aşamasıyla başlar; GM `start_battle` ile başlatır. */
  status: 'setup' | 'active' | 'finished';
  /** Haritasız savaşta yok. */
  map?: MapState;
  round: number;
  /** Initiative sırasına göre yaratık kimlikleri. */
  order: string[];
  turnIndex: number;
  combatants: Record<string, Combatant>;
  winner?: Side;
  /** Zar modu (Görev J): otomatik ya da fiziksel zar (yalnızca oyuncular / herkes). Eski kayıtta yok = otomatik. */
  diceMode?: DiceMode;
  /** Kuyruk 31: Serüven savaşı: bittikten sonra parti serbestçe yürür (`explore_move`); çıkış altıgenleri. */
  explore?: { exits: Offset[] };
  /**
   * Görev A1: ortak can havuzları (çağrılmış sürü, bağlı yaratıklar). Üyelerden herhangi birine gelen hasar havuzdan
   * düşer, iyileştirme havuza eklenir (en çok `max`); havuz 0 olunca bütün üyeler düşer.
   */
  hpPools?: Record<string, HpPool>;
  /**
   * Görev A6: çok altıgenli boyut açık mı (Large 3, Huge 7, Gargantuan 19 altıgen; `src/battle/body.ts`). Eski kayıtta
   * yok = kapalı (her yaratık tek altıgen).
   */
  multiHex?: boolean;
  /** Kuyruk 18 H4: bırakılan katların haritaları (harita kimliği → harita durumu). */
  floors?: Record<string, NonNullable<BattleState['map']>>;
  /**
   * Kuyruk 43: çok altıgende en büyük şekil. Klasik (21×11'den küçük) haritada `'H'`: Gargantuan da 7 altıgen kaplar
   * (19 altıgen yalnızca orta/geniş haritada). Yoksa sınır yok.
   */
  multiHexMax?: 'H';
  /**
   * Kuyruk 16 K16E: kural sürümü (`data/kural-surumu.json`; `src/battle/ruleVersion.ts`). Yeni savaş güncel sürümle
   * başlar; eski kayıtta yok = 1 (eski kurallar, replay aynı).
   */
  kuralSurumu?: number;
  /**
   * Y1: yapay zekâ ayarı (karar olay değil, kural sürümü gerekmez). `zorluk` taraf başına (varsayılan Normal);
   * `eski: true` Y1 öncesi kural zincirini çalıştırır (regresyon ölçümü).
   */
  yz?: { zorluk?: Partial<Record<'party' | 'enemies', 'kolay' | 'normal' | 'usta'>>; eski?: boolean;
    /** Kuyruk Y1: yalnız denge ölçümü (simülasyon `setSimYz`; arayüzde yok): Earthquake alanda dost varken de seçilebilir (en az 2 düşman). */
    deprem?: boolean };
  /**
   * Görev Y1: yüzey etkileşimi (tepkimeler: tutuşma, buhar, donma, erime, patlama, suda yıldırım). Varsayılan açık;
   * yalnızca `false` kapatır (eski kayıt: açık).
   */
  yuzeyEtkilesimi?: boolean;
  /** Kuyruk K55: bu turda zincirle çalışan tepkime ikilileri (`<satır>@<altıgen>`; aynı ikili turda bir kez). */
  hexReacted?: { turn: string; keys: string[] };
  /** Görev K13B: Game Master'ın kurulumda açıp kapattığı ev kuralları (`data/ev-kurallari.json`); verilmeyen varsayılan. */
  houseRules?: Record<string, boolean>;
  /** Kuyruk 24b: savaşta kazanılan sonuç bayrakları (ör. `heykel-magarasi-kesfedildi`; sefer ekranı okuyacak). */
  flags?: string[];
  /** Görev S3: hedefler (yoksa eski kazanma kuralı, bit bit aynı). */
  goals?: Goals;
  /** Görev S4: alarmın çaldığı tur (fail `alarm`). */
  alarmRound?: number;
  /** Görev S4: uyuyan/habersiz gruplar (harita verisinden ya da Game Master kurulumundan). */
  groups?: SleepGroup[];
  /** Görev S4: yalnızca `false` alarm tetiklerini kapatır (simülasyon "hiç alarm" ucu). */
  alarmEnabled?: boolean;
}

/** Görev A2: engelden geçme kuralı; `difficult`: geçilen engel/yaratık altıgenleri zorlu zemin. */
export interface PhaseSpec {
  difficult?: boolean;
}

/** Görev A1: ortak can havuzu. */
export interface HpPool {
  id: string;
  hp: number;
  max: number;
  label?: string;
  /**
   * Kuyruk K54b: Yıkılmaz Birlik (Birlik Manastırı 17): havuz 0'a düşecekken bir kez `hp` ile ayakta kalır; sahibin
   * kaynağı (`resource`) ve tepkisi harcanır, üyelerin Motivasyonu dolar (reducer `trackPools`). Kullanılınca `held`.
   */
  guard?: { ownerId: string; hp: number; resource: string };
  held?: boolean;
}

/** Bir saldırı seçeneği (silah saldırısı veya büyü saldırısı). */
export interface AttackOption {
  label: string;
  attackBonus: number;
  /** Hasar zarı, örneğin "2d10" veya "1d8+3". */
  damage: string;
  damageType?: string;
  ranged: boolean;
  spell: boolean;
  /** Yakın dövüş erişimi (ft); verilmezse 5. */
  reachFt?: number;
  /** Menzilli saldırının normal ve uzun menzili (ft). */
  range?: [number, number];
  /** Kuyruk S2 (paket `silahFirlat`): fırlatılan silah saldırıdan sonra ele döner (elden çıkmaz). */
  returns?: boolean;
  /** Ortam kurallarında anahtar kelime aramak için küçük harfli tarif. */
  tag: string;
  /** Saldırı zarındaki yetenek (Rage hasarı ve Reckless Attack: STR). */
  ability?: 'str' | 'dex';
  /** Finesse silah (Sneak Attack için). */
  finesse?: boolean;
  /** Silahın kimliği (data/weapons.json). */
  weaponId?: string;
  /** Karakterin bu silahta kullandığı ustalık (Weapon Mastery; yalnızca oyunda çalışanlar). */
  mastery?: MasteryId;
  /** Saldırı zarındaki yetenek değiştiricisi (Graze hasarı, Cleave). */
  abilityMod?: number;
  /** Yetenek değiştiricisiz silah hasarı (Cleave'in ikinci saldırısı; büyülü bonus dahil). */
  weaponDamage?: string;
  /** Ustalığın save DC'si: 8 + yetenek değiştiricisi + yetkinlik (Topple). */
  masteryDc?: number;
  /**
   * Kuyruk 19: Push isteğe bağlı (SRD "you can push"): `push` her isabette iter, `skip` itmez; yoksa eski seçim (yakın
   * dövüşte eylemin son saldırısında). Kural sürümü 16 + Game Master anahtarı `pushChoice`.
   */
  pushChoice?: 'push' | 'skip';
  /** Silahın hasar zarlarında en düşük sayılan değer (Great Weapon Fighting: 3). */
  minDie?: number;
  /** Light silah (Light özelliğinin ek saldırısı; Görev P1). */
  light?: boolean;
  /** İki elle tutuluyor (Two-Handed ya da iki elle Versatile). */
  twoHands?: boolean;
  /** Yan el saldırısı (Light ek saldırısı). */
  offhand?: boolean;
  /** Hasar Radiant olabilir (Sacred Weapon): hedefe göre en iyi tür seçilir (Görev P-Paladin). */
  radiantOption?: boolean;
  /** Görev B1: hasar bu türe de çevrilebilir (Shillelagh: Force); hedefe göre en iyi tür seçilir. */
  altDamageType?: string;
  /** Kuyruk 19: seçilebilen ek hasar türleri (Pact of the Blade: Necrotic, Psychic, Radiant); hedefe en çok işleyen. */
  altDamageTypes?: string[];
  /** Monk silahı ya da Unarmed Strike, Martial Arts'la (Stunning Strike, Flurry; Görev P-Monk). */
  martialArts?: boolean;
  /** Görev WARLOCK: pact silahı (Eldritch Smite, Lifedrinker). */
  pact?: boolean;
  /** Kuyruk 19 (SRD Heavy): yetersiz STR (yakın) ya da DEX (menzilli) ile dezavantaj; Loading: eylem başına bir atış; cephane türü. */
  heavyDis?: boolean;
  /** Kuyruk MB1 (68+, SRD Lance): binek dışında iki elli (`unlessMounted`); karakterin diğer eli dolu (kalkan ya da yan el; `handBusy`). */
  unlessMounted?: boolean;
  handBusy?: boolean;
  loading?: boolean;
  ammo?: string;
  /** K13: Wild Shape biçiminin saldırısı (canavar kimliği ve saldırı adı): ek etkileri (rider, süreli etki) canavardaki gibi. */
  beast?: { monster: string; attack: string };
  /** Görev SORCERER: silahın büyülü bonusu (+1…; True Strike büyü yeteneğiyle saldırırken korunur). */
  enchant?: number;
  /** Görev SORCERER: bu saldırının isabetinde ek zar (True Strike 5+ seviye Radiant). */
  hitExtra?: { label: string; expr: string; type: string };
}

/** Görev DRUID: Wild Shape biçiminin savaş değerleri. */
export interface ShapeStats {
  form: string;
  name: string;
  ac: number;
  speed: number;
  fly: number;
  size: Combatant['size'];
  modifiers: Combatant['modifiers'];
  saves: Combatant['saves'];
  weaponOptions: AttackOption[];
  attacksPerAction: number;
  avatar: Combatant['avatar'];
  /** Kuyruk 18 H2: Polymorph (büyüyle dönüşüm): canavar saldırıları ve Multiattack biçiminkiyle değişir; geçici HP bitince biter. */
  polymorph?: boolean;
  /** Kuyruk K48: Karadul Örümcek Biçimi (biçim canı = geçici HP; bitince ya da bırakınca biter). */
  spider?: boolean;
  /** Kuyruk K64a: ele geçirilmiş bedenin değerleri (bitişi `possession.ts`; `shapeCleanup` dokunmaz). */
  possession?: boolean;
  attacks?: CombatantAttack[];
  multiattack?: boolean;
}
/** Biçimden önceki (bırakınca dönen) değerler. */
export type ShapePrev = Pick<Combatant, 'ac' | 'speed' | 'fly' | 'size' | 'modifiers' | 'saves' | 'weaponOptions' | 'attacksPerAction' | 'avatar'>
  & Partial<Pick<Combatant, 'attacks' | 'multiattack'>>;

/** İsabetteki ek hasar (Sneak Attack, Hunter's Mark). */
export interface ExtraDamage {
  label: string;
  rolls: number[];
  raw: number;
  applied: number;
  type: string;
  note: DamageNote;
}

/** Oyuncunun veya GM'in göndermek istediği istekler. */
/** Kuyruk 19: Multiattack planının bir adımı (saldırı adı ya da büyü; hedef yoksa komutun hedefi). */
export interface MultiStep { attack?: string; spell?: string; targetId?: string; targetHex?: Offset }

export type Command =
  | { type: 'attack'; actorId: string; targetId: string; option: AttackOption; cunning?: CunningOption[]; /** Kuyruk 18 H3: Brutal Strike (Kuyruk 19: Staggering, Sundering; 17'de ikinci etki). */ brutal?: 'forceful' | 'hamstring' | 'staggering' | 'sundering'; brutal2?: 'forceful' | 'hamstring' | 'staggering' | 'sundering'; /** Kuyruk 18 H3: Tactical Master (push, sap, slow). */ mastery?: string; /** Kuyruk 19: Punch and Grab. */ grab?: boolean }
  /** Görev F: Steady Aim (bonus eylem; bu tur hareket etmemiş olmalı). */
  | { type: 'steady_aim'; actorId: string }
  /** Kuyruk K64a: ele geçiren bedeni bırakır (bonus eylem; aktör beden ya da ele geçiren). Game Master `gm: true` ile eylemsiz bitirir. */
  | { type: 'possession_leave'; actorId: string; gm?: boolean }
  /** Görev F: Horde Breaker (Hunter's Prey): bu tur saldırılan yaratığın 5 ft yakınındaki başka bir yaratığa aynı silahla ek saldırı. */
  | { type: 'horde_breaker'; actorId: string; targetId: string; option: AttackOption }
  /** Yalnızca haritasız savaş: soyut yükseklik değiştirme (çıkarken tırmanma kontrolü). */
  | { type: 'change_height'; actorId: string; toHeight: Height }
  /** Kuyruk 26: yükseklik katmanında 2+ seviye farkı aşma (yukarı tırmanma, aşağı atlama). */
  | { type: 'climb'; actorId: string; to: Offset }
  /** Kuyruk K73b (sürüm 63+): gönüllü düşme: kenardan bitişik altıgene atlama ya da duvarda tutunurken kendi altıgeninde bırakma. */
  | { type: 'jump_down'; actorId: string; to: Offset }
  /** Haritalı savaş: hedef altıgene en ucuz yoldan yürür. */
  | { type: 'move'; actorId: string; to: Offset; /** Kuyruk K71c (sürüm 58+): birleşik uçuş: hedef irtifa (ft). */ toFt?: number }
  /** Kuyruk 31: bitmiş Serüven savaşında keşif yürüyüşü (sıra ve hareket sınırı tur başına sıfırlanır). */
  | { type: 'explore_move'; actorId: string; to: Offset }
  /** Haritalı savaş: düz bir doğrultuda kanalın üstünden atlar (5e uzun atlama). */
  | { type: 'jump'; actorId: string; to: Offset }
  /** Haritalı savaş: gizlenme yerinde Dexterity (Stealth) ile gizlenir (DC 15). */
  | { type: 'hide'; actorId: string; bonus?: boolean }
  /** Koşma (Dash): bu tur hızı kadar ek hareket. */
  | { type: 'dash'; actorId: string; bonus?: boolean }
  /** Ayrılma (Disengage): bu tur fırsat saldırısı tetiklemez. */
  | { type: 'disengage'; actorId: string; bonus?: boolean }
  /** Haritalı savaş: Wisdom (Perception) ile gizlenmiş düşmanları arar. */
  | { type: 'search'; actorId: string }
  /** Yalnızca GM: haritanın tetiklemeli kuralı (patlama, lav yükselmesi, dalga). */
  | { type: 'map_trigger'; rule: string; at?: Offset }
  /** Yalnızca GM: kapıyı aç veya kapat. */
  | { type: 'gate'; at: Offset; open: boolean }
  /** GM: uyuyan ejderhayı uyandır (her kipte, her an). */
  | { type: 'wake_dragon' }
  /** Yapay zekâ düşmanı (`dragonWake: chance`): tur başında uyandırma eğilimi zarı. */
  | { type: 'rouse_dragon'; actorId: string }
  /** Kapalı kapıya silahla saldırı (kırmak için). */
  | { type: 'attack_gate'; actorId: string; at: Offset; option: AttackOption }
  /** Batağa saplanmış savaşçı kendini çıkarmaya çalışır (Athletics). */
  | { type: 'escape'; actorId: string }
  /** Kuyruk 19 (SRD Mounted Combat): bin / in. */
  | { type: 'mount'; actorId: string; mountId: string }
  | { type: 'dismount'; actorId: string; to?: Offset; /** Kuyruk MB3 (69+): havada iniş irtifası (ft; uçabilen). */ toFt?: number }
  /** CILA: Haste'in ek eylemi (turda bir; eylem kullanıldıktan sonra). */
  | { type: 'haste_action'; actorId: string }
  /** CILA: sahibi bonus eylemle çağrısını taşır (Flaming Sphere, ruh sürüsü); `ramId` bitişik yaratığa çarptırma. */
  | { type: 'shift_move'; actorId: string; to: Offset }
  /** Kuyruk 19: Monk 18 Superior Defense (tur başında 3 Focus). */
  | { type: 'superior_defense'; actorId: string }
  /** Kuyruk 19: Find Steed atının bonus eylemleri (Fell Glare, Fey Step, Healing Touch). */
  | { type: 'steed_action'; actorId: string; kind: 'fell-glare' | 'fey-step' | 'healing-touch'; targetId?: string; to?: Offset }
  /** Kuyruk 19: Alert'in Initiative Swap'ı (sıra dışı). */
  | { type: 'initiative_swap'; actorId: string; allyId: string }
  /** Kuyruk 19: oyuncunun Grapple'ı (Attack eyleminde bir saldırının yerine). */
  | { type: 'grapple'; actorId: string; targetId: string }
  | { type: 'summon_move'; actorId: string; to: Offset; ramId?: string; /** Kuyruk 19: Arcane Hand etkisi. */ hand?: 'fist' | 'force' | 'grasp' | 'crush' | 'interpose' }
  /** Bitişikteki batmış müttefiki çeker (Athletics). */
  | { type: 'pull'; actorId: string; targetId: string }
  /** Yalnızca GM: bir savaşçıdan beceri kontrolü ister (sıra beklemez). */
  | { type: 'skill_check'; actorId: string; skill: Skill; dc: number }
  /** Kurulum aşaması: savaşçıyı kendi başlangıç bölgesine yerleştirir. */
  | { type: 'place'; actorId: string; at: Offset }
  /** GM kurulumda masumun görselini seçer (data/masumlar.json kimliği). */
  | { type: 'choose_civilian_art'; actorId: string; gorselId: string }
  /** Yalnızca GM, kurulum aşaması: herkes yerleştiyse savaşı başlatır. */
  | { type: 'start_battle' }
  | { type: 'end_turn'; actorId: string }
  /**
   * Büyü. Haritalı savaşta alan büyüleri hedef altıgen (`targetHex`) alır; verilmezse
   * `targetId`nin altıgeni kullanılır.
   */
  | {
      type: 'cast_spell'; actorId: string; spellName: string; targetId?: string; targetHex?: Offset; slotLevel?: number;
      /** Çok hedefli etki büyüsü (Bless, Bane, Heroism; Görev R2): hedefler (yoksa `targetId`). */
      targetIds?: string[];
      /** Kuyruk A8: birden çok merkezli alan (Meteor Swarm: dört nokta). Kuyruk S2: Wind Wall serbest duvar yolu. */
      targetHexes?: Offset[];
      /** Kuyruk P11 (paket `buyuSakla`): büyüyü yapmadan sakla (slot ve eylem harcanır; sonra `spell_followup` `choice: 'sakli'`). */
      store?: boolean;
      /** Kuyruk P11 (paket `buyuDegisimi.cikisCagri`): büyü bu çağrının altıgeninden çıkar. */
      originId?: string;
      /** Kuyruk S2 (sürüm 41): alandan dışarıda bırakılan altıgenler (Plant Growth). */
      excludeHexes?: Offset[];
      /** Kuyruk S2: Levitate ilk yükselme (ft; yoksa veriden). */
      altitudeFt?: number;
      /**
       * Kuyruk K73c (sürüm 64+): havada merkezli küre/silindir: merkezin `targetHex` zemininden yüksekliği (ft, 5'in katı;
       * 0 ya da yoksa yerde). Call Lightning'de şimşek noktasının yüksekliği (`src/battle/airArea.ts`).
       */
      targetFt?: number;
      /** Görev SORCERER: bu yapımda kullanılan Metamagic seçenekleri. */
      metamagic?: string[];
      /**
       * Kuyruk 43b: oyuncu isteğiyle slotsuz yapım (Divine Intervention: listeli kaynak, `freeSpellList`). Slot harcanmaz,
       * kaynak bir azalır; büyü kendi seviyesinde ve Magic eylemiyle yapılır (SRD 5.2.1).
       */
      free?: boolean;
      /** K11: Transmuted Spell'in hedef türü. */
      transmute?: string;
      /** Kuyruk 19 (11–20): Overchannel (Evoker 14): hasar zarları en yüksek. */
      overchannel?: boolean;
      /**
       * Etki büyüsünün seçimi: beceri (Guidance), hasar türü (Resistance), komut (Command). Çağırma büyüsünde
       * (Görev R3) yaratık türü (Find Familiar, Find Steed) ya da nefes hasar türü (Summon Dragon).
       */
      choice?: string;
      /** Find Familiar: familiar biçimi (data/monsters.json kimliği; data/summons.json `forms`). */
      form?: string;
      /** CILA (Wind Wall): duvar biçimi; `arc` büyücünün çevresinde yay (yoksa düz). */
      wallShape?: 'arc' | 'ring';
    }
  /** Yalnızca GM: bir savaşçıya durum ekler veya kaldırır. */
  | { type: 'set_condition'; targetId: string; condition: string; present: boolean }
  /** Yalnızca GM: bir savaşçının HP'sini elle ayarlar (0..maxHp). */
  | { type: 'adjust_hp'; targetId: string; hp: number }
  /** Görev S1: Game Master bitkinlik seviyesini ayarlar (0–6). */
  | { type: 'set_exhaustion'; targetId: string; level: number }
  /** Y1 G2: Game Master bir yaratığa yapay zekâ rolü atar (`null`: veriden türet). */
  | { type: 'set_ai_role'; targetId: string; role: 'hasarci' | 'kontrolcu' | 'destek' | 'tank' | null }
  /** Görev A1: Game Master birden çok yaratığı tek can havuzunda birleştirir (`hp`/`max` verilmezse üyelerin toplamı). */
  | { type: 'create_hp_pool'; memberIds: string[]; poolId?: string; hp?: number; max?: number; label?: string }
  /** Görev Y1: Game Master yüzey yerleştirir (yağ, su, buz, zehir bulutu…) ya da altıgenlerdeki yüzeyleri kaldırır (`kind` yok). */
  | { type: 'place_surface'; kind?: SurfaceKind; hexes: Offset[] }
  /** Kuyruk 18 H4: merdivenden öbür kata (bütün parti). */
  | { type: 'change_floor'; actorId: string }
  /** Görev S2: Game Master nesne yerleştirir ya da kaldırır (`kind` yok). */
  | { type: 'place_object'; kind?: ObjectKind; at: Offset; state?: ObjectState }
  /** Kuyruk 30 D1: Game Master gizli nesneyi açığa çıkarır. */
  | { type: 'reveal_object'; objectId: string }
  /** Görev S2: nesneye silah saldırısı (SRD: nesne AC'si; isabette hasar). */
  | { type: 'attack_object'; actorId: string; objectId: string; option: AttackOption }
  /** Görev S2: nesneyi kullan (bitişik). */
  | { type: 'object_use'; actorId: string; objectId: string; action: ObjectAction; to?: Offset }
  | { type: 'alarm_group'; groupId: string }
  /** `targetHex` (Görev R4): alanlı saldırının hedef altıgeni (koni/çizgi yönü ya da küre merkezi); yoksa hedefin altıgeni. */
  | { type: 'monster_attack'; actorId: string; targetId: string; attackIndex: number; targetHex?: Offset }
  /** Ölmekte olan bir müttefiki stabilize etmeye çalışır (Medicine, DC 10). */
  | { type: 'stabilize'; actorId: string; targetId: string }
  /**
   * Kuyruk 19 (`srdK19`): `plan` SRD Multiattack'ının adım adım seçimi (`data/multiattack.json`): bileşimdeki saldırılar,
   * saldırının yerine geçen nefes/büyü/özel eylem ve ek kullanımlar; her adımın kendi hedefi olabilir.
   */
  | { type: 'multiattack'; actorId: string; targetId: string; plan?: MultiStep[] }
  /** Kuyruk 19 (srdK19): SRD canavar yeteneği (`data/canavar-yetenekleri.json`); `option` Cunning Action/büyü seçimi. */
  | { type: 'monster_ability'; actorId: string; abilityId: string; targetId?: string; targetHex?: Offset; option?: string }
  /**
   * İtme (Unarmed Strike'ın Shove seçeneği): Attack eylemindeki bir saldırının yerine. Hedef STR
   * ya da DEX save'i yapar; başarısızsa 5 ft itilir (`push`) ya da Prone olur (`prone`).
   */
  | { type: 'shove'; actorId: string; targetId: string; effect: 'push' | 'prone' }
  /** Kaçın (Dodge): sonraki turunun başına dek saldıranlar dezavantajlı, DEX save'leri avantajlı. */
  | { type: 'dodge'; actorId: string }
  /** Ayağa kalk (Prone kalkar, hızın yarısı harcanır). */
  | { type: 'stand_up'; actorId: string }
  /** Yakalamadan kaçmaya çalış (eylem; Athletics ya da Acrobatics vs kaçış DC'si). */
  | { type: 'escape_grapple'; actorId: string }
  /** Yardım (Help): bitişik düşmana karşı tarafının ilk saldırısı avantajlı (sonraki turunun başına dek). */
  | { type: 'help'; actorId: string; targetId: string }
  /** Kuyruk 41b: Dikkat dağıt (eylem): `at` altıgenine ses; yakındaki uyanık düşmanların pasif Algısı düşer. */
  | { type: 'distract'; actorId: string; at: Offset }
  /** Kuyruk 43: sarf eşyası (iksir) kullan: kendine ya da erişimdeki dosta. */
  | { type: 'use_item'; actorId: string; itemId: string; targetId: string }
  /** Kuyruk K48: Moral tam modu: çökmüş dosta toparlama (eylem). */
  | { type: 'moral_rally'; actorId: string; targetId: string }
  /** Fighter: Action Surge (eylemini kullandıktan sonra bir eylem daha). */
  | { type: 'action_surge'; actorId: string }
  /** Fighter: Second Wind (bonus eylem, 1d10 + seviye HP). */
  | { type: 'second_wind'; actorId: string }
  /** Yan el ek saldırısı (Light özelliği): Attack eyleminde Light silahla saldırdıktan sonra; Nick varsa eylemin içinde. */
  | { type: 'offhand_attack'; actorId: string; targetId: string }
  /** Görev R4: Dragonborn Breath Weapon; Attack eyleminin bir saldırısının yerine; şekil (koni/çizgi) ve yön altıgeni. */
  | { type: 'breath_weapon'; actorId: string; shape: 'cone' | 'line'; targetHex: Offset }
  /** Rage (bonus eylem): başlatır ya da süren Rage'i bir tur daha uzatır. */
  | { type: 'rage'; actorId: string }
  /** Reckless Attack (eylemsiz): turun ilk saldırısından önce. */
  | { type: 'reckless'; actorId: string }
  /**
   * Savaşta kullanılan sınıf özelliği (veriden, `FeatureMechanic.effect`; Görev P-Paladin): iyileştirme havuzu
   * (`amount` HP, `cure` ile durum kaldırma) ya da süren güçlendirme.
   */
  /** Görev SORCERER: Font of Magic (slot → Sorcery Point eylemsiz; Sorcery Point → slot bonus eylem). */
  | { type: 'font_of_magic'; actorId: string; mode: 'toPoints' | 'toSlot'; level: number }
  /** Görev DRUID: Wild Shape (bonus eylem; `form` yoksa biçimi bırak) ve Wild Resurgence (eylemsiz). */
  | { type: 'wild_shape'; actorId: string; form?: string }
  | { type: 'wild_resurgence'; actorId: string; mode: 'toShape' | 'toSlot' | 'magician'; /** Kuyruk 19: Nature Magician kullanım sayısı. */ uses?: number }
  | { type: 'use_feature'; actorId: string; feature: string; targetId?: string; amount?: number; cure?: boolean; to?: Offset; choice?: string }
  /** Bonus eylemle Unarmed Strike (Martial Arts) ya da Flurry of Blows'un vuruşu (Open Hand Technique seçimiyle). */
  | { type: 'bonus_strike'; actorId: string; targetId: string; technique?: 'addle' | 'push' | 'topple' }
  /** Focus ile bonus eylem (veriden: Flurry of Blows, Patient Defense, Step of the Wind). */
  | { type: 'focus_action'; actorId: string; action: string }
  /** Stunning Strike: bu tur Monk silahı ya da Unarmed Strike ile vurulan hedefe (eylemsiz, Focus harcar). */
  | { type: 'stunning_strike'; actorId: string; targetId: string }
  /** Görev WARLOCK: Eldritch Smite (bu tur pact silahı isabetinden sonra; eylemsiz). */
  | { type: 'eldritch_smite'; actorId: string }
  /**
   * Süren konsantrasyon büyüsünü bonus eylemle sürdürür: Spiritual Weapon gücü 20 ft taşınıp
   * saldırır; Hunter's Mark işareti, hedefi 0 HP'ye düştüyse yeni hedefe taşınır.
   */
  /** Kuyruk 19: Resilient Sphere: içerideki yuvarlar (eylem, yarım hız) ya da bitişikteki kaldırır/bırakır. */
  | { type: 'sphere_roll'; actorId: string; to: Offset }
  /** Kuyruk 19: Animate Objects: bonus eylemle çağrılanlara emir. */
  | { type: 'command_summons'; actorId: string }
  /** Kuyruk 19: Pact of the Chain / Investment / Gaze of Two Minds. */
  | { type: 'familiar_strike'; actorId: string; targetId: string }
  | { type: 'familiar_order'; actorId: string }
  | { type: 'gaze'; actorId: string; targetId: string }
  | { type: 'sphere_carry'; actorId: string; targetId: string; drop?: boolean }
  | { type: 'spell_followup'; actorId: string; targetId: string; targetHex?: Offset; /** Kuyruk 19: Telekinesis `lift`. */ choice?: string;
      /** Kuyruk K67b (sürüm 51, Dancing Lights): ışıkların yeni yerleri (sırayla; yoksa `targetHex` hepsini öteler). */ targetHexes?: Offset[];
      /** Kuyruk P12 (sürüm 43): mühürlü büyüyü (`choice: 'sakli'`) tetikleyen dostun yanında saklayanın kimliği. */ sourceId?: string }
  /** Kuyruk S2 (sürüm 41): dikey hareket (uçan kendi hareketiyle; Levitate'i yapan hedefini ya da nesneyi turda 20 ft'e dek). */
  | { type: 'vertical_move'; actorId: string; targetId?: string; objectId?: string; toFt: number; /** Kuyruk K66a: yarıktan 0 ft'te çıkış altıgeni. */ to?: Offset }
  /** Kuyruk S2: elindekini bırakma (serbest) ve yerden alma (nesne etkileşimi). */
  | { type: 'drop_item'; actorId: string; item: string }
  | { type: 'pick_up'; actorId: string; objectId: string }
  /** Kuyruk S1 (sürüm 40): seçilen dostlarla haritadan ayrılma (Plane Shift); büyü yapımının (`cast_spell`) kısa yolu. */
  | { type: 'retreat'; actorId: string; spellName: string; targetIds: string[]; slotLevel?: number };

/** Olaylar: olmuş ve sonuçlanmış gerçekler. Durum yalnızca olaylardan türetilir. */
export type BattleEvent =
  | { type: 'battle_started'; state: BattleState }
  /**
   * CILA: Haste'in ek eylemi alındı (eylem yeniden boş; yalnızca tek saldırı, Dash, Disengage, Hide). Kuyruk A6 (sürüm 35,
   * `first`): asıl eylemden önce de: sıradaki eylem Haste'inkidir, kullanılınca asıl eylem geri gelir.
   */
  | { type: 'haste_action'; actorId: string; first?: boolean }
  /** CILA: sahibi çağrısını bonus eylemle taşıyor (çağrının bu turdaki hareketi sıfırlanır). */
  | { type: 'summon_steered'; summonId: string }
  | {
      type: 'attack_resolved';
      /** Kuyruk 18 H3: Brutal Strike etkisi (avantajdan vazgeçildi; isabette +1d10). */
      brutal?: 'forceful' | 'hamstring' | 'staggering' | 'sundering';
      actorId: string;
      targetId: string;
      label: string;
      mode: RollMode;
      reasons: string[];
      d20: number[];
      natural: number;
      total: number;
      targetAc: number;
      hit: boolean;
      critical: boolean;
      fumble: boolean;
      damageRolls: number[];
      rawDamage: number;
      appliedDamage: number;
      damageType: string;
      damageNote: DamageNote;
      /** Görev B1: hasar cezası (Reduce, Ray of Enfeeblement): günlük için. */
      penalty?: string;
      targetHpAfter: number;
      effects: DamageEffect[];
      rider?: string;
      /** Hedefin siperi (AC'ye eklendi, `targetAc` siper dahil). */
      cover?: 2 | 5;
      /** CILA: otomatik ıska nedeni (Wind Wall). */
      autoMiss?: string;
      /** İsabetteki ek hasarlar (`appliedDamage` bunları da içerir). */
      extra?: ExtraDamage[];
      /** Sneak Attack kullanıldı: bu tur anahtarı saldırana yazılır. */
      sneakTurn?: string;
      /** Görev F: turda bir kez çalışan özellikler (özellik → tur anahtarı), Steady Aim harcandı, Cunning Strike seçenekleri. */
      traitTurns?: Record<string, string>;
      steadyAim?: boolean;
      /** F1: Savage Attacker'ın iki hasar atışı (kullanılan `kept`; isabetin hasarı odur). */
      savage?: { rolls: [number[], number[]]; totals: [number, number]; kept: 0 | 1 };
      cunning?: { options: CunningOption[]; dice: number };
      /** Frenzy kullanıldı: bu tur anahtarı saldırana yazılır. */
      frenzyTurn?: string;
      /** Fırsat saldırısı (tepki). */
      opportunity?: boolean;
      /** Yakın dövüş silah saldırısı (smite büyülerinin tetiği; Görev P-Paladin). */
      melee?: boolean;
      /** Monk silahı ya da Unarmed Strike (Stunning Strike tetiği; Görev P-Monk). */
      martialArts?: boolean;
      /** Görev WARLOCK: pact silahıyla. */
      pact?: boolean;
      /** Kuyruk 19: harcanan cephane türü. */
      ammo?: string;
      /** Deflect Attacks ile azaltılan hasar (tepki harcandı). */
      deflected?: number;
      /**
       * Hedefin tepkisi (Görev R1): adı, AC'ye eklenen (Shield, Parry; `targetAc` dahil) ve azaltılan hasar
       * (Uncanny Dodge, Deflect; `appliedDamage` sonrası).
       */
      reacted?: { name: string; ac?: number; reduced?: number };
      /** Saldırı zarının eklenti zarları (Bless, Bane; Görev R2; `total` dahil). */
      bonusDice?: RolledExtra[];
    }
  | {
      /**
       * Tepki kullanıldı (Görev R1; kayıt sürümü 13): tepki hakkı harcanır. Havuzlu canavar tepkisinde kalan kullanım,
       * Recharge'lı tepkide yeniden dolması beklenir.
       */
      type: 'reaction_used'; actorId: string; reaction: string; name: string; trigger: ReactionTrigger;
      sourceId?: string; pool?: { id: string; remaining: number }; recharge?: boolean;
      /** Görev K3: kaynaktan kullanılan tepki (Giant Ancestry) ya da slotsuz tepki büyüsü (Infernal: Hellish Rebuke). */
      resource?: { id: string; remaining: number };
      /** Süren etki (Shield: AC işareti, sonraki turunun başına dek). */
      mark?: MasteryMark;
    }
  | { type: 'reaction_recharged'; actorId: string; reaction: string; d6: number; recharged: boolean }
  /** Süren etki kondu (Görev R2; kayıt sürümü 14); aynı kimlikli etki yenisiyle değişir. */
  | { type: 'effect_added'; targetId: string; effect: ActiveEffect }
  /** Kuyruk 41b: Dikkat dağıt (günlük; etkiler ayrı `effect_added`). */
  | { type: 'distracted'; actorId: string; at: Offset; targetIds: string[] }
  /** Kuyruk 43: sarf eşyası kullanıldı (adet azalır; iyileşme ayrı `healed`). */
  | { type: 'item_used'; actorId: string; itemId: string; name: string; targetId: string; left: number }
  /** Kuyruk K48: Moral değişti (dost düştü, korku, toparlama); `moral` yeni değer. */
  | { type: 'moral_changed'; targetId: string; delta: number; moral: number; reason: 'dost' | 'korku' | 'toparlama' | 'zafer'; byId?: string }
  /** Süren etki bitti (save, süre, kullanım, komutun turu). */
  | { type: 'effect_ended'; targetId: string; effectId: string; name: string; reason: 'save' | 'used' | 'expired' | 'turn' | 'dispelled' | 'destroyed' }
  /** Geçici HP (Heroism): yığılmaz, yüksek olan kalır. */
  | { type: 'temp_hp'; targetId: string; amount: number; label: string }
  /** En çok HP ve HP artışı (Aid). */
  | { type: 'hp_boosted'; targetId: string; amount: number; label: string }
  /** Süregelen hasar (Searing Smite): tur başında hasar, ardından save. */
  | {
      type: 'effect_tick'; targetId: string; effectId: string; name: string; damageRolls: number[]; appliedDamage: number;
      damageType: string; targetHpAfter: number; effects: DamageEffect[];
      save?: { ability: Ability; dc: number; d20: number[]; total: number; success: boolean; extra?: RolledExtra[] };
    }
  /** Komut (Command): sırası gelen yaratık turunu kaybetti (Grovel: önce yere düşer). */
  | { type: 'turn_lost'; actorId: string; label: string; command: CommandWord }
  /** Görev CLERIC: Sanctuary save'i (saldıran WIS; başarısızsa saldırı ya da büyü boşa gider). */
  /** Görev SORCERER: Font of Magic ile yaratılan slot. */
  | { type: 'slot_created'; actorId: string; level: number }
  /** Görev DRUID: Wild Shape biçimi (değerleri olayda) ya da bırakma (`stats: null`). */
  | { type: 'shape_changed'; actorId: string; stats: ShapeStats | null; reason?: string }
  /** Turda bir kez kullanılan özellik işaretlendi (Wild Resurgence). */
  | { type: 'trait_turn'; actorId: string; trait: string; key: string }
  | { type: 'sanctuary_save'; actorId: string; targetId: string; label: string; dc: number; d20: number[]; total: number; success: boolean; retarget?: string }
  /** Görev CLERIC: Warding Bond: bağlı hedefin aldığı hasar kadar büyücüye. */
  | { type: 'bond_damage'; targetId: string; fromId: string; label: string; amount: number; targetHpAfter: number; effects: DamageEffect[] }
  /** Görev CLERIC: Bestow Curse tur başı save'i; başarısızsa eylem yok. */
  | { type: 'curse_save'; actorId: string; label: string; dc: number; d20: number[]; total: number; success: boolean }
  /** İki yaratık yer değiştirdi (Redirect Attack). */
  | { type: 'swapped'; actorId: string; otherId: string }
  | {
      type: 'height_changed';
      actorId: string;
      from: Height;
      to: Height;
      moved: boolean;
      check: { natural: number; total: number; dc: number } | null;
    }
  | { type: 'turn_ended'; actorId: string; nextActorId: string; round: number; /** Kuyruk 19: Thief's Reflexes yansıma turu; sonra bu sıradan sürer. */ reflex?: number }
  | { type: 'placed'; actorId: string; at: Offset }
  /** Masumun görseli seçildi (kayıt sürümü 4). */
  | { type: 'civilian_art'; actorId: string; gorselId: string }
  /**
   * Bu adımda atılan zarlar (Görev J; kayıt sürümü 5): değerleri, kimin ne için attığı, elle mi girildiği.
   * Durumu değiştirmez (sonuçlar zaten ardından gelen olaylarda); zar animasyonu ve elle girilen zarların kaydı için.
   */
  | { type: 'dice_rolled'; rolls: DiceRoll[] }
  | { type: 'combat_started' }
  /** Yol başlangıcı hariç girilen altıgenler; maliyet altıgen cinsinden. */
  | { type: 'mounted'; actorId: string; mountId: string; cost: number }
  | { type: 'dismounted'; actorId: string; at: Offset; cost: number; /** Kuyruk MB1 (68+): binekten düşerek (günlük). */ fell?: true; /** Kuyruk MB3 (69+): havada iniş irtifası (ft; yoksa irtifa değişmez). */ toFt?: number }
  | { type: 'moved'; actorId: string; path: Offset[]; cost: number; /** Kuyruk 19: serbest kayma (`shiftLeft`'ten düşer). */ free?: boolean }
  | { type: 'shift_granted'; actorId: string; hexes: number }
  | { type: 'initiative_swapped'; actorId: string; allyId: string }
  /** Uzun atlama: aradaki `gap` altıgen atlandı, `cost` hareketten düştü. */
  | { type: 'jumped'; actorId: string; from: Offset; to: Offset; gap: number; cost: number; running: boolean; traitTurns?: Record<string, string> }
  | {
      type: 'hide_attempted';
      actorId: string;
      mode: RollMode;
      d20: number[];
      natural: number;
      /** Zemin bonusu dahil toplam; başarılıysa bulunma DC'si olur. */
      total: number;
      bonus: number;
      dc: number;
      success: boolean;
      /** Toplamın geçmesi gereken pasif Algı DC 15'ten yüksekse o gözcü (Görev K). */
      watcherId?: string;
      bonusDice?: RolledExtra[];
    }
  /** Gizlenmiş yaratık ortaya çıktı (saldırdı, yürüdü, büyü yaptı veya bulundu). */
  | { type: 'revealed'; actorId: string; reason: string }
  | { type: 'searched'; actorId: string; natural: number; total: number; found: string[]; bonusDice?: RolledExtra[] }
  /**
   * Eylem harcandı: `kind` neyin harcandığı (`attack`: Extra Attack ile kalan saldırılardan biri).
   * `attacksLeft` Attack eyleminde kalan saldırılar; `slotTurn` slotlu büyü yapılan tur.
   */
  | {
      type: 'action_used'; actorId: string; kind: 'action' | 'bonus' | 'reaction' | 'attack'; what: string;
      attacksLeft?: number; slotTurn?: string;
      /** Görev A5: ek bonus eylem harcandı (bonus eylem zaten kullanılmıştı). */
      extraBonus?: boolean;
      /** Kuyruk A6 (Conjure Animals): sürü sahibiyle taşındı (turda bir). */
      packMoved?: boolean;
      /** Light silahla saldırı (yan el ek saldırısını açar) ve yan el ek saldırısı yapıldı (kayıt sürümü 10). */
      light?: boolean; offhand?: boolean;
      /** Flurry of Blows'tan kalan vuruş ve Stunning Strike denendi (Görev P-Monk). */
      flurryLeft?: number; stunUsed?: boolean;
      /** K13: Thirsting Blade ek saldırıları (yalnızca pact silahı). */
      pactOnly?: boolean;
      /** Kuyruk 19 (11–20): Fleet Step: başka bonus eylemden sonra bedava Step of the Wind; Arcane Apotheosis kullanıldı. */
      fleet?: boolean; apotheosis?: boolean;
      /** Kuyruk 19 (SRD Loading): Loading silah bu eylemde ateşlendi. */
      loadingFired?: boolean;
    }
  | { type: 'dashed'; actorId: string }
  /**
   * Harita kuralının bir savaşçıya etkisi: isteğe bağlı save veya beceri kontrolü, hasar,
   * durum ekleme/kaldırma, sayaç değişimi, yer değiştirme (bataktan çıkış).
   */
  /** Kuyruk 33: boss bir efsanevi eylem kullandı (başka yaratığın turundan sonra) / turunun başında yenilendi. */
  | { type: 'legendary_used'; actorId: string; actionId: string; name: string; left: number }
  | { type: 'legendary_refresh'; actorId: string; left: number }
  | {
      type: 'map_effect'; rule: string; targetId: string; text: string;
      roll?: { label: string; dc: number; d20: number[]; natural: number; total: number; success: boolean; mode: RollMode };
      damage?: { rolls: number[]; raw: number; applied: number; type: string; note: DamageNote };
      hpAfter?: number;
      effects?: DamageEffect[];
      addCondition?: string;
      removeCondition?: string;
      mapStatus?: Partial<MapStatus>;
      moveTo?: Offset;
      /** Bu tur hareket biter (buzda kayma). */
      stopMovement?: boolean;
      /** Zar eklentileri ve ikinci şans (Görev F; Indomitable, Tactical Mind). */
      bonusDice?: RolledExtra[];
      /** Kuyruk K71b (sürüm 57+): yanan hareket (altıgen; tutmayan tırmanma kontrolü). */
      burnMove?: number;
      /** Kuyruk K72 (sürüm 60+): çöken kat döşemesi altıgenleri ("katId|sütun,satır"). */
      katCokuk?: string[];
    }
  /** Harita altıgeni değişti (lav yükselmesi). */
  | { type: 'tile_changed'; at: Offset; to: string }
  /** Lav yükselmesi uyarısı: bu altıgenler bir sonraki tur başında lav olur. */
  | { type: 'lava_warning'; hexes: Offset[]; round: number }
  | { type: 'map_note'; text: string; trapFound?: Offset; trapSprung?: Offset; gate?: { at: Offset; state: 'open' | 'closed' | 'broken'; hp: number };
      /** Kuyruk 24b: alarm boynuzunun çaldığı tur (sürekli takviye sayacı) ve savaşın sonuç bayrağı (ör. mağara keşfi). */
      hornRound?: number; flag?: string;
      /** Kuyruk 29 K28b: çığın geleceği tur (0: geldi). */
      avalancheRound?: number; floodRound?: number;
      /** Görev K26: ince buz çatırdadı (uyarı; sonraki girişte kırılır). */
      crackIce?: Offset }
  | { type: 'disengaged'; actorId: string }
  /** Beceri kontrolü; `reason` kontrolü doğuran kural (ör. "bataklık"). */
  | {
      type: 'skill_checked'; actorId: string; skill: Skill; mode: RollMode; d20: number[]; natural: number;
      total: number; dc: number; success: boolean; reason?: string;
      /** Kontrol zarının eklenti zarları (Guidance; Görev R2). */
      bonusDice?: RolledExtra[];
    }
  /** Zorla hareket veya lav yükselmesi: HP 0, ölüm kurtarması yok. */
  | { type: 'fell_into_lava'; actorId: string; at: Offset }
  | { type: 'slot_spent'; actorId: string; level: number; remaining: number }
  | {
      type: 'save_resolved';
      actorId: string;
      targetId: string;
      label: string;
      ability: Ability;
      dc: number;
      mode: RollMode;
      reasons: string[];
      d20: number[];
      natural: number | null;
      total: number | null;
      success: boolean;
      damageRolls: number[];
      rawDamage: number;
      appliedDamage: number;
      damageType: string;
      damageNote: DamageNote;
      targetHpAfter: number;
      conditionsAdded: string[];
      effects: DamageEffect[];
      rider?: string;
      /** DEX save'ine eklenen siper bonusu. */
      cover?: 2 | 5;
      /** Kuyruk 19: ikinci hasar türü (Ice Storm, Flame Strike): ana tür `damageType`'ta, buradaki ayrıca uygulanır. */
      secondary?: { type: string; rolls: number[]; raw: number; applied: number; note: DamageNote };
      /** Yayılım save'i (Spirit Guardians): büyücü ve tur; yaratık turda bir kez save yapar. */
      aura?: { casterId: string; turn: string };
      /** Save zarının eklenti zarları (Bless, Bane; Görev R2; `total` dahil). */
      bonusDice?: RolledExtra[];
    }
  | { type: 'healed'; actorId: string; targetId: string; label: string; amount: number; targetHpAfter: number; /** Kuyruk P11: iyileştirme zarları (ve paket değişikliği). */ rolls?: number[]; changed?: string }
  /** Kuyruk 19: savaşta HP zarı harcandı (Lifedrinker). */
  | { type: 'hit_die_spent'; actorId: string; left: number }
  /** Kuyruk 19: Animate Objects emri (bonus eylem; ekonomi `summonCommand`). */
  | { type: 'summons_commanded'; actorId: string }
  /** Kuyruk 19: savaştan çıkarıldı (kendi düzlemine sürgün). */
  | { type: 'exiled'; targetId: string; label: string }
  /** Kuyruk 19: konsantrasyon büyüsü erken bitirildi (Dispel Evil and Good özel işlevi). */
  | { type: 'concentration_ended'; actorId: string; label: string }
  /** Kuyruk 19: HP maksimumu azalır (0'a inerse ölür). */
  | { type: 'max_hp_drained'; targetId: string; amount: number; label: string }
  /** Kuyruk 19: yetenek puanı azalır; `modDelta` değiştirici farkı (save ve kontrol), `dies` puan 0. */
  | { type: 'ability_drained'; targetId: string; ability: Ability; amount: number; modDelta: number; dies: boolean; label: string }
  /** Kuyruk 19: Greater Restoration: kalıcı azalma (HP maksimumu ya da yetenek) geri gelir. */
  | { type: 'drain_restored'; targetId: string; what: 'maxHp' | Ability; label: string }
  /** `sourceId`: durumu koyan büyücü (konsantrasyon bitince kalkar). */
  | { type: 'condition_changed'; targetId: string; condition: string; present: boolean; reason: string; sourceId?: string; timer?: ConditionTimer }
  /** Süreli durum sayacı azaldı (`count` yeni değer). */
  | { type: 'condition_timer'; targetId: string; condition: string; count: number }
  /** "Save ends" kurtarma zarı (her kendi turunun sonunda). */
  | { type: 'condition_save'; targetId: string; condition: string; ability: Ability; dc: number; d20: number[]; total: number; success: boolean; bonusDice?: RolledExtra[] }
  /** Süreli durum bitti (süre doldu, kurtarma başarılı, kullanıldı). */
  | { type: 'condition_ended'; targetId: string; condition: string; reason: string }
  /** Yere düşmüş savaşçı ayağa kalktı: hızının yarısı kadar hareket harcar (`cost` altıgen). */
  | { type: 'stood_up'; actorId: string; cost: number }
  /** Yakalandı (Grappled; `restrained`: kavrama sürerken Restrained da). */
  | { type: 'grappled'; targetId: string; by: string; escapeDc: number; restrained: boolean; label: string }
  /** Yakalama bitti (kaçtı, yakalayan düştü/etkisiz, uzaklaştı). */
  | { type: 'grapple_ended'; targetId: string; reason: string }
  /** Kaçış denemesi: Athletics ya da Acrobatics (yüksek olan) vs kaçış DC'si. */
  | { type: 'grapple_escape'; actorId: string; skill: 'athletics' | 'acrobatics' | 'investigation'; d20: number[]; total: number; dc: number; success: boolean; bonusDice?: RolledExtra[] }
  /** İtme: hedefin save'i ve sonucu; başarısızsa `effect` uygulanır (`to`: itileceği altıgen). */
  | {
      type: 'shove_resolved'; actorId: string; targetId: string; ability: 'str' | 'dex'; dc: number;
      d20: number[]; natural: number | null; total: number | null; success: boolean; effect: 'push' | 'prone'; to?: Offset;
      bonusDice?: RolledExtra[];
    }
  /** Riskli atlama zarı (`lavJump`): sonuç güvenli iniş, yanarak iniş ya da düşme. */
  | {
      type: 'jump_check'; actorId: string; from: Offset; to: Offset; skill: Skill; d20: number[]; natural: number;
      total: number; dc: number; over: number; outcome: 'safe' | 'burned' | 'fell';
    }
  /** Zorunlu hareket (itme): fırsat saldırısı tetiklemez; harita kuralları ayrıca çalışır. */
  | { type: 'pushed'; targetId: string; from: Offset; to: Offset; by: string }
  /**
   * Silah ustalığı uygulandı (kayıt sürümü 8). Graze: `damage` ve `hpAfter`; Topple: `save`; Sap/Slow/Vex: `mark`
   * (`holderId` işareti taşıyan); Cleave: `turn` (saldırana yazılır, ardından ikinci saldırı); Push: ardından `pushed`.
   */
  | {
      type: 'mastery_applied'; actorId: string; targetId: string; mastery: MasteryId; label: string;
      damage?: { raw: number; applied: number; type: string; note: DamageNote };
      hpAfter?: number;
      effects?: DamageEffect[];
      save?: { ability: Ability; dc: number; d20: number[]; natural: number | null; total: number | null; success: boolean };
      mark?: { holderId: string; mark: MasteryMark };
      turn?: string;
      bonusDice?: RolledExtra[];
    }
  /** Rage başladı (`added`: Rage'in eklediği dirençler; konsantrasyon biter; kayıt sürümü 9). */
  | { type: 'rage_started'; actorId: string; added: string[]; /** Kuyruk 18 H3: Instinctive Pounce (bu tur ek hareket, altıgen). */ pounce?: number;
      /** Kuyruk 18 H3: Mindless Rage girişte biten durumlar. */ cleared?: string[] }
  /** Rage bonus eylemle uzatıldı. */
  | { type: 'rage_extended'; actorId: string }
  /** Rage bitti (`reason`: süre doldu, Incapacitated…). */
  | { type: 'rage_ended'; actorId: string; reason: string }
  /** Reckless Attack: sonraki turunun başına dek (işaret `reckless`). */
  | { type: 'reckless_started'; actorId: string }
  /** Ustalık işareti kullanıldı ve kalktı (Sap: dezavantajlı saldırı; Vex: avantajlı saldırı). */
  | { type: 'mastery_mark_used'; holderId: string; kind: MasteryMark['kind']; by: string; targetId?: string }
  /** Görev F: özellik işareti (Studied Attacks, Multiattack Defense). */
  | { type: 'mark_added'; holderId: string; mark: MasteryMark; label: string }
  /** Görev F: Steady Aim (hız 0, sonraki saldırı avantajlı). */
  | { type: 'steady_aim_used'; actorId: string; turn: string }
  /** Görev F: saldırı dışı ek hasar (Superior Hunter's Prey: Hunter's Mark hasarı ikinci yaratığa). */
  | {
      type: 'extra_damage'; actorId: string; targetId: string; label: string; rolls: number[]; raw: number; applied: number;
      damageType: string; damageNote: DamageNote; targetHpAfter: number; effects: DamageEffect[]; traitTurns?: Record<string, string>;
    }
  /** Sınıf özelliği kullanıldı; `remaining` kalan kullanım. */
  | { type: 'feature_used'; actorId: string; feature: string; remaining: number }
  /** Süren güçlendirme eklendi (aynı kaynaktan olan yenilenir). */
  | { type: 'buff_added'; targetId: string; buff: Buff }
  /** Görev WIZARD: Dispel Magic büyü kaynaklı güçlendirmeyi (Magic Weapon, Divine Favor) kaldırır. */
  | { type: 'buff_removed'; targetId: string; source: string }
  /** Konsantrasyon başladı (öncekini bitirir). */
  /** Görev R3: çağrılan yaratık savaşa girer; `index` sıradaki yeri (sahibinin ardı ya da inisiyatifine göre). */
  /**
   * Görev R4: alan etkisi (canavar nefesi, Dragonborn, Draconic Spirit): şekil, ölçü, hedef altıgen, kapladığı altıgenler
   * ve etkilenenler; ardından her hedefin `save_resolved` olayı. Durumu değiştirmez (günlük ve önizleme).
   */
  | { type: 'area_used'; actorId: string; label: string; shape: string; sizeFt: number; widthFt?: number; aim?: Offset; hexes: Offset[]; targetIds: string[];
      /** Görev Y1: alanın hasar türü, zorluk sınıfı ve zarı (yüzey tepkimeleri için). */
      damageType?: string; dc?: number; dice?: string }
  | { type: 'summoned'; ownerId: string; spell: string; combatant: Combatant; index: number }
  /** Görev R3: çağrılan yaratık kaybolur (0 HP, konsantrasyon, sahibinin ölümü, yenisiyle değişme, süre). */
  | { type: 'summon_vanished'; actorId: string; ownerId: string; reason: SummonVanishReason }
  /** Görev B2: büyü alanı oluştu, taşındı (yeni altıgenler), tetiklendi (turda bir kez kaydı) ya da bitti. */
  | { type: 'zone_created'; zone: SpellZone }
  /** Kuyruk 18 H4: kat değişimi (bkz. `floors.ts`). */
  | { type: 'floor_changed'; actorId: string; from: string; to: string; map: NonNullable<BattleState['map']>; prev: NonNullable<BattleState['map']>; environmentId: string;
      moved: Array<{ id: string; pos: Offset | null }>; parked: Array<{ id: string; pos: Offset }>; restored: string[]; added: Combatant[]; hexesUsed: number }
  | { type: 'zone_moved'; zoneId: string; hexes: Offset[]; /** Kuyruk 18b: yeni bitiş turu (seyrelme, dağılma). */ until?: number; /** Kuyruk 19 */ center?: Offset }
  | { type: 'zone_triggered'; zoneId: string; targetId: string; turn: string }
  /** Kuyruk 19: alanın verdiği hasar bütçeye yazılır (Guardian of Faith). */
  | { type: 'zone_dealt'; zoneId: string; amount: number }
  | { type: 'zone_panel_damaged'; zoneId: string; hex: Offset; amount: number }
  | { type: 'zone_ended'; zoneId: string; name: string; reason: 'expired' | 'concentration' | 'replaced' | 'dispelled' | 'reacted' | 'destroyed' }
  | { type: 'concentration_started'; actorId: string; spell: string; slotLevel: number; turn: string; targetId?: string; pos?: Offset }
  /** Konsantrasyon büyüsü taşındı: işaretin yeni hedefi veya gücün yeni altıgeni. */
  | { type: 'concentration_moved'; actorId: string; targetId?: string; pos?: Offset }
  | { type: 'spell_cast'; actorId: string; targetId: string | null; label: string; slotLevel: number | null; note: string;
      /** Görev Y1: alan büyüsünün altıgenleri, hasar türü, zorluk sınıfı, zarı ve etkilenenler (yüzey tepkimeleri). */
      area?: { hexes: Offset[]; /** Kuyruk K73c: yere değmeyen havadaki alanın altıgenleri (yalnız görsel). */ airHexes?: Offset[]; damageType?: string; dc?: number; dice?: string; targetIds?: string[];
        /** Kuyruk E2: yalnız görsel (efekt katmanı; reducer ve kurallar okumaz): alan şekli ve nişan altıgeni. */
        shape?: string; aim?: Offset } }
  /** Görev Y1: yüzey tepkimesi (yalnızca günlük; alan değişiklikleri `zone_*` olaylarında). */
  /** Kuyruk K55: `row` tablo satırı (data/yuzey-etkilesimleri.json; keşif defteri), `pairs` zincirde çalışan ikililer (turda bir). */
  | { type: 'surface_reacted'; reaction: SurfaceReaction; hexes: Offset[]; sourceId?: string; label: string; row?: string; pairs?: string[] }
  /** Görev S2: nesne olayları (yerleşti, kaldırıldı, hasar aldı, yıkıldı, durumu değişti). */
  | { type: 'object_placed'; object: MapObject }
  | { type: 'object_removed'; objectId: string }
  | { type: 'object_damaged'; objectId: string; actorId?: string; label: string; damage: number; damageType: string; hpAfter: number;
      roll?: { d20: number; total: number; ac: number; hit: boolean } }
  | { type: 'object_destroyed'; objectId: string; label: string }
  | { type: 'object_changed'; objectId: string; state?: ObjectState; label: string; /** Kuyruk A7: nesne ışığı (null kaldırır). */ light?: { r: number; spell: string; by: string } | null; /** Kuyruk 30 D1: gizli nesne bulundu. */ found?: boolean; check?: { d20: number; total: number; dc: number; success: boolean }; carriedBy?: string | null; at?: Offset;
      /** Kuyruk S1 (Faerie Fire): parlama süresi (tur). */ outlined?: number;
      /** Kuyruk S2: irtifa / Levitate / boyut büyüsü (null kaldırır). */ altitudeFt?: number; levitatedBy?: string | null; resized?: 'Enlarge' | 'Reduce' | null; resizedBy?: string; hp?: number;
      /** Kuyruk 36: doğaçlama silah alındı: taşıyanın silah seçeneklerine eklenir. */ arm?: AttackOption }
  | { type: 'goal_changed'; goalId: string; status: GoalStatus }
  | { type: 'groups_formed'; members: Record<string, string[]> }
  /** Kuyruk 16 K16D: devriye bir rota noktasına vardı: sıradaki nokta ve bu tura dek bekleme. */
  | { type: 'patrol_moved'; groupId: string; index: number; waitUntil: number }
  | { type: 'group_alarmed'; groupId: string; reason: string; byId?: string; round: number; initiatives: Record<string, number>; order: string[]; turnIndex: number }
  | {
      type: 'death_save';
      actorId: string;
      natural: number;
      successes: number;
      failures: number;
      outcome: 'success' | 'failure' | 'stable' | 'dead' | 'revived';
    }
  | { type: 'stabilized'; actorId: string; targetId: string; natural: number; success: boolean }
  | { type: 'recharge_used'; actorId: string; attackIndex: number }
  | { type: 'recharge_rolled'; actorId: string; attackIndex: number; d6: number; recharged: boolean }
  | { type: 'regeneration'; actorId: string; amount: number; blocked: boolean; died: boolean; hpAfter: number }
  | { type: 'hp_adjusted'; targetId: string; hpAfter: number; life: Combatant['life'] }
  /** Görev S1: büyüyle stabil etme ya da diriltme (Spare the Dying, Revivify). */
  | { type: 'life_restored'; targetId: string; hpAfter: number; life: 'alive' | 'stable'; label: string }
  /** Görev S1: ışınlanma (fırsat saldırısı tetiklemez; sıra ve konsantrasyon korunur). */
  /** Kuyruk S2: irtifa (ft) değişti (yaratık ya da nesne); `cost` harcanan hareket (altıgen), `turn`/`moved` Levitate turluk sınırı. */
  | { type: 'altitude_changed'; targetId?: string; objectId?: string; altitudeFt: number; label: string; cost?: number; turn?: string; moved?: number; byId?: string; /** Levitate: bitince süzülerek iner. */ gentle?: boolean; /** Kuyruk K68b: tırmanma (duvar/tavan). */ climb?: true; /** Kuyruk K72 (sürüm 60+): duruş yüzeyinde (sur tepesi, kat döşemesi): tırmanma işareti kalkar. */ stand?: true; /** Kuyruk K73c (sürüm 64+): kazarak yer altına (irtifa eksi). */ burrow?: true }
  /** Kuyruk S2: elden düşen eşya (yerde nesne olur; `options` geri alınınca dönen saldırı seçenekleri; nesnesizse kaybolur). */
  | { type: 'item_dropped'; actorId: string; item: string; label: string; objectId?: string; at?: Offset; options?: AttackOption[] }
  | { type: 'item_picked'; actorId: string; objectId: string; label: string; bond?: boolean }
  /** Kuyruk S2: gizli alan fark edildi (Spike Growth). */
  | { type: 'zone_spotted'; zoneId: string; by: string[] }
  /** Kuyruk S1: haritadan ayrılanlar (Plane Shift; `offFloor: 'duzlem'`, konum yok, sırada atlanır, tarafı ayakta tutmaz). */
  | { type: 'retreated'; actorId: string; ids: string[]; label: string }
  /** Kuyruk K64a (sürüm 48): ele geçirme başladı (bedene etki, ele geçiren `offFloor: 'beden'`). */
  | { type: 'possessed'; possessorId: string; hostId: string; label: string; incap: boolean; until: number }
  /** Kuyruk K64a: ele geçirme bitti; ele geçiren `to` altıgeninde belirir, ev sahibi ona savaş sonuna dek bağışık. */
  | { type: 'possession_ended'; possessorId: string; hostId: string; reason: 'hp0' | 'leave' | 'dispel' | 'gone' | 'gm'; to: Offset | null; label: string }
  /** Kuyruk K64a: ele geçirme save'i başarılı (bağışıklık). */
  | { type: 'possession_resisted'; possessorId: string; hostId: string; label: string }
  | { type: 'teleported'; actorId: string; from: Offset; to: Offset; label: string; /** Kuyruk 19: harcanan hareket (altıgen) ve Tree Stride işareti. */ cost?: number; stride?: boolean }
  /** Görev S1: bitkinlik seviyesi değişti (6'da ölür). */
  | { type: 'exhaustion_changed'; targetId: string; level: number; reason: string }
  /** Y1 G2: yapay zekâ rolü atandı (Game Master). */
  | { type: 'ai_role_set'; targetId: string; role: 'hasarci' | 'kontrolcu' | 'destek' | 'tank' | null }
  /** Kuyruk 19: canavar yeteneğinin şarjı (kullanıldı ya da tur başı d6). */
  | { type: 'ability_recharge'; actorId: string; abilityId: string; used?: boolean; d6?: number; recharged?: boolean }
  /** Kuyruk 19 (Hydra Multiple Heads): baş sayısı, son turundan beri ölen, ateş hasarı aldı mı, turun başındaki HP. */
  | { type: 'heads_changed'; actorId: string; heads: number; lost: number; fire: boolean; turnHp: number }
  /** Kuyruk 19: ölüm patlaması yapıldı (bir kez). */
  | { type: 'burst_done'; actorId: string }
  /** Kuyruk 19 (Time Stop): büyücü art arda `turns` tur oynar; başka yaratığı etkilerse biter. */
  | { type: 'time_stop'; actorId: string; turns: number }
  | { type: 'time_stop_ended'; actorId: string }
  | { type: 'battle_finished'; winner: Side; /** Kuyruk S1: kaybeden taraf haritadan ayrıldı (Plane Shift). */ retreat?: boolean }
  /** Kuyruk 31: keşif adımı öncesi hareket sayacı sıfırlanır. */
  | { type: 'explore_step'; actorId: string }
  /** Uyuyan ejderha uyandı; `reason` günlük metni (hasar, yanına girdi, gürültü, Algı, GM). */
  | { type: 'dragon_woke'; actorId: string; reason: string; byId?: string }
  /** Tur sonunda ejderhanın Algı zarı: 25 ft içindeki gizlenmemiş karakteri fark etti mi. */
  | { type: 'dragon_perception'; actorId: string; watcherId: string; d20: number[]; total: number; dc: number; success: boolean }
  /** Düşmanın ejderhayı uyandırma eğilimi zarı (d100 < yüzde tutar). */
  | { type: 'rouse_roll'; actorId: string; roll: number; pct: number; success: boolean; turn: string }
  /** Görev A1: can havuzu kuruldu (üyelerin HP'si ve azamisi havuzunki olur). */
  | { type: 'hp_pool_created'; poolId: string; memberIds: string[]; hp: number; max: number; label?: string; guard?: HpPool['guard'] }
  /** Görev A1: komut sonunda üyelerin HP'si havuzunkine eşitlenir (aynı komutta birden çok üyeye gelen hasar ayrı ayrı düşülür). */
  | { type: 'hp_pool_synced'; poolId: string; hp: number };

export interface CommandContext {
  /** İsteği gönderen oyuncunun kimliği (GM için de kendi kimliği). */
  playerId: string | null;
  isGm: boolean;
}
