import { create } from 'zustand';
import {
  SCHEMA_VERSION,
  type CanvasEdge,
  type CanvasNode,
  type CanvasProject,
  type Feasibility,
  type TriggerType,
} from '../types';
import { getProject, saveProject } from '../lib/db';
import { pickRandom, uid, now } from '../lib/utils';
import {
  abstractionPrompts,
  bisociationWords,
  incubationRevisitPrompts,
  perspectiveRoles,
  scamperItems,
  triggerEdgeLabel,
  triggerMeta,
} from '../data/triggerBank';
import { clusterNodes } from '../lib/clustering';

interface CanvasState {
  project: CanvasProject | null;
  loading: boolean;
  selectedNodeId: string | null;
  clusters: string[][];
  showClusters: boolean;

  load: (id: string) => Promise<void>;
  persist: () => void;
  setName: (name: string) => void;
  setMode: (mode: 'diverge' | 'converge') => void;

  addNode: (partial?: Partial<CanvasNode>) => CanvasNode;
  updateNode: (id: string, patch: Partial<CanvasNode>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  setSelected: (id: string | null) => void;

  addEdge: (source: string, target: string, label?: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  removeEdge: (id: string) => void;

  drawTrigger: (
    sourceId: string,
    triggerType: TriggerType,
    extra?: { direction?: 'up' | 'down'; delayMs?: number }
  ) => void;

  setNodeTag: (
    id: string,
    tag: { feasibility?: Feasibility; category?: string }
  ) => void;

  recomputeClusters: () => void;
  toggleClusters: (show?: boolean) => void;
  applyCluster: (nodeIds: string[]) => void;

  checkIncubation: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  project: null,
  loading: false,
  selectedNodeId: null,
  clusters: [],
  showClusters: false,

  load: async (id) => {
    set({ loading: true });
    const project = await getProject(id);
    set({ project: project ?? null, loading: false, selectedNodeId: null });
    get().checkIncubation();
  },

  persist: () => {
    const { project } = get();
    if (!project) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const p = get().project;
      if (p) saveProject({ ...p, updatedAt: now() });
    }, 300);
  },

  setName: (name) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, name, updatedAt: now() } });
    get().persist();
  },

  setMode: (mode) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, mode, updatedAt: now() } });
    get().persist();
  },

  addNode: (partial) => {
    const { project } = get();
    const t = now();
    const node: CanvasNode = {
      id: uid('node'),
      type: 'normal',
      content: '',
      position: { x: 0, y: 0 },
      createdAt: t,
      updatedAt: t,
      ...partial,
    };
    if (project) {
      set({
        project: { ...project, nodes: [...project.nodes, node], updatedAt: t },
      });
      get().persist();
    }
    return node;
  },

  updateNode: (id, patch) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        nodes: project.nodes.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: now() } : n
        ),
        updatedAt: now(),
      },
    });
    get().persist();
  },

  moveNode: (id, position) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        nodes: project.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
      },
    });
    get().persist();
  },

  removeNode: (id) => {
    const { project, selectedNodeId } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        nodes: project.nodes.filter((n) => n.id !== id),
        edges: project.edges.filter((e) => e.source !== id && e.target !== id),
        updatedAt: now(),
      },
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
    });
    get().persist();
  },

  setSelected: (id) => set({ selectedNodeId: id }),

  addEdge: (source, target, label) => {
    const { project } = get();
    if (!project || source === target) return;
    const exists = project.edges.some(
      (e) => e.source === source && e.target === target
    );
    if (exists) return;
    const edge: CanvasEdge = { id: uid('edge'), source, target, label };
    set({
      project: { ...project, edges: [...project.edges, edge], updatedAt: now() },
    });
    get().persist();
  },

  updateEdgeLabel: (id, label) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        edges: project.edges.map((e) => (e.id === id ? { ...e, label } : e)),
        updatedAt: now(),
      },
    });
    get().persist();
  },

  removeEdge: (id) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        edges: project.edges.filter((e) => e.id !== id),
        updatedAt: now(),
      },
    });
    get().persist();
  },

  drawTrigger: (sourceId, triggerType, extra) => {
    const { project } = get();
    if (!project) return;
    const source = project.nodes.find((n) => n.id === sourceId);
    if (!source) return;

    // 生成触发卡内容
    let content = '';
    switch (triggerType) {
      case 'bisociation': {
        const word = pickRandom(bisociationWords);
        content = `【强制关联】你的想法和「${word}」有什么关系？`;
        break;
      }
      case 'perspective': {
        const role = pickRandom(perspectiveRoles);
        content = `【视角切换】以「${role}」的身份，重新描述这个想法：`;
        break;
      }
      case 'scamper': {
        const item = pickRandom(scamperItems);
        content = `【SCAMPER · ${item.letter} ${item.name}】${item.question}`;
        break;
      }
      case 'abstraction': {
        const dir = extra?.direction ?? 'up';
        const prompt =
          dir === 'up'
            ? pickRandom(abstractionPrompts.up)
            : pickRandom(abstractionPrompts.down);
        const arrow = dir === 'up' ? '↑更抽象' : '↓更具体';
        content = `【抽象阶梯 ${arrow}】${prompt}`;
        break;
      }
      case 'incubation': {
        // 孵化卡不新建节点，而是标记 source 节点
        const delayMs = extra?.delayMs ?? 0;
        get().updateNode(sourceId, {
          incubationUntil: delayMs > 0 ? now() + delayMs : now(),
        });
        return;
      }
    }

    // 触发卡节点放在 source 右下方，带轻微随机偏移
    const meta = triggerMeta[triggerType];
    const newNode = get().addNode({
      type: 'trigger',
      triggerType,
      content,
      position: {
        x: source.position.x + 260 + Math.random() * 40,
        y: source.position.y + 40 + Math.random() * 120,
      },
      style: { color: meta.color },
    });
    get().addEdge(sourceId, newNode.id, triggerEdgeLabel[triggerType]);
    set({ selectedNodeId: newNode.id });
  },

  setNodeTag: (id, tag) => {
    const { project } = get();
    if (!project) return;
    const node = project.nodes.find((n) => n.id === id);
    if (!node) return;
    get().updateNode(id, { tags: { ...node.tags, ...tag } });
  },

  recomputeClusters: () => {
    const { project } = get();
    if (!project) return;
    const { clusters } = clusterNodes(project.nodes);
    set({ clusters, showClusters: true });
  },

  toggleClusters: (show) =>
    set((s) => ({ showClusters: show ?? !s.showClusters })),

  applyCluster: (nodeIds) => {
    const { project } = get();
    if (!project) return;
    const members = project.nodes.filter((n) => nodeIds.includes(n.id));
    if (members.length === 0) return;
    // 计算质心并把成员吸附到质心周围的网格
    const cx =
      members.reduce((s, n) => s + n.position.x, 0) / members.length;
    const cy =
      members.reduce((s, n) => s + n.position.y, 0) / members.length;
    const cols = Math.ceil(Math.sqrt(members.length));
    const gap = 240;
    set({
      project: {
        ...project,
        nodes: project.nodes.map((n) => {
          const idx = nodeIds.indexOf(n.id);
          if (idx === -1) return n;
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          return {
            ...n,
            position: {
              x: cx + (col - (cols - 1) / 2) * gap,
              y: cy + row * 160,
            },
          };
        }),
        updatedAt: now(),
      },
    });
    get().persist();
  },

  checkIncubation: () => {
    const { project } = get();
    if (!project) return;
    const t = now();
    const due = project.nodes.filter(
      (n) => n.incubationUntil != null && n.incubationUntil <= t
    );
    if (due.length === 0) return;

    // 找到画布顶部（最小 y），把到期节点上移到顶部并清除孵化标记，
    // 同时为每个到期节点附带一张随机触发卡。
    const minY = Math.min(...project.nodes.map((n) => n.position.y), 0);
    let offset = 0;
    for (const n of due) {
      get().updateNode(n.id, {
        incubationUntil: undefined,
        position: { x: n.position.x, y: minY - 180 - offset },
        content: n.content.includes('孵化归来')
          ? n.content
          : `${n.content}\n\n孵化归来：${pickRandom(incubationRevisitPrompts)}`,
      });
      offset += 20;
      // 附带随机触发卡（排除 incubation 本身）
      const types: TriggerType[] = [
        'bisociation',
        'abstraction',
        'perspective',
        'scamper',
      ];
      get().drawTrigger(n.id, pickRandom(types));
    }
  },
}));

export function createEmptyProject(name: string): CanvasProject {
  const t = now();
  return {
    id: uid('proj'),
    name,
    mode: 'diverge',
    nodes: [],
    edges: [],
    schemaVersion: SCHEMA_VERSION,
    createdAt: t,
    updatedAt: t,
  };
}
