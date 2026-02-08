import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from './error-boundary';

function mockContainer(): HTMLElement {
  const children: HTMLElement[] = [];
  const doc = {
    createElement: (tag: string) => mockElement(tag, doc),
  };
  return {
    ownerDocument: doc,
    prepend: (el: HTMLElement) => children.unshift(el),
    get firstChild() {
      return children[0] ?? null;
    },
    get childNodes() {
      return children;
    },
  } as unknown as HTMLElement;
}

function mockElement(tag: string, doc: unknown): HTMLElement {
  let parent: HTMLElement | null = null;
  return {
    tagName: tag.toUpperCase(),
    className: '',
    textContent: '',
    ownerDocument: doc,
    remove: function () {
      parent = null;
    },
    set parentNode(p: HTMLElement | null) {
      parent = p;
    },
    get parentNode() {
      return parent;
    },
  } as unknown as HTMLElement;
}

function mockSvg(): SVGElement {
  return { tagName: 'svg' } as unknown as SVGElement;
}

describe('ErrorBoundary.cacheRender', () => {
  it('stores and retrieves cached SVG', () => {
    const container = mockContainer();
    const eb = new ErrorBoundary(container);
    const svg = mockSvg();
    eb.cacheRender(svg);
    expect(eb.getLastValidRender()).toBe(svg);
  });
});

describe('ErrorBoundary.getLastValidRender', () => {
  it('returns null when no cache exists', () => {
    const container = mockContainer();
    const eb = new ErrorBoundary(container);
    expect(eb.getLastValidRender()).toBeNull();
  });
});

describe('ErrorBoundary.showError', () => {
  it('creates banner element in container', () => {
    const container = mockContainer();
    const eb = new ErrorBoundary(container);
    eb.showError('Parse failed');
    const banner = container.firstChild as HTMLElement;
    expect(banner).not.toBeNull();
    expect(banner.className).toBe('error-banner');
    expect(banner.textContent).toBe('Parse failed');
  });
});

describe('ErrorBoundary.clearError', () => {
  it('removes banner from DOM', () => {
    const container = mockContainer();
    const eb = new ErrorBoundary(container);
    eb.showError('error');
    eb.clearError();
    eb.showError('new error');
    const banner = container.firstChild as HTMLElement;
    expect(banner.textContent).toBe('new error');
  });
});

describe('ErrorBoundary.handleRenderSuccess', () => {
  it('caches SVG and clears error', () => {
    const container = mockContainer();
    const eb = new ErrorBoundary(container);
    eb.showError('old error');
    const svg = mockSvg();
    eb.handleRenderSuccess(svg);
    expect(eb.getLastValidRender()).toBe(svg);
  });
});
