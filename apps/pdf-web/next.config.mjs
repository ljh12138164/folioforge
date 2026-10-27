/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['@pixelforge/ui'],
  webpack(config) {
    config.module.rules.push({ test: /\.wasm$/, type: 'asset/resource' });
    return config;
  },
};

export default nextConfig;
