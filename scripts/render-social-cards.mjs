import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../apps/image-web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [app, name, title, features, domain] of [
    ['pdf-web', 'FolioForge / 页匠', 'PDF 工具箱', '合并拆分 · 中英文 OCR · 水印签名 · 压缩排版', 'pdf.ljhboard.cn'],
    ['image-web', 'PixelForge', '图片格式转换', '16 种导出格式 · 批量转换 · 画质尺寸 · SVG 描摹', 'img.ljhboard.cn'],
  ]) {
    await page.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
      * { box-sizing: border-box; } body { margin: 0; padding: 54px 72px 30px; background: #f7f3ec; color: #26201b; font-family: "Segoe UI", "Microsoft YaHei", sans-serif; }
      header { padding-bottom: 24px; border-bottom: 2px solid #e6ddd1; font-size: 34px; font-weight: 700; }
      h1 { margin: 52px 0 16px; font-size: 72px; letter-spacing: -2px; } p { margin: 0; color: #6c5f56; font-size: 36px; }
      aside { margin-top: 44px; padding: 24px; background: white; border-radius: 16px; font-size: 28px; }
      footer { margin-top: 58px; padding-top: 22px; border-top: 2px solid #e6ddd1; color: #c2451b; font-size: 24px; }
      </style><header>${name}</header><h1>${title}</h1><p>本地处理，文件无需上传</p><aside>${features}</aside><footer>${domain}</footer></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`../apps/${app}/public/social-card.png`, import.meta.url)) });
    console.log(`${app}: sharing card rendered.`);
  }
} finally { await browser.close(); }
