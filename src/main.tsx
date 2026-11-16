import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { seedDefaultPlan } from './lib/seed';
import './styles.css';

// Erst den festen Plan eintragen (nur beim allerersten Start), dann die App zeigen.
// Schlägt das fehl, startet die App trotzdem.
seedDefaultPlan()
  .catch((error) => console.error('Plan konnte nicht eingetragen werden', error))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
