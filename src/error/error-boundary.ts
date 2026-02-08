export class ErrorBoundary {
  private cachedSvg: SVGElement | null = null;
  private container: HTMLElement;
  private banner: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  cacheRender(svgElement: SVGElement): void {
    this.cachedSvg = svgElement;
  }

  getLastValidRender(): SVGElement | null {
    return this.cachedSvg;
  }

  showError(message: string): void {
    if (!this.banner) {
      this.banner = createBanner(this.container);
    }
    this.banner.textContent = message;
  }

  clearError(): void {
    if (!this.banner) return;
    this.banner.remove();
    this.banner = null;
  }

  handleRenderSuccess(svgElement: SVGElement): void {
    this.cacheRender(svgElement);
    this.clearError();
  }
}

function createBanner(container: HTMLElement): HTMLElement {
  const banner = container.ownerDocument.createElement('div');
  banner.className = 'error-banner';
  container.prepend(banner);
  return banner;
}
