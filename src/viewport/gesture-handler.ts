import type { ViewportController } from './viewport-controller';

const ZOOM_SENSITIVITY = 0.01;
const ZOOM_STEP = 0.1;

export class GestureHandler {
  private controller: ViewportController;
  private container: HTMLElement | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(controller: ViewportController) {
    this.controller = controller;
  }

  attach(container: HTMLElement): void {
    this.container = container;
    this.wheelHandler = (e) => this.handleWheel(e);
    this.keyHandler = (e) => this.handleKey(e);
    container.addEventListener('wheel', this.wheelHandler);
    container.ownerDocument.addEventListener('keydown', this.keyHandler);
  }

  detach(): void {
    if (!this.container) return;
    if (this.wheelHandler) {
      this.container.removeEventListener('wheel', this.wheelHandler);
    }
    if (this.keyHandler) {
      this.container.ownerDocument.removeEventListener('keydown', this.keyHandler);
    }
    this.wheelHandler = null;
    this.keyHandler = null;
    this.container = null;
  }

  private handleWheel(e: WheelEvent): void {
    if (e.ctrlKey) {
      e.preventDefault();
      const center = { x: e.clientX, y: e.clientY };
      this.controller.zoomBy(-e.deltaY * ZOOM_SENSITIVITY, center);
      return;
    }
    this.controller.panBy(e.deltaX, e.deltaY);
  }

  private handleKey(e: KeyboardEvent): void {
    if (!e.metaKey) return;
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      this.zoomFromCenter(ZOOM_STEP);
    } else if (e.key === '-') {
      e.preventDefault();
      this.zoomFromCenter(-ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      this.controller.fitToContent();
    }
  }

  private zoomFromCenter(delta: number): void {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const center = { x: rect.width / 2, y: rect.height / 2 };
    this.controller.zoomBy(delta, center);
  }
}
