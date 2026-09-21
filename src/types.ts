// 数据结构（对齐 PRD 第 4 节）。SCHEMA_VERSION 用于未来数据迁移。
export const SCHEMA_VERSION = 2;

export type TriggerType =
  | 'bisociation'
  | 'abstraction'
  | 'perspective'
  | 'scamper'
  | 'incubation';

export type Feasibility = 'high' | 'medium' | 'low';

export interface CanvasNode {
  id: string;
  type: 'normal' | 'trigger';
  triggerType?: TriggerType;
  content: string;
  longForm?: string;
  position: { x: number; y: number };
  style?: {
    color?: string;
    fontSize?: number;
    width?: number;
    height?: number;
  };
  material?: {
    id: string;
    type: string;
    sourceUrl?: string;
  };
  tags?: {
    feasibility?: Feasibility;
    category?: string;
  };
  incubationUntil?: number; // 时间戳，用于孵化卡逻辑
  createdAt: number;
  updatedAt: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CanvasProject {
  id: string;
  name: string;
  mode: 'diverge' | 'converge';
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}
