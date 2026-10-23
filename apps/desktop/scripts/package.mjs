import { packager } from '@electron/packager';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metadata = JSON.parse(await readFile(join(desktop, 'package.json'), 'utf8'));
await mkdir(join(desktop, 'work'), { recursive: true });
const stage = await mkdtemp(join(desktop, 'work', 'package-'));
try {
  await cp(join(desktop, 'src'), join(stage, 'src'), { recursive: true });
  await cp(resolve(desktop, '../web/out'), join(stage, 'web'), { recursive: true });
  await writeFile(join(stage, 'package.json'), JSON.stringify({ name: 'pixelforge', productName: 'PixelForge', version: metadata.version, main: metadata.main, description: metadata.description, author: metadata.author }));
  const paths = await packager({ dir: stage, out: join(desktop, 'dist'), name: 'PixelForge', appBundleId: 'app.pixelforge.desktop', platform: process.platform, arch: process.arch,
    electronVersion: metadata.devDependencies.electron, asar: true, overwrite: true, prune: false,
    download: process.env.ELECTRON_MIRROR ? { mirrorOptions: { mirror: process.env.ELECTRON_MIRROR } } : undefined,
    win32metadata: { CompanyName: 'PixelForge', FileDescription: metadata.description, ProductName: 'PixelForge' },
  });
  console.log('Desktop package:', paths.join('\n'));
} finally {
  // stage was created inside this app's work directory, never a user-supplied path.
  if (dirname(stage) === join(desktop, 'work')) await rm(stage, { recursive: true, force: true });
}
