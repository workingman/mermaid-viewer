import type { ViewportController } from './viewport-controller';

export class ScrollIndicator {
  private controller: ViewportController;
  private scrollContainer: HTMLDivElement | null = null;
  private spacer: HTMLDivElement | null = null;
  private isSyncing = false;

  constructor(controller: ViewportController) {
    this.controller = controller;
  }

  attach(wrapper: HTMLElement): HTMLDivElement {
    const doc = wrapper.ownerDocument;
    this.scrollContainer = doc.createElement('div');
    this.scrollContainer.className = 'viewport-scroll-container';
    this.spacer = doc.createElement('div');
    this.spacer.className = 'viewport-scroll-spacer';
    this.scrollContainer.appendChild(this.spacer);
    wrapper.appendChild(this.scrollContainer);
    this.scrollContainer.addEventListener('scroll', () => this.onScroll());
    return this.scrollContainer;
  }

  detach(): void {
    if (!this.scrollContainer) return;
    this.scrollContainer.remove();
    this.scrollContainer = null;
    this.spacer = null;
  }

  updateSpacerSize(diagramWidth: number, diagramHeight: number): void {
    if (!this.spacer) return;
    const zoom = this.controller.getState().zoom;
    this.spacer.style.width = `${diagramWidth * zoom}px`;
    this.spacer.style.height = `${diagramHeight * zoom}px`;
  }

  syncFromViewport(): void {
    if (!this.scrollContainer) return;
    this.isSyncing = true;
    const rect = this.controller.getViewportRect();
    const zoom = this.controller.getState().zoom;
    this.scrollContainer.scrollLeft = rect.x * zoom;
    this.scrollContainer.scrollTop = rect.y * zoom;
    this.isSyncing = false;
  }

  private onScroll(): void {
    if (this.isSyncing || !this.scrollContainer) return;
    const zoom = this.controller.getState().zoom;
    if (zoom === 0) return;
    const dx = this.scrollContainer.scrollLeft / zoom;
    const dy = this.scrollContainer.scrollTop / zoom;
    const rect = this.controller.getViewportRect();
    const deltaX = (dx - rect.x) * zoom;
    const deltaY = (dy - rect.y) * zoom;
    this.controller.panBy(deltaX, deltaY);
  }
}
