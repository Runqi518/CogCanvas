import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { CanvasNode } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { triggerMeta } from '../data/triggerBank';
import { TriggerIcon } from './CognitiveIcon';

export interface TextNodeData {
  node: CanvasNode;
  inCluster?: string | null;
}

const MAILLARD_TINTS = ['#f9f6f0', '#e6dfd1', '#d4c4b7', '#e8e8e8'];
function tintOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) % 997;
  return MAILLARD_TINTS[h % MAILLARD_TINTS.length];
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
  const bgColor = isTrigger ? '#ffffff' : tintOf(id);
  const fontSize = node.style?.fontSize ?? 15;

  function commit() {
    setEditing(false);
    if (value !== node.content) updateNode(id, { content: value });
  }

  function openLongForm(event: React.MouseEvent) {
    event.stopPropagation();
    if (projectId) navigate(`/canvas/${projectId}/node/${id}/edit`);
  }

  return (
    <div
      className={`note-card ${selected ? 'note-card-selected' : ''}`}
      style={{
        width: 164,
        backgroundColor: bgColor,
        outline: inCluster ? `2px dashed ${inCluster}` : undefined,
        outlineOffset: 4,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="px-3 py-2.5">
        {isTrigger && (
          <div className="mb-2 flex items-center gap-2 border-b border-black/15 pb-1.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md border bg-white/70"
              style={{ color: meta.color, borderColor: `${meta.color}66` }}
            >
              <TriggerIcon type={node.triggerType!} size={15} />
            </span>
            <span className="text-[13px] font-bold text-[var(--ink)] tracking-wide">
              {meta.name}
            </span>
          </div>
        )}
        {editing ? (
          <textarea
            ref={ref}
            className="w-full resize-none bg-transparent outline-none text-[var(--ink)] nodrag"
            style={{ fontSize, lineHeight: 1.5 }}
            rows={Math.min(5, Math.max(2, value.split('\n').length))}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
              if (e.key === 'Escape') { setValue(node.content); setEditing(false); }
            }}
            placeholder="Type here..."
          />
        ) : (
          <div
            className="min-h-[44px] cursor-text whitespace-pre-wrap break-words text-[var(--ink)]"
            style={{ fontSize, lineHeight: 1.5 }}
            onDoubleClick={openLongForm}
          >
            {node.content || <span className="text-gray-400">Double click...</span>}
            {node.longForm && <div className="mt-2 line-clamp-2 border-t border-black/10 pt-1.5 text-[10px] font-normal leading-relaxed text-gray-500">{node.longForm}</div>}
          </div>
        )}
        <NodeTags node={node} />
      </div>
      <Handle type="source" position={Position.Right} />
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
