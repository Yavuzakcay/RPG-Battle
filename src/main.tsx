import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { applyTheme, storedTheme } from './ui/theme';
import { ensureLang } from './i18n';

// Kayıtlı tema ilk çizimden önce uygulanır (yanıp sönme olmasın).
applyTheme(storedTheme());

const root = document.getElementById('root');
if (!root) throw new Error('#root bulunamadı');
// F1: İngilizce metinler ayrı parça; kayıtlı dil EN ise ilk çizimden önce yüklenir (Türkçede beklemez).
void ensureLang().then(() => createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
));
