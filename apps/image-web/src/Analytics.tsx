'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { siteUrl } from './seo';

const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? 'https://analytics.ljhboard.cn/script.js';
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '69bf35a5-ccf1-4dca-b709-d128d73aa44f';
const hostname = new URL(siteUrl).hostname;

export function Analytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(!!scriptUrl && !!websiteId && location.protocol === 'https:' && location.hostname === hostname);
  }, []);
  return enabled ? <Script id="umami-analytics" src={scriptUrl} defer strategy="afterInteractive" data-website-id={websiteId} data-domains={hostname} data-exclude-search="true" data-exclude-hash="true" data-do-not-track="true" /> : null;
}
