import type { ChartDetailResponse, ZiweiChartSnapshot } from '@ziweiai/contracts';
import { isZiweiChartSnapshot } from '@ziweiai/contracts';
import { tryTranslateZiweiKey, translateZiweiKey } from '../../i18n/ziwei-terms-vi';
import { normalizeLegacyDisplayName } from '../../text/cjk';

type SnapshotPalace = ZiweiChartSnapshot['palaces'][number];
type SnapshotStar = SnapshotPalace['majorStars'][number];

export type StarTokenView = {
  key: string;
  name: string;
  group: SnapshotStar['group'];
  brightness: string | null;
  mutagen: string | null;
};

export type PalaceView = {
  nameKey: string;
  name: string;
  index: number;
  earthlyBranchKey: string;
  stemBranch: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  changsheng: string | null;
  decadalRange: string | null;
  ages: number[];
  majorStars: StarTokenView[];
  minorStars: StarTokenView[];
  adjectiveStars: StarTokenView[];
};

function translateLegacyAwareKey(key: string, displayName?: string): string {
  const translated = tryTranslateZiweiKey(key);
  if (translated) {
    return translated;
  }

  if (displayName) {
    return normalizeLegacyDisplayName(displayName);
  }

  if (key.startsWith('legacy')) {
    return '';
  }

  return translateZiweiKey(key);
}

function buildStarToken(star: SnapshotStar): StarTokenView {
  return {
    key: star.nameKey,
    name: translateLegacyAwareKey(star.nameKey, star.displayName),
    group: star.group,
    brightness: star.brightnessKey ? translateZiweiKey(star.brightnessKey) : null,
    mutagen: star.mutagen ? translateZiweiKey(star.mutagen) : null,
  };
}

export function buildPalaceView(palace: SnapshotPalace): PalaceView {
  const stem = translateLegacyAwareKey(palace.heavenlyStemKey);
  const branch = translateLegacyAwareKey(palace.earthlyBranchKey);
  const stemBranch = [stem, branch].filter(Boolean).join(' ');

  return {
    nameKey: palace.nameKey,
    name: translateLegacyAwareKey(palace.nameKey, palace.displayName),
    index: palace.index,
    earthlyBranchKey: palace.earthlyBranchKey,
    stemBranch,
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    changsheng: palace.changsheng12Key ? translateZiweiKey(palace.changsheng12Key) : null,
    decadalRange: palace.decadalRange && palace.decadalRange.length >= 2 ? `${palace.decadalRange[0]}–${palace.decadalRange[1]}` : null,
    ages: palace.ages,
    majorStars: palace.majorStars.map(buildStarToken),
    minorStars: palace.minorStars.map(buildStarToken),
    adjectiveStars: palace.adjectiveStars.map(buildStarToken),
  };
}

export function buildPalaceViews(snapshot: ChartDetailResponse['snapshot']): PalaceView[] {
  if (!isZiweiChartSnapshot(snapshot)) {
    return [];
  }

  return snapshot.palaces.map(buildPalaceView);
}
