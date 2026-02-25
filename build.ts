import { type BuildOptions, type Plugin, build, context } from 'esbuild';
import { stat, writeFile } from 'fs/promises';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');
const isProd = !isWatch;

interface ManifestConfig {
  name: string;
  author: string;
  description: string;
  version: string;
  nodeVersion: string;
  dependencies: string[];
}

const manifest: ManifestConfig = {
  name: 'Gaia Core',
  author: 'Gaia Project',
  description: 'Gaia Core Roleplay - Framework RP',
  version: '0.0.1',
  nodeVersion: '22',
  dependencies: [],
};

const aliasPlugin: Plugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@\// }, async (args) => {
      const rel = args.path.slice(2);
      const basePath = join(process.cwd(), 'src', rel);

      const candidates = [`${basePath}.ts`, `${basePath}/index.ts`, basePath];

      for (const candidate of candidates) {
        try {
          const s = await stat(candidate);
          if (s.isFile()) return { path: candidate };
        } catch {}
      }

      return { path: `${basePath}.ts` };
    });
  },
};

const commonConfig: BuildOptions = {
  bundle: true,
  target: 'es2023',
  logLevel: 'info',
  sourcemap: !isProd,
  minify: isProd,
  drop: isProd ? ['console'] : undefined,
  plugins: [aliasPlugin],
  define: {
    __DEV__: isProd ? 'false' : 'true',
  },
  dropLabels: isProd ? ['DEV'] : undefined,
};

const clientConfig: BuildOptions = {
  ...commonConfig,
  entryPoints: ['src/client/index.ts'],
  outfile: 'dist/client.js',
  platform: 'browser',
  format: 'iife',
};

const serverConfig: BuildOptions = {
  ...commonConfig,
  entryPoints: ['src/server/index.ts'],
  outfile: 'dist/server.js',
  platform: 'node',
  target: ['node22'],
  format: 'cjs',
  packages: 'external',
};

interface ManifestFiles {
  clientFile: string;
  serverFile: string;
}

async function writeFxmanifest({ clientFile, serverFile }: ManifestFiles): Promise<void> {
  const deps =
    manifest.dependencies.length > 0
      ? `\ndependencies {\n${manifest.dependencies.map((d) => `  '${d}'`).join(',\n')}\n}\n`
      : '';

  const content = `fx_version 'cerulean'
game 'gta5'

name '${manifest.name}'
author '${manifest.author}'
description '${manifest.description}'
version '${manifest.version}'

node_version '${manifest.nodeVersion}'

client_scripts {
  '${clientFile}'
}

server_scripts {
  '${serverFile}'
}

${deps}`;

  await writeFile('fxmanifest.lua', content, 'utf8');
}

const manifestFiles: ManifestFiles = {
  clientFile: 'dist/client.js',
  serverFile: 'dist/server.js',
};

async function buildOnce(): Promise<void> {
  await build(clientConfig);
  await build(serverConfig);
  await writeFxmanifest(manifestFiles);
  console.log(`[${manifest.name}] build done (prod=${isProd})`);
}

async function watchBuild(): Promise<void> {
  const clientCtx = await context(clientConfig);
  const serverCtx = await context(serverConfig);
  await clientCtx.watch();
  await serverCtx.watch();
  await writeFxmanifest(manifestFiles);
  console.log(`[${manifest.name}] watching (dev) ... Ctrl+C to stop`);
}

if (isWatch) {
  await watchBuild();
} else {
  await buildOnce();
}
