import type { ViewportState } from '@shared/types';

export type DragCallback = (nodeId: string, x: number, y: number) => void;

interface DragState {
  nodeId: string;
  offsetX: number;
  offsetY: number;
}

let activeDrag: DragState | null = null;
let onDrag: DragCallback | null = null;
let onDragEnd: DragCallback | null = null;
let getViewport: (() => ViewportState) | null = null;

export function setDragCallbacks(
  dragCb: DragCallback,
  dragEndCb: DragCallback,
  viewportFn: () => ViewportState,
): void {
  onDrag = dragCb;
  onDragEnd = dragEndCb;
  getViewport = viewportFn;
}

export function clearDragCallbacks(): void {
  onDrag = null;
  onDragEnd = null;
  getViewport = null;
}

export function screenToDiagram(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
): { x: number; y: number } {
  const x = (screenX - viewport.panX) / viewport.zoom;
  const y = (screenY - viewport.panY) / viewport.zoom;
  return { x, y };
}

export function handleNodeDragStart(nodeId: string, event: PointerEvent): void {
  if (!getViewport) return;
  const viewport = getViewport();
  const diagram = screenToDiagram(event.clientX, event.clientY, viewport);
  const el = event.currentTarget as Element;
  const nodeX = parseTranslateX(el);
  const nodeY = parseTranslateY(el);

  activeDrag = {
    nodeId,
    offsetX: diagram.x - nodeX,
    offsetY: diagram.y - nodeY,
  };

  el.classList.add('node--selected');
  (el as HTMLElement).setPointerCapture(event.pointerId);
}

export function handleNodeDrag(event: PointerEvent): void {
  if (!activeDrag || !getViewport) return;
  const viewport = getViewport();
  const diagram = screenToDiagram(event.clientX, event.clientY, viewport);
  const x = diagram.x - activeDrag.offsetX;
  const y = diagram.y - activeDrag.offsetY;

  const el = event.currentTarget as Element;
  el.setAttribute('transform', `translate(${x},${y})`);
  onDrag?.(activeDrag.nodeId, x, y);
}

export function handleNodeDragEnd(event: PointerEvent): void {
  if (!activeDrag) return;
  const el = event.currentTarget as Element;
  (el as HTMLElement).releasePointerCapture(event.pointerId);
  el.classList.remove('node--selected');

  if (getViewport) {
    const viewport = getViewport();
    const diagram = screenToDiagram(event.clientX, event.clientY, viewport);
    const x = diagram.x - activeDrag.offsetX;
    const y = diagram.y - activeDrag.offsetY;
    onDragEnd?.(activeDrag.nodeId, x, y);
  }

  activeDrag = null;
}

export function isDragging(): boolean {
  return activeDrag !== null;
}

export function resetDragState(): void {
  activeDrag = null;
}

function parseTranslateX(el: Element): number {
  const transform = el.getAttribute('transform') ?? '';
  const match = transform.match(/translate\(([^,]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseTranslateY(el: Element): number {
  const transform = el.getAttribute('transform') ?? '';
  const match = transform.match(/translate\([^,]+,\s*([^)]+)/);
  return match ? parseFloat(match[1]) : 0;
}
