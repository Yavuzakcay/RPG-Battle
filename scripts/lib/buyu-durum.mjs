/**
 * Kuyruk K58 G7: büyü durumu sınıflandırması (339 SRD büyüsü, 0–9). BUYU-KISMI ile aynı ölçüt: tamamlama blokları
 * (a4, a6, a7, a8, s1, s2, g6) temel mekaniğin üstüne yazılır; kısmi = yaklaşıklık (`approx`) ya da yalnız Game Master notu
 * (kapsam dışı, savaş dışı, sığmayan ya da Game Master notlu değilse). Saf (betik ve test ortak).
 */
export const BLOCKS = ['a4', 'a6', 'a7', 'a8', 's1', 's2', 'g6', 'k61', 'k62'];
const BLOCK_VER = { a4: 32, a6: 35, a7: 36, a8: 37, s1: 40, s2: 41, g6: 43, k61: 44, k62: 46 };

export const mergedOf = (s) => {
  const m = s.mechanics ?? {};
  return Object.assign({}, m, ...BLOCKS.map((k) => m[k] ?? {}));
};

/** Bir büyünün durumu: 'çalışır' | 'kısmi' | 'yok' | 'savaş dışı' ve notları. */
export function classify(game) {
  if (!game) return { durum: 'yok', neden: 'oyunda kayıt yok' };
  const m = mergedOf(game);
  const last = [...BLOCKS].reverse().find((k) => game.mechanics?.[k]);
  const blok = last ? `${last} (sürüm ${BLOCK_VER[last]})` : '';
  if (m.unsupported) return { durum: 'yok', neden: String(m.unsupported), blok };
  if (m.offCombat || game.offCombat) return { durum: 'savaş dışı', neden: m.gmNote ?? '', blok, upgrade: !!game.mechanics?.upgrade };
  const partial = !!(m.approx || (m.gmNote && !m.kapsamDisi && !m.offCombat && !m.sigmayan && !m.gmNoted));
  if (partial) return { durum: 'kısmi', neden: m.approx || m.gmNote || '', blok };
  return { durum: 'çalışır', blok, ...(m.gmNoted ? { gm: m.gmNote ?? '' } : {}), ...(m.kapsamDisi ? { kapsam: m.kapsamDisi } : {}), ...(m.sigmayan ? { sigmayan: m.sigmayan } : {}) };
}

/** SRD listesi + oyun verisi → satırlar (SRD sırası: seviye, ad). */
export function durumRows(srd, game) {
  const byRef = new Map(game.map((g) => [g.srd, g]));
  return srd.slice().sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map((s) => {
    const g = byRef.get(`spells:${s.id}`);
    return { id: s.id, name: s.name, level: s.level, file: g?.file ?? '', textEmpty: !g?.text, ...classify(g) };
  });
}
