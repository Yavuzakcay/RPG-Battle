import { loadClassData, loadMonsters } from './src/data';
await Promise.all([loadMonsters(), loadClassData()]);
const b = await import('./src/sim/balance');
const { characterProblems } = await import('./src/rules/builder');
const { classKit } = await import('./src/rules/classFeatures');
const { spells } = await import('./src/data');
for (const kind of ['standart', 'barbar'] as const) {
  b.setPartyKind(kind);
  for (const lv of [1, 3, 5]) for (const s of b.partyAt(lv)) {
    const k = classKit(s.classId, lv, s.subclassId) as any;
    const sp = (s.spellNames ?? []).map((n) => spells.find((x) => x.name === n)!);
    console.log(kind, lv, s.name, 'cantrip', sp.filter((x) => x.level === 0).length, 'prep', sp.filter((x) => x.level > 0).length,
      Object.keys(k).filter((x)=>/cantrip|prepared|spell/i.test(x)).map((x)=>x+'='+JSON.stringify(k[x])).join(' '),
      characterProblems({ id: 'x', sheet: s, method: 'standard', classSkills: s.skills ?? [], otherSkills: [] } as any).join('; '));
  }
}
