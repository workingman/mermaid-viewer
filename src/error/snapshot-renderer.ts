export class SnapshotRenderer {
  private container: HTMLElement;
  private currentSvg: SVGElement | null = null;
  private spinner: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setCurrentSvg(svg: SVGElement | null): void {
    this.currentSvg = svg;
  }

  async createSnapshot(): Promise<HTMLCanvasElement | null> {
    if (!this.currentSvg) return null;
    return rasterizeSvg(this.currentSvg, this.container.ownerDocument);
  }

  async startReRender(): Promise<HTMLCanvasElement | null> {
    const canvas = await this.createSnapshot();
    if (!canvas || !this.currentSvg) return null;
    this.currentSvg.replaceWith(canvas);
    this.currentSvg = null;
    this.showRenderingIndicator();
    return canvas;
  }

  completeReRender(newSvg: SVGElement): void {
    const canvas = this.container.querySelector('canvas');
    if (canvas) {
      newSvg.classList.add('svg-crossfade');
      canvas.replaceWith(newSvg);
    }
    this.currentSvg = newSvg;
    this.hideRenderingIndicator();
  }

  showRenderingIndicator(): void {
    if (this.spinner) return;
    const doc = this.container.ownerDocument;
    this.spinner = doc.createElement('div');
    this.spinner.className = 'render-spinner';
    this.container.appendChild(this.spinner);
  }

  hideRenderingIndicator(): void {
    if (!this.spinner) return;
    this.spinner.remove();
    this.spinner = null;
  }
}

async function rasterizeSvg(svg: SVGElement, doc: Document): Promise<HTMLCanvasElement> {
  const html = svg.outerHTML;
  const blob = new Blob([html], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const response = await fetch(url);
    const fetchedBlob = await response.blob();
    const bitmap = await createImageBitmap(fetchedBlob);
    const canvas = doc.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(bitmap, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
