import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleNodeDragStart,
  handleNodeDrag,
  handleNodeDragEnd,
  isDragging,
  setDragCallbacks,
  clearDragCallbacks,
  screenToDiagram,
  resetDragState,
} from './drag-handler';

function mockViewport(zoom = 1, panX = 0, panY = 0) {
  return {
    zoom,
    panX,
    panY,
    contentBounds: { x: 0, y: 0, width: 100, height: 100 },
  };
}

function mockElement() {
  const attrs: Record<string, string> = {};
  const classes = new Set<string>();
  return {
    getAttribute: (name: string) => attrs[name] ?? null,
    setAttribute: (name: string, val: string) => {
      attrs[name] = val;
    },
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  };
}

function mockPointerEvent(
  clientX: number,
  clientY: number,
  target: unknown,
  pointerId = 1,
): PointerEvent {
  return {
    clientX,
    clientY,
    pointerId,
    currentTarget: target,
  } as unknown as PointerEvent;
}

describe('screenToDiagram', () => {
  it('converts screen coords at 1x zoom no pan', () => {
    const result = screenToDiagram(100, 200, mockViewport());
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('accounts for 2x zoom', () => {
    const result = screenToDiagram(200, 400, mockViewport(2, 0, 0));
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('accounts for pan offset', () => {
    const result = screenToDiagram(150, 250, mockViewport(1, 50, 50));
    expect(result).toEqual({ x: 100, y: 200 });
  });
});

describe('handleNodeDragStart', () => {
  beforeEach(() => {
    resetDragState();
    clearDragCallbacks();
  });

  it('sets dragging state and captures pointer', () => {
    setDragCallbacks(vi.fn(), vi.fn(), () => mockViewport());
    const el = mockElement();
    const event = mockPointerEvent(100, 100, el);
    handleNodeDragStart('A', event);

    expect(isDragging()).toBe(true);
    expect(el.setPointerCapture).toHaveBeenCalledWith(1);
  });
});

describe('handleNodeDrag', () => {
  beforeEach(() => {
    resetDragState();
    clearDragCallbacks();
  });

  it('updates transform and calls drag callback', () => {
    const dragCb = vi.fn();
    setDragCallbacks(dragCb, vi.fn(), () => mockViewport());

    const el = mockElement();
    handleNodeDragStart('A', mockPointerEvent(100, 100, el));
    handleNodeDrag(mockPointerEvent(150, 200, el));

    // offset is (100,100), so position = (150-100, 200-100)
    expect(dragCb).toHaveBeenCalledWith('A', 50, 100);
  });
});

describe('handleNodeDragEnd', () => {
  beforeEach(() => {
    resetDragState();
    clearDragCallbacks();
  });

  it('releases pointer capture and calls end callback', () => {
    const endCb = vi.fn();
    setDragCallbacks(vi.fn(), endCb, () => mockViewport());

    const el = mockElement();
    handleNodeDragStart('A', mockPointerEvent(100, 100, el));
    handleNodeDragEnd(mockPointerEvent(200, 300, el));

    expect(isDragging()).toBe(false);
    expect(el.releasePointerCapture).toHaveBeenCalledWith(1);
    // offset is (100,100), so position = (200-100, 300-100)
    expect(endCb).toHaveBeenCalledWith('A', 100, 200);
  });

  it('does nothing when not dragging', () => {
    const endCb = vi.fn();
    setDragCallbacks(vi.fn(), endCb, () => mockViewport());

    handleNodeDragEnd(mockPointerEvent(100, 100, mockElement()));
    expect(endCb).not.toHaveBeenCalled();
  });
});
