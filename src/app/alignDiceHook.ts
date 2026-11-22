/**
 * SD8 eki: Alignment zarı kancası. Karakter kaydedilirken bulunduğu Alignment karesinin zarı kalıcı açılır (kare değişince
 * yenisi eklenir, eskisi kalır). Alignment'ı değiştiren tembel parçalar (oluşturucu, Game Master paneli) bu modülü içe aktarır;
 * yalnız görünüm, savaşa ve kural sürümüne girmez.
 */
import { addCharacterSaveHook } from './storage';
import { withAlignDice } from '../rules/alignDice';

addCharacterSaveHook(withAlignDice);
