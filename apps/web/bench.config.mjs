import config from './playwright.config.mjs';

export default { ...config, testDir: './bench', testMatch: '**/*.bench.mjs', timeout: 600_000, outputDir: './work/bench' };
