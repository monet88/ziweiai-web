/**
 * Danh sách các domain email tạm thời / rác phổ biến dùng để ngăn chặn bot Sybil attack.
 */
export const DISPOSABLE_EMAIL_DOMAINS: readonly string[] = [
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10mail.org',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'tempail.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'grr.la',
  'sharklasers.com',
  'pokemail.net',
  'spam4.me',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'maildrop.cc',
  'mytemp.email',
  'mohmal.com',
  'burnermail.io',
  'crazymailing.com',
  'nada.ltd',
  'inboxkitten.com',
  'generator.email',
  'fakemailgenerator.com',
  'emailondeck.com',
  'tempr.email',
  'disposablemail.com',
  'dropmail.me',
  'vmani.com',
  'clipmail.eu',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'einrot.com',
] as const;

const DISPOSABLE_DOMAINS_SET = new Set<string>(DISPOSABLE_EMAIL_DOMAINS);

/**
 * Kiểm tra xem một địa chỉ email có thuộc dịch vụ email tạm thời/rác hay không.
 */
export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const cleanEmail = email.trim().toLowerCase();
  const atIndex = cleanEmail.lastIndexOf('@');
  if (atIndex === -1 || atIndex === cleanEmail.length - 1) {
    return false;
  }
  const domain = cleanEmail.slice(atIndex + 1);
  return DISPOSABLE_DOMAINS_SET.has(domain);
}

/**
 * Che mờ địa chỉ email hoặc tên hiển thị theo tiêu chuẩn GDPR:
 * galaxypro710@gmail.com -> g***0@gmail.com
 * john@example.com -> j***n@example.com
 * a@example.com -> a***@example.com
 */
export function maskEmail(emailOrName: string | null | undefined): string {
  if (!emailOrName || typeof emailOrName !== 'string') {
    return 'Người dùng ẩn danh';
  }

  const trimmed = emailOrName.trim();
  if (!trimmed) {
    return 'Người dùng ẩn danh';
  }

  const atIndex = trimmed.indexOf('@');
  if (atIndex > 0) {
    const localPart = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex); // bao gồm cả '@'

    if (localPart.length <= 1) {
      return `${localPart}***${domain}`;
    }
    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    return `${firstChar}***${lastChar}${domain}`;
  }

  // Trường hợp display_name không phải email (ví dụ "Nguyễn Văn A" hoặc "user123")
  if (trimmed.length <= 2) {
    return `${trimmed[0]}***`;
  }
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
}
