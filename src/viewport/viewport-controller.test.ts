import { describe, it, expect } from 'vitest';
import { ViewportController } from './viewport-controller';

describe('ViewportController.zoomTo', () => {
  it('clamps zoom to [0.1, 5.0]', () => {
    const vc = new ViewportController(800, 600);
    vc.zoomTo(10);
    expect(vc.getState().zoom).toBe(5.0);
    vc.zoomTo(-1);
    expect(vc.getState().zoom).toBe(0.1);
    vc.zoomTo(2.5);
    expect(vc.getState().zoom).toBe(2.5);
  });
});

describe('ViewportController.zoomBy', () => {
  it('preserves focal point under cursor', () => {
    const vc = new ViewportController(800, 600);
    vc.zoomTo(1);
    const center = { x: 400, y: 300 };
    const rectBefore = vc.getViewportRect();
    const worldX = rectBefore.x + center.x / 1;
    vc.zoomBy(0.5, center);
    const rectAfter = vc.getViewportRect();
    const worldXAfter = rectAfter.x + center.x / 1.5;
    expect(Math.abs(worldX - worldXAfter)).toBeLessThan(1);
  });
});

describe('ViewportController.panBy', () => {
  it('shifts viewBox correctly', () => {
    const vc = new ViewportController(800, 600);
    vc.zoomTo(1);
    const before = vc.getViewportRect();
    vc.panBy(100, 50);
    const after = vc.getViewportRect();
    expect(after.x).toBeCloseTo(before.x - 100, 5);
    expect(after.y).toBeCloseTo(before.y - 50, 5);
  });
});

describe('ViewportController.fitToContent', () => {
  it('shows full diagram with padding', () => {
    const vc = new ViewportController(800, 600);
    vc.setContentBounds({ x: 0, y: 0, width: 1000, height: 800 });
    vc.fitToContent();
    const rect = vc.getViewportRect();
    expect(rect.width).toBeGreaterThanOrEqual(1000);
    expect(rect.height).toBeGreaterThanOrEqual(800);
  });
});

describe('ViewportController.getViewportRect', () => {
  it('returns correct area for zoom level', () => {
    const vc = new ViewportController(800, 600);
    vc.zoomTo(2);
    const rect = vc.getViewportRect();
    expect(rect.width).toBe(400);
    expect(rect.height).toBe(300);
  });
});
