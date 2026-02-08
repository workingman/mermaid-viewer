import { describe, it, expect, beforeEach } from 'vitest';
import {
  enterEditMode,
  exitEditMode,
  isEditing,
  isEditingEnabled,
  handleKeyDown,
  canModifyEdges,
} from './edit-controller';

function mockContainer(): HTMLElement {
  const classes = new Set<string>();
  return {
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
  } as unknown as HTMLElement;
}

function makeKeyEvent(key: string, metaKey: boolean): KeyboardEvent {
  let defaultPrevented = false;
  return {
    key,
    metaKey,
    preventDefault: () => {
      defaultPrevented = true;
    },
    get defaultPrevented() {
      return defaultPrevented;
    },
  } as unknown as KeyboardEvent;
}

describe('isEditingEnabled', () => {
  it('returns true for flowchart', () => {
    expect(isEditingEnabled('flowchart')).toBe(true);
  });

  it('returns true for stateDiagram', () => {
    expect(isEditingEnabled('stateDiagram')).toBe(true);
  });

  it('returns false for sequenceDiagram', () => {
    expect(isEditingEnabled('sequenceDiagram')).toBe(false);
  });

  it('returns false for pie', () => {
    expect(isEditingEnabled('pie')).toBe(false);
  });
});

describe('enterEditMode / exitEditMode', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = mockContainer();
    if (isEditing()) exitEditMode();
  });

  it('adds editing-active class on enter', () => {
    enterEditMode(container);
    expect(container.classList.contains('editing-active')).toBe(true);
    expect(isEditing()).toBe(true);
  });

  it('removes editing-active class on exit', () => {
    enterEditMode(container);
    exitEditMode();
    expect(container.classList.contains('editing-active')).toBe(false);
    expect(isEditing()).toBe(false);
  });
});

describe('handleKeyDown (Cmd+E)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = mockContainer();
    if (isEditing()) exitEditMode();
  });

  it('toggles editing mode on Cmd+E for editable type', () => {
    handleKeyDown(makeKeyEvent('e', true), container, 'flowchart');
    expect(isEditing()).toBe(true);

    handleKeyDown(makeKeyEvent('e', true), container, 'flowchart');
    expect(isEditing()).toBe(false);
  });

  it('ignores Cmd+E for non-editable diagram type', () => {
    handleKeyDown(makeKeyEvent('e', true), container, 'sequenceDiagram');
    expect(isEditing()).toBe(false);
  });
});

describe('canModifyEdges', () => {
  beforeEach(() => {
    if (isEditing()) exitEditMode();
  });

  it('returns true when not in edit mode', () => {
    expect(canModifyEdges()).toBe(true);
  });

  it('returns false when in edit mode', () => {
    enterEditMode(mockContainer());
    expect(canModifyEdges()).toBe(false);
  });
});
