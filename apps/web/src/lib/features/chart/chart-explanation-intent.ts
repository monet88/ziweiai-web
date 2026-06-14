import type { CreateExplanationRequest, ExplanationKind, PalaceScope } from '@ziweiai/contracts';

type ChartCopy = typeof import('../../i18n/vi').viCopy.chart;

const CHART_DETAIL_EXPLANATION_KIND: ExplanationKind = 'overview';

export function buildChartDetailExplanationRequest(chartSnapshotId: string): CreateExplanationRequest {
  return {
    chartSnapshotId,
    explanationKind: CHART_DETAIL_EXPLANATION_KIND,
    providerPreference: 'auto',
    userConsentedToStorePrompt: false,
  };
}

// Luận giải theo cung/vận hạn (14 mục Tử Vi): giữ explanationKind overview để tương
// thích, thêm palaceScope để API khóa cache và sinh prompt riêng theo cung.
// palaceScope = null → overview explanation (không gửi palaceScope field, backward compatible)
export function buildPalaceExplanationRequest(chartSnapshotId: string, palaceScope: PalaceScope | null): CreateExplanationRequest {
  return {
    chartSnapshotId,
    explanationKind: CHART_DETAIL_EXPLANATION_KIND,
    ...(palaceScope !== null && { palaceScope }),
    providerPreference: 'auto',
    userConsentedToStorePrompt: false,
  };
}

export function getChartDetailExplanationButtonLabel(copy: ChartCopy): string {
  return CHART_DETAIL_EXPLANATION_KIND === 'overview' ? copy.generateOverviewExplanation : copy.generateExplanation;
}

export function getChartDetailSelectionHint(copy: ChartCopy, selectedPalaceName: string | null): string {
  return selectedPalaceName ? `${copy.selectedPalacePrefix}: ${selectedPalaceName}` : copy.noPalaceSelected;
}

export function getChartDetailExplanationScopeHint(copy: ChartCopy): string {
  return CHART_DETAIL_EXPLANATION_KIND === 'overview' ? copy.overviewExplanationHint : copy.perPalaceComingSoon;
}
