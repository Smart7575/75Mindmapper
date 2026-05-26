import React, { useState, useEffect, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Node, Edge, MindMap, NodeShape, Side, ThemeId } from './types';
import MindMapCanvas from './components/Canvas/MindMapCanvas';
import OutlineView from './components/UI/OutlineView';
import Toolbar, { ViewMode } from './components/UI/Toolbar';
import Sidebar from './components/UI/Sidebar';
import Dashboard from './components/UI/Dashboard';
import { createInitialMap, loadMaps, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from './store/utils';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import AuthScreen from './components/UI/AuthScreen';
import { Loader2 } from 'lucide-react';
import { useLanguage } from './lib/i18n';
import { getThemeNodeStyles, getThemeCanvasBg, getThemeFontClass } from './lib/themes';

export default function App() {
  const { t, language } = useLanguage();
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newlyCreatedNodeId, setNewlyCreatedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [outlineWidth, setOutlineWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const GRID_SIZE = 20;

  const snap = (val: number) => {
    return snapToGrid ? Math.round(val / GRID_SIZE) * GRID_SIZE : val;
  };

  const currentMap = maps.find(m => m.id === currentMapId);

  const addToHistory = useCallback(() => {
    if (!currentMap) return;
    setHistory(prev => [...prev.slice(-49), { nodes: JSON.parse(JSON.stringify(currentMap.nodes)), edges: JSON.parse(JSON.stringify(currentMap.edges)) }]);
    setRedoStack([]);
  }, [currentMap]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || !currentMapId || !currentMap) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setRedoStack(prev => [...prev, { nodes: currentMap.nodes, edges: currentMap.edges }]);
    setHistory(newHistory);

    setMaps(prev => prev.map(m => m.id === currentMapId ? { ...m, nodes: previous.nodes, edges: previous.edges } : m));
  }, [history, currentMap, currentMapId]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !currentMapId || !currentMap) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    
    setHistory(prev => [...prev, { nodes: currentMap.nodes, edges: currentMap.edges }]);
    setRedoStack(newRedo);

    setMaps(prev => prev.map(m => m.id === currentMapId ? { ...m, nodes: next.nodes, edges: next.edges } : m));
  }, [redoStack, currentMap, currentMapId]);

  // Synchronise authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Synchronise maps with Firestore in real-time
  useEffect(() => {
    if (!currentUser) {
      setMaps([]);
      return;
    }

    const q = query(
      collection(db, 'users', currentUser.uid, 'mindmaps')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;

      const loadedMaps: MindMap[] = [];
      snapshot.forEach((docSnap) => {
        loadedMaps.push(docSnap.data() as MindMap);
      });
      setMaps(loadedMaps);
    }, (error) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      setSaveStatus('Sync Error: ' + errMsg);
      handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/mindmaps`);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updateMaps = useCallback((newMap: MindMap) => {
    if (!currentUser) return;
    const securedMap = { ...newMap, ownerId: currentUser.uid, updatedAt: Date.now() };

    setMaps(prev => {
      return prev.map(m => m.id === securedMap.id ? securedMap : m);
    });

    setSaveStatus('Saving...');
    setDoc(doc(db, 'users', currentUser.uid, 'mindmaps', securedMap.id), securedMap)
      .then(() => setSaveStatus('Saved'))
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        setSaveStatus('Error saving: ' + errMsg);
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/mindmaps/${securedMap.id}`);
      });
  }, [currentUser]);

  const handleUpdateEdge = (update: Partial<Edge>) => {
    if (!currentMap || !update.id) return;
    const newMap = {
      ...currentMap,
      edges: currentMap.edges.map(e => e.id === update.id ? { ...e, ...update } as Edge : e)
    };
    updateMaps(newMap);
  };

  const handleAddEdge = (sourceId: string, targetId: string, sourceSide?: Side, targetSide?: Side) => {
    if (!currentMap || sourceId === targetId) return;
    addToHistory();
    if (currentMap.edges.find(e => 
      e.sourceId === sourceId && 
      e.targetId === targetId && 
      e.sourceSide === sourceSide && 
      e.targetSide === targetSide
    )) return;

    const sourceNode = currentMap.nodes.find(n => n.id === sourceId);
    
    const newEdge: Edge = {
      id: 'edge-' + Math.random().toString(36).substr(2, 9),
      sourceId,
      targetId,
      sourceSide,
      targetSide,
      color: sourceNode ? sourceNode.borderColor : '#94a3b8',
      width: 1.5,
      style: 'solid',
      curve: 1,
      arrowStart: false,
      arrowEnd: true
    };

    const newMap = {
      ...currentMap,
      edges: [...currentMap.edges, newEdge],
      updatedAt: Date.now()
    };
    updateMaps(newMap);
  };

  const handleAddNode = useCallback((x: number, y: number, mode: 'child' | 'sibling' = 'child', targetParentId?: string) => {
    if (!currentMap) return;
    addToHistory();

    const effectiveSelectedId = targetParentId || selectedId;
    const selectedNode = effectiveSelectedId ? currentMap.nodes.find(n => n.id === effectiveSelectedId) : null;
    let parent = selectedNode || currentMap.nodes[0]; // Default to root if nothing selected
    
    if (mode === 'sibling' && selectedNode && !selectedNode.id.includes('root')) {
      const parentEdge = currentMap.edges.find(e => e.targetId === selectedNode.id);
      if (parentEdge) {
        const foundParent = currentMap.nodes.find(n => n.id === parentEdge.sourceId);
        if (foundParent) parent = foundParent;
      }
    }

    const level = parent ? (parent.level || 0) + 1 : 0;
    
    // Tiered coloring
    const getLevelStyle = (lvl: number) => {
      switch (lvl) {
        case 0: return { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' };
        case 1: return { bg: '#dcfce7', border: '#16a34a', text: '#14532d' };
        case 2: return { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95' };
        case 3: return { bg: '#ffedd5', border: '#ea580c', text: '#713f12' };
        case 4: return { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d' };
        default: return { bg: '#fef9c3', border: '#ca8a04', text: '#713f12' };
      }
    };
    
    const style = getLevelStyle(level);
    
    // Automatic Positioning
    let newX = snap(x);
    let newY = snap(y);
    let sourceSide: Side = 'right';
    let targetSide: Side = 'left';

    const currentLevel = parent ? (parent.level || 0) : 0;
    const horizontalGap = currentLevel === 0 ? 240 : 180;
    const verticalGap = currentLevel === 0 ? 240 : 180;

    if (parent && x === 0 && y === 0) {
      const parentChildrenEdges = currentMap.edges.filter(e => e.sourceId === parent.id);
      const childCount = parentChildrenEdges.length;

      if (currentLevel === 0) {
        // Distribute around root
        // Use 8 primary directions, but interleave them for outer rings to avoid alignment overlaps
        const baseAngles = [0, Math.PI, Math.PI / 2, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
        const ringIndex = Math.floor(childCount / baseAngles.length);
        const angleInRing = baseAngles[childCount % baseAngles.length];
        
        // Offset every second ring by 22.5 degrees to interleave nodes
        const ringOffset = (ringIndex % 2 === 1) ? Math.PI / 8 : 0;
        const angle = angleInRing + ringOffset;
        
        // Increase distance for outer rings
        const dist = 240 + ringIndex * 120;
        
        newX = snap(parent.x + Math.cos(angle) * dist);
        newY = snap(parent.y + Math.sin(angle) * dist);
      } else {
        const incomingEdge = currentMap.edges.find(e => e.targetId === parent.id);
        const incomingSide = incomingEdge?.targetSide || 'left';
        
        // Growth direction is opposite to relative incoming side
        if (incomingSide === 'left') sourceSide = 'right';
        else if (incomingSide === 'right') sourceSide = 'left';
        else if (incomingSide === 'top') sourceSide = 'bottom';
        else sourceSide = 'top';

        const directionX = sourceSide === 'right' ? 1 : sourceSide === 'left' ? -1 : 0;
        const directionY = sourceSide === 'bottom' ? 1 : sourceSide === 'top' ? -1 : 0;

        newX = snap(parent.x + (directionX !== 0 ? directionX * horizontalGap : 0));
        newY = snap(parent.y + (directionY !== 0 ? directionY * verticalGap : 0));

        // Stack siblings parallel to each other
        if (directionX !== 0) {
          // Alternative around parent center to avoid crossings
          const stackOffset = Math.ceil(childCount / 2) * verticalGap * (childCount % 2 === 0 ? 1 : -1);
          newY = snap(parent.y + stackOffset);
        } else {
          const stackOffset = Math.ceil(childCount / 2) * horizontalGap * (childCount % 2 === 0 ? 1 : -1);
          newX = snap(parent.x + stackOffset);
        }
      }
    }

    // --- UNIVERSAL ROBUST COLLISION DETECTION & RESOLUTION ---
    // Ensure no exact overlap with existing nodes
    let collision = true;
    let safetyCounter = 0;
    const forbiddenXRange = 175; // Adjusted to allow nodes at 180px center-to-center
    const forbiddenYRange = 75;  
    
    const initialX = newX;
    const initialY = newY;
    
    let growDirX = 0;
    let growDirY = 0;
    
    if (parent) {
      const dx = initialX - parent.x;
      const dy = initialY - parent.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        growDirX = dx >= 0 ? 1 : -1;
      } else {
        growDirY = dy >= 0 ? 1 : -1;
      }
    } else {
      growDirX = 1;
    }

    while (collision && safetyCounter < 50) {
      collision = currentMap.nodes.some(n => Math.abs(n.x - newX) < forbiddenXRange && Math.abs(n.y - newY) < forbiddenYRange);
      if (collision) {
        const step = safetyCounter + 1;
        
        if (growDirX !== 0) {
          // Growing Horizontally
          const xStepCount = Math.ceil(step / 3);
          const yOffsetType = step % 3; // 0 = original level, 1 = up, 2 = down
          
          newX = initialX + growDirX * xStepCount * horizontalGap;
          if (yOffsetType === 0) {
            newY = initialY;
          } else if (yOffsetType === 1) {
            newY = initialY - verticalGap;
          } else {
            newY = initialY + verticalGap;
          }
        } else {
          // Growing Vertically
          const yStepCount = Math.ceil(step / 3);
          const xOffsetType = step % 3; // 0 = original level, 1 = left, 2 = right
          
          newY = initialY + growDirY * yStepCount * verticalGap;
          if (xOffsetType === 0) {
            newX = initialX;
          } else if (xOffsetType === 1) {
            newX = initialX - horizontalGap;
          } else {
            newX = initialX + horizontalGap;
          }
        }
        
        newX = snap(newX);
        newY = snap(newY);
      }
      safetyCounter++;
    }

    // Dynamic Connection Side Alignment based on final positions
    if (parent) {
      const dx = newX - parent.x;
      const dy = newY - parent.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          sourceSide = 'right';
          targetSide = 'left';
        } else {
          sourceSide = 'left';
          targetSide = 'right';
        }
      } else {
        if (dy > 0) {
          sourceSide = 'bottom';
          targetSide = 'top';
        } else {
          sourceSide = 'top';
          targetSide = 'bottom';
        }
      }
    }

    const newNode: Node = {
      id: 'node-' + Math.random().toString(36).substr(2, 9),
      text: '',
      x: newX,
      y: newY,
      width: DEFAULT_NODE_WIDTH,
      height: level === 0 ? 80 : DEFAULT_NODE_HEIGHT,
      shape: 'rounded-rectangle',
      backgroundColor: style.bg,
      borderColor: style.border,
      borderWidth: level === 0 ? 2 : 1.5,
      borderStyle: 'solid',
      textColor: style.text,
      fontSize: level === 0 ? 16 : level === 1 ? 14 : 13,
      fontWeight: level === 0 ? '600' : '400',
      fontStyle: 'normal',
      textDecoration: 'none',
      level
    };

    const newMap: MindMap = {
      ...currentMap,
      nodes: [...currentMap.nodes, newNode],
      updatedAt: Date.now()
    };

    // Auto-connect
    if (parent) {
      const newEdge: Edge = {
        id: 'edge-' + Math.random().toString(36).substr(2, 9),
        sourceId: parent.id,
        targetId: newNode.id,
        sourceSide,
        targetSide,
        color: style.border,
        width: 1.5,
        style: 'solid',
        curve: 0.5,
        arrowStart: false,
        arrowEnd: true
      };
      newMap.edges = [...newMap.edges, newEdge];
    }

    updateMaps(newMap);
    setSelectedId(newNode.id);
    setNewlyCreatedNodeId(newNode.id);
  }, [currentMap, selectedId, snapToGrid, updateMaps]);

  const handleMoveNode = (id: string, x: number, y: number) => {
    if (!currentMap) return;
    const newMap = {
      ...currentMap,
      nodes: currentMap.nodes.map(n => n.id === id ? { ...n, x, y } : n)
    };
    updateMaps(newMap);
  };

  const handleUpdateNode = (update: Partial<Node>) => {
    if (!currentMap || !update.id) return;
    // Don't add text changes to history continuously, maybe handled on blur?
    // For now, let's allow it for simpler implementation or handle it elsewhere
    const newMap = {
      ...currentMap,
      nodes: currentMap.nodes.map(n => n.id === update.id ? { ...n, ...update } as Node : n)
    };
    updateMaps(newMap);
  };

  const handleCreateNewMap = async (name?: string) => {
    if (!currentUser) return;
    const newMap = createInitialMap(name);
    const securedMap = { ...newMap, ownerId: currentUser.uid };

    setMaps(prev => [...prev, securedMap]);
    setCurrentMapId(securedMap.id);
    setSelectedId(securedMap.nodes[0].id);
    setNewlyCreatedNodeId(securedMap.nodes[0].id);
    setShowDashboard(false);

    try {
      setSaveStatus('Saving...');
      await setDoc(doc(db, 'users', currentUser.uid, 'mindmaps', securedMap.id), securedMap);
      setSaveStatus('Saved');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSaveStatus('Error creating: ' + errMsg);
      handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/mindmaps/${securedMap.id}`);
    }
  };

  const handleDeleteMap = async (id: string) => {
    if (!currentUser) return;

    setMaps(prev => prev.filter(m => m.id !== id));
    if (currentMapId === id) {
      setCurrentMapId(null);
      setShowDashboard(true);
    }

    try {
      setSaveStatus('Saving...');
      await deleteDoc(doc(db, 'users', currentUser.uid, 'mindmaps', id));
      setSaveStatus('Saved');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSaveStatus('Error deleting: ' + errMsg);
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/mindmaps/${id}`);
    }
  };

  const handleOpenMap = (id: string) => {
    setCurrentMapId(id);
    setShowDashboard(false);
  };

  const handleImportJSON = async (jsonContent: string) => {
    if (!currentUser) return;
    try {
      const parsed = JSON.parse(jsonContent);
      let importedMaps: any[] = [];
      if (Array.isArray(parsed)) {
        importedMaps = parsed;
      } else if (parsed && typeof parsed === 'object') {
        importedMaps = [parsed];
      }

      const validMaps: MindMap[] = [];

      for (const item of importedMaps) {
        if (item && typeof item === 'object' && Array.isArray(item.nodes)) {
          const mapId = 'map-' + Math.random().toString(36).substr(2, 9);
          const newMap: MindMap = {
            id: mapId,
            name: item.name || (language === 'en' ? 'Imported Mind Map' : 'Geïmporteerde Mind Map'),
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            updatedAt: Date.now(),
            nodes: item.nodes,
            edges: Array.isArray(item.edges) ? item.edges : [],
            theme: item.theme || 'default',
          };
          validMaps.push(newMap);
        }
      }

      if (validMaps.length === 0) {
        alert(t('import_invalid_file'));
        return;
      }

      setMaps(prev => {
        const filteredPrev = prev.filter(m => !validMaps.some(vm => vm.id === m.id));
        return [...filteredPrev, ...validMaps];
      });

      setSaveStatus('Saving...');
      for (const map of validMaps) {
        await setDoc(doc(db, 'users', currentUser.uid, 'mindmaps', map.id), {
          ...map,
          ownerId: currentUser.uid
        });
      }
      setSaveStatus('Saved');
      
      alert(t('import_success'));
      
      if (validMaps.length > 0) {
        handleOpenMap(validMaps[0].id);
      }
    } catch (e) {
      console.error('Import error:', e);
      alert(t('import_error'));
    }
  };

  const handleRenameMap = (name: string) => {
    if (!currentMap) return;
    updateMaps({ ...currentMap, name, updatedAt: Date.now() });
  };

  const handleThemeChange = (newTheme: ThemeId) => {
    if (!currentMap) return;
    updateMaps({ ...currentMap, theme: newTheme, updatedAt: Date.now() });
  };

  const handleExport = async (format: string) => {
    if (!currentMap) return;

    const fileName = currentMap.name.toLowerCase().replace(/\s+/g, '-');

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(currentMap, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'markdown') {
      const buildMarkdown = (parentId: string | null = null, depth: number = 0): string => {
        let childNodes: Node[] = [];
        if (parentId === null) {
          const targetIds = new Set(currentMap.edges.map(e => e.targetId));
          childNodes = currentMap.nodes.filter(n => !targetIds.has(n.id));
          if (childNodes.length === 0 && currentMap.nodes.length > 0) childNodes = [currentMap.nodes[0]];
        } else {
          const childIds = new Set(currentMap.edges.filter(e => e.sourceId === parentId).map(e => e.targetId));
          childNodes = currentMap.nodes.filter(n => childIds.has(n.id));
        }

        return childNodes.map(node => {
          const indent = '  '.repeat(depth);
          const prefix = depth === 0 ? '# ' : depth === 1 ? '## ' : '- ';
          const current = `${indent}${prefix}${node.text || '(Leeg onderwerp)'}\n`;
          return current + buildMarkdown(node.id, depth + 1);
        }).join('');
      };

      const markdown = buildMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // For visual exports, we need the SVG container
    const container = document.getElementById('svg-container');
    if (!container) return;

    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Compute bounding box of all nodes
    const nodes = currentMap.nodes;
    if (nodes.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + node.width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + node.height);
    });

    // Padding around the exported mindmap
    const padding = 100;
    const exportX = minX - padding;
    const exportY = minY - padding;
    const exportW = (maxX - minX) + (padding * 2);
    const exportH = (maxY - minY) + (padding * 2);

    // Change background color matching the active theme!
    let exportBgColor = '#ffffff';
    if (currentMap.theme === 'retro-terminal') {
      exportBgColor = '#05070f';
    } else if (currentMap.theme === 'elegant-warm') {
      exportBgColor = '#FDFBF7';
    } else if (currentMap.theme === 'playful-bubble') {
      exportBgColor = '#FAF9FF';
    }

    // Save original states of container to properly restore them afterwards
    const originalContainerStyle = {
      position: container.style.position,
      left: container.style.left,
      top: container.style.top,
      width: container.style.width,
      height: container.style.height,
      zIndex: container.style.zIndex,
      overflow: container.style.overflow,
    };

    // Save original state of SVG
    const originalSvgAttrs = {
      viewBox: svgElement.getAttribute('viewBox'),
      width: svgElement.getAttribute('width'),
      height: svgElement.getAttribute('height'),
    };
    const originalSvgStyle = {
      width: svgElement.style.width,
      height: svgElement.style.height,
      position: svgElement.style.position,
      left: svgElement.style.left,
      top: svgElement.style.top,
    };

    // Save states of overlay controls (everything except SVG) to temporarily hide them
    const overlays = Array.from(container.children).filter(child => child.tagName.toLowerCase() !== 'svg');
    const originalDisplays = overlays.map(el => {
      const hEl = el as HTMLElement;
      return { element: hEl, display: hEl.style.display };
    });

    // Save background grid pattern rect dimensions
    const bgRect = svgElement.querySelector('rect[fill="url(#dynamic-grid)"]');
    const originalBgRectAttrs = bgRect ? {
      x: bgRect.getAttribute('x'),
      y: bgRect.getAttribute('y'),
      width: bgRect.getAttribute('width'),
      height: bgRect.getAttribute('height'),
    } : null;

    // Elements we mutate temporarily to ensure consistent text colors during export
    const mutatedElements: { element: HTMLElement; originalColor: string; originalFill: string }[] = [];

    try {
      // 1. Instantly hide UI overlay controls (minimap, zoom buttons, FAB, toolbar, etc.)
      overlays.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // 2. Lock the SVG viewBox and sizing to surround the mindmap bounds perfectly
      svgElement.setAttribute('viewBox', `${exportX} ${exportY} ${exportW} ${exportH}`);
      svgElement.setAttribute('width', `${exportW}`);
      svgElement.setAttribute('height', `${exportH}`);
      
      svgElement.style.width = `${exportW}px`;
      svgElement.style.height = `${exportH}px`;
      svgElement.style.position = 'absolute';
      svgElement.style.left = '0';
      svgElement.style.top = '0';

      // 3. Size and isolate the container in place, positioned far beneath (zIndex -99999) to keep active rendering frames
      container.style.position = 'fixed';
      container.style.left = '0px';
      container.style.top = '0px';
      container.style.width = `${exportW}px`;
      container.style.height = `${exportH}px`;
      container.style.zIndex = '-99999';
      container.style.overflow = 'hidden';

      // 4. Ensure the grid stretches adequately across the expanded viewBox area
      if (bgRect) {
        bgRect.setAttribute('x', `${exportX - 2000}`);
        bgRect.setAttribute('y', `${exportY - 2000}`);
        bgRect.setAttribute('width', `${exportW + 4000}`);
        bgRect.setAttribute('height', `${exportH + 4000}`);
      }

      // 5. Directly override inline style colors/fills of text elements for perfect cross-browser rendering
      // This is 100% reliable for browser rendering with html-to-image/foreignObject and fixes contrast issues.
      currentMap.nodes.forEach(node => {
        const nodeEl = container.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeEl) {
          const textElements = nodeEl.querySelectorAll('div, span, textarea');
          const themeProps = getThemeNodeStyles(currentMap.theme, node, false, false);
          
          // Use whatever textColor is dynamically defined by the theme mapping
          const targetColor = themeProps.textColor;

          textElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            mutatedElements.push({
              element: htmlEl,
              originalColor: htmlEl.style.color,
              originalFill: htmlEl.style.fill
            });
            htmlEl.style.setProperty('color', targetColor, 'important');
            htmlEl.style.setProperty('fill', targetColor, 'important');
          });
        }
      });

      // Target connection line labels to preserve correct contrast
      const edgeLabels = container.querySelectorAll('.edge-label-span, span.edge-label-span');
      edgeLabels.forEach(el => {
        const htmlEl = el as HTMLElement;
        mutatedElements.push({
          element: htmlEl,
          originalColor: htmlEl.style.color,
          originalFill: htmlEl.style.fill
        });
        const labelColor = currentMap.theme === 'retro-terminal' ? '#10b981' : '#64748b';
        htmlEl.style.setProperty('color', labelColor, 'important');
      });

      // 6. Trigger download based on requested format
      if (format === 'svg') {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }

      else if (format === 'png') {
        const dataUrl = await htmlToImage.toPng(container, {
          backgroundColor: exportBgColor,
          width: exportW,
          height: exportH,
          quality: 1.0,
          pixelRatio: 2 // Crisp Retina quality
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${fileName}.png`;
        a.click();
      }

      else if (format === 'pdf') {
        const dataUrl = await htmlToImage.toPng(container, {
          backgroundColor: exportBgColor,
          width: exportW,
          height: exportH,
          quality: 0.95,
          pixelRatio: 2
        });
        
        const pdf = new jsPDF({
          orientation: exportW > exportH ? 'landscape' : 'portrait',
          unit: 'px',
          format: [exportW, exportH]
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, exportW, exportH);
        pdf.save(`${fileName}.pdf`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'nl' ? 'Export mislukt. Probeer het opnieuw.' : 'Export failed. Please try again.');
    } finally {
      // Restore mutated inline style elements
      mutatedElements.forEach(item => {
        if (item.originalColor) {
          item.element.style.setProperty('color', item.originalColor);
        } else {
          item.element.style.removeProperty('color');
        }
        if (item.originalFill) {
          item.element.style.setProperty('fill', item.originalFill);
        } else {
          item.element.style.removeProperty('fill');
        }
      });

      // 6. Restore Container styles instantly to its flexible React layout position
      container.style.position = originalContainerStyle.position;
      container.style.left = originalContainerStyle.left;
      container.style.top = originalContainerStyle.top;
      container.style.width = originalContainerStyle.width;
      container.style.height = originalContainerStyle.height;
      container.style.zIndex = originalContainerStyle.zIndex;
      container.style.overflow = originalContainerStyle.overflow;

      // Restore SVG attributes
      if (originalSvgAttrs.viewBox) svgElement.setAttribute('viewBox', originalSvgAttrs.viewBox);
      else svgElement.removeAttribute('viewBox');

      if (originalSvgAttrs.width) svgElement.setAttribute('width', originalSvgAttrs.width);
      else svgElement.removeAttribute('width');

      if (originalSvgAttrs.height) svgElement.setAttribute('height', originalSvgAttrs.height);
      else svgElement.removeAttribute('height');

      // Restore SVG styles
      svgElement.style.width = originalSvgStyle.width;
      svgElement.style.height = originalSvgStyle.height;
      svgElement.style.position = originalSvgStyle.position;
      svgElement.style.left = originalSvgStyle.left;
      svgElement.style.top = originalSvgStyle.top;

      // Restore background rect attributes
      if (bgRect && originalBgRectAttrs) {
        if (originalBgRectAttrs.x) bgRect.setAttribute('x', originalBgRectAttrs.x);
        if (originalBgRectAttrs.y) bgRect.setAttribute('y', originalBgRectAttrs.y);
        if (originalBgRectAttrs.width) bgRect.setAttribute('width', originalBgRectAttrs.width);
        if (originalBgRectAttrs.height) bgRect.setAttribute('height', originalBgRectAttrs.height);
      }

      // Restore visibility/display of overlays
      originalDisplays.forEach(item => {
        item.element.style.display = item.display;
      });
    }
  };

  const handleAIExpand = async (id: string) => {
    if (!currentMap) return;
    const node = currentMap.nodes.find(n => n.id === id);
    if (!node) return;

    try {
      const response = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentMap.name, contextNode: node }),
      });
      
      const { suggestions } = await response.json();
      
      if (suggestions && suggestions.length > 0) {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        
        suggestions.forEach((s: any, i: number) => {
          const angle = (2 * Math.PI * i) / suggestions.length;
          const radius = 250;
          
          const newNode: Node = {
            id: 'node-' + Math.random().toString(36).substr(2, 9),
            text: s.text,
            x: snap(node.x + Math.cos(angle) * radius),
            y: snap(node.y + Math.sin(angle) * radius),
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            shape: node.shape,
            backgroundColor: node.backgroundColor,
            borderColor: node.borderColor,
            borderWidth: node.borderWidth,
            borderStyle: 'solid',
            textColor: node.textColor,
            fontSize: 13,
            fontWeight: '400',
            fontStyle: 'normal',
            textDecoration: 'none'
          };
          
          const newEdge: Edge = {
            id: 'edge-' + Math.random().toString(36).substr(2, 9),
            sourceId: node.id,
            targetId: newNode.id,
            color: node.borderColor,
            width: 1.5,
            style: 'solid',
            curve: 1,
            arrowStart: false,
            arrowEnd: true
          };
          
          newNodes.push(newNode);
          newEdges.push(newEdge);
        });

        const newMap = {
          ...currentMap,
          nodes: [...currentMap.nodes, ...newNodes],
          edges: [...currentMap.edges, ...newEdges],
          updatedAt: Date.now()
        };
        updateMaps(newMap);
      }
    } catch (error) {
      console.error('AI Error:', error);
    }
  };

  const applyRadialLayout = () => {
    if (!currentMap) return;
    addToHistory();
    
    const root = currentMap.nodes.find(n => n.id.includes('root')) || currentMap.nodes[0];
    if (!root) return;

    // We'll work on a deep copy to avoid intermediate state issues
    const nodes = JSON.parse(JSON.stringify(currentMap.nodes)) as Node[];
    const edges = JSON.parse(JSON.stringify(currentMap.edges)) as Edge[];
    const positionedIds = new Set([root.id]);
    
    const repositionSubtree = (parentId: string, level: number) => {
      const parent = nodes.find(n => n.id === parentId)!;
      const childEdges = edges.filter(e => e.sourceId === parentId);
      
      const hGap = level === 0 ? 240 : 180;
      const vGap = level === 0 ? 240 : 180;

      childEdges.forEach((edge, i) => {
        const child = nodes.find(n => n.id === edge.targetId);
        // Important: avoid cycles or re-positioning same node from different paths
        if (!child || positionedIds.has(child.id)) return;

        let newX = 0, newY = 0, sourceSide: Side = 'right', targetSide: Side = 'left';

        if (level === 0) {
          // Root distribution logic
          const baseAngles = [0, Math.PI, Math.PI / 2, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
          const ringIndex = Math.floor(i / baseAngles.length);
          const angleInRing = baseAngles[i % baseAngles.length];
          const ringOffset = (ringIndex % 2 === 1) ? Math.PI / 8 : 0;
          const angle = angleInRing + ringOffset;
          const dist = 240 + ringIndex * 120;

          newX = snap(parent.x + Math.cos(angle) * dist);
          newY = snap(parent.y + Math.sin(angle) * dist);

          if (Math.abs(angle) < 0.1) { sourceSide = 'right'; targetSide = 'left'; }
          else if (Math.abs(angle - Math.PI/2) < 0.1) { sourceSide = 'bottom'; targetSide = 'top'; }
          else if (Math.abs(angle - Math.PI) < 0.1) { sourceSide = 'left'; targetSide = 'right'; }
          else if (Math.abs(angle - 3*Math.PI/2) < 0.1) { sourceSide = 'top'; targetSide = 'bottom'; }
          else {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            if (Math.abs(cos) > Math.abs(sin)) {
              sourceSide = cos > 0 ? 'right' : 'left';
              targetSide = cos > 0 ? 'left' : 'right';
            } else {
              sourceSide = sin > 0 ? 'bottom' : 'top';
              targetSide = sin > 0 ? 'top' : 'bottom';
            }
          }
        } else {
          // Deeper level positioning logic: follow parent's growth direction
          const incomingEdge = edges.find(e => e.targetId === parent.id);
          const incomingSide = incomingEdge?.targetSide || 'left';
          
          if (incomingSide === 'left') sourceSide = 'right';
          else if (incomingSide === 'right') sourceSide = 'left';
          else if (incomingSide === 'top') sourceSide = 'bottom';
          else sourceSide = 'top';

          const directionX = sourceSide === 'right' ? 1 : sourceSide === 'left' ? -1 : 0;
          const directionY = sourceSide === 'bottom' ? 1 : sourceSide === 'top' ? -1 : 0;

          newX = snap(parent.x + (directionX !== 0 ? directionX * hGap : 0));
          newY = snap(parent.y + (directionY !== 0 ? directionY * vGap : 0));

          // Parallel stacking
          if (directionX !== 0) {
            const stackOffset = Math.ceil((i+1) / 2) * vGap * ((i+1) % 2 === 0 ? 1 : -1);
            newY = snap(parent.y + stackOffset * 1.1); 
          } else {
            const stackOffset = Math.ceil((i+1) / 2) * hGap * ((i+1) % 2 === 0 ? 1 : -1);
            newX = snap(parent.x + stackOffset * 1.1);
          }

          if (sourceSide === 'right') targetSide = 'left';
          else if (sourceSide === 'left') targetSide = 'right';
          else if (sourceSide === 'top') targetSide = 'bottom';
          else targetSide = 'top';
        }

        // Collision check against ALREADY positioned nodes in this run
        let collision = true;
        let safetyCounter = 0;
        const forbiddenXRange = 170;
        const forbiddenYRange = 70;
        
        while (collision && safetyCounter < 30) {
          collision = nodes.some(n => positionedIds.has(n.id) && Math.abs(n.x - newX) < forbiddenXRange && Math.abs(n.y - newY) < forbiddenYRange);
          if (collision) {
            const dx = (newX - parent.x) || (sourceSide === 'right' ? 1 : -1);
            const dy = (newY - parent.y) || (sourceSide === 'bottom' ? 1 : -1);
            if (Math.abs(dx) > Math.abs(dy)) {
              newX += (dx >= 0 ? 1 : -1) * 40;
              newY += vGap / 2 * (safetyCounter % 2 === 0 ? 1 : -1);
            } else {
              newY += (dy >= 0 ? 1 : -1) * 40;
              newX += hGap / 4 * (safetyCounter % 2 === 0 ? 1 : -1);
            }
            newX = snap(newX);
            newY = snap(newY);
          }
          safetyCounter++;
        }


        // Apply placement
        child.x = newX;
        child.y = newY;
        child.level = level + 1;
        edge.sourceSide = sourceSide;
        edge.targetSide = targetSide;
        positionedIds.add(child.id);

        // Recurse down
        repositionSubtree(child.id, level + 1);
      });
    };

    repositionSubtree(root.id, 0);
    
    updateMaps({ ...currentMap, nodes, edges, updatedAt: Date.now() });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === 'Tab' && selectedId && currentMap) {
        e.preventDefault();
        handleAddNode(0, 0, 'child');
      }

      if (e.key === 'Enter' && selectedId && currentMap) {
        e.preventDefault();
        handleAddNode(0, 0, 'sibling');
      }

      if (e.key === 'Delete' && selectedId && currentMap) {
        addToHistory();
        const node = currentMap.nodes.find(n => n.id === selectedId);
        if (node) {
          const newMap = {
            ...currentMap,
            nodes: currentMap.nodes.filter(n => n.id !== selectedId),
            edges: currentMap.edges.filter(ed => ed.sourceId !== selectedId && ed.targetId !== selectedId)
          };
          updateMaps(newMap);
          setSelectedId(null);
        }
      }

      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, currentMap, handleAddNode, updateMaps]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < window.innerWidth * 0.7) {
        setOutlineWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <span className="text-sm font-bold text-slate-500 font-mono tracking-widest uppercase animate-pulse">Laden van account...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={() => setShowDashboard(true)} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-900 bg-white selection:bg-blue-100">
      <Toolbar 
        currentMap={currentMap}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDashboard={() => setShowDashboard(true)}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddNode={() => handleAddNode(0, 0)}
        onAutoLayout={applyRadialLayout}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onRenameMap={handleRenameMap}
        theme={currentMap?.theme || 'default'}
        onThemeChange={handleThemeChange}
        userEmail={currentUser?.email}
        onSignOut={() => signOut(auth)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <main className={`flex-1 relative flex overflow-hidden ${viewMode === 'split' ? '' : ''}`}>
          {(viewMode === 'map' || viewMode === 'split') && (
            <div className="relative h-full flex-1 overflow-hidden">
              {currentMap ? (
                <MindMapCanvas 
                  nodes={currentMap.nodes}
                  edges={currentMap.edges}
                  selectedId={selectedId}
                  selectedEdgeId={selectedEdgeId}
                  onSelect={(id) => { 
                    setSelectedId(id); 
                    setSelectedEdgeId(null); 
                    if (id !== newlyCreatedNodeId) {
                      setNewlyCreatedNodeId(null);
                    }
                  }}
                  onSelectEdge={(id) => { setSelectedEdgeId(id); setSelectedId(null); }}
                  onMoveNode={handleMoveNode}
                  onAddNode={handleAddNode}
                  onUpdateNode={handleUpdateNode}
                  onAddEdge={handleAddEdge}
                  snapToGrid={snapToGrid}
                  newlyCreatedNodeId={newlyCreatedNodeId}
                  theme={currentMap?.theme || 'default'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <p className="text-slate-400 mb-4 font-mono text-sm uppercase tracking-widest text-balance">
                      {language === 'nl' ? 'Selecteer of maak een mindmap om te beginnen' : 'Select or create a mind map to begin'}
                    </p>
                    <button 
                      onClick={() => setShowDashboard(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer"
                    >
                      {language === 'nl' ? 'Open Dashboard' : 'Open Dashboard'}
                    </button>
                  </div>
                </div>
              )}

              {/* Keyboard Shortcuts Legend */}
              {currentMap && (
                <div className="absolute bottom-36 left-6 flex flex-col gap-2 pointer-events-none select-none z-20 hidden xl:flex">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      {language === 'nl' ? 'Sneltoetsen' : 'Keyboard Shortcuts'}
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-semibold text-slate-500">
                          {language === 'nl' ? 'Sub-onderwerp' : 'Subtopic'}
                        </span>
                        <kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-[10px] font-mono font-bold min-w-[48px] text-center text-slate-700">TAB</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-semibold text-slate-500">
                          {language === 'nl' ? 'Zelfde niveau' : 'Same sibling level'}
                        </span>
                        <kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-[10px] font-mono font-bold min-w-[48px] text-center text-slate-700">ENTER</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-xs font-semibold text-slate-500">
                          {language === 'nl' ? 'Verwijderen' : 'Delete'}
                        </span>
                        <kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-[10px] font-mono font-bold min-w-[48px] text-center text-slate-700">DEL</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'split' && (
            <div 
              onMouseDown={startResizing}
              className={`w-1.5 h-full cursor-col-resize hover:bg-blue-400/30 active:bg-blue-500/50 transition-colors z-30 shrink-0 ${isResizing ? 'bg-blue-500/50' : 'bg-slate-200'}`}
            />
          )}

          {(viewMode === 'outline' || viewMode === 'split') && (
            <div 
              className="h-full bg-slate-50/30 shrink-0"
              style={{ width: viewMode === 'split' ? `${outlineWidth}px` : '100%' }}
            >
              {currentMap ? (
                <OutlineView 
                  currentMap={currentMap}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onUpdateNode={handleUpdateNode}
                  onAddNode={(parentId, mode) => {
                    handleAddNode(0, 0, mode, parentId);
                  }}
                  onDeleteNode={(id) => {
                    addToHistory();
                    const newMap = {
                      ...currentMap,
                      nodes: currentMap.nodes.filter(n => n.id !== id),
                      edges: currentMap.edges.filter(e => e.sourceId !== id && e.targetId !== id)
                    };
                    updateMaps(newMap);
                    if (selectedId === id) setSelectedId(null);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-l border-slate-100 italic text-slate-400">
                   {language === 'nl' ? 'Geen kaart geselecteerd' : 'No map selected'}
                </div>
              )}
            </div>
          )}
        </main>

        {(selectedId || selectedEdgeId) && currentMap && (
          <Sidebar 
            selectedNode={currentMap.nodes.find(n => n.id === selectedId)}
            selectedEdge={currentMap.edges.find(e => e.id === selectedEdgeId)}
            onUpdateNode={handleUpdateNode}
            onUpdateEdge={handleUpdateEdge}
            onDeleteNode={(id) => {
              addToHistory();
              const newMap = {
                ...currentMap,
                nodes: currentMap.nodes.filter(n => n.id !== id),
                edges: currentMap.edges.filter(e => e.sourceId !== id && e.targetId !== id)
              };
              updateMaps(newMap);
              setSelectedId(null);
            }}
            onDeleteEdge={(id) => {
              addToHistory();
              const newMap = {
                ...currentMap,
                edges: currentMap.edges.filter(e => e.id !== id)
              };
              updateMaps(newMap);
              setSelectedEdgeId(null);
            }}
            onAIExpand={handleAIExpand}
          />
        )}
      </div>


      {showDashboard && (
        <Dashboard 
          maps={maps}
          onOpen={handleOpenMap}
          onCreate={handleCreateNewMap}
          onDelete={handleDeleteMap}
          onClose={maps.length > 0 ? (() => setShowDashboard(false)) : undefined}
          userEmail={currentUser?.email}
          onSignOut={() => signOut(auth)}
          onImportJSON={handleImportJSON}
        />
      )}

      {/* Footer Status Bar */}
      <footer className="h-9 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-500 font-bold shrink-0 z-10 uppercase tracking-tighter">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] ${saveStatus === 'Error saving' ? 'bg-red-500 shadow-red-500/55' : saveStatus === 'Saving...' ? 'bg-amber-500 shadow-amber-500/55' : 'bg-emerald-500 shadow-emerald-500/55'}`}></span>
            {saveStatus || (language === 'nl' ? 'Cloud Sync Actief' : 'Cloud Sync Active')}
          </span>
          <span className="opacity-60">Snap-to-grid: {snapToGrid ? 'ON' : 'OFF'}</span>
          {currentMap && <span className="opacity-60">{currentMap.nodes.length} Nodes</span>}
        </div>
        <div className="flex items-center gap-4 opacity-40">
           <span>MINDMAPPER ENGINE v2.5.0</span>
        </div>
      </footer>
    </div>
  );
}

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}
