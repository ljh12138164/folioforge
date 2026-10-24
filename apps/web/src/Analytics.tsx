'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { siteUrl } from './seo';

const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? 'https://analytics.ljhboard.cn/script.js';
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? 'd870329a-3066-4586-b0b9-88160f29d476';
const hostname = new URL(siteUrl).hostname;

export function Analytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(!!scriptUrl && !!websiteId && location.protocol === 'https:' && location.hostname === hostname);
  }, []);
  return enabled ? <Script id="umami-analytics" src={scriptUrl} strategy="afterInteractive" data-website-id={websiteId} data-domains={hostname} data-exclude-search="true" data-exclude-hash="true" data-do-not-track="true" /> : null;
}
