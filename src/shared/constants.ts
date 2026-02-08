export const APP_NAME = 'Mermaid Viewer' as const;

export const GRAPH_DIAGRAM_TYPES = [
  'flowchart',
  'stateDiagram',
  'classDiagram',
  'erDiagram',
] as const;

export const NON_GRAPH_DIAGRAM_TYPES = ['sequenceDiagram', 'gantt', 'pie', 'gitGraph'] as const;

export function isGraphDiagram(type: string): boolean {
  return (GRAPH_DIAGRAM_TYPES as readonly string[]).includes(type);
}
