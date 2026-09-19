import { describe, expect, it } from 'vitest';
import { flattenTarotCards, toCardStringId, type TarotCardSource } from './tarot-cards';

const sampleCards: TarotCardSource[] = [
  {
    id: 0,
    name: '愚者',
    nameEn: 'The Fool',
    type: 'major',
    meaning: {
      upright: '新起点、自由',
      reversed: '逃避责任、莽撞',
    },
    description: '愚者立于悬崖边，白狗在侧。',
    interpretation: {
      upright: '正位愚者示你正站在一段崭新旅程的门槛。',
      reversed: '逆位愚者警示脚步与心念尚未对齐。',
    },
    advice: {
      upright: '信任直觉迈出第一步。',
      reversed: '先为脚下找一块实土。',
    },
    categories: {
      love: { upright: '新恋情初至。', reversed: '逃避承诺。' },
      career: { upright: '转职创业皆有机缘。', reversed: '跳槽勿草率。' },
      wealth: { upright: '探索新财源。', reversed: '财务冲动需刹车。' },
      health: { upright: '身心轻盈。', reversed: '作息紊乱。' },
    },
  },
  {
    id: 22,
    name: '权杖1',
    nameEn: 'Wands Ace',
    type: 'minor',
    suit: 'wands',
    number: 1,
    meaning: {
      upright: '新起点、灵感',
      reversed: '延迟启动',
    },
    description: '权杖王牌如手中初燃的火焰。',
    interpretation: {
      upright: '充满火元素的起点之牌。',
      reversed: '热情尚未真正点燃。',
    },
    advice: {
      upright: '抓住此刻的灵感。',
      reversed: '暂停盲目开工。',
    },
    categories: {
      love: { upright: '新恋情萌发。', reversed: '感情动力不足。' },
      career: { upright: '新项目浮现。', reversed: '计划搁置。' },
      wealth: { upright: '新的收入渠道。', reversed: '财务冲动需克制。' },
      health: { upright: '精力回升。', reversed: '易因倦怠忽视身体。' },
    },
  },
];

function fakeTranslate(units: { id: string; text: string }[]): Map<string, string> {
  return new Map(units.map((u) => [u.id, `vi:${u.text}`]));
}

describe('tarot-cards job', () => {
  it('toCardStringId ánh xạ chính xác id số sang id chuỗi monorepo', () => {
    expect(toCardStringId(0)).toBe('major_00');
    expect(toCardStringId(21)).toBe('major_21');
    expect(toCardStringId(22)).toBe('wands_ace');
    expect(toCardStringId(35)).toBe('wands_king');
    expect(toCardStringId(36)).toBe('cups_ace');
    expect(toCardStringId(49)).toBe('cups_king');
    expect(toCardStringId(50)).toBe('swords_ace');
    expect(toCardStringId(63)).toBe('swords_king');
    expect(toCardStringId(64)).toBe('pentacles_ace');
    expect(toCardStringId(77)).toBe('pentacles_king');
  });

  it('flattenTarotCards trích xuất đủ các leaf chuỗi và dedupe', () => {
    const { units } = flattenTarotCards(sampleCards);
    expect(units.length).toBeGreaterThan(0);
    // Mỗi lá bài có 15 leaf chuỗi cần dịch
    expect(units.length).toBe(30);
  });

  it('rebuild ráp lại đúng cấu trúc + gán string id và tên tiếng Việt', () => {
    const vnNames: Record<string, string> = {
      major_00: 'Kẻ Khờ (The Fool)',
      wands_ace: 'Gậy Át',
    };
    const { units, rebuild } = flattenTarotCards(sampleCards, vnNames);
    const rebuilt = rebuild(fakeTranslate(units));

    expect(rebuilt).toHaveLength(2);
    expect(rebuilt[0].id).toBe('major_00');
    expect(rebuilt[0].name).toBe('Kẻ Khờ (The Fool)');
    expect(rebuilt[0].meaning.upright).toBe('vi:新起点、自由');
    expect(rebuilt[0].categories.love.upright).toBe('vi:新恋情初至。');

    expect(rebuilt[1].id).toBe('wands_ace');
    expect(rebuilt[1].name).toBe('Gậy Át');
    expect(rebuilt[1].suit).toBe('wands');
    expect(rebuilt[1].number).toBe(1);
  });
});
