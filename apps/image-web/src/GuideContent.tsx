'use client';

import { SiteHeader } from './SiteHeader';
import { useImageI18n } from './i18n';

export function GuideContent() {
  const { t } = useImageI18n();
  const g = t.guidePage;

  return (
    <div className="app-shell">
      <SiteHeader active="guide" />
      <main className="tool-guide">
        <nav aria-label="面包屑">
          <a href="/">{g.breadcrumbHome}</a>
          <span aria-hidden="true">/</span>
          <span>{g.breadcrumbGuide}</span>
        </nav>
        <h1>{g.title}</h1>
        <p className="tool-guide-intro">{g.intro}</p>
        <p className="tool-guide-updated">
          {g.updatedAt} <time dateTime="2026-10-27">2026-10-27</time>
        </p>

        <section id="images">
          <h2>{g.sec1Title}</h2>
          <ol>
            <li>
              <a href="/convert/">{g.openWorkbench}</a>，{g.sec1Step1}
            </li>
            <li>{g.sec1Step2}</li>
            <li>{g.sec1Step3}</li>
          </ol>
          <p>
            {g.sec1Formats} <a href="/images/">{g.samplePageLink}</a>
          </p>
          <div className="tool-guide-table">
            <table>
              <caption>{g.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{g.colType}</th>
                  <th scope="col">{g.colLimits}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">HEIC / HEIF</th>
                  <td>{g.rowHeic}</td>
                </tr>
                <tr>
                  <th scope="row">SVG</th>
                  <td>{g.rowSvg}</td>
                </tr>
                <tr>
                  <th scope="row">PSD / 动图 / HDR</th>
                  <td>{g.rowPsd}</td>
                </tr>
                <tr>
                  <th scope="row">尺寸与体积</th>
                  <td>{g.rowSize}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="svg">
          <h2>{g.sec2Title}</h2>
          <p>{g.sec2P1}</p>
          <p>{g.sec2P2}</p>
        </section>

        <section id="offline">
          <h2>{g.sec3Title}</h2>
          <p>{g.sec3P1}</p>
          <p>{g.sec3P2}</p>
        </section>

        <footer>
          <a href="/">{g.backHome}</a>
          <a href="/convert/">{g.openWorkbench}</a>
        </footer>
      </main>
    </div>
  );
}
