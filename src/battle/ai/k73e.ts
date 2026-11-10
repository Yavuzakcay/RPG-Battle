/** Kuyruk K73e (kural sürümü 65+): YZ kazma ve dalış parametreleri (`data/yapay-zeka.json` `k73e`). */
import aiData from '../../../data/yapay-zeka.json';

export const K73E = (aiData as unknown as { k73e: { kazmaOrani: number; kacisCan: number; tehditMenzil: number; nefesOrani: number } }).k73e;

/** Kuyruk K73f (kural sürümü 66+): YZ yer altında uzaklaşma (`data/yapay-zeka.json` `k73f`). */
export const K73F = (aiData as unknown as { k73f: { kacisCan: number } }).k73f;
