import { describe, it, expect, vi } from 'vitest';
import { canvasToWebpBlob, canvasToWebpDataUrl } from './image-compress';

describe('image-compress utility (Sprint 60)', () => {
  it('canvasToWebpDataUrl returns webp or fallback data url', () => {
    const mockCanvas = {
      toDataURL: vi.fn((type: string, quality?: number) => {
        if (type === 'image/webp') {
          return `data:image/webp;base64,mockwebpquality${quality}`;
        }
        return 'data:image/png;base64,mockpng';
      }),
    } as unknown as HTMLCanvasElement;

    const result = canvasToWebpDataUrl(mockCanvas, 0.85);
    expect(result).toBe('data:image/webp;base64,mockwebpquality0.85');
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.85);
  });

  it('canvasToWebpDataUrl falls back to PNG when webp data url is not supported', () => {
    const mockCanvas = {
      toDataURL: vi.fn((type: string) => {
        if (type === 'image/webp') {
          // Trình duyệt không hỗ trợ trả về data:image/png
          return 'data:image/png;base64,fallbackpng';
        }
        return 'data:image/png;base64,standardpng';
      }),
    } as unknown as HTMLCanvasElement;

    const result = canvasToWebpDataUrl(mockCanvas, 0.85);
    expect(result).toBe('data:image/png;base64,standardpng');
  });

  it('canvasToWebpBlob resolves blob with quality and mimeType', async () => {
    const mockBlob = new Blob(['mock-image-data'], { type: 'image/webp' });
    const mockCanvas = {
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(mockBlob);
      }),
    } as unknown as HTMLCanvasElement;

    const blob = await canvasToWebpBlob(mockCanvas, { quality: 0.85 });
    expect(blob).toBe(mockBlob);
  });
});
