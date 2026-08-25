import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
  type EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../store/canvasStore';
import { TextNode, type TextNodeData } from '../components/TextNode';
import TriggerPanel from '../components/TriggerPanel';
import TagEditor from '../components/TagEditor';
import ConvergeBoard from '../components/ConvergeBoard';

/** 聚类色：牛皮纸系（赭 / 苔 / 陶 / 红笔 / 深棕） */
const CLUSTER_COLORS = [
  '#8f6a33',
  '#5f6b40',
  '#8a4a3c',
  '#a8443a',
  '#6f6249',
  '#7b6b8a',
];

const nodeTypes: NodeTypes = { text: TextNode };

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

function CanvasInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rf = useReactFlow();

  const {
    project,
    loading,
    load,
    selectedNodeId,
    setSelected,
    addNode,
    moveNode,
    removeNode,
    addEdge,
    removeEdge,
    setName,
    setMode,
    clusters,
    showClusters,
    recomputeClusters,
    toggleClusters,
    applyCluster,
  } = useCanvasStore();

  const lastClusterCount = useRef(0);

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  // 每新增 5 个节点自动重算并展示聚类建议
  const nodeLen = project?.nodes.length ?? 0;
  useEffect(() => {
    if (nodeLen >= 2 && nodeLen - lastClusterCount.current >= 5) {
      lastClusterCount.current = nodeLen;
      recomputeClusters();
    }
  }, [nodeLen, recomputeClusters]);

  const clusterColorMap = useMemo(() => {
    const map = new Map<string, string>();
    clusters.forEach((c, i) => {
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
      c.forEach((nid) => map.set(nid, color));
    });
    return map;
  }, [clusters]);

  const rfNodes: Node<TextNodeData>[] = useMemo(() => {
    if (!project) return [];
    return project.nodes.map((n) => ({
      id: n.id,
      type: 'text',
      position: n.position,
      data: {
        node: n,
        inCluster: showClusters ? clusterColorMap.get(n.id) ?? null : null,
      },
      selected: n.id === selectedNodeId,
    }));
  }, [project, selectedNodeId, showClusters, clusterColorMap]);

  const rfEdges: Edge[] = useMemo(() => {
    if (!project) return [];
    return project.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      labelStyle: {
        fontSize: 10,
        fill: '#6f6249',
        letterSpacing: '0.08em',
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgStyle: { fill: '#f4eee1', fillOpacity: 0.9 },
      style: { stroke: '#8f7f63', strokeWidth: 1.4 },
      animated: false,
    }));
  }, [project]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          moveNode(c.id, c.position);
        } else if (c.type === 'remove') {
          removeNode(c.id);
        } else if (c.type === 'select') {
          if (c.selected) setSelected(c.id);
        }
      }
    },
    [moveNode, removeNode, setSelected]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === 'remove') removeEdge(c.id);
      }
    },
    [removeEdge]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (conn.source && conn.target) addEdge(conn.source, conn.target);
    },
    [addEdge]
  );

  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(
          '.react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__minimap, .react-flow__panel'
        )
      ) {
        return;
      }
      if (
        !target.closest(
          '.react-flow__pane, .react-flow__viewport, .react-flow__renderer, .react-flow'
        )
      ) {
        return;
      }
      const pos = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const node = addNode({ position: { x: pos.x - 92, y: pos.y - 55 } });
      setSelected(node.id);
    },
    [rf, addNode, setSelected]
  );

  if (loading) {
    return (
      <div className="kraft-surface flex h-full items-center justify-center text-[13px] tracking-[0.2em] text-ink-soft">
        加载中
      </div>
    );
  }
  if (!project) {
    return (
      <div className="kraft-surface flex h-full flex-col items-center justify-center gap-4">
        <div className="paper px-8 py-6 text-center">
          <p className="text-[13px] tracking-[0.1em] text-ink">找不到该画布</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 border border-[rgba(79,69,52,0.6)] px-4 py-1.5 text-[12px] tracking-[0.14em] text-ink transition hover:bg-[rgba(233,224,205,0.7)]"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const selectedNode = project.nodes.find((n) => n.id === selectedNodeId);
  const isConverge = project.mode === 'converge';

  function createNodeAtCenter() {
    const el = document.querySelector('.react-flow') as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    const center = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = rf.screenToFlowPosition(center);
    const node = addNode({ position: { x: pos.x - 92, y: pos.y - 55 } });
    setSelected(node.id);
  }

  return (
    <div className="flex h-full flex-col">
      {/* ===== 顶部：档案条 ===== */}
      <header className="paper-kraft relative z-10 flex items-end gap-4 border-b-2 border-[rgba(79,69,52,0.5)] px-5 pb-0 pt-3">
        {/* 左：返回 + 画布名 */}
        <div className="flex min-w-0 flex-1 flex-col pb-2.5">
          <div className="mb-1 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="border-b border-[rgba(79,69,52,0.55)] text-[11px] tracking-[0.14em] text-ink-soft transition hover:text-ink"
            >
              ← 返回索引
            </button>
            <span className="meta-line text-[9.5px] uppercase">
              canvas / {project.mode === 'diverge' ? 'diverge' : 'converge'} /{' '}
              {project.nodes.length} notes
            </span>
          </div>
          <input
            value={project.name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 border-0 border-b border-transparent bg-transparent font-song text-[19px] font-semibold tracking-[0.06em] text-ink outline-none transition hover:border-[rgba(79,69,52,0.4)] focus:border-[rgba(79,69,52,0.7)]"
          />
        </div>

        {/* 右：工具 + 模式标签页 */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={createNodeAtCenter}
              className="border border-[rgba(79,69,52,0.6)] bg-[rgba(255,253,246,0.7)] px-3 py-1 text-[11.5px] tracking-[0.12em] text-ink transition hover:bg-[rgba(255,253,246,0.95)]"
              title="新建想法便签"
            >
              ＋ 新便签
            </button>
            <button
              onClick={() => recomputeClusters()}
              className="border border-[rgba(79,69,52,0.45)] bg-[rgba(255,253,246,0.5)] px-3 py-1 text-[11.5px] tracking-[0.12em] text-ink-soft transition hover:bg-[rgba(255,253,246,0.85)]"
              title="按语义相似度整理"
            >
              整理
            </button>
            {showClusters && (
              <button
                onClick={() => toggleClusters(false)}
                className="px-1 text-[10.5px] tracking-wider text-ink-faint underline decoration-dotted hover:text-ink-soft"
              >
                隐藏聚类
              </button>
            )}
            <button
              onClick={() => navigate('/workflow')}
              className="border-b border-dashed border-[rgba(79,69,52,0.55)] px-1 text-[11px] tracking-[0.12em] text-ink-soft transition hover:text-ink"
            >
              工作流
            </button>
          </div>

          {/* 模式：文件夹标签页 */}
          <div className="flex items-end gap-1">
            <span className="meta-line mr-1 pb-1.5 text-[9px] uppercase">
              mode
            </span>
            <button
              onClick={() => setMode('diverge')}
              className={`folder-tab px-4 pb-1.5 pt-1 text-[11.5px] tracking-[0.16em] transition ${
                !isConverge
                  ? 'folder-tab-active text-ink'
                  : 'text-ink-faint hover:text-ink-soft'
              }`}
              style={{ borderRadius: '4px 4px 0 0' }}
            >
              发散
            </button>
            <button
              onClick={() => setMode('converge')}
              className={`folder-tab px-4 pb-1.5 pt-1 text-[11.5px] tracking-[0.16em] transition ${
                isConverge
                  ? 'folder-tab-active text-pencil'
                  : 'text-ink-faint hover:text-ink-soft'
              }`}
              style={{ borderRadius: '4px 4px 0 0' }}
            >
              收敛
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <div
          className="kraft-surface relative flex-1"
          onDoubleClick={onPaneDoubleClick}
        >
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={() => setSelected(null)}
            fitView
            minZoom={0.2}
            maxZoom={2}
            zoomOnDoubleClick={false}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background
              variant={BackgroundVariant.Cross}
              gap={34}
              size={3}
              color="rgba(90,74,48,0.16)"
            />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) =>
                (n.data as TextNodeData)?.node.type === 'trigger'
                  ? (n.data as TextNodeData)?.node.style?.color || '#8f6a33'
                  : '#f4e59b'
              }
              maskColor="rgba(90,74,48,0.18)"
              style={{ background: '#e0d1b2' }}
            />
          </ReactFlow>

          {/* 空画布提示 */}
          {project.nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="paper relative px-7 py-5 text-center">
                <span
                  className="tape"
                  style={{ top: -11, left: '50%', marginLeft: -39 }}
                />
                <p className="text-[13px] leading-relaxed tracking-[0.06em] text-ink-soft">
                  双击空白处贴一张便签
                </p>
                <p className="meta-line mt-1.5 text-[10px]">
                  或点击右上角「＋ 新便签」
                </p>
              </div>
            </div>
          )}

          {/* 聚类建议 */}
          {showClusters && clusters.length > 0 && (
            <div className="paper paper-edge absolute bottom-5 left-5 z-10 w-[246px] px-3.5 py-3">
              <div className="label-title mb-0.5 inline-block text-[11.5px] font-semibold tracking-[0.16em] text-ink">
                语义聚类建议
              </div>
              <div className="meta-line mb-2.5 text-[9.5px] uppercase">
                {clusters.length} groups / tf-idf
              </div>
              <div className="max-h-44 space-y-1.5 overflow-y-auto">
                {clusters.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border border-[rgba(120,104,76,0.3)] bg-[rgba(255,253,246,0.5)] px-2 py-1.5"
                  >
                    <span className="flex items-center gap-2 text-[11.5px] text-ink-soft">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                        }}
                      />
                      {c.length} 张相近便签
                    </span>
                    <button
                      onClick={() => applyCluster(c)}
                      className="border-b border-current pb-[1px] text-[11px] tracking-[0.1em] text-pencil"
                    >
                      聚拢
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showClusters && clusters.length === 0 && (
            <div className="paper absolute bottom-5 left-5 z-10 px-3 py-2 text-[11px] text-ink-faint">
              没有发现明显相近的便签
            </div>
          )}

          {/* 右侧浮动：触发器 + 收敛标签 */}
          {selectedNode && (
            <div className="absolute right-5 top-4 z-10 flex max-h-[calc(100%-2rem)] flex-col gap-3 overflow-y-auto pr-1">
              <TriggerPanel node={selectedNode} />
              {isConverge && <TagEditor node={selectedNode} />}
            </div>
          )}
        </div>

        {isConverge && <ConvergeBoard />}
      </div>
    </div>
  );
}
