import type { ChartKey } from '@ziweiai/contracts';

const trigramValueToKey: Record<string, ChartKey> = {
  '乾': 'qianTrigram',
  '兑': 'duiTrigram',
  '离': 'liTrigram',
  '震': 'zhenTrigram',
  '巽': 'xunTrigram',
  '坎': 'kanTrigram',
  '艮': 'genTrigram',
  '坤': 'kunTrigram',
};

const fiveElementValueToKey: Record<string, ChartKey> = {
  '金': 'metalElement',
  '木': 'woodElement',
  '水': 'waterElement',
  '火': 'fireElement',
  '土': 'earthElement',
};

const jieQiValueToKey: Record<string, ChartKey> = {
  '冬至': 'dongZhiJieQi',
  '小寒': 'xiaoHanJieQi',
  '大寒': 'daHanJieQi',
  '立春': 'liChunJieQi',
  '雨水': 'yuShuiJieQi',
  '惊蛰': 'jingZheJieQi',
  '春分': 'chunFenJieQi',
  '清明': 'qingMingJieQi',
  '谷雨': 'guYuJieQi',
  '立夏': 'liXiaJieQi',
  '小满': 'xiaoManJieQi',
  '芒种': 'mangZhongJieQi',
  '夏至': 'xiaZhiJieQi',
  '小暑': 'xiaoShuJieQi',
  '大暑': 'daShuJieQi',
  '立秋': 'liQiuJieQi',
  '处暑': 'chuShuJieQi',
  '白露': 'baiLuJieQi',
  '秋分': 'qiuFenJieQi',
  '寒露': 'hanLuJieQi',
  '霜降': 'shuangJiangJieQi',
  '立冬': 'liDongJieQi',
  '小雪': 'xiaoXueJieQi',
  '大雪': 'daXueJieQi',
};

const qimenStarValueToKey: Record<string, ChartKey> = {
  '天蓬': 'tianPengStar',
  '天芮': 'tianRuiStar',
  '天冲': 'tianChongStar',
  '天辅': 'tianFuStar',
  '天禽': 'tianQinStar',
  '芮禽': 'tianQinStar',
  '天心': 'tianXinStar',
  '天柱': 'tianZhuStar',
  '天任': 'tianRenStar',
  '天英': 'tianYingStar',
};

const qimenGateValueToKey: Record<string, ChartKey> = {
  '休门': 'restGate',
  '死门': 'deathGate',
  '伤门': 'hurtGate',
  '杜门': 'blockGate',
  '开门': 'openGate',
  '惊门': 'frightGate',
  '生门': 'lifeGate',
  '景门': 'sceneGate',
};

const sanYuanValueToKey: Record<string, ChartKey> = {
  '上元': 'upperCycle',
  '中元': 'middleCycle',
  '下元': 'lowerCycle',
};

const yinYangDunValueToKey: Record<string, ChartKey> = {
  '阳遁': 'yangDun',
  '阴遁': 'yinDun',
};

function lookupKey(map: Record<string, ChartKey>, value: string, kind: string): ChartKey {
  const key = map[value];
  if (!key) {
    throw new Error(`Unsupported ${kind}: ${value}`);
  }

  return key;
}

export function toTrigramKey(value: string): ChartKey {
  return lookupKey(trigramValueToKey, value, 'trigram');
}

export function toFiveElementKey(value: string): ChartKey {
  return lookupKey(fiveElementValueToKey, value, 'five element');
}

export function toJieQiKey(value: string): ChartKey {
  return lookupKey(jieQiValueToKey, value, 'jie qi');
}

export function toQimenStarKey(value: string): ChartKey {
  return lookupKey(qimenStarValueToKey, value, 'qi men star');
}

export function toQimenGateKey(value: string): ChartKey {
  return lookupKey(qimenGateValueToKey, value, 'qi men gate');
}

export function toSanYuanKey(value: string): ChartKey {
  return lookupKey(sanYuanValueToKey, value, 'san yuan');
}

export function toYinYangDunKey(value: string): ChartKey {
  return lookupKey(yinYangDunValueToKey, value, 'yin yang dun');
}
