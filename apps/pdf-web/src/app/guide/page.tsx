import { SiteHeader } from '../../SiteHeader';
import { pageMetadata, PageSchema } from '../../seo';

export const metadata = pageMetadata('guide');
export default function GuidePage() {
  return <><PageSchema page="guide" /><div className="app-shell"><SiteHeader active="guide" /><main className="tool-guide">
    <nav aria-label="面包屑"><a href="/">首页</a><span aria-hidden="true">/</span><span>使用指南</span></nav>
    <h1>PDF 工具使用指南</h1>
    <p className="tool-guide-intro">FolioForge 页匠在浏览器本地整理 PDF、识别扫描件并导出文档。文件内容无需上传服务器。</p>
    <p className="tool-guide-updated">更新于 <time dateTime="2026-10-27">2026 年 10 月 27 日</time></p>
    <section id="pdf"><h2>怎样合并、拆分和整理 PDF？</h2>
      <ol><li>打开 <a href="/pdf/">PDF 工作台</a>，添加一份或多份 PDF，也可以添加 PNG / JPG 图片。图片会居中放入 A4 页面。</li><li>拖动页面右上角手柄调整顺序，也可使用前移、后移按钮；勾选页面后可以批量旋转或删除。需要恢复时，使用撤销或重做，最多保留 20 步。</li><li>选择“整理与合并”导出一份 PDF；选择 <a href="/pdf/?tool=extract">提取页面</a> 并输入页码范围（如 1-3, 5），仅导出所需页面；选择 <a href="/pdf/?tool=split">拆分文档</a>，将每页作为独立 PDF 打包下载。</li></ol>
      <p>单个文件最多 40 MiB，任务总计最多 100 MiB、200 页。密码加密文档、交互表单和数字签名字段暂不支持，请先使用其他工具解除这些限制。</p>
      <h3>水印、签名和扫描整理有什么区别？</h3>
      <p><a href="/pdf/?tool=watermark">文字水印</a>支持中英文；<a href="/pdf/?tool=stamp">签名与图片</a>支持手写签名和图片定位。这里的签名是写入页面的外观图片，不是数字证书签名。<a href="/pdf/?tool=duplex">双面重排</a>用于交错排列分开扫描的正反面，<a href="/pdf/?tool=blank">空白页识别</a>只给出候选，确认后才删除。</p>
      <p><a href="/pdf/?tool=layout">裁剪与排版</a>可裁去四边留白、等比适配 A4，或将 2 页、4 页合排到一张纸；<a href="/pdf/?tool=compare">视觉对比</a>提供同步翻页、滑块、透明叠加和并排查看。</p>
    </section>

    <section id="ocr"><h2>文字提取和 OCR 应该选哪个？</h2>
      <p>能直接选中文字的 PDF，优先使用 <a href="/pdf/?tool=text">提取文字</a>：按页搜索已有文字并导出 TXT。由扫描图片组成的 PDF，使用 <a href="/pdf/?tool=ocr">扫描件 OCR</a>：本地模型支持简体中文与英文，可以导出 TXT 或带可搜索文字层的 PDF。文字层会放在原页面图像之上，不会自动重排成可编辑文档。</p>
      <p>OCR 会占用处理时间与内存。模糊、倾斜、手写内容和复杂排版可能识别错误，导出后应核对数字、专有名词和页面顺序。</p>
      <h3>PDF 压缩会降低清晰度吗？</h3>
      <p><a href="/pdf/?tool=compress">压缩 PDF</a>提供两种方式：对象重存主要优化文件组织，压缩幅度取决于原文件；扫描件降采样会降低图片分辨率并重新编码，适合以图片为主的扫描件。降采样需要确认，并会移除原有文字层和链接。处理后会显示前后体积，若结果变大则回退原文件；需要可搜索内容时，可再运行 OCR。</p>
    </section>


    <section id="offline"><h2>本地处理、离线与隐私</h2>
      <p>首次访问 PDF 工作台时会缓存应用、字体和 OCR 模型。显示“离线资源已就绪”后，可断网重开工作台。PDF 页面编辑任务不跨刷新保存，刷新或关闭前请先导出结果。</p>
      <p>文件内容与处理结果不发送到业务服务器。网站配置访问统计后，仅统计页面访问、来源及浏览器信息，排除 URL 查询参数与片段，不发送文件名或文件内容。本地预览与桌面端不启用统计。</p>
    </section>
    <footer><a href="/">返回首页</a><a href="/pdf/">打开 PDF 工作台</a></footer>
  </main></div></>;
}
