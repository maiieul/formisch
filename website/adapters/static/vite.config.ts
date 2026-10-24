import { ssgAdapter } from '@qwik.dev/router/adapters/ssg/vite';
import { extendConfig } from '@qwik.dev/router/vite';
import { existsSync, readFileSync } from 'node:fs';
import baseConfig from '../../vite.config.ts';

/**
 * Returns the hash of the client manifest created by the client build.
 *
 * Note: SSG needs this hash to write `routeLoader$` data files that match the
 * URLs requested during client navigation. Qwik Router currently does not pass
 * it to SSG automatically and falls back to `dev` instead.
 *
 * @returns The manifest hash.
 */
function getManifestHash(): string {
  const manifestPath = 'dist/q-manifest.json';
  if (!existsSync(manifestPath)) {
    throw new Error(
      `Missing ${manifestPath}. Run the client build before the server build.`
    );
  }
  return JSON.parse(readFileSync(manifestPath, 'utf8')).manifestHash;
}

export default extendConfig(
  // @ts-ignore
  baseConfig,
  () => {
    return {
      build: {
        ssr: true,
        rollupOptions: {
          input: ['src/entry.ssr.tsx'],
        },
      },
      plugins: [
        ssgAdapter({
          origin: 'https://formisch.dev',
          sitemapOutFile: null,
          // @ts-ignore
          manifest: { manifestHash: getManifestHash() },
        }),
      ],
    };
  }
);
