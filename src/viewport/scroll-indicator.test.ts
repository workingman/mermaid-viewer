import { describe, it, expect, vi } from 'vitest';
import { ViewportController } from './viewport-controller';
import { ScrollIndicator } from './scroll-indicator';

function mockWrapper(): HTMLElement {
  const children: HTMLElement[] = [];
  return {
    ownerDocument: {
      createElement: (tag: string) => mockDiv(tag),
    },
    appendChild: (el: HTMLElement) => children.push(el),
    get children() {
      return children;
    },
  } as unknown as HTMLElement;
}

function mockDiv(tag: string): HTMLDivElement {
  const listeners: Record<string, Array<() => void>> = {};
  const childNodes: HTMLElement[] = [];
  return {
    tagName: tag.toUpperCase(),
    className: '',
    style: {} as CSSStyleDeclaration,
    scrollLeft: 0,
    scrollTop: 0,
    addEventListener: (t: string, fn: () => void) => {
      (listeners[t] ??= []).push(fn);
    },
    removeEventListener: () => {},
    appendChild: (el: HTMLElement) => childNodes.push(el),
    remove: () => {},
    get children() {
      return childNodes;
    },
  } as unknown as HTMLDivElement;
}

describe('ScrollIndicator spacer sizing', () => {
  it('matches diagram dimensions at zoom level', () => {
    const vc = new ViewportController(800, 600);
    vc.zoomTo(2);
    const si = new ScrollIndicator(vc);
    const wrapper = mockWrapper();
    const container = si.attach(wrapper);
    si.updateSpacerSize(1000, 800);
    const spacer = container.children[0] as HTMLElement;
    expect(spacer.style.width).toBe('2000px');
    expect(spacer.style.height).toBe('1600px');
  });
});

describe('ScrollIndicator scroll-to-pan', () => {
  it('scrolling container calls panBy', () => {
    const vc = new ViewportController(800, 600);
    const spy = vi.spyOn(vc, 'panBy');
    const si = new ScrollIndicator(vc);
    const wrapper = mockWrapper();
    si.attach(wrapper);
    si.syncFromViewport();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('ScrollIndicator pan-to-scroll', () => {
  it('viewport change updates scrollLeft/scrollTop', () => {
    const vc = new ViewportController(800, 600);
    vc.zoomTo(1);
    vc.panBy(-100, -50);
    const si = new ScrollIndicator(vc);
    const wrapper = mockWrapper();
    const container = si.attach(wrapper);
    si.syncFromViewport();
    expect(container.scrollLeft).toBeGreaterThan(0);
    expect(container.scrollTop).toBeGreaterThan(0);
  });
});
