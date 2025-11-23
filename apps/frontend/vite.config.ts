import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Suppress file watcher errors on Windows (known issue with special characters in paths)
if (process.platform === 'win32') {
  const originalListeners = process.listeners('uncaughtException');
  process.removeAllListeners('uncaughtException');
  
  process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
    // Suppress file watcher errors - they're non-fatal on Windows
    if (error.code === 'UNKNOWN' && error.syscall === 'watch') {
      console.warn('⚠️  File watcher error suppressed (known Windows issue with special characters in paths)');
      return;
    }
    // Call original listeners for other errors
    originalListeners.forEach((listener) => {
      if (typeof listener === 'function') {
        try {
          (listener as (error: Error) => void)(error);
        } catch {
          // Ignore errors in error handlers
        }
      }
    });
  });
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 3001,
    host: true, // Allow external connections
    watch: {
      // Ignore file watcher errors on Windows with special characters in paths
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      // Use polling on Windows to avoid file watcher issues with special characters
      usePolling: process.platform === 'win32',
      interval: 1000,
      binaryInterval: 3000,
    },
    // Suppress file watcher errors
    fs: {
      strict: false,
      allow: ['..'],
    },
    proxy: {
      // Proxy GraphQL requests to backend (backend manages Hasura)
      '/graphql': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Direct Hasura access (if needed for admin operations)
      '/v1/graphql': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Proxy REST API requests to backend
      '/employees': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/departments': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/constraints': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/schedules': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/shifts': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/optimization': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Logging configuration
  logLevel: 'info', // Show info messages including server startup
  clearScreen: false, // Keep previous output visible
});
