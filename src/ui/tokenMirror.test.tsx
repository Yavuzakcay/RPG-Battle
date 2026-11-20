/** KQ6-7: Gulyabani (Warlock WL-8) jetonu doğal yönü sola; çözücü aynalar, savaş yönüyle XOR. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvatarCircle, AvatarBadge } from './Avatar';
import { naturalLeft } from './tokenMirror';
import ayna from '../../data/jeton-ayna.json';

const av = (src: string) => ({ src, bg: '#000', label: 'G' });
const svg = (src: string, flip?: boolean) => renderToStaticMarkup(<svg><AvatarCircle avatar={av(src)} cx={50} cy={50} r={20} eager {...(flip !== undefined ? { flip } : {})} /></svg>);

describe('jeton ayna verisi ve çözücü', () => {
  it('veri: yalnız warlock-WL-8 (Gulyabani); kucuk/ ve cinsiyet biçimleri tanınır', () => {
    expect(ayna.sinifHucre).toEqual(['warlock-WL-8']);
    expect(naturalLeft('characters/dwarf-erkek-warlock-WL-8.webp')).toBe(true);
    expect(naturalLeft('characters/kucuk/elf-kadin-warlock-WL-8.webp')).toBe(true);
    expect(naturalLeft('characters/dwarf-erkek-warlock-WL-7.webp')).toBe(false);
    expect(naturalLeft('characters/dwarf-male-warlock.webp')).toBe(false);
    expect(naturalLeft('characters/dwarf-erkek-cleric-ID8.webp')).toBe(false);
    expect(naturalLeft(undefined)).toBe(false);
  });
  it('savaş jetonu: Gulyabani doğal olarak aynalı; düşmana dönme (flip) ters çevirir (ek ayna yok); sıradan jeton yalnız flip ile', () => {
    const g = 'characters/dwarf-erkek-warlock-WL-8.webp';
    expect(svg(g)).toContain('scale(-1 1)');
    expect(svg(g, false)).toContain('scale(-1 1)');
    expect(svg(g, true)).not.toContain('scale(-1 1)');
    const n = 'characters/dwarf-erkek-warlock-WL-7.webp';
    expect(svg(n)).not.toContain('scale(-1 1)');
    expect(svg(n, true)).toContain('scale(-1 1)');
  });
  it('rozet: Gulyabani için --mirror CSS değişkeni (look ölçeğiyle birlikte)', () => {
    expect(renderToStaticMarkup(<AvatarBadge avatar={av('characters/dwarf-erkek-warlock-WL-8.webp')} size={44} eager />)).toContain('--mirror:-1');
    expect(renderToStaticMarkup(<AvatarBadge avatar={av('characters/dwarf-erkek-warlock-WL-7.webp')} size={44} eager />)).not.toContain('--mirror');
  });
});
