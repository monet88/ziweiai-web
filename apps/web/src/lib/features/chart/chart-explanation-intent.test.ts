import { describe, expect, it } from 'vitest';
import { viCopy } from '../../i18n/vi';
import {
  buildChartDetailExplanationRequest,
  buildPalaceExplanationRequest,
  getChartDetailSelectionHint,
  getChartDetailExplanationButtonLabel,
} from './chart-explanation-intent';

describe('chart explanation intent', () => {
  it('always builds an overview request for the current chart-detail flow', () => {
    const payload = buildChartDetailExplanationRequest('0f8fad5b-d9cb-469f-a165-70867728950e');

    expect(payload).toMatchObject({
      chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      explanationKind: 'overview',
      providerPreference: 'auto',
      userConsentedToStorePrompt: false,
    });
  });

  it('tells the user that a selected palace only changes the local inspection focus for now', () => {
    expect(getChartDetailSelectionHint(viCopy.chart, 'Mệnh')).toBe('Cung đang chọn: Mệnh');
    expect(getChartDetailExplanationButtonLabel(viCopy.chart)).toBe('Tạo luận giải tổng quan');
  });

  it('builds a palace-scoped request carrying the selected palace scope', () => {
    const payload = buildPalaceExplanationRequest('0f8fad5b-d9cb-469f-a165-70867728950e', 'wealthPalace');

    expect(payload).toMatchObject({
      chartSnapshotId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      explanationKind: 'overview',
      palaceScope: 'wealthPalace',
      providerPreference: 'auto',
      userConsentedToStorePrompt: false,
    });
  });
});
