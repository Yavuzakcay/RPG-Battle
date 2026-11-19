/**
 * Mekanik matris: SRD 5.2.1 metninin otomatik ayrıştırmaya sığmayan büyüleri için elle okunmuş beklentiler
 * (kaynak: data/srd/spells.json metni). Her kayıt yapım anında ne olduğunu ve (varsa) alanın tetiğini söyler.
 * `karar`: SRD metni oyuna iki türlü uyarlanabilir; matriste "karar bekliyor".
 */
import type { Ab } from './srd';

export interface Parca { dice: string; type: string }

export interface Yapim {
  /** save: hedef(ler) yapımda save atar; attack: yapımda büyü saldırısı; auto: saldırısız/save'siz hasar; yok: yapımda hedefe etki yok. */
  tur: 'save' | 'attack' | 'auto' | 'yok';
  /** Iskada ilk hasarın yarısı (Acid Arrow). */
  halfOnMiss?: boolean;
  /** İsabet ya da ıska, ardından hedefte save'li patlama (Ice Knife: DEX, 2d6 cold, yarı yok; yukarı slotta +1d6). */
  burst?: { save: Ab; dice: string; type: string; up: string };
  /** Komutta seçim (Blindness/Deafness: Blinded). */
  choice?: string;
  save?: Ab;
  dmg?: Parca[];
  half?: boolean;
  conds?: string[];
  attack?: 'melee' | 'ranged';
  /** Saldırı hasarına büyü yeteneği değiştiricisi. */
  addMod?: boolean;
}

export interface Tetik {
  /** Hedefin turunun başı (start) ya da sonu (end). */
  olay: 'start' | 'end';
  save?: Ab;
  dmg?: Parca[];
  half?: boolean;
  conds?: string[];
}

export interface Ozel {
  yapim?: Yapim;
  /** Büyücüye her bağlamda eklenen (True Strike: elde silah). */
  buyucuEk?: Record<string, unknown>;
  /** Save yapılandırılmış olayla kaydedilmez (Telekinesis: günlük notu); yalnız durum karşılaştırılır. */
  saveGizli?: boolean;
  /** Save `saveEffect` ile (`map_effect.roll`, d20 `kind` etiketsiz) atılır: kanca etiketsiz d20'yi save sayar (G02). */
  saveEtiketsiz?: boolean;
  /** Komutta seçim (alan/çağrı büyüleri: element). */
  secim?: string;
  /** Siper bağlamı uygulanmaz (yer etkisi: Earthquake). */
  siperYok?: boolean;
  /** Savaş dışı oluşu doğru (SRD etkisi savaş modelinin dışında). */
  savasDisi?: string;
  /** Hedefe her bağlamda eklenen (Heat Metal: metal silah tutar). */
  hedefEk?: Record<string, unknown>;
  /** Çağrı/alan hedefin bitişiğindeki boş altıgende belirir (Flaming Sphere, Guardian of Faith). */
  bitisik?: boolean;
  tetik?: Tetik;
  /** Yapım anı yorumu karar bekliyor (neden). */
  karar?: string;
  /** Rapor notu. */
  not?: string;
  /** Hedef tarafı (etki büyüleri; SRD: istekli/dost ya da düşman). */
  taraf?: 'dost' | 'dusman' | 'kendi';
  /** Save savaşta avantajlı ("does so with Advantage if you or your allies are fighting it"). */
  saveAdv?: boolean;
}

const p = (dice: string, type: string): Parca => ({ dice, type });

export const OZEL: Record<string, Ozel> = {
  // --- Belirince save aldıran alanlar ---
  moonbeam: { yapim: { tur: 'save', save: 'con', dmg: [p('2d10', 'radiant')], half: true }, tetik: { olay: 'end', save: 'con', dmg: [p('2d10', 'radiant')], half: true } },
  cloudkill: { yapim: { tur: 'save', save: 'con', dmg: [p('5d8', 'poison')], half: true }, tetik: { olay: 'end', save: 'con', dmg: [p('5d8', 'poison')], half: true } },
  'incendiary-cloud': { yapim: { tur: 'save', save: 'dex', dmg: [p('10d8', 'fire')], half: true }, tetik: { olay: 'end', save: 'dex', dmg: [p('10d8', 'fire')], half: true } },
  'insect-plague': { yapim: { tur: 'save', save: 'con', dmg: [p('4d10', 'piercing')], half: true }, tetik: { olay: 'end', save: 'con', dmg: [p('4d10', 'piercing')], half: true } },
  'wall-of-fire': { yapim: { tur: 'save', save: 'dex', dmg: [p('5d8', 'fire')], half: true }, tetik: { olay: 'end', dmg: [p('5d8', 'fire')] },
    not: 'SRD: seçilen yüzün 10 ft içinde ya da duvarın içinde tur bitiren 5d8 Fire (save yok).' },
  'wall-of-thorns': { yapim: { tur: 'save', save: 'dex', dmg: [p('7d8', 'piercing')], half: true }, tetik: { olay: 'end', save: 'dex', dmg: [p('7d8', 'slashing')], half: true } },
  'wind-wall': { yapim: { tur: 'save', save: 'str', dmg: [p('4d8', 'bludgeoning')], half: true } },
  'blade-barrier': { yapim: { tur: 'save', save: 'dex', dmg: [p('6d10', 'force')], half: true }, tetik: { olay: 'end', save: 'dex', dmg: [p('6d10', 'force')], half: true } },
  'wall-of-ice': { yapim: { tur: 'save', save: 'dex', dmg: [p('10d6', 'cold')], half: true }, saveEtiketsiz: true, not: 'SRD: duvarın kestiği yaratık bir yana itilir ve save atar.' },
  'prismatic-spray': { saveEtiketsiz: true },
  'storm-of-vengeance': { yapim: { tur: 'save', save: 'con', dmg: [p('2d6', 'thunder')], conds: ['Deafened'] } },
  earthquake: { siperYok: true, yapim: { tur: 'save', save: 'dex', conds: ['Prone'] }, not: 'SRD: başarısız save Prone ve konsantrasyon bozulur (hasar yok).' },
  'black-tentacles': { yapim: { tur: 'save', save: 'str', dmg: [p('3d6', 'bludgeoning')], conds: ['Restrained'] }, tetik: { olay: 'end', save: 'str', dmg: [p('3d6', 'bludgeoning')], conds: ['Restrained'] } },
  entangle: { yapim: { tur: 'save', save: 'str', conds: ['Restrained'] } },
  grease: { yapim: { tur: 'save', save: 'dex', conds: ['Prone'] }, tetik: { olay: 'end', save: 'dex', conds: ['Prone'] } },
  'ice-storm': { yapim: { tur: 'save', save: 'dex', dmg: [p('2d10', 'bludgeoning'), p('4d6', 'cold')], half: true } },
  'call-lightning': { yapim: { tur: 'save', save: 'dex', dmg: [p('3d10', 'lightning')], half: true } },
  sunbeam: { yapim: { tur: 'save', save: 'con', dmg: [p('6d8', 'radiant')], half: true, conds: ['Blinded'] } },
  'vitriolic-sphere': { yapim: { tur: 'save', save: 'dex', dmg: [p('10d4', 'acid')], half: true }, not: 'SRD: başarısızda ayrıca sonraki tur sonunda 5d4 Acid.' },
  'conjure-celestial': { yapim: { tur: 'save', save: 'dex', dmg: [p('6d12', 'radiant')], half: true }, not: 'SRD: her yaratık için Healing ya da Searing Light seçilir (düşmana Searing).' },
  'flame-strike': { yapim: { tur: 'save', save: 'dex', dmg: [p('5d6', 'fire'), p('5d6', 'radiant')], half: true } },
  'meteor-swarm': { yapim: { tur: 'save', save: 'dex', dmg: [p('20d6', 'fire'), p('20d6', 'bludgeoning')], half: true } },
  'fire-storm': { yapim: { tur: 'save', save: 'dex', dmg: [p('7d10', 'fire')], half: true } },
  // --- Yapımda etki yok; tetikle işleyen alanlar ---
  web: { yapim: { tur: 'yok' }, tetik: { olay: 'start', save: 'dex', conds: ['Restrained'] } },
  'sleet-storm': { yapim: { tur: 'yok' }, tetik: { olay: 'start', save: 'dex', conds: ['Prone'] } },
  'stinking-cloud': { yapim: { tur: 'yok' }, tetik: { olay: 'start', save: 'con', conds: ['Poisoned'] } },
  'spike-growth': { yapim: { tur: 'yok' }, not: 'SRD: alanda her 5 ft hareket 2d4 Piercing.' },
  'flaming-sphere': { bitisik: true, yapim: { tur: 'yok' }, tetik: { olay: 'end', save: 'dex', dmg: [p('2d6', 'fire')], half: true } },
  'guardian-of-faith': { bitisik: true, yapim: { tur: 'yok' }, tetik: { olay: 'start', save: 'dex', dmg: [p('20', 'radiant')], half: true } },
  'faithful-hound': { bitisik: true, yapim: { tur: 'yok' } },
  'delayed-blast-fireball': { yapim: { tur: 'yok' }, not: 'SRD: boncuk büyü bitince patlar (12d6 + birikim).' },
  'conjure-animals': { bitisik: true, yapim: { tur: 'yok' }, not: 'SRD: sürü yaklaşınca/girince/tur sonunda DEX save 3d10 Slashing (büyücü seçer).' },
  'conjure-elemental': { bitisik: true, secim: 'fire', yapim: { tur: 'yok' }, tetik: { olay: 'start', save: 'dex', dmg: [p('8d8', 'fire')], conds: ['Restrained'] },
    not: 'SRD: tutsak sonraki turlarının başında save yineler (4d8); yakalandığı turda değil.' },
  'conjure-woodland-beings': { karar: 'SRD: "Emanation bir yaratığın alanına girdiğinde" — yapımda içerideki yaratıkların save atıp atmadığı yoruma açık.',
    tetik: { olay: 'end', save: 'wis', dmg: [p('5d8', 'force')], half: true } },
  'spirit-guardians': { karar: 'SRD 5.2.1: "whenever the Emanation enters a creature\'s space" — yapımda içerideki yaratığın save atıp atmadığı yoruma açık (motor: atar).',
    tetik: { olay: 'end', save: 'wis', dmg: [p('3d8', 'radiant')], half: true } },
  // --- Yapımda saldırı (çağrı/güç) ---
  'spiritual-weapon': { yapim: { tur: 'attack', attack: 'melee', dmg: [p('1d8', 'force')], addMod: true } },
  'arcane-sword': { yapim: { tur: 'attack', attack: 'melee', dmg: [p('4d12', 'force')], addMod: true } },
  'arcane-hand': { yapim: { tur: 'attack', attack: 'melee', dmg: [p('5d8', 'force')] }, not: 'SRD: yapımda el taşınıp bir etki (Clenched Fist: 5d8 Force) uygulanabilir.' },
  'conjure-fey': { yapim: { tur: 'attack', attack: 'melee', dmg: [p('3d12', 'psychic')], addMod: true, conds: ['Frightened'] } },
  // --- Sonraki Magic eylemiyle saldıran ---
  'produce-flame': { yapim: { tur: 'yok' }, not: 'SRD: alev elde belirir; fırlatmak ayrı Magic eylemi (yapım Bonus Action).' },
  'flame-blade': { yapim: { tur: 'yok' }, not: 'SRD: kılıç belirir; saldırı ayrı Magic eylemi (yapım Bonus Action).' },
  'dragons-breath': { taraf: 'dost', not: 'SRD: dokunulan dost sonraki turlarında Magic eylemiyle nefes verir.' },
  // --- Etki büyülerinde taraf ve save ---
  'ice-knife': { yapim: { tur: 'attack', attack: 'ranged', dmg: [p('1d10', 'piercing')], burst: { save: 'dex', dice: '2d6', type: 'cold', up: '1d6' } } },
  'acid-arrow': { yapim: { tur: 'attack', attack: 'ranged', dmg: [p('4d4', 'acid')], halfOnMiss: true }, not: 'SRD: isabette ayrıca hedefin sonraki tur sonunda 2d4 Acid.' },
  'heat-metal': { yapim: { tur: 'auto', dmg: [p('2d8', 'fire')] }, hedefEk: { weaponOptions: [{ label: 'Longsword', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, reachFt: 5, tag: 't longsword', weaponId: 'longsword' }] },
    not: 'SRD: temas eden 2d8 Fire (save yok); CON save yalnız nesneyi bırakma/dezavantaj için.' },
  'blindness-deafness': { yapim: { tur: 'save', save: 'con', conds: ['Blinded'], choice: 'Blinded' }, not: 'SRD: Blinded ya da Deafened (büyücü seçer); bağlamda Blinded.' },
  'hypnotic-pattern': { yapim: { tur: 'save', save: 'wis', conds: ['Charmed', 'Incapacitated'] }, not: 'SRD: Charmed; Charmed iken Incapacitated ve hız 0.' },
  'dispel-evil-and-good': { taraf: 'kendi', not: 'SRD: Charmed/Frightened Break Enchantment ile kalkar (uygulanmaz).' },
  command: { yapim: { tur: 'save', save: 'wis', conds: [], choice: 'grovel' }, tetik: { olay: 'start', conds: ['Prone'] },
    not: 'SRD: hedef komutu sonraki turunda uygular (Grovel: Prone olur, turu biter).' },
  'freezing-sphere': { yapim: { tur: 'save', save: 'con', dmg: [p('10d6', 'cold')], half: true }, not: 'SRD: Restrained yalnız donan suda yüzen yaratığa.' },
  'meld-into-stone': { savasDisi: 'Büyücü taşa girer; savaştan çekilme (hasar yalnız taş kırılınca).' },
  teleport: { savasDisi: 'Hasar yalnız kaza (mishap) tablosunda.' },
  sequester: { savasDisi: 'Nesne/istekli yaratık saklanır (yapım 1 dakika).' },
  'modify-memory': { savasDisi: 'Anı değiştirme (sosyal; Charmed yalnız yapım boyunca).' },
  'true-strike': { yapim: { tur: 'attack', attack: 'melee', dmg: [p('1d8+4', 'slashing'), p('3d6', 'radiant')] },
    buyucuEk: { weaponOptions: [{ label: 'Longsword', attackBonus: 9, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, reachFt: 5, tag: 'a longsword', weaponId: 'longsword', abilityMod: 3, ability: 'str' }] },
    not: 'SRD: silahla saldırı; saldırı ve hasarda büyü yeteneği; 17. seviyede +3d6 Radiant. Hasar türü Radiant ya da silahınki (seçim).' },
  telekinesis: { yapim: { tur: 'save', save: 'str', conds: ['Restrained'] }, saveGizli: true, not: 'Motor STR save\'ini günlük notuyla kaydediyor (save_resolved olayı yok); yalnız durum karşılaştırıldı.' },
  'charm-person': { saveAdv: true },
  'charm-monster': { saveAdv: true },
  light: { taraf: 'kendi', not: 'SRD: dokunulan nesne (büyücünün taşıdığı nesne).' },
  'continual-flame': { taraf: 'kendi', not: 'SRD: dokunulan nesne.' },
  maze: { taraf: 'dusman', not: 'SRD: save yok; hedef labirente sürülür.' },
  haste: { taraf: 'dost' }, fly: { taraf: 'dost' }, invisibility: { taraf: 'dost' }, 'greater-invisibility': { taraf: 'dost' },
  'enlarge-reduce': { taraf: 'dusman', not: 'Reduce düşmana (CON save); Enlarge istekli dosta.' },
  levitate: { taraf: 'dusman' }, polymorph: { taraf: 'dusman' }, 'resilient-sphere': { taraf: 'dusman' },
  'gaseous-form': { taraf: 'dost' }, sanctuary: { taraf: 'dost' }, 'beacon-of-hope': { taraf: 'dost' }, 'holy-aura': { taraf: 'dost' },
};
