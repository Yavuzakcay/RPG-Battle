/** Görev SD13: büyü bileşenleri (V/S/M): 339 büyünün hepsinde SRD bileşen kaydı var, örnek büyüler doğru, malzeme ayrıntısı. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { spells } from '../data';
import { parseComponents, spellComponents, spellsWithoutComponents } from './spellComponents';
import { SpellComps, componentsInfo } from '../ui/SpellComps';
import { t } from '../i18n';

const code = (name: string): string => {
  const sp = spells.find((x) => x.name === name);
  const c = sp ? spellComponents(sp) : null;
  return c ? `${c.v ? 'V' : ''}${c.s ? 'S' : ''}${c.m ? 'M' : ''}` : '?';
};

describe('SD13 bileşen verisi', () => {
  it('339 büyünün hepsinin SRD bileşen kaydı var; bileşensiz kayıt yok', () => {
    expect(spells.length).toBeGreaterThanOrEqual(339);
    expect(spellsWithoutComponents()).toEqual([]);
    const missing = spells.filter((sp) => !spellComponents(sp)).map((sp) => sp.name);
    expect(missing).toEqual([]);
  });
  it('seçili örnekler', () => {
    expect(code('Fireball')).toBe('VSM');
    expect(code('Shield')).toBe('VS');
    expect(code('Healing Word')).toBe('V');
    expect(code('Mage Hand')).toBe('VS');
    expect(code('Light')).toBe('VM');
    // SRD 5.2.1'de Message yalnız S, M (görev metnindeki "VSM" örneği SRD'ye uymuyor; SRD esas alındı).
    expect(code('Message')).toBe('SM');
  });
  it('ayrıştırıcı: malzeme, değer, tüketim', () => {
    expect(parseComponents('V, S, M (a diamond worth 300+ GP, which the spell consumes)')).toEqual({ v: true, s: true, m: true, material: { text: 'a diamond worth 300+ GP, which the spell consumes', gp: 300, consumed: true } });
    expect(parseComponents('S')).toEqual({ v: false, s: true, m: false });
    expect(parseComponents('V, M (a firefly)').material).toEqual({ text: 'a firefly', consumed: false });
    expect(parseComponents('V, S, M (1,000+ GP)').material?.gp).toBe(1000);
  });
  it('kimlik: srd kimliği büyü kaydına eşlenir', () => {
    for (const sp of spells) if (sp.srd) expect(spellComponents(sp), sp.name).not.toBeNull();
  });
});

describe('SD13 gösterim', () => {
  const sp = (n: string) => spells.find((x) => x.name === n) as NonNullable<(typeof spells)[number]>;
  it('liste satırı: tek küçük grup, yalnız var olan bileşenler; değerli malzemede ⚠', () => {
    const shield = renderToStaticMarkup(createElement(SpellComps, { spell: sp('Shield'), compact: true }));
    expect(shield).toContain('>V<'); expect(shield).toContain('>S<'); expect(shield).not.toContain('>M<');
    const rev = renderToStaticMarkup(createElement(SpellComps, { spell: sp('Revivify'), compact: true }));
    expect(rev).toContain('⚠'); expect(rev).toContain('Değerli malzeme');
    expect(renderToStaticMarkup(createElement(SpellComps, { spell: sp('Fireball'), compact: true }))).not.toContain('⚠');
  });
  it('ⓘ metni: bileşen adları ve malzeme satırı (değer, tüketilir)', () => {
    const info = componentsInfo(sp('Revivify'));
    expect(info).toContain('V (Verbal)'); expect(info).toContain('M (Material)');
    expect(info).toContain('300+ altın'); expect(info).toContain('tüketilir');
    expect(info).toContain('büyücü odağı');
  });
  it('Sessizlikte V vurgulu ve neden yazılı', () => {
    const html = renderToStaticMarkup(createElement(SpellComps, { spell: sp('Fireball'), silenced: true }));
    expect(html).toContain('comp on hot');
    expect(html).toContain('V: sözlü, Sessizlik alanındasın');
    expect(t().battle.spellNote.barred.silence).toBe('V: sözlü, Sessizlik alanındasın');
    expect(renderToStaticMarkup(createElement(SpellComps, { spell: sp('Fireball') }))).not.toContain('hot');
  });
});
