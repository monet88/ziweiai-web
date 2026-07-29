/**
 * Minimal satori element tree helpers.
 * Avoids satori-html (ESM-only) so Vercel NFT can bundle CJS-safe paths.
 */

export type OgStyle = Record<string, string | number>;

export type OgNode =
  | string
  | {
      type: string;
      props: {
        style?: OgStyle;
        children?: OgNode | OgNode[];
      };
    };

export function el(type: string, style: OgStyle, children?: OgNode | OgNode[]): OgNode {
  return {
    type,
    props: {
      style,
      ...(children === undefined ? {} : { children }),
    },
  };
}

export function buildMysticalOgTree(input: {
  systemName: string;
  title: string;
  genderLabel: string | null;
  yearLabel: string | null;
}): OgNode {
  const chips: OgNode[] = [];
  if (input.genderLabel) {
    chips.push(
      el(
        'div',
        {
          display: 'flex',
          padding: '8px 18px',
          borderRadius: 999,
          background: 'rgba(212,175,55,0.16)',
          border: '1px solid rgba(212,175,55,0.35)',
        },
        el('span', { fontSize: 22, color: '#f5f1e8' }, input.genderLabel),
      ),
    );
  }
  if (input.yearLabel) {
    chips.push(
      el(
        'div',
        {
          display: 'flex',
          padding: '8px 18px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
        },
        el('span', { fontSize: 22, color: '#cfc7ba' }, `Năm ${input.yearLabel}`),
      ),
    );
  }

  return el(
    'div',
    {
      display: 'flex',
      width: 1200,
      height: 630,
      backgroundColor: '#0c0b12',
      color: '#f5f1e8',
      fontFamily: 'Inter',
      position: 'relative',
      overflow: 'hidden',
    },
    [
      el('div', {
        position: 'absolute',
        top: -120,
        left: -80,
        width: 520,
        height: 520,
        borderRadius: 999,
        background: 'rgba(212, 175, 55, 0.18)',
      }),
      el('div', {
        position: 'absolute',
        bottom: -160,
        right: -60,
        width: 560,
        height: 560,
        borderRadius: 999,
        background: 'rgba(120, 96, 220, 0.16)',
      }),
      el(
        'div',
        {
          position: 'absolute',
          top: 36,
          right: 36,
          bottom: 36,
          left: 36,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.06)',
          padding: '48px 56px',
        },
        [
          el(
            'div',
            { display: 'flex', alignItems: 'center' },
            [
              el(
                'div',
                {
                  display: 'flex',
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#d4af37',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                },
                el('span', { fontSize: 22, fontWeight: 700, color: '#14110c' }, 'TV'),
              ),
              el('span', { fontSize: 28, fontWeight: 700, color: '#f5f1e8' }, 'Tử Vi Toàn Tập'),
            ],
          ),
          el(
            'div',
            { display: 'flex', flexDirection: 'column' },
            [
              el(
                'span',
                {
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#d4af37',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  marginBottom: 16,
                },
                input.systemName,
              ),
              el(
                'div',
                {
                  fontSize: 58,
                  fontWeight: 700,
                  color: '#f5f1e8',
                  lineHeight: 1.12,
                  margin: '0 0 18px 0',
                  maxWidth: 980,
                  display: 'flex',
                },
                input.title,
              ),
              el('div', { display: 'flex', gap: 12 }, chips),
            ],
          ),
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 22,
            },
            [
              el('span', { fontSize: 22, color: '#cfc7ba' }, 'Xem luận giải AI tại tuvitoantap.vercel.app'),
              el(
                'div',
                {
                  display: 'flex',
                  padding: '12px 26px',
                  borderRadius: 999,
                  background: '#d4af37',
                },
                el('span', { fontSize: 22, fontWeight: 700, color: '#14110c' }, 'Mở lá số'),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

export function buildReferralOgTree(input: {
  referralCode: string;
}): OgNode {
  return el(
    'div',
    {
      display: 'flex',
      width: 1200,
      height: 630,
      backgroundColor: '#0c0b12',
      color: '#f5f1e8',
      fontFamily: 'Inter',
      position: 'relative',
      overflow: 'hidden',
    },
    [
      el('div', {
        position: 'absolute',
        top: -120,
        left: -80,
        width: 520,
        height: 520,
        borderRadius: 999,
        background: 'rgba(212, 175, 55, 0.18)',
      }),
      el('div', {
        position: 'absolute',
        bottom: -160,
        right: -60,
        width: 560,
        height: 560,
        borderRadius: 999,
        background: 'rgba(120, 96, 220, 0.16)',
      }),
      el(
        'div',
        {
          position: 'absolute',
          top: 36,
          right: 36,
          bottom: 36,
          left: 36,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.06)',
          padding: '48px 56px',
        },
        [
          el(
            'div',
            { display: 'flex', alignItems: 'center' },
            [
              el(
                'div',
                {
                  display: 'flex',
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#d4af37',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                },
                el('span', { fontSize: 22, fontWeight: 700, color: '#14110c' }, 'TV'),
              ),
              el('span', { fontSize: 28, fontWeight: 700, color: '#f5f1e8' }, 'Tử Vi Toàn Tập'),
            ],
          ),
          el(
            'div',
            { display: 'flex', flexDirection: 'column' },
            [
              el(
                'span',
                {
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#d4af37',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  marginBottom: 16,
                },
                'NHẬN NGAY 15 XU THƯỞNG',
              ),
              el(
                'div',
                {
                  fontSize: 58,
                  fontWeight: 700,
                  color: '#f5f1e8',
                  lineHeight: 1.12,
                  margin: '0 0 18px 0',
                  maxWidth: 980,
                  display: 'flex',
                },
                'Đăng ký Tử Vi Toàn Tập qua link giới thiệu',
              ),
              el(
                'div',
                { display: 'flex', gap: 12 },
                [
                  el(
                    'div',
                    {
                      display: 'flex',
                      padding: '8px 18px',
                      borderRadius: 999,
                      background: 'rgba(212,175,55,0.16)',
                      border: '1px solid rgba(212,175,55,0.35)',
                    },
                    el('span', { fontSize: 22, color: '#f5f1e8' }, `Mã giới thiệu: ${input.referralCode}`),
                  ),
                ],
              ),
            ],
          ),
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 22,
            },
            [
              el('span', { fontSize: 22, color: '#cfc7ba' }, 'Xem luận giải AI tại tuvitoantap.vercel.app'),
              el(
                'div',
                {
                  display: 'flex',
                  padding: '12px 26px',
                  borderRadius: 999,
                  background: '#d4af37',
                },
                el('span', { fontSize: 22, fontWeight: 700, color: '#14110c' }, 'Đăng Ký Ngay'),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
