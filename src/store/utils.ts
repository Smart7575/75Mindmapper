import { Node, Edge, MindMap } from '../types';

export const DEFAULT_NODE_WIDTH = 150;
export const DEFAULT_NODE_HEIGHT = 60;

export const createInitialMap = (name: string = 'Untitled Mind Map'): MindMap => {
  const rootId = 'root-' + Math.random().toString(36).substr(2, 9);
  return {
    id: 'map-' + Math.random().toString(36).substr(2, 9),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes: [
      {
        id: rootId,
        text: '',
        x: 0,
        y: 0,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
        shape: 'rounded-rectangle',
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderStyle: 'solid',
        textColor: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'normal',
        textDecoration: 'none',
        level: 0
      }
    ],
    edges: []
  };
};

export const saveMaps = (maps: MindMap[]) => {
  localStorage.setItem('mindmapper_maps', JSON.stringify(maps));
};

export const loadMaps = (): MindMap[] => {
  const stored = localStorage.getItem('mindmapper_maps');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse maps', e);
    }
  }
  return [];
};
