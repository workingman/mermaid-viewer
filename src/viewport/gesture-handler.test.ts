import { describe, it, expect, vi } from 'vitest';
import { ViewportController } from './viewport-controller';
import { GestureHandler } from './gesture-handler';

type Listener = (e: unknown) => void;

function mockContainer(): HTMLElement & { fire: (t: string, e: unknown) => void } {
  const listeners: Record<string, Listener[]> = {};
  const docListeners: Record<string, Listener[]> = {};
  const fire = (type: string, event: unknown) => {
    for (const fn of listeners[type] ?? []) fn(event);
    for (const fn of docListeners[type] ?? []) fn(event);
  };
  return {
    addEventListener: (t: string, fn: Listener) => {
      (listeners[t] ??= []).push(fn);
    },
    removeEventListener: (t: string, fn: Listener) => {
      listeners[t] = (listeners[t] ?? []).filter((f) => f !== fn);
    },
    getBoundingClientRect: () => ({ width: 800, height: 600 }),
    ownerDocument: {
      addEventListener: (t: string, fn: Listener) => {
        (docListeners[t] ??= []).push(fn);
      },
      removeEventListener: (t: string, fn: Listener) => {
        docListeners[t] = (docListeners[t] ?? []).filter((f) => f !== fn);
      },
    },
    fire,
    _listeners: listeners,
    _docListeners: docListeners,
  } as unknown as HTMLElement & { fire: (t: string, e: unknown) => void };
}

describe('GestureHandler ctrl+wheel zooms', () => {
  it('dispatches zoomBy on ctrl+wheel', () => {
    const vc = new ViewportController(800, 600);
    const spy = vi.spyOn(vc, 'zoomBy');
    const gh = new GestureHandler(vc);
    const container = mockContainer();
    gh.attach(container);
    const event = {
      ctrlKey: true,
      deltaY: -100,
      clientX: 400,
      clientY: 300,
      preventDefault: vi.fn(),
    };
    container.fire('wheel', event);
    expect(spy).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });
});

describe('GestureHandler plain wheel pans', () => {
  it('dispatches panBy on plain wheel', () => {
    const vc = new ViewportController(800, 600);
    const spy = vi.spyOn(vc, 'panBy');
    const gh = new GestureHandler(vc);
    const container = mockContainer();
    gh.attach(container);
    container.fire('wheel', { ctrlKey: false, deltaX: 10, deltaY: 20 });
    expect(spy).toHaveBeenCalledWith(10, 20);
  });
});

describe('GestureHandler keyboard shortcuts', () => {
  it('Cmd+= zooms in and Cmd+0 fits', () => {
    const vc = new ViewportController(800, 600);
    const zoomSpy = vi.spyOn(vc, 'zoomBy');
    const fitSpy = vi.spyOn(vc, 'fitToContent');
    const gh = new GestureHandler(vc);
    const container = mockContainer();
    gh.attach(container);
    container.fire('keydown', { metaKey: true, key: '=', preventDefault: vi.fn() });
    expect(zoomSpy).toHaveBeenCalled();
    container.fire('keydown', { metaKey: true, key: '0', preventDefault: vi.fn() });
    expect(fitSpy).toHaveBeenCalled();
  });
});

describe('GestureHandler attach/detach lifecycle', () => {
  it('removes listeners on detach preventing leaks', () => {
    const vc = new ViewportController(800, 600);
    const spy = vi.spyOn(vc, 'panBy');
    const gh = new GestureHandler(vc);
    const container = mockContainer();
    gh.attach(container);
    gh.detach();
    container.fire('wheel', { ctrlKey: false, deltaX: 5, deltaY: 5 });
    expect(spy).not.toHaveBeenCalled();
  });
});
