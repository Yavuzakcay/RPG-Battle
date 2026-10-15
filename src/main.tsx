import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { applyTheme, storedTheme } from './ui/theme';

// Kayıtlı tema ilk çizimden önce uygulanır (yanıp sönme olmasın).
applyTheme(storedTheme());

const root = document.getElementById('root');
if (!root) throw new Error('#root bulunamadı');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
