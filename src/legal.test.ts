import { describe, it, expect } from 'vitest';
import notice from '../NOTICE?raw';
import readme from '../README.md?raw';
import about from '../public/atiflar.txt?raw';

/** SRD 5.2.1'in ilk sayfasındaki atıf metni, olduğu gibi (CC-BY-4.0 şartı). */
const ATTRIBUTION =
  'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the ' +
  'Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative ' +
  'Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';

describe('SRD 5.2.1 atfı', () => {
  it.each([
    ['NOTICE', notice],
    ['README.md', readme],
    ['public/atiflar.txt', about],
  ])('%s atıf metnini birebir içerir', (_name, text) => {
    expect(text).toContain(ATTRIBUTION);
  });
  it('Wizards adı atıf metni dışında geçmez', () => {
    for (const text of [notice, readme, about]) {
      expect(text.split('Wizards').length - 1).toBe(1);
    }
  });
});
