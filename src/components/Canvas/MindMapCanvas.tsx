import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Node, Edge, NodeShape, Side, ThemeId } from '../../types';
import { getPortConfigs } from '../../lib/nodes';
import { getThemeCanvasBg, getThemeFontClass, getThemeGridConfig, getThemeEdgePath, getThemeEdgeStyle } from '../../lib/themes';
import NodeComponent from './NodeComponent';
import EdgeComponent from './EdgeComponent';

interface Props {
  nodes: Node[];
  edges: Edge[];
  selectedId: string | null;
  selectedEdgeId: string | null;
  onSelect: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onAddNode: (x: number, y: number) => void;
  onUpdateNode: (node: Partial<Node>) => void;
  onAddEdge: (sourceId: string, targetId: string, sourceSide?: Side, targetSide?: Side) => void;
  snapToGrid: boolean;
  newlyCreatedNodeId: string | null;
  theme: ThemeId;
}

const MindMapCanvas: React.FC<Props> = ({
  nodes,
  edges,
  selectedId,
  selectedEdgeId,
  onSelect,
  onSelectEdge,
  onMoveNode,
  onAddNode,
  onUpdateNode,
  onAddEdge,
  snapToGrid,
  newlyCreatedNodeId,
  theme
}) => {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingSide, setConnectingSide] = useState<Side | null>(null);
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(null);
  const [connectionTargetSide, setConnectionTargetSide] = useState<Side | null>(null);
  const [dragEdgeTarget, setDragEdgeTarget] = useState<{x: number, y: number} | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const GRID_SIZE = 20;
  const snappedNodes = useMemo(() => {
    if (!snapToGrid) return nodes;
    return nodes.map(n => {
      if (n.id === draggingNodeId) {
        return n; // Keep smooth coordinates during drag to align arrows
      }
      return {
        ...n,
        x: Math.round(n.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(n.y / GRID_SIZE) * GRID_SIZE
      };
    });
  }, [nodes, snapToGrid, draggingNodeId]);

  const [viewBox, setViewBox] = useState({ x: -400, y: -300, w: 800, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchPos, setLastTouchPos] = useState<{x: number, y: number} | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Resize observer to handle container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewBox(prev => ({
          ...prev,
          w: entry.contentRect.width,
          h: entry.contentRect.height
        }));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
    }
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | SVGElement | null;
    if (target && target.closest('[data-node-id]')) {
      return; // Do not pan when touching a node or its ports
    }

    if (e.touches.length === 1) {
      setLastTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsPanning(true);
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      setInitialPinchDistance(dist);
      setIsPanning(false); // Stop panning when zooming
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastTouchPos && isPanning) {
      const dx = e.touches[0].clientX - lastTouchPos.x;
      const dy = e.touches[0].clientY - lastTouchPos.y;
      
      const zoomRatio = viewBox.w / (containerRef.current?.clientWidth || viewBox.w);
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx * zoomRatio,
        y: prev.y - dy * zoomRatio
      }));
      setLastTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDist = getTouchDistance(e.touches);
      if (currentDist) {
        const ratio = initialPinchDistance / currentDist;
        const zoomIntensity = 0.05;
        const delta = ratio > 1 ? 1 + zoomIntensity : 1 - zoomIntensity;

        // Zoom relative to midpoint of touches
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        const svgMidX = (midX / rect.width) * viewBox.w + viewBox.x;
        const svgMidY = (midY / rect.height) * viewBox.h + viewBox.y;

        const newW = viewBox.w * delta;
        const newH = viewBox.h * delta;
        const newX = svgMidX - (midX / rect.width) * newW;
        const newY = svgMidY - (midY / rect.height) * newH;

        setViewBox({ x: newX, y: newY, w: newW, h: newH });
        setInitialPinchDistance(currentDist);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchPos(null);
    setInitialPinchDistance(null);
    
    // Cleanup connections started via touch
    if (connectingFrom) {
       if (connectionTargetId && connectionTargetId !== connectingFrom) {
         onAddEdge(connectingFrom, connectionTargetId, connectingSide || undefined, connectionTargetSide || undefined);
       }
       setConnectingFrom(null);
       setConnectingSide(null);
       setDragEdgeTarget(null);
       setConnectionTargetId(null);
       setConnectionTargetSide(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewBox(prev => ({
        ...prev,
        x: prev.x - e.movementX,
        y: prev.y - e.movementY
      }));
    }

    if (connectingFrom) {
       const rect = svgRef.current?.getBoundingClientRect();
       if (!rect) return;
       const x = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
       const y = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
       setDragEdgeTarget({ x, y });

       // Improved detection: find node under cursor
       const element = document.elementFromPoint(e.clientX, e.clientY);
       const nodeElement = element?.closest('[data-node-id]');
       if (nodeElement) {
         const nodeId = nodeElement.getAttribute('data-node-id');
         if (nodeId && nodeId !== connectingFrom) {
           setConnectionTargetId(nodeId);
           
           // Determine which side is closest to the mouse
           const targetNode = snappedNodes.find(n => n.id === nodeId);
           if (targetNode) {
              const targetX = targetNode.x;
              const targetY = targetNode.y;
              const targetW = targetNode.width;
              const targetH = targetNode.height;
              
              const ports = getPortConfigs(targetNode);
              
              // We want a bit of "gravity" towards the ports
              let minDist = Infinity;
              let bestSide: Side = 'top';
              ports.forEach(p => {
                const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
                if (dist < minDist) {
                  minDist = dist;
                  bestSide = p.side;
                }
              });
              
              // Only snap if we are reasonably close to the node or within it
              setConnectionTargetSide(bestSide);
           }
         } else {
           setConnectionTargetId(null);
           setConnectionTargetSide(null);
         }
       } else {
         // Even if not over a node element (like if over the port circles)
         // search for the closest node if we are within a certain radius of its ports
         let foundNodeId: string | null = null;
         let foundSide: Side | null = null;
         let minPortDist = 30; // Snap radius in px

         snappedNodes.forEach(n => {
           if (n.id === connectingFrom) return;
           const ports = [
             { side: 'top' as Side, x: n.x + n.width / 2, y: n.y },
             { side: 'right' as Side, x: n.x + n.width, y: n.y + n.height / 2 },
             { side: 'bottom' as Side, x: n.x + n.width / 2, y: n.y + n.height },
             { side: 'left' as Side, x: n.x, y: n.y + n.height / 2 }
           ];
           ports.forEach(p => {
             const d = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
             if (d < minPortDist) {
               minPortDist = d;
               foundNodeId = n.id;
               foundSide = p.side;
             }
           });
         });

         if (foundNodeId) {
            setConnectionTargetId(foundNodeId);
            setConnectionTargetSide(foundSide);
         } else {
            setConnectionTargetId(null);
            setConnectionTargetSide(null);
         }
       }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (connectingFrom) {
       if (connectionTargetId && connectionTargetId !== connectingFrom) {
         onAddEdge(connectingFrom, connectionTargetId, connectingSide || undefined, connectionTargetSide || undefined);
       }
       setConnectingFrom(null);
       setConnectingSide(null);
       setDragEdgeTarget(null);
       setConnectionTargetId(null);
       setConnectionTargetSide(null);
    }
  };

  const handleStartConnection = (nodeId: string, side: Side) => {
    setConnectingFrom(nodeId);
    setConnectingSide(side);
    setConnectionTargetId(null);
    setConnectionTargetSide(null);
  };

  const handleCompleteConnection = (targetId: string) => {
    // This is now handled by the global handleMouseUp with checking connectionTargetId
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 40;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          setViewBox(prev => ({ ...prev, x: prev.x - step }));
          break;
        case 'ArrowRight':
          setViewBox(prev => ({ ...prev, x: prev.x + step }));
          break;
        case 'ArrowUp':
          setViewBox(prev => ({ ...prev, x: prev.y - step }));
          break;
        case 'ArrowDown':
          setViewBox(prev => ({ ...prev, y: prev.y + step }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddNodeAtCenter = () => {
    const centerX = viewBox.x + viewBox.w / 2;
    const centerY = viewBox.y + viewBox.h / 2;
    onAddNode(centerX, centerY);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    
    // Zoom relative to mouse position
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const svgMouseX = (mouseX / rect.width) * viewBox.w + viewBox.x;
    const svgMouseY = (mouseY / rect.height) * viewBox.h + viewBox.y;

    const newW = viewBox.w * delta;
    const newH = viewBox.h * delta;
    const newX = svgMouseX - (mouseX / rect.width) * newW;
    const newY = svgMouseY - (mouseY / rect.height) * newH;

    setViewBox({ x: newX, y: newY, w: newW, h: newH });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as any).tagName === 'svg') {
       const rect = svgRef.current?.getBoundingClientRect();
       if (!rect) return;
       const x = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
       const y = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
       onAddNode(x, y);
    }
  };

  const gridConfig = getThemeGridConfig(theme);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing transition-colors duration-300 ${getThemeCanvasBg(theme)} ${getThemeFontClass(theme)}`}
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      id="svg-container"
    >
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        onClick={() => onSelect(null)}
      >
        <defs>
          {/* Custom SVG grid pattern */}
          <pattern 
            id="dynamic-grid" 
            width={gridConfig.size} 
            height={gridConfig.size} 
            patternUnits="userSpaceOnUse"
          >
            {gridConfig.dots && (
              <circle 
                cx={gridConfig.size / 2} 
                cy={gridConfig.size / 2} 
                r="1.8" 
                fill={gridConfig.lineColor} 
                fillOpacity={gridConfig.lineOpacity * 1.5} 
              />
            )}
            {gridConfig.ruled && (
              <line 
                x1="0" 
                y1={gridConfig.size} 
                x2={gridConfig.size} 
                y2={gridConfig.size} 
                stroke={gridConfig.lineColor} 
                strokeWidth="1" 
                strokeOpacity={gridConfig.lineOpacity} 
              />
            )}
            {gridConfig.subdivisions && (
              <>
                <rect 
                  width={gridConfig.size} 
                  height={gridConfig.size} 
                  fill="none" 
                  stroke={gridConfig.lineColor} 
                  strokeWidth="1.5" 
                  strokeOpacity={gridConfig.lineOpacity} 
                />
                <path 
                  d={`M ${gridConfig.size / 2} 0 V ${gridConfig.size} M 0 ${gridConfig.size / 2} H ${gridConfig.size}`} 
                  stroke={gridConfig.lineColor} 
                  strokeWidth="0.7" 
                  strokeOpacity={gridConfig.lineOpacity * 0.7} 
                  strokeDasharray="3,3" 
                />
              </>
            )}
            {!gridConfig.dots && !gridConfig.ruled && !gridConfig.subdivisions && (
              <path 
                d={`M ${gridConfig.size} 0 L 0 0 0 ${gridConfig.size}`} 
                fill="none" 
                stroke={gridConfig.lineColor} 
                strokeWidth="1" 
                strokeOpacity={gridConfig.lineOpacity} 
              />
            )}
          </pattern>

          {/* Theme Filters and Effects */}
          {/* Neon Retro Terminal Glows */}
          <filter id="retro-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="retro-glow-selected" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="retro-edge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Comic Shadow / Pop Art (Flat Offset) */}
          <filter id="comic-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feOffset dx="4" dy="4" in="SourceAlpha" result="offset" />
            <feFlood floodColor="#2d3748" result="color" />
            <feComposite operator="in" in="color" in2="offset" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="comic-shadow-selected" x="-10%" y="-10%" width="130%" height="130%">
            <feOffset dx="5" dy="5" in="SourceAlpha" result="offset" />
            <feFlood floodColor="#3b82f6" result="color" />
            <feComposite operator="in" in="color" in2="offset" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Classic Warm Paper shadows */}
          <filter id="editorial-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#8c7a6b" floodOpacity="0.2" />
          </filter>
          <filter id="subtle-sepia" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8c7a6b" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Dynamic, infinite grid pattern background that spans whole viewBox */}
        <rect 
          x={viewBox.x - 20000} 
          y={viewBox.y - 20000} 
          width={viewBox.w + 40000} 
          height={viewBox.h + 40000} 
          fill="url(#dynamic-grid)" 
          className="transition-all duration-300"
        />

        {edges.map(edge => {
          const sNode = snappedNodes.find(n => n.id === edge.sourceId);
          const tNode = snappedNodes.find(n => n.id === edge.targetId);
          if (!sNode || !tNode) return null;
          
          return (
            <EdgeComponent 
              key={edge.id}
              edge={edge}
              sourceNode={sNode}
              targetNode={tNode}
              selected={selectedEdgeId === edge.id}
              onSelect={() => onSelectEdge(edge.id)}
              theme={theme}
            />
          );
        })}

        {dragEdgeTarget && connectingFrom && (
          <path 
            d={(() => {
              const n1 = snappedNodes.find(node => node.id === connectingFrom)!;
              const p1 = getPortConfigs(n1).find(p => p.side === connectingSide) || getPortConfigs(n1)[1]; // Fallback to right
              const x1 = p1.x;
              const y1 = p1.y;
              
              let x2 = dragEdgeTarget.x;
              let y2 = dragEdgeTarget.y;

              // If targeting a specific node, snap to the best port
              if (connectionTargetId && connectionTargetSide) {
                const n2 = snappedNodes.find(node => node.id === connectionTargetId);
                if (n2) {
                  const p2 = getPortConfigs(n2).find(p => p.side === connectionTargetSide);
                  if (p2) {
                    x2 = p2.x;
                    y2 = p2.y;
                  }
                }
              }

              const dx = Math.abs(x2 - x1) * 0.5;
              const dy = Math.abs(y2 - y1) * 0.5;
              
              return `M ${x1} ${y1} C ${x1 + (connectingSide === 'right' ? dx : connectingSide === 'left' ? -dx : 0)} ${y1 + (connectingSide === 'bottom' ? dy : connectingSide === 'top' ? -dy : 0)}, ${x2 + (connectionTargetSide === 'right' ? dx : connectionTargetSide === 'left' ? -dx : 0)} ${y2 + (connectionTargetSide === 'bottom' ? dy : connectionTargetSide === 'top' ? -dy : 0)}, ${x2} ${y2}`;
            })()}
            stroke={theme === 'retro-terminal' ? '#00FF66' : '#3b82f6'}
            strokeWidth="3"
            strokeDasharray="6,4"
            fill="none"
            className="pointer-events-none opacity-60"
          />
        )}

        {nodes.map((node, index) => (
          <NodeComponent
            key={node.id}
            node={snappedNodes[index]}
            rawX={node.x}
            rawY={node.y}
            selected={selectedId === node.id}
            onSelect={() => onSelect(node.id)}
            onMove={(dx, dy) => onMoveNode(node.id, node.x + dx, node.y + dy)}
            onUpdate={(update) => onUpdateNode({ ...update, id: node.id })}
            canvasZoom={viewBox.w / (containerRef.current?.clientWidth || 800)}
            isConnecting={!!connectingFrom}
            isTargeted={connectionTargetId === node.id}
            targetSide={connectionTargetId === node.id ? connectionTargetSide : undefined}
            autoFocus={newlyCreatedNodeId === node.id}
            onStartConnection={(side) => handleStartConnection(node.id, side)}
            onHoverConnection={() => setConnectionTargetId(node.id)}
            onLeaveConnection={() => setConnectionTargetId(null)}
            onDragStart={() => setDraggingNodeId(node.id)}
            onDragEnd={() => setDraggingNodeId(null)}
            theme={theme}
          />
        ))}
      </svg>
      
      {/* Zoom controls */}
      <div className="absolute bottom-10 left-10 flex items-center bg-white border border-slate-200 rounded-2xl shadow-xl p-1 z-10">
        <button 
          className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
          onClick={() => setViewBox(prev => ({ ...prev, x: prev.x + prev.w*0.1, y: prev.y + prev.h*0.1, w: prev.w*0.8, h: prev.h*0.8 }))}
          title="Zoom In"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span className="text-xs font-black px-4 text-slate-700 min-w-[70px] text-center uppercase tracking-tighter">
          {Math.round((800 / viewBox.w) * 100)}%
        </span>
        <button 
          className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
          onClick={() => setViewBox(prev => ({ ...prev, x: prev.x - prev.w*0.1, y: prev.y - prev.h*0.1, w: prev.w*1.2, h: prev.h*1.2 }))}
          title="Zoom Out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div className="w-px h-5 bg-slate-100 mx-1" />
        <button 
          className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
          onClick={() => setViewBox({ x: -400, y: -300, w: 800, h: 600 })}
          title="Reset View"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
        </button>
      </div>

      {/* Floating Action Button for New Node */}
      <button 
        onClick={handleAddNodeAtCenter}
        className="absolute bottom-10 right-10 flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all z-20 group"
      >
        <div className="bg-white/20 p-1 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <span className="font-bold tracking-tight">Nieuwe Knoop</span>
      </button>

      {/* Minimap Placeholder Style */}
      <div className="absolute top-10 right-10 w-44 h-32 bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-1.5 z-10 hidden md:block">
        <div className="w-full h-full bg-slate-50/50 rounded-[1.25rem] relative border border-slate-200/50 overflow-hidden">
           <div className="absolute inset-0 bg-blue-500/5 scale-50 -translate-x-4"></div>
           <div className="absolute top-1/2 left-1/2 w-12 h-8 border-2 border-blue-600/40 bg-white/60 shadow-lg backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default MindMapCanvas;
