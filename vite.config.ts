// import tailwindcss from '@tailwindcss/vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';
// import {defineConfig, loadEnv} from 'vite';

// export default defineConfig(({mode}) => {
//   const env = loadEnv(mode, '.', '');
//   return {
//     plugins: [react(), tailwindcss()],
//     define: {
//       'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
//     },
//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, '.'),
//       },
//     },
//     server: {
//       // HMR is disabled in AI Studio via DISABLE_HMR env var.
//       // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
//       hmr: process.env.DISABLE_HMR !== 'true',
//     },
//   };
// });

// import tailwindcss from '@tailwindcss/vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';
// import {defineConfig, loadEnv} from 'vite';

// export default defineConfig(({mode}) => {
//   // __dirname ensures .env is always loaded from the project root folder
//   const env  = loadEnv(mode, __dirname, '');
//   return {
//     plugins: [react(), tailwindcss()],
//     define: {
//       'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
//     },
//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, '.'),
//       },
//     },
//     server: {
//       hmr: process.env.DISABLE_HMR !== 'true',
//     },
//   };
// });

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});