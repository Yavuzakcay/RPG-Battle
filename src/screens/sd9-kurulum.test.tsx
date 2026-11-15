/** SD9: Game Master kurulum sadeleştirmesi: temalı mekanik grupları, grup aç/kapat, Gelişmiş katı, Find Familiar metinleri. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import kontrol from '../../data/kural-kontrol.json';
import gruplar from '../../data/kurulum-gruplari.json';
import { MapRulesPanel, groupOf } from '../ui/gm/MapRulesPanel';
import { RoomRules } from '../ui/settings/RoomRules';
import { t } from '../i18n';

const rules = Object.keys((kontrol as { rules: Record<string, unknown> }).rules);
const ids = new Set(gruplar.gruplar.map((g) => g.id));

describe('SD9 veri', () => {
  it('her kural bir gruba düşer (listede yoksa harita); grup kimlikleri geçerli; kaldırma adayları gerçek kural', () => {
    for (const id of rules) expect(ids.has(groupOf(id)), id).toBe(true);
    for (const [id, g] of Object.entries(gruplar.kural)) { expect(rules, id).toContain(id); expect(ids.has(g), id).toBe(true); }
    for (const id of gruplar.kaldirmaAdayi) expect(rules, id).toContain(id);
    expect(gruplar.gruplar.map((g) => g.id)).toEqual(['yuzey', 'sinif', 'yz', 'buyu', 'harita', 'diger']);
  });
});

describe('SD9 arayüz', () => {
  it('harita mekanikleri temalı gruplarda; her grupta aç/kapat; kapalı katman', () => {
    const html = renderToStaticMarkup(<MapRulesPanel mapId="orman" variantId="gunduz" toggles={{}} params={{}} onChange={() => {}} />);
    if (html === '') return; // haritada denetlenen kural yoksa panel yok
    expect(html).toContain('rule-group');
    expect(html).toContain('Grubu aç');
    expect(html).toContain('Grubu kapat');
    expect(html).not.toMatch(/<details[^>]* open/);
  });
  it('oda kuralları kurulumda (SD8) ve Find Familiar metinleri', () => {
    expect(renderToStaticMarkup(<RoomRules />)).toContain('Oda kuralları');
    const U = t().setupUi;
    expect(U.familiarForm).toBe('Hayvan biçimi');
    expect(U.familiarType).toBe('Ruh türü');
    expect(U.familiarKind.celestial).toContain('Göksel');
    expect(U.familiarKind.fey).toContain('Peri');
    expect(U.familiarKind.fiend).toContain('İblis');
    expect(U.familiarKindNote).toContain('statları değiştirmez');
  });
});
