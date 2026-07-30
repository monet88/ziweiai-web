import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SheetStore } from './sheet.svelte';
import type { Component } from 'svelte';

describe('SheetStore', () => {
  let store: SheetStore;
  let popstateCallback: ((event: any) => void) | null = null;
  
  beforeEach(() => {
    // Mock History API
    vi.stubGlobal('history', {
      pushState: vi.fn(),
      back: vi.fn(),
      state: {},
    });

    // Mock Window Event Listener
    vi.stubGlobal('addEventListener', vi.fn((event, callback) => {
      if (event === 'popstate') {
        popstateCallback = callback;
      }
    }));

    store = new SheetStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    popstateCallback = null;
  });

  it('should initialize with closed state', () => {
    expect(store.isOpen).toBe(false);
    expect(store.component).toBeNull();
  });

  it('should open and push state', () => {
    const mockComponent = 'mock-component' as unknown as Component;
    const mockProps = { title: 'Test' };

    store.open(mockComponent, mockProps);

    expect(store.isOpen).toBe(true);
    expect(store.component).toBe(mockComponent);
    expect(store.props).toEqual(mockProps);
    expect(window.history.pushState).toHaveBeenCalledWith({ sheetOpen: true }, '');
  });

  it('should close and pop state', async () => {
    const mockComponent = {} as Component;
    store.open(mockComponent, {});
    expect(store.isOpen).toBe(true);

    // Mock that the current state is our dummy state
    (window.history as any).state = { sheetOpen: true };
    store.close();
    expect(store.isOpen).toBe(false);
    expect(window.history.back).toHaveBeenCalled();

    // wait for timeout in close
    await new Promise(r => setTimeout(r, 350));
    expect(store.component).toBeNull();
  });

  it('should close on popstate event without calling history.back', () => {
    const mockComponent = {} as Component;
    store.open(mockComponent, {});
    expect(store.isOpen).toBe(true);
    
    // Simulate back button press (state changes back to whatever was before, so no sheetOpen)
    expect(popstateCallback).not.toBeNull();
    popstateCallback!({ state: {} });
    
    expect(store.isOpen).toBe(false);
    // Since it was from popstate, it shouldn't call back() again
    expect(window.history.back).not.toHaveBeenCalled();
  });
});
