// Configuración del empaquetador Vite para el front React.
import { defineConfig } from 'vite'
// Plugin oficial que habilita JSX, Fast Refresh y transformaciones de React.
import { default as pluginReact } from '@vitejs/plugin-react'

// Exporta la configuración leída por el comando `vite` / `npm run dev` / `npm run build`.
export default defineConfig({
  // Registra el plugin de React en el pipeline de Vite.
  plugins: [pluginReact()],
  server: {
    // Escucha en todas las interfaces (útil en red local o contenedores).
    host: '0.0.0.0',
    // Puerto fijo del admin: http://localhost:5173/admin (no usar otro puerto en desarrollo).
    port: 5173,
    strictPort: true,
    // Permite hostnames no listados (evita bloqueo al abrir por IP o túnel).
    allowedHosts: true,
    proxy: {
      '/api': {
        // Redirige peticiones /api al backend ASP.NET en desarrollo.
        target: process.env.VITE_API_PROXY ?? 'http://localhost:5100',
        // Reescribe el encabezado Host al del target para servidores que lo exigen.
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:5100',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa dependencias pesadas en chunks con nombre para mejor caché del navegador.
        manualChunks(id: string) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) return 'vendor-charts';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/axios')) return 'vendor-http';
        },
      },
    },
    // Sube el umbral de aviso de tamaño (KB) para evitar ruido con chunks grandes.
    chunkSizeWarningLimit: 400,
  },
})
