import { isGraphDiagram } from '@shared/constants';
import { handleNodeDragStart, handleNodeDrag, handleNodeDragEnd, isDragging } from './drag-handler';

export const EDITABLE_DIAGRAM_TYPES = [
  'flowchart',
  'stateDiagram',
  'classDiagram',
  'erDiagram',
] as const;

export function isEditingEnabled(diagramType: string): boolean {
  return isGraphDiagram(diagramType);
}

let editing = false;
let containerEl: HTMLElement | null = null;

export function isEditing(): boolean {
  return editing;
}

export function enterEditMode(container: HTMLElement): void {
  if (editing) return;
  editing = true;
  containerEl = container;
  container.classList.add('editing-active');
}

export function exitEditMode(): void {
  if (!editing) return;
  editing = false;
  containerEl?.classList.remove('editing-active');
  containerEl = null;
}

export function toggleEditMode(container: HTMLElement, diagramType: string): void {
  if (!isEditingEnabled(diagramType)) return;
  if (editing) {
    exitEditMode();
  } else {
    enterEditMode(container);
  }
}

export function handleKeyDown(
  event: KeyboardEvent,
  container: HTMLElement,
  diagramType: string,
): void {
  if (event.metaKey && event.key === 'e') {
    event.preventDefault();
    toggleEditMode(container, diagramType);
  }
}

function findNodeGroup(target: EventTarget | null): Element | null {
  let el = target as Element | null;
  while (el) {
    if (el.closest?.('.node-layer > g')) return el.closest('.node-layer > g');
    el = el.parentElement;
  }
  return null;
}

export function handlePointerDown(event: PointerEvent): void {
  if (!editing) return;
  const nodeGroup = findNodeGroup(event.target);
  if (!nodeGroup) return;
  const nodeId = nodeGroup.getAttribute('data-node-id');
  if (!nodeId) return;
  handleNodeDragStart(nodeId, event);
}

export function handlePointerMove(event: PointerEvent): void {
  if (!editing || !isDragging()) return;
  handleNodeDrag(event);
}

export function handlePointerUp(event: PointerEvent): void {
  if (!editing || !isDragging()) return;
  handleNodeDragEnd(event);
}
