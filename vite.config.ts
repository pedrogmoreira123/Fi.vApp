import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        "@components": path.resolve(import.meta.dirname, "client", "src", "components"),
        "@pages": path.resolve(import.meta.dirname, "client", "src", "pages"),
        "@hooks": path.resolve(import.meta.dirname, "client", "src", "hooks"),
        "@services": path.resolve(import.meta.dirname, "client", "src", "services"),
        "@contexts": path.resolve(import.meta.dirname, "client", "src", "contexts"),
        "@types": path.resolve(import.meta.dirname, "client", "src", "types"),
        "@utils": path.resolve(import.meta.dirname, "client", "src", "utils"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            utils: ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_WS_URL || 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});
