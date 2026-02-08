import type { ELKLayoutOptions } from '@shared/types';

export const ELK_OPTIONS: ELKLayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.nodeNode': '40',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.spacing.edgeEdge': '15',
  'elk.spacing.edgeNode': '20',
  'elk.layered.unnecessaryBendpoints': 'false',
};

export const EDGE_CORNER_RADIUS = 6;

export const EDGE_CROSSING_GAP = 10;

export const EDGE_BRIDGE_RADIUS = 5;
