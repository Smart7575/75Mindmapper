import { ThemeId, Node, Edge, Side } from '../types';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  icon: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'default',
    name: 'Standaard',
    description: 'Modern & minimalistisch met vloeiende curves.',
    icon: '✨'
  },
  {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    description: 'Neon groen en cyber cyan cyberpunk stijl.',
    icon: '💻'
  },
  {
    id: 'elegant-warm',
    name: 'Klassiek Warm',
    description: 'Mooi papier-sepia editie met serif lettertype.',
    icon: '📚'
  },
  {
    id: 'playful-bubble',
    name: 'Speels Pastel',
    description: 'Vrolijke pastelkleuren met dikke speelse randen.',
    icon: '🎈'
  }
];

// Returns Tailwind class for container background
export const getThemeCanvasBg = (theme: ThemeId): string => {
  switch (theme) {
    case 'retro-terminal':
      return 'bg-[#05070f]';
    case 'elegant-warm':
      return 'bg-[#FDFBF7]';
    case 'playful-bubble':
      return 'bg-[#FAF9FF]';
    default:
      return 'bg-slate-50/50';
  }
};

// Returns fonts classes
export const getThemeFontClass = (theme: ThemeId): string => {
  switch (theme) {
    case 'retro-terminal':
      return 'font-mono';
    case 'elegant-warm':
      return 'font-serif';
    case 'playful-bubble':
      return 'font-sans tracking-tight';
    default:
      return 'font-sans tracking-tight';
  }
};

// Returns SVG grid fill/stroke settings
export const getThemeGridConfig = (theme: ThemeId) => {
  switch (theme) {
    case 'retro-terminal':
      return {
        patternId: 'grid-retro',
        bgColor: '#05070f',
        lineColor: '#10b981',
        lineOpacity: 0.12,
        size: 40,
        subdivisions: true
      };
    case 'elegant-warm':
      return {
        patternId: 'grid-warm',
        bgColor: '#FDFBF7',
        lineColor: '#8c7a6b',
        lineOpacity: 0.08,
        size: 30,
        ruled: true
      };
    case 'playful-bubble':
      return {
        patternId: 'grid-playful',
        bgColor: '#FAF9FF',
        lineColor: '#a78bfa',
        lineOpacity: 0.15,
        size: 50,
        dots: true
      };
    default:
      return {
        patternId: 'grid-default',
        bgColor: '#ffffff',
        lineColor: '#64748b',
        lineOpacity: 0.06,
        size: 20,
        dots: true
      };
  }
};

// Tiered palettes per theme
export const getThemeNodeStyles = (
  theme: ThemeId,
  node: Node,
  selected: boolean,
  isTargeted: boolean
) => {
  const isRoot = node.id.includes('root');
  const level = node.level || 0;

  switch (theme) {
    case 'retro-terminal': {
      // Glow and high contrast green/cyan terminal theme
      const colors = [
        { bg: '#070a13', border: '#00FF66', text: '#00FF66' }, // Root: Bright Green
        { bg: '#070a13', border: '#00FFFF', text: '#00FFFF' }, // Niveau 1: Cyan
        { bg: '#070a13', border: '#F59E0B', text: '#F59E0B' }, // Niveau 2: Amber
        { bg: '#070a13', border: '#ec4899', text: '#ec4899' }, // Niveau 3: Pink
      ];
      const levelStyle = colors[level % colors.length];

      return {
        backgroundColor: levelStyle.bg,
        borderColor: levelStyle.border,
        textColor: levelStyle.text,
        borderWidth: isRoot ? 3 : 2,
        borderStyle: 'solid' as const,
        borderRadius: 0, // Hard box corners
        shadowFilter: selected ? 'url(#retro-glow-selected)' : 'url(#retro-glow)',
        fontSize: isRoot ? 15 : 13,
        fontWeight: 'bold',
        fontStyle: 'normal',
        shape: 'rectangle' as const
      };
    }

    case 'elegant-warm': {
      // Vintage sepia paper edition styles
      const colors = [
        { bg: '#2C1E17', border: '#1A120C', text: '#FDFBF7' }, // Root: deep dark brown
        { bg: '#F5E6D3', border: '#8C6239', text: '#2C1E17' }, // Niveau 1: warm leather
        { bg: '#E3EDF7', border: '#4A6984', text: '#1E2D44' }, // Niveau 2: grey-blue slate
        { bg: '#E2EAD3', border: '#5B703C', text: '#253018' }, // Niveau 3: sage herb green
      ];
      const levelStyle = colors[level % colors.length];

      return {
        backgroundColor: selected ? '#FAF6EE' : (node.backgroundColor.startsWith('#3b') || node.backgroundColor.startsWith('#dcf') ? levelStyle.bg : node.backgroundColor),
        borderColor: node.borderColor.startsWith('#25') || node.borderColor.startsWith('#16') ? levelStyle.border : node.borderColor,
        textColor: node.textColor === '#ffffff' ? (isRoot ? '#FDFBF7' : levelStyle.text) : node.textColor,
        borderWidth: 1.5,
        borderStyle: level % 2 === 1 ? 'solid' as const : 'solid' as const,
        borderRadius: 4, // subtle soft corners
        shadowFilter: selected ? 'url(#editorial-shadow)' : 'url(#subtle-sepia)',
        fontSize: isRoot ? 16 : 14,
        fontWeight: isRoot ? '700' : 'normal',
        fontStyle: level === 1 ? 'italic' : 'normal',
        shape: isRoot ? 'rounded-rectangle' as const : 'ellipse' as const
      };
    }

    case 'playful-bubble': {
      // Thick borders, bright pastels, and funny soft round dimensions
      const colors = [
        { bg: '#ffccd5', border: '#2d3748', text: '#1a202c' }, // Cotton candy pink
        { bg: '#d8f3dc', border: '#2d3748', text: '#1a202c' }, // Soft green
        { bg: '#e0f2fe', border: '#2d3748', text: '#1a202c' }, // Sky soft blue
        { bg: '#fef3c7', border: '#2d3748', text: '#1a202c' }, // Butter yellow
      ];
      const levelStyle = colors[level % colors.length];

      return {
        backgroundColor: node.backgroundColor.startsWith('#3b') || node.backgroundColor.startsWith('#dcf') ? levelStyle.bg : node.backgroundColor,
        borderColor: '#2D3748', // Uniform fun thick carbon border
        textColor: '#1A202C',
        borderWidth: 3,
        borderStyle: 'solid' as const,
        borderRadius: 24, // Super bubbly capsules
        shadowFilter: selected ? 'url(#comic-shadow-selected)' : 'url(#comic-shadow)',
        fontSize: isRoot ? 17 : 14,
        fontWeight: 'bold',
        fontStyle: 'normal',
        shape: 'rounded-rectangle' as const
      };
    }

    default: // standard / default
      return {
        backgroundColor: node.backgroundColor,
        borderColor: node.borderColor,
        textColor: node.textColor,
        borderWidth: node.borderWidth,
        borderStyle: node.borderStyle,
        borderRadius: node.shape === 'ellipse' ? 999 : 16,
        shadowFilter: selected ? 'url(#shadow)' : isRoot ? 'url(#heavy-shadow)' : 'url(#subtle-shadow)',
        fontSize: node.fontSize,
        fontWeight: node.fontWeight,
        fontStyle: node.fontStyle,
        shape: node.shape
      };
  }
};

// Gets the styled curve for each theme setting
export const getThemeEdgeStyle = (
  theme: ThemeId,
  edge: Edge,
  selected: boolean
) => {
  switch (theme) {
    case 'retro-terminal':
      return {
        color: selected ? '#00FFFF' : '#10b981',
        strokeWidth: selected ? 3 : 2,
        style: 'dashed' as const,
        glowFilter: 'url(#retro-edge-glow)'
      };
    case 'elegant-warm':
      return {
        color: selected ? '#4A6984' : '#8c7a6b',
        strokeWidth: selected ? 1.8 : 1.2,
        style: 'solid' as const,
        glowFilter: 'none'
      };
    case 'playful-bubble':
      return {
        color: '#2D3748', // Bouncy thick outlines
        strokeWidth: selected ? 4 : 3,
        style: 'solid' as const,
        glowFilter: 'none'
      };
    default:
      return {
        color: selected ? '#3b82f6' : edge.color,
        strokeWidth: selected ? edge.width + 1 : edge.width,
        style: edge.style,
        glowFilter: 'none'
      };
  }
};

// Returns the optimized path command details based on theme
export const getThemeEdgePath = (
  theme: ThemeId,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  side1?: Side,
  side2?: Side
): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (theme === 'retro-terminal') {
    // Orthogonal stair-step routing for the terminal theme!
    // Creates high tech retro wiring harness aesthetics.
    const midX = x1 + dx / 2;
    const midY = y1 + dy / 2;

    if (side1 === 'left' || side1 === 'right') {
      return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
    } else {
      return `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
    }
  }

  if (theme === 'elegant-warm') {
    // Thin, pencil delicate curves. Beautiful ink stroke loop or elegant S curve
    const strength = Math.min(Math.max(Math.abs(dx), Math.abs(dy)) * 0.45, 90);
    let cx1 = x1;
    let cy1 = y1;
    let cx2 = x2;
    let cy2 = y2;

    if (side1 === 'left') cx1 = x1 - strength;
    else if (side1 === 'right') cx1 = x1 + strength;
    else if (side1 === 'top') cy1 = y1 - strength;
    else if (side1 === 'bottom') cy1 = y1 + strength;

    if (side2 === 'left') cx2 = x2 - strength;
    else if (side2 === 'right') cx2 = x2 + strength;
    else if (side2 === 'top') cy2 = y2 - strength;
    else if (side2 === 'bottom') cy2 = y2 + strength;

    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  if (theme === 'playful-bubble') {
    // Extra bouncy curves with an offset bubble weight!
    const cpX1 = x1 + dx * 0.25;
    const cpY1 = y1 + dy * 0.1;
    const cpX2 = x1 + dx * 0.75;
    const cpY2 = y1 + dy * 0.9;
    return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + (dx > 0 ? 30 : -30)}, ${x2} ${y2}`;
  }

  // Standard (Bezier Curve, smooth strength)
  const strength = Math.min(Math.max(Math.abs(dx), Math.abs(dy)) * 0.45, 120);
  let cx1 = x1;
  let cy1 = y1;
  let cx2 = x2;
  let cy2 = y2;

  if (side1 === 'left') cx1 = x1 - strength;
  else if (side1 === 'right') cx1 = x1 + strength;
  else if (side1 === 'top') cy1 = y1 - strength;
  else if (side1 === 'bottom') cy1 = y1 + strength;

  if (side2 === 'left') cx2 = x2 - strength;
  else if (side2 === 'right') cx2 = x2 + strength;
  else if (side2 === 'top') cy2 = y2 - strength;
  else if (side2 === 'bottom') cy2 = y2 + strength;

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
};
