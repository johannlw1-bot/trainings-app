import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Im WLAN erreichbar, damit die App auf dem iPhone getestet werden kann.
    host: true,
    port: 5173,
  },
});
