import React from 'react';
import { Node, Edge, ThemeId } from '../../types';
import { getPortConfigs } from '../../lib/nodes';
import { getThemeEdgePath, getThemeEdgeStyle } from '../../lib/themes';

interface Props {
  edge: Edge;
  sourceNode: Node;
  targetNode: Node;
  selected: boolean;
  onSelect: () => void;
  theme?: ThemeId;
}

const EdgeComponent: React.FC<Props> = ({ edge, sourceNode, targetNode, selected, onSelect, theme = 'default' as ThemeId }) => {
  if (!sourceNode || !targetNode) return null;

  // Connection points for a node
  const sourcePorts = getPortConfigs(sourceNode);
  const targetPorts = getPortConfigs(targetNode);

  // Find the absolute best points (closest distance)
  let absBestSource = sourcePorts[0];
  let absBestTarget = targetPorts[0];
  let minDistance = Infinity;

  sourcePorts.forEach(sp => {
    targetPorts.forEach(tp => {
      const dist = Math.sqrt(Math.pow(sp.x - tp.x, 2) + Math.pow(sp.y - tp.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        absBestSource = sp;
        absBestTarget = tp;
      }
    });
  });

  // Decide which sides to use
  let bestSource = sourcePorts.find(p => p.side === edge.sourceSide);
  let bestTarget = targetPorts.find(p => p.side === edge.targetSide);

  // If sides were stored but now result in a distance significantly larger than the min distance,
  // we likely moved the node manually and should switch to the absolute best points.
  if (bestSource && bestTarget) {
    const currentDist = Math.sqrt(Math.pow(bestSource.x - bestTarget.x, 2) + Math.pow(bestSource.y - bestTarget.y, 2));
    // Factor of 1.15 is a good balance between layout intent and manual movement responsiveness
    if (currentDist > minDistance * 1.15) {
      bestSource = absBestSource;
      bestTarget = absBestTarget;
    }
  } else {
    bestSource = absBestSource;
    bestTarget = absBestTarget;
  }

  const x1 = bestSource.x;
  const y1 = bestSource.y;
  const x2 = bestTarget.x;
  const y2 = bestTarget.y;

  const themeEdge = getThemeEdgeStyle(theme, edge, selected);
  const pathData = getThemeEdgePath(theme, x1, y1, x2, y2, bestSource.side, bestTarget.side);

  return (
    <g 
      className="cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <defs>
        <marker
          id={`arrowhead-${edge.id}`}
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 L 2 4 Z" fill={themeEdge.color} />
        </marker>
        <marker
          id={`arrowstart-${edge.id}`}
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 8 4 L 0 8 L 2 4 Z" fill={themeEdge.color} />
        </marker>
      </defs>
      
      {/* Hidden wide path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        className="pointer-events-auto"
      />

      <path
        d={pathData}
        stroke={themeEdge.color}
        strokeWidth={themeEdge.strokeWidth}
        strokeDasharray={themeEdge.style === 'dashed' ? '8,4' : themeEdge.style === 'dotted' ? '2,3' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        markerEnd={edge.arrowEnd ? `url(#arrowhead-${edge.id})` : ''}
        markerStart={edge.arrowStart ? `url(#arrowstart-${edge.id})` : ''}
        filter={theme === 'retro-terminal' ? undefined : (themeEdge.glowFilter !== 'none' ? themeEdge.glowFilter : undefined)}
        style={theme === 'retro-terminal' ? { filter: selected ? 'drop-shadow(0px 0px 5px #00FFFF)' : 'drop-shadow(0px 0px 4px #10b981)' } : undefined}
        className={`transition-all duration-300 ${selected && theme !== 'retro-terminal' ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]' : 'group-hover:stroke-slate-400'}`}
      />
      
      {edge.label && (
        <foreignObject 
          x={(x1 + x2) / 2 - 50} 
          y={(y1 + y2) / 2 - 10} 
          width="100" 
          height="20"
          className="pointer-events-auto"
        >
          <div className="w-full h-full flex items-center justify-center">
            <span className={`${theme === 'retro-terminal' ? 'bg-[#070a13] text-[#10b981]' : 'bg-white/80 text-slate-500'} px-1 py-0.5 rounded text-[10px] whitespace-nowrap overflow-hidden text-ellipsis shadow-sm`}>
              {edge.label}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default EdgeComponent;
