import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { simpleImageOptimizationPlugin } from "./vite-plugin-simple-image-optimization.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    simpleImageOptimizationPlugin({
      quality: 80,
      maxWidth: 800,
      enabled: process.env.NODE_ENV === 'production'
    })
  ],
  server: {
    port: 5196,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
      'recharts'
    ]
  },
});
