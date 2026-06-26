import { Fragment, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/animations.css'
import './styles/globals.css'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
const RootWrapper = import.meta.env.DEV ? Fragment : StrictMode;
root.render(
  <RootWrapper>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </RootWrapper>
);

// Register service worker only in production to avoid interfering with Vite HMR in development.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('✅ Service Worker registered:', reg.scope),
        (err) => console.warn('⚠️ Service Worker registration failed:', err)
      );
      return;
    }

    // In development, remove any previously-registered SW so fetch/HMR stays stable.
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log('🧹 Development mode: service workers unregistered');
    } catch (err) {
      console.warn('⚠️ Failed to unregister service workers in development:', err);
    }
  });
}
