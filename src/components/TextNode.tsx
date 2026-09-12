import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { CanvasNode } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { triggerMeta } from '../data/triggerBank';

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

  return (
    <div
      className={`k-card ${selected ? '!ring-2 !ring-black !ring-offset-2' : ''}`}
      style={{
        width: 220,
        backgroundColor: bgColor,
        outline: inCluster ? `3px dashed ${inCluster}` : undefined,
        outlineOffset: 6,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="px-4 py-3.5">
        {isTrigger && (
          <div className="flex items-center gap-2 mb-2 border-b-1.5 border-[var(--ink)] pb-1.5">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-[var(--ink)] text-[10px] font-bold shadow-[1px_1px_0_var(--ink)]"
              style={{ background: meta.color }}
            >
              {meta.mark}
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
            rows={Math.max(2, value.split('\n').length)}
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
            onDoubleClick={() => setEditing(true)}
          >
            {node.content || <span className="text-gray-400">Double click...</span>}
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
