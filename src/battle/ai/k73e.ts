/** Kuyruk K73e (kural sürümü 65+): YZ kazma ve dalış parametreleri (`data/yapay-zeka.json` `k73e`). */
import aiData from '../../../data/yapay-zeka.json';

export const K73E = (aiData as unknown as { k73e: { kazmaOrani: number; kacisCan: number; tehditMenzil: number; nefesOrani: number } }).k73e;
