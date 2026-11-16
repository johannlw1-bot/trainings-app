import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { db } from './db';
import './styles.css';

// Datenbank gleich beim Start anlegen, damit Schemafehler sofort auffallen.
db.open().catch((error) => console.error('Datenbank konnte nicht geöffnet werden', error));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
