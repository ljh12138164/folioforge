import { SiteHeader } from '../../SiteHeader';
import { pageMetadata, PageSchema } from '../../seo';

export const metadata = pageMetadata('guide');
export default function GuidePage() {
  return <><PageSchema page="guide" /><div className="app-shell"><SiteHeader active="guide" /><main className="tool-guide">
    <nav aria-label="面包屑"><a href="/">首页</a><span aria-hidden="true">/</span><span>使用指南</span></nav>
    <h1>图片转换使用指南</h1>
    <p className="tool-guide-intro">PixelForge 在浏览器本地转换图片格式，批量调整画质与尺寸。文件内容无需上传服务器。</p>
    <p className="tool-guide-updated">更新于 <time dateTime="2026-10-27">2026 年 10 月 27 日</time></p>
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


    <section id="offline"><h2>本地处理、离线与隐私</h2>
      <p>图片引擎加载后在本机执行；首次加载或缺少资源时仍需要网络。图片任务、参数与转换结果保存在当前浏览器，刷新或重开可继续；清除网站数据会移除这些副本，存储不可用时使用临时工作区。</p>
      <p>文件内容与处理结果不发送到业务服务器。网站配置访问统计后，仅统计页面访问、来源及浏览器信息，排除 URL 查询参数与片段，不发送文件名或文件内容。本地预览与桌面端不启用统计。</p>
    </section>
    <footer><a href="/">返回首页</a><a href="/convert/">打开图片转换工作台</a></footer>
  </main></div></>;
}
