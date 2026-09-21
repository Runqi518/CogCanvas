import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import RagSearch from '../components/RagSearch';
import NodeContextPanel from '../components/NodeContextPanel';

const CLUSTER_COLORS = ['#ff6bba', '#59d2f6', '#52e085', '#f4d44d', '#9c7b64'];
const NEON_EDGES = ['#52e085', '#59d2f6', '#ff6bba'];
const nodeTypes: NodeTypes = { text: TextNode };

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size?: number;
  excerpt?: string;
  content?: string;
  sourceUrl?: string;
}

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
    addNode, updateNode, moveNode, removeNode, addEdge, removeEdge,
    setMode, clusters, showClusters, recomputeClusters, applyCluster,
  } = useCanvasStore();

  const lastClusterCount = useRef(0);
  const linkedProjectRef = useRef<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [materialsOpen, setMaterialsOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activePanel, setActivePanel] = useState<'trigger' | 'memory' | 'reference' | null>(null);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  useEffect(() => { if (id) load(id); }, [id, load]);

  useEffect(() => {
    if (!project || linkedProjectRef.current === project.id) return;
    linkedProjectRef.current = project.id;
    const ideaNodes = project.nodes.filter((node) => node.type === 'normal');
    if (project.edges.length === 0 && ideaNodes.length > 1) {
      for (let index = 1; index < ideaNodes.length; index += 1) {
        addEdge(ideaNodes[index - 1].id, ideaNodes[index].id, 'idea');
      }
    }
  }, [project, addEdge]);

  useEffect(() => {
    fetch('/api/materials')
      .then((response) => response.json())
      .then((items) => setUploadedFiles(items.map((item: { id: string; title: string; type: string; content: string; sourceUrl?: string }) => ({
        id: item.id,
        name: item.title,
        type: item.type,
        excerpt: item.content.slice(0, 120),
        content: item.content,
        sourceUrl: item.sourceUrl,
      }))))
      .catch(() => undefined);
  }, []);

  const openNodePanel = useCallback((nodeId: string, panel: 'trigger' | 'memory' | 'reference') => {
    setSelected(nodeId);
    setActivePanel(panel);
  }, [setSelected]);

  const nodeLen = project?.nodes.length ?? 0;
  useEffect(() => {
    if (nodeLen >= 2 && nodeLen - lastClusterCount.current >= 5) {
      lastClusterCount.current = nodeLen;
      recomputeClusters();
    }
  }, [nodeLen, recomputeClusters]);

  const clusterColorMap = useMemo(() => {
    const map = new Map<string, string>();
    clusters.forEach((cluster, index) => {
      const color = CLUSTER_COLORS[index % CLUSTER_COLORS.length];
      cluster.forEach((nodeId) => map.set(nodeId, color));
    });
    return map;
  }, [clusters]);

  const rfNodes: Node<TextNodeData>[] = useMemo(() => {
    if (!project) return [];
    return project.nodes.map((node) => {
      const width = node.style?.width ?? 248;
      const height = node.style?.height ?? 193;
      return {
        id: node.id,
        type: 'text',
        position: node.position,
        data: {
          node,
          inCluster: showClusters ? clusterColorMap.get(node.id) ?? null : null,
          onOpenPanel: openNodePanel,
          onExpandMaterial: setExpandedNodeId,
        },
        width,
        height,
        style: { width, height },
        selected: node.id === selectedNodeId,
      };
    });
  }, [project, selectedNodeId, showClusters, clusterColorMap, openNodePanel]);

  const rfEdges: Edge[] = useMemo(() => {
    if (!project) return [];
    return project.edges.map((edge, index) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      labelStyle: { fontSize: 11, fill: '#1f1f1f', fontWeight: 'bold' },
      labelBgPadding: [6, 4] as [number, number],
      labelBgStyle: { fill: '#fff', fillOpacity: 1, stroke: '#1f1f1f', strokeWidth: 1.5, rx: 6, ry: 6 },
      style: { stroke: NEON_EDGES[index % NEON_EDGES.length], strokeWidth: 2.5 },
      animated: false,
    }));
  }, [project]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type === 'position' && change.position) moveNode(change.id, change.position);
      else if (change.type === 'remove') removeNode(change.id);
      else if (change.type === 'select' && change.selected) setSelected(change.id);
      else if (change.type === 'dimensions' && change.dimensions) {
        const node = project?.nodes.find((item) => item.id === change.id);
        const width = Math.round(change.dimensions.width);
        const height = Math.round(change.dimensions.height);
        if ((node?.style?.width ?? 248) === width && (node?.style?.height ?? 193) === height) continue;
        updateNode(change.id, {
          style: {
            ...node?.style,
            width,
            height,
          },
        });
      }
    }
  }, [moveNode, project, removeNode, setSelected, updateNode]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const change of changes) if (change.type === 'remove') removeEdge(change.id);
  }, [removeEdge]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) addEdge(connection.source, connection.target);
  }, [addEdge]);

  const createNodeAt = useCallback((clientX: number, clientY: number) => {
    const position = rf.screenToFlowPosition({ x: clientX, y: clientY });
    const sourceId = selectedNodeId ?? project?.nodes[project.nodes.length - 1]?.id;
    const node = addNode({ position: { x: position.x - 124, y: position.y - 60 } });
    if (sourceId) addEdge(sourceId, node.id, 'idea');
    setSelected(node.id);
    setActivePanel(null);
  }, [rf, addNode, addEdge, project, selectedNodeId, setSelected]);

  // 直接监听画布容器的原生 dblclick，避开 ReactFlow 事件路径的浏览器差异
  useEffect(() => {
    const element = canvasWrapRef.current;
    if (!element) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__panel, .react-flow__handle, .k-card, .k-button, button, textarea, input, a')) return;
      event.preventDefault();
      createNodeAt(event.clientX, event.clientY);
    };
    element.addEventListener('dblclick', handler, true);
    return () => element.removeEventListener('dblclick', handler, true);
  }, [createNodeAt]);

  const onPaneClick = useCallback(() => {
    setSelected(null);
    setActivePanel(null);
  }, [setSelected]);

  async function uploadMaterial(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      setUploadedFiles((files) => [{
        id: result.id,
        name: result.title,
        type: result.type,
        size: result.size,
        excerpt: result.excerpt,
        content: result.content,
        sourceUrl: result.sourceUrl,
      }, ...files]);

      const source = project?.nodes.find((node) => node.id === selectedNodeId)
        ?? project?.nodes[project.nodes.length - 1];
      const position = source
        ? { x: source.position.x + 300, y: source.position.y + 70 }
        : { x: 300, y: 180 };
      const node = addNode({
        content: result.title,
        longForm: result.content || result.excerpt || '',
        material: {
          id: result.id,
          type: result.type,
          sourceUrl: result.sourceUrl,
        },
        position,
      });
      if (source) addEdge(source.id, node.id, 'material');
      setSelected(node.id);
      setActivePanel(null);
    } finally {
      setUploading(false);
    }
  }

  async function deleteMaterial(file: UploadedFile) {
    if (!window.confirm(`删除资料“${file.name}”及其画布卡片？`)) return;
    const response = await fetch(`/api/materials/${encodeURIComponent(file.id)}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) return;
    setUploadedFiles((files) => files.filter((item) => item.id !== file.id));
    project?.nodes
      .filter((node) => node.material?.id === file.id)
      .forEach((node) => removeNode(node.id));
    setExpandedNodeId((nodeId) => {
      const expanded = project?.nodes.find((node) => node.id === nodeId);
      return expanded?.material?.id === file.id ? null : nodeId;
    });
  }

  if (loading) return <div className="kinopio-bg flex h-full items-center justify-center font-bold">Loading...</div>;
  if (!project) return <div className="kinopio-bg flex h-full items-center justify-center"><button className="k-button" onClick={() => navigate('/')}>Home</button></div>;

  const selectedNode = project.nodes.find((node) => node.id === selectedNodeId);
  const expandedNode = project.nodes.find((node) => node.id === expandedNodeId);
  const isConverge = project.mode === 'converge';

  function createNodeAtCenter() {
    const element = document.querySelector('.react-flow') as HTMLElement | null;
    const rect = element?.getBoundingClientRect();
    const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const position = rf.screenToFlowPosition(center);
    const sourceId = selectedNodeId ?? project?.nodes[project.nodes.length - 1]?.id;
    const node = addNode({ position: { x: position.x - 124, y: position.y - 60 } });
    if (sourceId) addEdge(sourceId, node.id, 'idea');
    setSelected(node.id);
    setActivePanel(null);
  }

  function createLinkedContextNode(title: string, body: string, edgeLabel: string) {
    if (!selectedNode) return;
    const node = addNode({
      content: title,
      longForm: body,
      position: {
        x: selectedNode.position.x + 300,
        y: selectedNode.position.y + 60,
      },
    });
    addEdge(selectedNode.id, node.id, edgeLabel);
    setSelected(node.id);
    setActivePanel(null);
  }

  return (
    <div className="flex h-full flex-col kinopio-bg">
      <div className="absolute left-5 top-5 z-50 flex gap-2">
        <button className="k-button k-button-green" onClick={createNodeAtCenter}>+ New</button>
        <button className="k-button" onClick={() => navigate('/')}>Home</button>
        <div className="k-card px-3 py-1.5 text-[14px] font-bold flex items-center">{project.name}</div>
      </div>

      <div className="absolute right-5 top-5 z-50 flex gap-2">
        {isConverge && <button className="k-button" onClick={() => recomputeClusters()}>Cluster ideas</button>}
        <div className="flex items-center gap-1 rounded-lg border border-black/15 bg-white/80 p-1 shadow-sm" aria-label="Diverge and Converge are opposite creative modes">
          <button className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${!isConverge ? 'bg-[var(--neon-green)] shadow-sm' : 'text-gray-400'}`} onClick={() => setMode('diverge')}>Diverge</button>
          <span className="text-[11px] text-gray-400">↔</span>
          <button className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${isConverge ? 'bg-[var(--neon-pink)] shadow-sm' : 'text-gray-400'}`} onClick={() => setMode('converge')}>Converge</button>
        </div>
      </div>

      <aside
        className={`k-card absolute bottom-24 left-5 top-20 z-40 flex flex-col overflow-hidden bg-white/95 transition-[width] duration-200 ${materialsOpen ? 'w-64 p-3' : 'w-11 p-1.5'}`}
      >
        <button
          type="button"
          className={`k-button h-8 min-h-8 ${materialsOpen ? 'ml-auto px-2' : 'w-8 px-0'} k-button-pink`}
          onClick={() => setMaterialsOpen((open) => !open)}
          title={materialsOpen ? '收起多模态资料' : '展开多模态资料'}
        >
          {materialsOpen ? '‹' : '›'}
        </button>

        {materialsOpen ? (
          <>
            <div className="mb-3 mt-1 text-[13px] font-bold">多模态资料</div>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,audio/*,video/*,.pdf,.txt,.md"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadMaterial(file);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              className="rounded-lg border-[1.5px] border-dashed border-[var(--ink)] bg-[var(--m-cream)] px-3 py-5 text-center text-[12px] font-bold hover:bg-[var(--neon-cyan)]"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploading}
            >
              <span className="mb-1 block text-xl">+</span>
              {uploading ? 'Uploading...' : 'Upload files'}
              <span className="mt-1 block text-[10px] font-normal text-gray-500">Image · Audio · Video · PDF</span>
            </button>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={file.id} className={`k-card px-2.5 py-2 ${index % 2 === 0 ? 'bg-[var(--m-cream)]' : 'bg-[var(--m-sand)]'}`}>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 truncate text-[11px] font-bold">{file.name}</div>
                    <button
                      type="button"
                      className="rounded px-1 text-[13px] text-gray-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => void deleteMaterial(file)}
                      title="删除资料"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-1 truncate text-[9px] text-gray-500">
                    {file.type || 'file'}{file.size ? ` · ${(file.size / 1024).toFixed(1)} KB` : ''}
                  </div>
                  {file.excerpt && <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-gray-500">{file.excerpt}</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="mt-3 text-[10px] font-bold tracking-wider [writing-mode:vertical-rl]"
            onClick={() => setMaterialsOpen(true)}
          >
            MULTI-MODAL
          </button>
        )}
      </aside>

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

      <div className="relative flex flex-1 overflow-hidden" ref={canvasWrapRef}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          fitView
          minZoom={0.2}
          maxZoom={2}
          zoomOnDoubleClick={false}
          deleteKeyCode={['Backspace', 'Delete']}
          style={{ background: 'transparent' }}
        >
          <Controls showInteractive={false} className="!mb-6 !mr-6" />
        </ReactFlow>

        {isConverge && showClusters && clusters.length > 0 && (
          <div className="k-card absolute bottom-20 left-[285px] z-50 w-[240px] px-3.5 py-3 bg-[var(--m-cream)]">
            <div className="text-[13px] font-bold border-b-1.5 border-[var(--ink)] mb-2 pb-1">Converge suggestions</div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto">
              {clusters.map((cluster, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] font-bold">
                    <span className="h-3 w-3 rounded-full border-[1.5px] border-[var(--ink)]" style={{ background: CLUSTER_COLORS[index % CLUSTER_COLORS.length] }} />
                    {cluster.length} nodes
                  </span>
                  <button onClick={() => applyCluster(cluster)} className="underline font-bold text-[11px]">Group</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNode && activePanel === 'trigger' && (
          <div className="absolute right-5 top-20 z-50 flex max-h-[calc(100%-8rem)] flex-col gap-3 overflow-y-auto w-[280px]">
            <TriggerPanel node={selectedNode} />
            {isConverge && <TagEditor node={selectedNode} />}
          </div>
        )}

        {selectedNode && (activePanel === 'memory' || activePanel === 'reference') && (
          <div className="absolute right-5 top-20 z-50 w-[300px]">
            <NodeContextPanel
              mode={activePanel}
              node={selectedNode}
              onClose={() => setActivePanel(null)}
              onCreateNode={createLinkedContextNode}
            />
          </div>
        )}

        {expandedNode?.material && (
          <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/30 p-8" onClick={() => setExpandedNodeId(null)}>
            <div className="k-card flex max-h-full w-full max-w-4xl flex-col bg-white p-5" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center gap-3 border-b border-black/10 pb-3">
                <div className="min-w-0 flex-1 truncate text-[16px] font-bold">{expandedNode.content}</div>
                <button type="button" className="k-button px-3" onClick={() => setExpandedNodeId(null)}>关闭</button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap text-[14px] leading-7 text-gray-700">
                {expandedNode.material.type === 'image' && expandedNode.material.sourceUrl ? (
                  <img src={expandedNode.material.sourceUrl} alt={expandedNode.content} className="mx-auto max-h-full max-w-full object-contain" />
                ) : expandedNode.material.type === 'audio' && expandedNode.material.sourceUrl ? (
                  <audio src={expandedNode.material.sourceUrl} controls className="w-full" />
                ) : expandedNode.material.type === 'video' && expandedNode.material.sourceUrl ? (
                  <video src={expandedNode.material.sourceUrl} controls className="max-h-full w-full" />
                ) : expandedNode.material.type === 'application' && expandedNode.material.sourceUrl ? (
                  <iframe src={expandedNode.material.sourceUrl} title={expandedNode.content} className="h-[70vh] w-full border-0" />
                ) : (
                  expandedNode.longForm || '该资料没有可预览的文本内容。'
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
