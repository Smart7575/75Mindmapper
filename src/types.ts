export type NodeShape = 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'diamond' | 'hexagon' | 'cloud' | 'star' | 'arrow';
export type ThemeId = 'default' | 'retro-terminal' | 'elegant-warm' | 'playful-bubble';

export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: NodeShape;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  textColor: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  icon?: string;
  level?: number;
}

export type Side = 'top' | 'right' | 'bottom' | 'left';

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceSide?: Side;
  targetSide?: Side;
  label?: string;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  curve: number; // 0 for straight, > 0 for curved
  arrowStart: boolean;
  arrowEnd: boolean;
}

export interface MindMap {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodes: Node[];
  edges: Edge[];
  theme?: ThemeId;
}

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}
