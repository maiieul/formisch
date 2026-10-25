import { qwikVite } from '@qwik.dev/core/optimizer';
import { qwikRouter } from '@qwik.dev/router/vite';
import rehypeShiki from '@shikijs/rehype/core';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import rehypeExternalLinks from 'rehype-external-links';
import { getSingletonHighlighter } from 'shiki';
import shikiAngularHtml from 'shiki/langs/angular-html.mjs';
import shikiAngularTypeScript from 'shiki/langs/angular-ts.mjs';
import shikiBash from 'shiki/langs/bash.mjs';
import shikiJsonc from 'shiki/langs/jsonc.mjs';
import shikiSvelte from 'shiki/langs/svelte.mjs';
import shikiTypeScript from 'shiki/langs/ts.mjs';
import shikiTypeScriptX from 'shiki/langs/tsx.mjs';
import shikiVue from 'shiki/langs/vue.mjs';
import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const highlighter = await getSingletonHighlighter();

await Promise.all([
  highlighter.loadLanguage(
    shikiTypeScript,
    shikiTypeScriptX,
    shikiBash,
    shikiJsonc,
    shikiSvelte,
    shikiVue,
    shikiAngularHtml,
    shikiAngularTypeScript
  ),
  highlighter.loadTheme(
    JSON.parse(readFileSync('shiki/pace-theme-light+.json', 'utf8')),
    JSON.parse(readFileSync('shiki/pace-theme-dark.json', 'utf8'))
  ),
]);

/**
 * Provides the hrefs of all docs menus as a `Set` via the `virtual:menu-hrefs`
 * module, so that the client bundle only contains the hrefs instead of the
 * full menu modules.
 *
 * @returns The Vite plugin.
 */
function menuHrefs(): Plugin {
  const virtualId = 'virtual:menu-hrefs';
  const resolvedId = `\0${virtualId}`;
  const routesDir = 'src/routes';
  return {
    name: 'menu-hrefs',
    resolveId(id) {
      if (id === virtualId) {
        return resolvedId;
      }
    },
    load(id) {
      if (id === resolvedId) {
        // Read all menu files and extract their absolute link hrefs
        const hrefs = new Set<string>();
        for (const file of readdirSync(routesDir, { recursive: true })) {
          if (typeof file === 'string' && file.endsWith('menu.md')) {
            const content = readFileSync(join(routesDir, file), 'utf8');
            for (const match of content.matchAll(/\]\((\/[^)\s]+)\)/g)) {
              hrefs.add(match[1]);
            }
          }
        }
        return `export default new Set(${JSON.stringify([...hrefs])});`;
      }
    },
    hotUpdate({ file, modules }) {
      // Invalidate and update virtual module when a menu file changes
      if (file.endsWith('menu.md')) {
        const module = this.environment.moduleGraph.getModuleById(resolvedId);
        if (module) {
          this.environment.moduleGraph.invalidateModule(module);
          return [...modules, module];
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      qwikRouter({
        mdxPlugins: {
          remarkGfm: true,
          rehypeSyntaxHighlight: false,
          rehypeAutolinkHeadings: true,
        },
        mdx: {
          providerImportSource: '~/hooks/useMDXComponents.tsx',
          rehypePlugins: [
            [rehypeExternalLinks, { rel: 'noreferrer', target: '_blank' }],
            [
              rehypeShiki,
              highlighter,
              {
                themes: {
                  light: 'Pace Light',
                  dark: 'Pace Dark',
                },
              },
            ],
          ],
        },
      }),
      qwikVite({
        experimental: ['valibot'],
      }),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      menuHrefs(),
      tailwindcss(),
    ],
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    },
  };
});
