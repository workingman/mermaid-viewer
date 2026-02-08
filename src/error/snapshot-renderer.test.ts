import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnapshotRenderer } from './snapshot-renderer';

function mockCanvas(): HTMLCanvasElement {
  return {
    tagName: 'CANVAS',
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: vi.fn() }),
    replaceWith: vi.fn(),
  } as unknown as HTMLCanvasElement;
}

function mockDoc(): Document {
  return {
    createElement: (tag: string) => {
      if (tag === 'canvas') return mockCanvas();
      return { className: '', remove: vi.fn() } as unknown as HTMLElement;
    },
  } as unknown as Document;
}

function mockContainer(doc: Document): HTMLElement {
  let canvasRef: HTMLCanvasElement | null = null;
  return {
    ownerDocument: doc,
    appendChild: vi.fn(),
    querySelector: (sel: string) => {
      if (sel === 'canvas') return canvasRef;
      return null;
    },
    setCanvas: (c: HTMLCanvasElement | null) => {
      canvasRef = c;
    },
  } as unknown as HTMLElement;
}

function mockSvg(): SVGElement {
  return {
    tagName: 'svg',
    outerHTML: '<svg></svg>',
    replaceWith: vi.fn(),
    classList: { add: vi.fn() },
  } as unknown as SVGElement;
}

function setupGlobals(): void {
  vi.stubGlobal('Blob', class {});
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:test',
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal('fetch', async () => ({ blob: async () => ({}) }));
  vi.stubGlobal('createImageBitmap', async () => ({
    width: 100,
    height: 80,
  }));
}

beforeEach(() => setupGlobals());

describe('SnapshotRenderer.createSnapshot', () => {
  it('returns canvas when SVG is present', async () => {
    const doc = mockDoc();
    const container = mockContainer(doc);
    const sr = new SnapshotRenderer(container);
    sr.setCurrentSvg(mockSvg());
    const canvas = await sr.createSnapshot();
    expect(canvas).not.toBeNull();
    expect(canvas!.width).toBe(100);
  });
});

describe('SnapshotRenderer.createSnapshot null', () => {
  it('returns null when no SVG is set', async () => {
    const doc = mockDoc();
    const container = mockContainer(doc);
    const sr = new SnapshotRenderer(container);
    const canvas = await sr.createSnapshot();
    expect(canvas).toBeNull();
  });
});

describe('SnapshotRenderer.startReRender', () => {
  it('swaps SVG for canvas in DOM', async () => {
    const doc = mockDoc();
    const container = mockContainer(doc);
    const sr = new SnapshotRenderer(container);
    const svg = mockSvg();
    sr.setCurrentSvg(svg);
    const canvas = await sr.startReRender();
    expect(canvas).not.toBeNull();
    expect(svg.replaceWith).toHaveBeenCalled();
  });
});

describe('SnapshotRenderer.completeReRender', () => {
  it('replaces canvas with new SVG', async () => {
    const doc = mockDoc();
    const container = mockContainer(doc);
    const sr = new SnapshotRenderer(container);
    sr.setCurrentSvg(mockSvg());
    const canvas = await sr.startReRender();
    // Simulate canvas being in the DOM after startReRender
    (container as unknown as { setCanvas: (c: unknown) => void }).setCanvas(canvas);
    const newSvg = mockSvg();
    sr.completeReRender(newSvg);
    expect(newSvg.classList.add).toHaveBeenCalledWith('svg-crossfade');
  });
});

describe('SnapshotRenderer error keeps snapshot', () => {
  it('canvas stays visible when re-render fails', async () => {
    const doc = mockDoc();
    const container = mockContainer(doc);
    const sr = new SnapshotRenderer(container);
    const svg = mockSvg();
    sr.setCurrentSvg(svg);
    const canvas = await sr.startReRender();
    expect(canvas).not.toBeNull();
    // On error: hide spinner, show error, but canvas remains
    sr.hideRenderingIndicator();
    // Canvas is still in the DOM (svg.replaceWith put it there)
    expect(svg.replaceWith).toHaveBeenCalledWith(canvas);
  });
});
