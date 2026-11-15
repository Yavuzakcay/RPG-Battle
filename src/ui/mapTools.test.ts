/** Kuyruk KQ5 GH1: tek aktif harita aracı: yüzey aracı açıkken hedef şeridine geçince dokunuş hedefe gider. */
import { describe, expect, it } from 'vitest';
import { activeTool, hexOwner, openGoalTool, openModeTool, toolbarShown, type ToolState } from './mapTools';
import { addDraftGoal, clearHexes, hasMapGoals, toggleHex, draftFromGoals } from '../oda/hedef';
import { goalPreset } from './gm/GoalsPanel';

const idle: ToolState = { mode: 'idle', goalPick: null };

describe('GH1 aktif araç modeli', () => {
  it('regresyon: yüzey aracı açıkken hedef şeridine geçilince tıklama hedefe gider, yüzey çubuğu kapanır', () => {
    let s = openModeTool(idle, 'gmSurface');
    expect(hexOwner(s, true)).toBe('surface');
    expect(toolbarShown(s, 'surface')).toBe(true);
    s = openGoalTool(s, { id: 'g1', how: 'hex' });
    expect(s).toEqual({ mode: 'idle', goalPick: { id: 'g1', how: 'hex' } });
    expect(activeTool(s)).toBe('goal');
    expect(hexOwner(s, true)).toBe('goal-hex');
    expect(toolbarShown(s, 'surface')).toBe(false); expect(toolbarShown(s, 'object')).toBe(false);
    // hedef açıkken yüzey kipi elle zorlansa bile (eski hata) dokunuş yine hedefe gider
    expect(hexOwner({ mode: 'gmSurface', goalPick: { id: 'g1', how: 'hex' } }, true)).toBe('goal-hex');
    expect(toolbarShown({ mode: 'gmSurface', goalPick: { id: 'g1', how: 'hex' } }, 'surface')).toBe(false);
  });
  it('biri açılınca ötekiler kapanır: nesne ↔ yüzey ↔ hedef; Bitti eski duruma döner', () => {
    let s = openModeTool(idle, 'gmObject');
    expect(activeTool(s)).toBe('object');
    s = openModeTool(s, 'gmSurface');
    expect(activeTool(s)).toBe('surface');
    s = openGoalTool(s, { id: 'g2', how: 'place' }); // nesne yerleştir: nesne aracı hedef için
    expect(s.mode).toBe('gmObject'); expect(activeTool(s)).toBe('object'); expect(toolbarShown(s, 'object')).toBe(true);
    s = openGoalTool(s, null);
    expect(s).toEqual({ mode: 'idle', goalPick: null }); expect(activeTool(s)).toBe('creature');
    s = openModeTool(openGoalTool(idle, { id: 'g1', how: 'obj' }), 'gmObject');
    expect(s.goalPick).toBeNull();
  });
  it('kurulum dışında hedef seçimi dokunuşu almaz; ağırlık aracı kendi sahibi', () => {
    expect(hexOwner({ mode: 'idle', goalPick: { id: 'g', how: 'hex' } }, false)).toBe('default');
    expect(hexOwner({ mode: 'gmObject', goalPick: null }, true, 'weight')).toBe('weight');
    expect(hexOwner({ mode: 'gmObject', goalPick: null }, true)).toBe('object');
  });
});

describe('GH1 hedef taslağı: Kaç ön ayarı ve elle düzenleme', () => {
  it('Kaç (doğu kenarı) ön ayarı kenar altıgenlerini doldurur, haritada düzenlenebilir sayılır; elle ekle/çıkar/temizle', () => {
    const d = draftFromGoals(goalPreset('escape', { cols: 15, rows: 7 }));
    expect(d?.list[0]?.hexes).toHaveLength(7);
    expect(d?.list[0]?.hexes?.every((h) => h.col === 14)).toBe(true);
    expect(hasMapGoals(d)).toBe(true); // şerit hazır hedefte de açılır
    let e = toggleHex(d!, d!.list[0]!.id, { col: 14, row: 0 }); // tekrar dokununca kalkar
    expect(e.list[0]?.hexes).toHaveLength(6);
    e = toggleHex(e, e.list[0]!.id, { col: 13, row: 2 }); // elle yeni
    expect(e.list[0]?.hexes).toHaveLength(7);
    expect(clearHexes(e, e.list[0]!.id).list[0]?.hexes).toBeUndefined();
    expect(hasMapGoals(addDraftGoal(null, 'defeat'))).toBe(false);
    expect(hasMapGoals(addDraftGoal(null, 'reach'))).toBe(true);
  });
});
