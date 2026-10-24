import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // During development, send /api requests to the Express server.
    // The browser only ever talks to Vite, so there are no cross-origin issues.
    proxy: { '/api': 'http://localhost:3001' },
  },
});
