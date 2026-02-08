import { isGraphDiagram } from '@shared/constants';

const DIRECTIVE_PATTERN = /^%%\{.*\}%%/;
const COMMENT_PATTERN = /^%%(?!\{)/;
const GRAPH_ALIAS = /^graph\b/;
const DIRECTION_SUFFIX = /\s+(TD|TB|LR|RL|BT)\s*$/;

function skipDirectivesAndComments(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (DIRECTIVE_PATTERN.test(trimmed)) continue;
    if (COMMENT_PATTERN.test(trimmed)) continue;
    return trimmed;
  }
  return '';
}

function extractKeyword(firstLine: string): string {
  const cleaned = firstLine.replace(DIRECTION_SUFFIX, '');
  const keyword = cleaned.split(/[\s:{]/)[0];
  return keyword;
}

export function detectDiagramType(mmdText: string): string {
  const lines = mmdText.split('\n');
  const firstLine = skipDirectivesAndComments(lines);
  if (!firstLine) return 'unknown';

  const keyword = extractKeyword(firstLine);
  if (GRAPH_ALIAS.test(keyword)) return 'flowchart';
  return keyword || 'unknown';
}

export function isPassthrough(diagramType: string): boolean {
  return !isGraphDiagram(diagramType);
}
