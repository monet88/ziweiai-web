/**
 * Helper hỗ trợ chia sẻ đa kênh mạng xã hội (Facebook, Zalo, Telegram, Web Share)
 * tự động đính kèm mã giới thiệu (Referral link) để tối ưu hóa phễu viral.
 */

export function buildShareUrl(path: string, referralCode?: string | null): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(cleanPath, origin);
  
  if (referralCode) {
    url.searchParams.set('ref', referralCode);
  }
  return url.toString();
}

export function openFacebookShare(url: string, quote?: string): void {
  const shareUrl = new URL('https://www.facebook.com/sharer/sharer.php');
  shareUrl.searchParams.set('u', url);
  if (quote) {
    shareUrl.searchParams.set('quote', quote);
  }
  window.open(shareUrl.toString(), '_blank', 'noopener,noreferrer,width=600,height=500');
}

export function openZaloShare(url: string): void {
  const shareUrl = new URL('https://sp.zalo.me/share_inline');
  shareUrl.searchParams.set('link', url);
  window.open(shareUrl.toString(), '_blank', 'noopener,noreferrer,width=600,height=500');
}

export function openTelegramShare(url: string, text?: string): void {
  const shareUrl = new URL('https://t.me/share/url');
  shareUrl.searchParams.set('url', url);
  if (text) {
    shareUrl.searchParams.set('text', text);
  }
  window.open(shareUrl.toString(), '_blank', 'noopener,noreferrer,width=600,height=500');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
