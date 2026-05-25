import { Node, Side } from '../types';

export const getPortConfigs = (node: Node) => {
  const { width, height, x, y } = node;
  return [
    { side: 'top' as Side, x: x + width / 2, y: y },
    { side: 'right' as Side, x: x + width, y: y + height / 2 },
    { side: 'bottom' as Side, x: x + width / 2, y: y + height },
    { side: 'left' as Side, x: x, y: y + height / 2 }
  ];
};

export const getRelativePortConfigs = (width: number, height: number) => {
  return [
    { side: 'top' as Side, x: width / 2, y: 0 },
    { side: 'right' as Side, x: width, y: height / 2 },
    { side: 'bottom' as Side, x: width / 2, y: height },
    { side: 'left' as Side, x: 0, y: height / 2 }
  ];
};
