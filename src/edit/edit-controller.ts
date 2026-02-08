import { isGraphDiagram } from '@shared/constants';

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
