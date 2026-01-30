import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    middlewareMode: false,
    middleware: [
      // Handle /buy-now route to serve buy-now.html
      (req, res, next) => {
        if (req.url === '/buy-now' || req.url === '/buy-now/') {
          req.url = '/buy-now.html';
        }
        next();
      }
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
