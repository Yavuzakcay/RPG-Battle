"""Kuyruk K68b tavan betiği; Kuyruk K71a'dan beri tek kaynak `scripts/k71-dikey.py` (TAVAN tablosu oraya taşındı).

Bu dosya geriye uyum için yönlendirir: `python scripts/k68-tavan.py [--kuru]` = `python scripts/k71-dikey.py [--kuru]`.
"""
import runpy

if __name__ == '__main__':
    runpy.run_path('scripts/k71-dikey.py', run_name='__main__')
