import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handle, NodeResizer, Position, type NodeProps } from 'reactflow';
import type { CanvasNode } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { triggerMeta } from '../data/triggerBank';
import { TriggerIcon } from './CognitiveIcon';

export interface TextNodeData {
  node: CanvasNode;
  inCluster?: string | null;
  onOpenPanel?: (nodeId: string, panel: 'trigger' | 'memory' | 'reference') => void;
  onExpandMaterial?: (nodeId: string) => void;
}

function TextNodeInner({ id, data, selected }: NodeProps<TextNodeData>) {
  const { node, inCluster } = data;
  const updateNode = useCanvasStore((s) => s.updateNode);
  const projectId = useCanvasStore((s) => s.project?.id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(node.content === '');
  const [value, setValue] = useState(node.content);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setValue(node.content); }, [node.content]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const meta = node.triggerType ? triggerMeta[node.triggerType] : null;
  const isTrigger = node.type === 'trigger' && meta;
  const fontSize = node.style?.fontSize ?? 15;

  function commit() {
    setEditing(false);
    if (value !== node.content) updateNode(id, { content: value });
  }

  function openLongForm(event: React.MouseEvent) {
    event.stopPropagation();
    if (value !== node.content) updateNode(id, { content: value });
    setEditing(false);
    if (projectId) navigate(`/canvas/${projectId}/node/${id}/edit`);
  }

  return (
    <div
      className={`context-note ${selected ? 'context-note-selected' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        outline: inCluster ? `2px dashed ${inCluster}` : undefined,
        outlineOffset: 6,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={160}
        keepAspectRatio
        lineStyle={{ borderColor: 'transparent' }}
        handleStyle={{ width: 10, height: 10, border: '1px solid #999', borderRadius: 3, background: '#fff' }}
      />
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div className="context-note-header">
        <span className="context-note-icon">
          {isTrigger ? <TriggerIcon type={node.triggerType!} size={16} /> : '📝'}
        </span>
        <span className="context-note-title">{isTrigger ? meta.name : 'Idea Node'}</span>
        {node.material && (
          <button
            type="button"
            className="context-expand nodrag"
            onClick={(event) => {
              event.stopPropagation();
              data.onExpandMaterial?.(id);
            }}
            title="展开全部资料"
          >
            ⛶
          </button>
        )}
        <button
          type="button"
          className="context-trigger nodrag"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenPanel?.(id, 'trigger');
          }}
        >
          Trigger ✧
        </button>
      </div>

      <div className="context-note-body">
        {editing ? (
          <textarea
            ref={ref}
            className="context-note-textarea nodrag"
            style={{ fontSize, lineHeight: 1.55 }}
            rows={Math.min(6, Math.max(3, value.split('\n').length))}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
              if (e.key === 'Escape') { setValue(node.content); setEditing(false); }
            }}
            placeholder="Write down your thoughts here..."
          />
        ) : (
          <div
            className="min-h-[58px] cursor-text whitespace-pre-wrap break-words text-[#666]"
            style={{ fontSize, lineHeight: 1.55 }}
            onDoubleClick={openLongForm}
          >
            {node.content || <span className="text-gray-400">Write down your thoughts here...</span>}
            {node.longForm && <div className="mt-3 line-clamp-2 border-t border-black/5 pt-2 text-[11px] font-normal leading-relaxed text-gray-500">{node.longForm}</div>}
          </div>
        )}
        <NodeTags node={node} />
      </div>

      <div className="context-note-actions">
        <button
          type="button"
          className="context-action nodrag"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenPanel?.(id, 'memory');
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.01 8.01 0 0 1-8 8Zm1-13h-2v6l5.2 3.1 1-1.7-4.2-2.5Z" /></svg>
          记忆
        </button>
        <button
          type="button"
          className="context-action nodrag"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenPanel?.(id, 'reference');
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h14V5Zm2 5h2v7H7Zm4-3h2v10h-2Zm4 6h2v4h-2Z" /></svg>
          参考
        </button>
        <button type="button" className="context-action nodrag" onClick={openLongForm}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75Zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75Z" /></svg>
          写作
        </button>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

function NodeTags({ node }: { node: CanvasNode }) {
  const hasAny = node.tags?.feasibility || node.tags?.category || node.incubationUntil != null;
  if (!hasAny) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {node.tags?.feasibility && (
        <span className="inline-block rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--bg-white)] px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0_var(--ink)]">
          {node.tags.feasibility === 'high' ? 'High' : node.tags.feasibility === 'medium' ? 'Med' : 'Low'}
        </span>
      )}
      {node.tags?.category && (
        <span className="inline-block rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--m-grey)] px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0_var(--ink)]">
          {node.tags.category}
        </span>
      )}
      {node.incubationUntil != null && (
        <span className="inline-block rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--neon-cyan)] px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0_var(--ink)]">
          Incubating
        </span>
      )}
    </div>
  );
}

export const TextNode = memo(TextNodeInner);
