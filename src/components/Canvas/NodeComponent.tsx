import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Node, Side, ThemeId } from '../../types';
import { getRelativePortConfigs } from '../../lib/nodes';
import { getThemeNodeStyles } from '../../lib/themes';

interface Props {
  node: Node;
  rawX: number;
  rawY: number;
  selected: boolean;
  isTargeted?: boolean;
  targetSide?: Side | null;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onUpdate: (update: Partial<Node>) => void;
  canvasZoom: number;
  isConnecting: boolean;
  autoFocus?: boolean;
  onStartConnection: (side: Side) => void;
  onHoverConnection: () => void;
  onLeaveConnection: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  theme?: ThemeId;
}

const NodeComponent: React.FC<Props> = ({
  node,
  rawX,
  rawY,
  selected,
  isTargeted,
  targetSide,
  onSelect,
  onMove,
  onUpdate,
  canvasZoom,
  isConnecting,
  autoFocus,
  onStartConnection,
  onHoverConnection,
  onLeaveConnection,
  onDragStart,
  onDragEnd,
  theme = 'default' as ThemeId
}) => {
  const [isEditing, setIsEditing] = useState(autoFocus || false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const themeProps = getThemeNodeStyles(theme, node, selected, !!isTargeted);
  const textColor = theme === 'retro-terminal' ? '#ffffff' : themeProps.textColor;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  useEffect(() => {
    if (autoFocus) {
      setIsEditing(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ text: e.target.value });
  };

  const renderShape = () => {
    const isRoot = node.id.includes('root');
    const commonProps = {
      fill: themeProps.backgroundColor,
      stroke: themeProps.borderColor,
      strokeWidth: themeProps.borderWidth,
      strokeDasharray: themeProps.borderStyle === 'dashed' ? '5,5' : themeProps.borderStyle === 'dotted' ? '2,2' : 'none',
      className: `transition-all duration-300 ${selected ? 'shadow-2xl' : ''}`,
      filter: themeProps.shadowFilter
    };

    const activeShape = themeProps.shape || node.shape;

    switch (activeShape) {
      case 'ellipse':
        return <ellipse cx={node.width / 2} cy={node.height / 2} rx={node.width / 2} ry={node.height / 2} {...commonProps} />;
      case 'diamond':
        return (
          <path 
            d={`M ${node.width/2} 0 L ${node.width} ${node.height/2} L ${node.width/2} ${node.height} L 0 ${node.height/2} Z`} 
            {...commonProps} 
          />
        );
      case 'hexagon':
        const w = node.width;
        const h = node.height;
        const quarter = w / 4;
        return (
          <path 
            d={`M ${quarter} 0 L ${w - quarter} 0 L ${w} ${h/2} L ${w - quarter} ${h} L ${quarter} ${h} L 0 ${h/2} Z`} 
            {...commonProps} 
          />
        );
      case 'rounded-rectangle':
        return <rect x="0" y="0" width={node.width} height={node.height} rx={themeProps.borderRadius} ry={themeProps.borderRadius} {...commonProps} />;
      default:
        return <rect x="0" y="0" width={node.width} height={node.height} rx={themeProps.borderRadius} ry={themeProps.borderRadius} {...commonProps} />;
    }
  };

  return (
    <motion.g
      initial={false}
      animate={{ x: node.x, y: node.y }}
      transition={{ duration: 0 }}
      drag={!isConnecting}
      dragMomentum={false}
      onDragStart={() => {
        onDragStart?.();
      }}
      onDragEnd={() => {
        onDragEnd?.();
      }}
      onDrag={(e, info) => {
        if (!isConnecting) {
          onMove(info.delta.x * canvasZoom, info.delta.y * canvasZoom);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={handleDoubleClick}
      data-node-id={node.id}
      className={`cursor-move ${selected ? 'z-10' : 'z-0'}`}
    >
      <motion.g
        animate={{ 
          scale: isTargeted ? 1.05 : (selected ? 1.02 : 1)
        }}
        transition={{ duration: 0.2 }}
      >
        <defs>
        <filter id="subtle-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </filter>
        <filter id="heavy-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.08" />
        </filter>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#3b82f6" floodOpacity="0.3" />
        </filter>
      </defs>

      {renderShape()}
      
      <foreignObject x="0" y="0" width={node.width} height={node.height} className="pointer-events-none">
        <div 
          xmlns="http://www.w3.org/1999/xhtml"
          className="pointer-events-auto"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '12px',
            boxSizing: 'border-box',
            color: textColor,
            fontFamily: theme === 'retro-terminal' ? '"JetBrains Mono", ui-monospace, monospace' : theme === 'elegant-warm' ? 'Georgia, serif' : 'Inter, sans-serif'
          }}
        >
          {isEditing ? (
            <textarea
              ref={textRef}
              value={node.text}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden text-center"
              style={{
                color: textColor,
                fontSize: `${themeProps.fontSize}px`,
                fontWeight: themeProps.fontWeight,
                fontStyle: themeProps.fontStyle,
                textDecoration: node.textDecoration,
                fontFamily: theme === 'retro-terminal' ? '"JetBrains Mono", ui-monospace, monospace' : theme === 'elegant-warm' ? 'Georgia, serif' : 'Inter, sans-serif'
              }}
            />
          ) : (
            <div
              style={{
                color: textColor,
                fontSize: `${themeProps.fontSize}px`,
                fontWeight: themeProps.fontWeight,
                fontStyle: themeProps.fontStyle,
                textDecoration: node.textDecoration,
                wordBreak: 'break-word',
                textAlign: 'center',
                fontFamily: theme === 'retro-terminal' ? '"JetBrains Mono", ui-monospace, monospace' : theme === 'elegant-warm' ? 'Georgia, serif' : 'Inter, sans-serif'
              }}
              className="select-none font-medium leading-tight tracking-tight text-center"
            >
              {node.icon && <span className="mr-1.5">{node.icon}</span>}
              {node.text}
            </div>
          )}
        </div>
      </foreignObject>

      {(selected || isConnecting) && (
        <g className="pointer-events-none">
          {selected && (
            <rect
              x="-8"
              y="-8"
              width={node.width + 16}
              height={node.height + 16}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="6,4"
              rx="20"
              className="opacity-50"
            />
          )}
          {/* Connection Ports Indicators */}
          {getRelativePortConfigs(node.width, node.height).map((p) => (
            <circle 
              key={p.side}
              cx={p.x} cy={p.y} r={targetSide === p.side ? 10 : 6} 
              fill={targetSide === p.side ? "#f59e0b" : isConnecting ? "#3b82f6" : "#cbd5e1"} 
              stroke="white" strokeWidth="2" 
              className="cursor-crosshair pointer-events-auto transition-all"
              onMouseDown={(e) => { e.stopPropagation(); onStartConnection(p.side); }}
              onTouchStart={(e) => { e.stopPropagation(); onStartConnection(p.side); }}
            />
          ))}
        </g>
      )}
      </motion.g>
    </motion.g>
  );
};

export default NodeComponent;
