import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startCloud } from './cloud';
import './styles.css';

// Erst alte Daten umwandeln und (ohne Anmeldung) den festen Plan eintragen, dann die App zeigen.
// Schlägt das fehl, startet die App trotzdem.
startCloud()
  .catch((error: unknown) => console.error('Start der Datenbank fehlgeschlagen', error))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
