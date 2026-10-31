/**
 * Kuyruk 24: simülasyonda harita mekaniklerini açıp kapatma. `--kural-kapali tentFire,boneRise` ve `--kural-acik riverBlocked`
 * (ya da ortam değişkenleri KURAL_KAPALI / KURAL_ACIK; paralel süreçlere geçer). Kimlikler `data/kural-kontrol.json`.
 * Bayrakları argüman listesinden çıkarır.
 */
import { RULE_CONTROL, setDefaultRuleToggles } from '../battle/ruleControl';

export function applyRuleFlags(args: string[], env: Record<string, string | undefined>): string[] {
  const toggles: Record<string, boolean> = {};
  let rest = args;
  for (const [flag, envKey, on] of [['--kural-kapali', 'KURAL_KAPALI', false], ['--kural-acik', 'KURAL_ACIK', true]] as const) {
    const i = rest.indexOf(flag);
    const v = i >= 0 ? rest[i + 1] : env[envKey];
    if (i >= 0) rest = rest.filter((_, j) => j !== i && j !== i + 1);
    for (const id of (v ?? '').split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!RULE_CONTROL[id]) throw new Error(`Bilinmeyen harita mekaniği: ${id} (${Object.keys(RULE_CONTROL).join(', ')})`);
      toggles[id] = on;
    }
  }
  if (Object.keys(toggles).length) setDefaultRuleToggles(toggles);
  return rest;
}
