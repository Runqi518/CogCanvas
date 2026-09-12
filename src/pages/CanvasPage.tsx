import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Controls,
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
import RagSearch from '../components/RagSearch';

const CLUSTER_COLORS = ['#ff6bba', '#59d2f6', '#52e085', '#f4d44d', '#9c7b64'];
const NEON_EDGES = ['#52e085', '#59d2f6', '#ff6bba'];
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
    project, loading, load, selectedNodeId, setSelected,
    addNode, moveNode, removeNode, addEdge, removeEdge,
    setMode, clusters, showClusters, recomputeClusters, applyCluster,
  } = useCanvasStore();

  const lastClusterCount = useRef(0);
  useEffect(() => { if (id) load(id); }, [id, load]);

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
      data: { node: n, inCluster: showClusters ? clusterColorMap.get(n.id) ?? null : null },
      selected: n.id === selectedNodeId,
    }));
  }, [project, selectedNodeId, showClusters, clusterColorMap]);

  const rfEdges: Edge[] = useMemo(() => {
    if (!project) return [];
    return project.edges.map((e, i) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      labelStyle: { fontSize: 11, fill: '#1f1f1f', fontWeight: 'bold' },
      labelBgPadding: [6, 4] as [number, number],
      labelBgStyle: { fill: '#fff', fillOpacity: 1, stroke: '#1f1f1f', strokeWidth: 1.5, rx: 6, ry: 6 },
      style: { stroke: NEON_EDGES[i % NEON_EDGES.length], strokeWidth: 4.5 },
      animated: false,
    }));
  }, [project]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const c of changes) {
      if (c.type === 'position' && c.position) moveNode(c.id, c.position);
      else if (c.type === 'remove') removeNode(c.id);
      else if (c.type === 'select') if (c.selected) setSelected(c.id);
    }
  }, [moveNode, removeNode, setSelected]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const c of changes) if (c.type === 'remove') removeEdge(c.id);
  }, [removeEdge]);

  const onConnect = useCallback((conn: Connection) => {
    if (conn.source && conn.target) addEdge(conn.source, conn.target);
  }, [addEdge]);

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__panel, .k-card, .k-button, .rag-window')) return;
    const pos = rf.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const node = addNode({ position: { x: pos.x - 110, y: pos.y - 40 } });
    setSelected(node.id);
  }, [rf, addNode, setSelected]);

  if (loading) return <div className="kinopio-bg flex h-full items-center justify-center font-bold">Loading...</div>;
  if (!project) return <div className="kinopio-bg flex h-full items-center justify-center"><button className="k-button" onClick={() => navigate('/')}>Home</button></div>;

  const selectedNode = project.nodes.find((n) => n.id === selectedNodeId);
  const isConverge = project.mode === 'converge';

  function createNodeAtCenter() {
    const el = document.querySelector('.react-flow') as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = rf.screenToFlowPosition(center);
    const node = addNode({ position: { x: pos.x - 110, y: pos.y - 40 } });
    setSelected(node.id);
  }

  return (
    <div className="flex h-full flex-col kinopio-bg">
      <div className="absolute left-5 top-5 z-50 flex gap-2">
        <button className="k-button k-button-green" onClick={createNodeAtCenter}>+ New</button>
        <button className="k-button" onClick={() => navigate('/')}>Home</button>
        <div className="k-card px-3 py-1.5 text-[14px] font-bold flex items-center">{project.name}</div>
      </div>

      <div className="absolute right-5 top-5 z-50 flex gap-2">
        <button className="k-button" onClick={() => recomputeClusters()}>Cluster</button>
        <button className={`k-button ${isConverge ? 'k-button-pink' : ''}`} onClick={() => setMode(isConverge ? 'diverge' : 'converge')}>
          {isConverge ? 'Converge Mode' : 'Diverge Mode'}
        </button>
      </div>

      <div className="absolute left-5 bottom-5 z-50">
        <RagSearch
          projectId={project.id}
          onSelect={(nodeId) => {
            setSelected(nodeId);
            const node = project.nodes.find((item) => item.id === nodeId);
            if (node) rf.setCenter(node.position.x + 110, node.position.y + 40, { zoom: 1.15, duration: 400 });
          }}
        />
      </div>

      <div className="relative flex flex-1 overflow-hidden" onDoubleClick={onPaneDoubleClick}>
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
          style={{ background: 'transparent' }}
        >
          <Controls showInteractive={false} className="!mb-6 !mr-6" />
        </ReactFlow>

        {showClusters && clusters.length > 0 && (
          <div className="k-card absolute bottom-20 left-5 z-50 w-[240px] px-3.5 py-3 bg-[var(--m-cream)]">
            <div className="text-[13px] font-bold border-b-1.5 border-[var(--ink)] mb-2 pb-1">Clusters</div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto">
              {clusters.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] font-bold">
                    <span className="h-3 w-3 rounded-full border-[1.5px] border-[var(--ink)]" style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
                    {c.length} nodes
                  </span>
                  <button onClick={() => applyCluster(c)} className="underline font-bold text-[11px]">Group</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNode && (
          <div className="absolute right-5 top-20 z-50 flex max-h-[calc(100%-8rem)] flex-col gap-3 overflow-y-auto w-[280px]">
            <TriggerPanel node={selectedNode} />
            {isConverge && <TagEditor node={selectedNode} />}
          </div>
        )}

        {isConverge && <ConvergeBoard />}
      </div>
    </div>
  );
}
