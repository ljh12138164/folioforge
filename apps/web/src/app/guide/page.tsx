import { SiteHeader } from '../../SiteHeader';
import { pageMetadata, PageSchema } from '../../seo';

export const metadata = pageMetadata('guide');

export default function GuidePage() {
  return <><PageSchema page="guide" /><div className="app-shell"><SiteHeader active="guide" /><main className="tool-guide">
    <nav aria-label="面包屑"><a href="/">工具箱</a><span aria-hidden="true">/</span><span>使用指南</span></nav>
    <h1>PDF 与图片工具使用指南</h1>
    <p className="tool-guide-intro">FolioForge 页匠是一套在浏览器本地运行的 PDF 与图片工具。你可以整理文档、识别扫描件、转换图片格式并下载结果，文件内容无需上传服务器。</p>
    <p className="tool-guide-updated">更新于 <time dateTime="2026-10-25">2026 年 10 月 25 日</time></p>
    <nav className="tool-guide-contents" aria-label="指南目录"><a href="#pdf">整理 PDF</a><a href="#ocr">OCR 与压缩</a><a href="#images">图片转换</a><a href="#svg">SVG 描摹</a><a href="#offline">离线与隐私</a></nav>

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

    <section id="images"><h2>怎样转换 HEIC、WebP 和其他图片格式？</h2>
      <ol><li>进入 <a href="/convert/">图片转换工作台</a>，选择、拖入或粘贴图片。</li><li>选择目标格式；有损编码可以调整画质。宽、高表示最大边界，始终保持比例，只缩小、不放大。只填一边时另一边自动按比例计算。</li><li>查看原图和实际转换结果的滑块对照、分辨率与文件体积，再单张下载；批量转换完成后可下载 ZIP。</li></ol>
      <p>支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、HEIC、QOI、TGA、PSD、JPEG 2000、EXR、SVG 共 16 种导出格式。<a href="/images/">图片示例页</a>可直接试用转换与参数设置。</p>
      <div className="tool-guide-table"><table><caption>图片格式与处理边界</caption><thead><tr><th scope="col">类型</th><th scope="col">支持方式与限制</th></tr></thead><tbody>
        <tr><th scope="row">HEIC / HEIF</th><td>HEIC 支持导入与导出，HEIF 仅导入；HEIC 导出会合成透明背景。</td></tr>
        <tr><th scope="row">SVG</th><td>导入时转为位图；导出时将图像描摹为矢量路径，最多 400 万像素。</td></tr>
        <tr><th scope="row">PSD / 动图 / HDR</th><td>PSD 只保留合成图；仅处理静态图像，不保留动画帧；不保证 EXR 等格式的 HDR 色深与色彩保真。</td></tr>
        <tr><th scope="row">尺寸与体积</th><td>单张最多 40 MB、4800 万像素；ICO 最长边 256px。转换后体积可能增大，以实际结果为准。</td></tr>
      </tbody></table></div>
    </section>

    <section id="svg"><h2>SVG 描摹和调整尺寸怎么配合？</h2>
      <p>SVG 导出会先按设定尺寸缩小输入图像，再用 Rust / WebAssembly 描摹出路径。比如 2172 × 724 的图片，最大宽度填 640 时，先缩为约 640 × 213，再生成 SVG。尺寸越小，参与描摹的细节越少；生成的路径可以继续放大，但不会恢复缩小前已经丢失的细节。</p>
      <p>彩色图标、黑白线稿和照片描摹对应不同的描摹方式。图标与线稿通常更适合矢量化；照片会得到近似色块和轮廓。透明与半透明区域会先合成到所选背景色，不保留原 SVG 的可编辑文字、图层或滤镜结构。</p>
    </section>

    <section id="offline"><h2>断网后能用吗？文件会保存在哪里？</h2>
      <p>PDF 工作台首次访问时会缓存应用、字体和本地 OCR 模型。底部显示“离线资源已就绪”后，可断网重开 PDF 工作台。图片转换在引擎加载后于本机执行；首次加载或缺少资源时仍需要网络，请不要把“本地处理”理解为首次访问就能完全断网。</p>
      <p>图片任务与转换结果默认保存在当前浏览器的本机存储中。清空任务或清除网站数据会删除这些副本；浏览器存储不可用时会进入临时工作区。PDF 页面编辑任务不跨刷新保存，刷新或关闭前请先导出结果。</p>
      <h3>网站会上传我的文件吗？</h3>
      <p>导入的 PDF、图片、OCR 内容和转换结果都在浏览器本地处理，不发送到业务服务器。正式网站使用 Umami 统计页面访问、来源及浏览器信息，排除 URL 查询参数与片段，不发送文件名、文件内容或转换结果。本地预览和桌面端不启用该统计。</p>
      <p>这份指南描述当前实现的支持范围。OCR 识别、图片描摹、空白页检测和压缩均有各自的限制，请先预览结果，再决定是否采用。</p>
    </section>
    <footer><a href="/">返回工具箱</a><a href="/pdf/">打开 PDF 工作台</a><a href="/convert/">打开图片转换</a></footer>
  </main></div></>;
}
