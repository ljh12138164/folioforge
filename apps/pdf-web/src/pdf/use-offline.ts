import { useEffect, useState } from 'react';

export function useOffline() {
  const [status, setStatus] = useState('正在检查离线资源');
  useEffect(() => {
    let active = true;
    let ready: (() => void) | undefined;
    const update = (text: string) => { if (active) setStatus(text); };
    if (process.env.NODE_ENV !== 'production') { update('开发预览 · 离线缓存未启用'); return; }
    if (!('serviceWorker' in navigator) || !window.isSecureContext || !/^https?:$/.test(location.protocol)) {
      update('本地处理 · 当前环境不支持离线缓存'); return;
    }
    const changed = () => update(navigator.onLine ? '离线资源已就绪' : '正在离线使用');
    navigator.serviceWorker.register('/pdf-sw.js', { scope: '/', updateViaCache: 'none' }).then(registration => {
      if (!active) return;
      ready = () => {
        if (registration.active) changed();
      };
      if (registration.active) ready();
      else update('正在缓存离线资源，请保持联网');
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'activated') changed();
        if (worker.state === 'redundant') update('离线缓存未完成，请联网刷新重试');
      });
      window.addEventListener('online', ready);
      window.addEventListener('offline', ready);
    }).catch(() => update('离线缓存未完成，请联网刷新重试'));
    return () => {
      active = false;
      if (ready) { window.removeEventListener('online', ready); window.removeEventListener('offline', ready); }
    };
  }, []);
  return status;
}
