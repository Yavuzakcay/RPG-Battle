/** Önizleme: sınıf jeton tabloları (yalnız geliştirme). */
import barbarian from '../../data/barbarian-jeton.json';
import bard from '../../data/bard-jeton.json';
import cleric from '../../data/cleric-jeton.json';
import druid from '../../data/druid-jeton.json';
import fighter from '../../data/fighter-jeton.json';
import monk from '../../data/monk-jeton.json';
import paladin from '../../data/paladin-jeton.json';
import ranger from '../../data/ranger-jeton.json';
import rogue from '../../data/rogue-jeton.json';
import sorcerer from '../../data/sorcerer-jeton.json';
import warlock from '../../data/warlock-jeton.json';
import wizard from '../../data/wizard-jeton.json';
type Tablo = { altSiniflar: Record<string, string>; formlar?: Record<string, { esik: number; ikinci: string }> };
const hepsi: Record<string, Tablo> = { barbarian, bard, cleric, druid, fighter, monk, paladin, ranger, rogue, sorcerer, warlock, wizard };
export default hepsi;
