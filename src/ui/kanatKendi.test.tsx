/**
 * Kuyruk A İş 2 (yalnız görünüm; kural ve kayıt sürümü değişmez): kendi çiziminde kanadı olan Dragonborn jetonlarında ejderha kanadı
 * çizilmez. Liste veride (`data/kanat-esleme.json` `slotlar.dragonborn.kanatsiz`); rozet (LookFrame + AvatarBadge), savaş jetonu
 * (Draconic Flight uçuşu dahil) ve karakter figürü aynı yardımcıdan (`ownWingToken`).
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvatarBadge, AvatarCircle, CharacterFigure } from './Avatar';
import { LookFrame } from './LookFrame';
import { lineageLook, ownWingToken } from './lineageLook';
import kanat from '../../data/kanat-esleme.json';

/** Jeton dosya adları (yalnız ad listesi; görsel testlere girmez). */
const TOKENS = new Set(Object.keys(import.meta.glob('/public/characters/dragonborn*.webp')).map((k) => k.replace(/^.*\//, '').replace(/\.webp$/, '')));
const LIST = (kanat.slotlar.dragonborn as unknown as { kanatsiz: string[] }).kanatsiz;
const look = { raceId: 'dragonborn', lineageId: 'gold', level: 5 };
const av = (name: string) => ({ src: `characters/${name}.webp`, bg: '#a44030', label: 'D', look });
const badge = (name: string) => renderToStaticMarkup(<LookFrame sheet={look} size={96} ability><AvatarBadge avatar={av(name)} size={96} /></LookFrame>);
const token = (name: string) => renderToStaticMarkup(<svg><AvatarCircle avatar={av(name)} cx={50} cy={50} r={40} flying eager /></svg>);

describe('Dragonborn: kendi çiziminde kanatlı jeton', () => {
  it('liste veride; her kayıt var olan bir Dragonborn jetonu; Cleric Yaşam (ID1) iki cinsiyette de listede', () => {
    expect(LIST.length).toBeGreaterThan(0);
    expect(TOKENS.size).toBe(266); // DRAGONBORN-ESKI-JETON-KALDIR (2026-11-22): 24 sınıf-genel jeton kaldırıldı (290 → 266)
    for (const n of LIST) expect(TOKENS.has(n), n).toBe(true);
    expect(LIST).toEqual(expect.arrayContaining(['dragonborn-erkek-cleric-ID1', 'dragonborn-kadin-cleric-ID1']));
  });
  it('yardımcı: yalnız listedeki jeton ve yalnız o slotun kanadı; küçük kopya ve klasör fark etmez', () => {
    const wing = lineageLook(look, { ability: true }).wing!;
    expect(ownWingToken(wing, 'characters/dragonborn-erkek-cleric-ID1.webp')).toBe(true);
    expect(ownWingToken(wing, 'characters/kucuk/dragonborn-erkek-cleric-ID1.webp')).toBe(true);
    expect(ownWingToken(wing, 'characters/dragonborn-erkek-cleric-ID2.webp')).toBe(false);
    expect(ownWingToken({ id: 'tiefling-kanatli' }, 'characters/dragonborn-erkek-cleric-ID1.webp')).toBe(false);
  });
  it('rozet (LookFrame): kanatlı jetonda ejderha kanadı yok, kanatsız jetonda var', () => {
    expect(badge('dragonborn-erkek-cleric-ID1')).not.toContain('badge-wings');
    expect(badge('dragonborn-kadin-warlock-WL-7')).not.toContain('badge-wings');
    expect(badge('dragonborn-erkek-cleric-ID2')).toContain('badge-wings');
  });
  it('savaş jetonu Draconic Flight ile havada: kanatlı jetonda yok, diğerinde var', () => {
    expect(token('dragonborn-kadin-cleric-ID1')).not.toContain('kanat/dragonborn');
    expect(token('dragonborn-kadin-cleric-ID2')).toContain('kanat/dragonborn');
  });
  it('karakter figürü: kanatlı jetonda kanat yok', () => {
    expect(renderToStaticMarkup(<CharacterFigure avatar={av('dragonborn-erkek-warlock-WL-7')} size={96} />)).not.toContain('kanat/dragonborn');
    expect(renderToStaticMarkup(<CharacterFigure avatar={av('dragonborn-erkek-warlock-WL-6')} size={96} />)).toContain('kanat/dragonborn');
  });
});
