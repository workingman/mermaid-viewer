import type { ViewportState, ViewportRect } from '@shared/types';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const FIT_PADDING = 0.05;

export class ViewportController {
  private state: ViewportState;
  private containerWidth: number;
  private containerHeight: number;
  private svgElement: SVGElement | null = null;

  constructor(containerWidth: number, containerHeight: number) {
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    this.state = {
      zoom: 1,
      panX: 0,
      panY: 0,
      contentBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  getState(): ViewportState {
    return { ...this.state };
  }

  zoomTo(level: number, center?: { x: number; y: number }): void {
    const clamped = clampZoom(level);
    if (center) {
      this.adjustPanForZoom(clamped, center);
    }
    this.state.zoom = clamped;
    this.applyTransform();
  }

  zoomBy(delta: number, center: { x: number; y: number }): void {
    const newZoom = clampZoom(this.state.zoom + delta);
    this.adjustPanForZoom(newZoom, center);
    this.state.zoom = newZoom;
    this.applyTransform();
  }

  panBy(dx: number, dy: number): void {
    this.state.panX += dx / this.state.zoom;
    this.state.panY += dy / this.state.zoom;
    this.applyTransform();
  }

  fitToContent(): void {
    const { contentBounds } = this.state;
    if (contentBounds.width === 0 || contentBounds.height === 0) return;

    const padW = contentBounds.width * FIT_PADDING;
    const padH = contentBounds.height * FIT_PADDING;
    const totalW = contentBounds.width + padW * 2;
    const totalH = contentBounds.height + padH * 2;

    const scaleX = this.containerWidth / totalW;
    const scaleY = this.containerHeight / totalH;
    this.state.zoom = clampZoom(Math.min(scaleX, scaleY));

    this.state.panX = -(contentBounds.x - padW);
    this.state.panY = -(contentBounds.y - padH);
    this.applyTransform();
  }

  getViewportRect(): ViewportRect {
    const w = this.containerWidth / this.state.zoom;
    const h = this.containerHeight / this.state.zoom;
    return {
      x: -this.state.panX,
      y: -this.state.panY,
      width: w,
      height: h,
    };
  }

  display(svgElement: SVGElement): void {
    this.svgElement = svgElement;
    const bbox = parseSvgBounds(svgElement);
    this.state.contentBounds = bbox;
    this.fitToContent();
  }

  setContentBounds(bounds: ViewportState['contentBounds']): void {
    this.state.contentBounds = { ...bounds };
  }

  private adjustPanForZoom(newZoom: number, center: { x: number; y: number }): void {
    const oldZoom = this.state.zoom;
    const cx = center.x / oldZoom - this.state.panX;
    const cy = center.y / oldZoom - this.state.panY;
    this.state.panX = center.x / newZoom - cx;
    this.state.panY = center.y / newZoom - cy;
  }

  private applyTransform(): void {
    if (!this.svgElement) return;
    const rect = this.getViewportRect();
    const vb = `${rect.x} ${rect.y} ${rect.width} ${rect.height}`;
    this.svgElement.setAttribute('viewBox', vb);
  }
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function parseSvgBounds(svg: SVGElement): ViewportState['contentBounds'] {
  const vb = svg.getAttribute('viewBox');
  if (!vb) return { x: 0, y: 0, width: 0, height: 0 };
  const parts = vb.split(/[\s,]+/).map(Number);
  return {
    x: parts[0] ?? 0,
    y: parts[1] ?? 0,
    width: parts[2] ?? 0,
    height: parts[3] ?? 0,
  };
}
