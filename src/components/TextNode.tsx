import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { CanvasNode } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { triggerMeta } from '../data/triggerBank';

export interface TextNodeData {
  node: CanvasNode;
  inCluster?: string | null; // 聚类簇颜色
}

/** 由 id 派生一个稳定的小角度，让每张便签都像手贴上去的 */
function tiltOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return ((h % 40) - 20) / 10; // -2.0deg ~ +1.9deg
}

/** 便签配色（普通节点在几种纸色中轮换） */
const STICKY_TINTS = [
  'linear-gradient(168deg,#f8eeb4 0%,#f4e59b 55%,#ebd984 100%)',
  'linear-gradient(168deg,#f7ecb9 0%,#f1e29a 55%,#e8d582 100%)',
  'linear-gradient(168deg,#f9f0c2 0%,#f5e8a6 55%,#ecdc8c 100%)',
];
function tintOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) % 997;
  return STICKY_TINTS[h % STICKY_TINTS.length];
}

function TextNodeInner({ id, data, selected }: NodeProps<TextNodeData>) {
  const { node, inCluster } = data;
  const updateNode = useCanvasStore((s) => s.updateNode);
  const [editing, setEditing] = useState(node.content === '');
  const [value, setValue] = useState(node.content);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(node.content);
  }, [node.content]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const meta = node.triggerType ? triggerMeta[node.triggerType] : null;
  const isTrigger = node.type === 'trigger' && meta;
  const accent = node.style?.color || (meta ? meta.color : '#6f6249');
  const fontSize = node.style?.fontSize ?? 13;
  const tilt = tiltOf(id);

  function commit() {
    setEditing(false);
    if (value !== node.content) updateNode(id, { content: value });
  }

  return (
    <div
      className="relative"
      style={{
        width: 184,
        transform: `rotate(${tilt}deg)`,
        outline: inCluster ? `2px dashed ${inCluster}` : undefined,
        outlineOffset: 7,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border !border-solid"
        style={{
          background: '#f4eee1',
          borderColor: 'rgba(79,69,52,0.65)',
          boxShadow: '0 1px 2px rgba(51,45,34,0.25)',
        }}
      />

      {isTrigger ? (
        /* ===== 触发卡：做旧纸条 + 档案编号 + 侧边色标 ===== */
        <div
          className="paper relative"
          style={{
            borderLeft: `4px solid ${accent}`,
            boxShadow: selected
              ? `0 0 0 1.5px ${accent}, 0 3px 8px rgba(51,45,34,0.2), 0 12px 24px rgba(51,45,34,0.16)`
              : undefined,
          }}
        >
          {/* 顶部档案条 */}
          <div className="flex items-center justify-between border-b border-[rgba(79,69,52,0.25)] px-2.5 py-1">
            <span className="flex items-center gap-1.5">
              <span
                className="flex h-[17px] w-[17px] items-center justify-center rounded-sm text-[10px] leading-none text-paper-light"
                style={{ background: accent }}
              >
                {meta.mark}
              </span>
              <span
                className="text-[11px] tracking-[0.14em]"
                style={{ color: accent }}
              >
                {meta.name}
              </span>
            </span>
            <span className="meta-line text-[9px]">{meta.code}</span>
          </div>
          <div className="px-2.5 py-2">
            {editing ? (
              <textarea
                ref={ref}
                className="rf-node-textarea nodrag"
                style={{ fontSize, lineHeight: 1.6 }}
                rows={Math.max(2, value.split('\n').length)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
                  if (e.key === 'Escape') {
                    setValue(node.content);
                    setEditing(false);
                  }
                }}
                placeholder="写下你的回答…"
              />
            ) : (
              <div
                className="min-h-[24px] cursor-text whitespace-pre-wrap break-words text-ink"
                style={{ fontSize, lineHeight: 1.65 }}
                onDoubleClick={() => setEditing(true)}
              >
                {node.content || (
                  <span className="text-ink-pale">双击编辑…</span>
                )}
              </div>
            )}
            <NodeTags node={node} />
          </div>
        </div>
      ) : (
        /* ===== 普通想法：黄色便签 ===== */
        <div
          className="sticky-note px-3.5 py-3"
          style={{
            backgroundImage: tintOf(id),
            boxShadow: selected
              ? '0 0 0 2px rgba(168,68,58,0.42), 0 5px 12px rgba(45,36,20,0.24), 0 16px 30px rgba(45,36,20,0.2)'
              : undefined,
          }}
        >
          {editing ? (
            <textarea
              ref={ref}
              className="rf-node-textarea nodrag"
              style={{ fontSize, lineHeight: 1.6 }}
              rows={Math.max(2, value.split('\n').length)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
                if (e.key === 'Escape') {
                  setValue(node.content);
                  setEditing(false);
                }
              }}
              placeholder="写下你的想法…"
            />
          ) : (
            <div
              className="min-h-[86px] cursor-text whitespace-pre-wrap break-words pr-3 text-ink"
              style={{ fontSize, lineHeight: 1.65 }}
              onDoubleClick={() => setEditing(true)}
            >
              {node.content || (
                <span className="text-[rgba(111,98,73,0.55)]">双击编辑…</span>
              )}
            </div>
          )}
          <NodeTags node={node} />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border !border-solid"
        style={{
          background: '#f4eee1',
          borderColor: 'rgba(79,69,52,0.65)',
          boxShadow: '0 1px 2px rgba(51,45,34,0.25)',
        }}
      />
    </div>
  );
}

/** 标签：可行性 / 分类 / 孵化状态 */
function NodeTags({ node }: { node: CanvasNode }) {
  const hasAny =
    node.tags?.feasibility || node.tags?.category || node.incubationUntil != null;
  if (!hasAny) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {node.tags?.feasibility && (
        <span
          className="inline-block rounded-sm border px-1.5 py-[1px] text-[10px] tracking-wider"
          style={{
            borderColor:
              node.tags.feasibility === 'high'
                ? 'rgba(95,107,64,0.6)'
                : node.tags.feasibility === 'medium'
                  ? 'rgba(143,106,51,0.6)'
                  : 'rgba(168,68,58,0.55)',
            color:
              node.tags.feasibility === 'high'
                ? '#4d5834'
                : node.tags.feasibility === 'medium'
                  ? '#7d5c2b'
                  : '#a8443a',
            background: 'rgba(255,253,246,0.5)',
          }}
        >
          可行性
          {node.tags.feasibility === 'high'
            ? '高'
            : node.tags.feasibility === 'medium'
              ? '中'
              : '低'}
        </span>
      )}
      {node.tags?.category && (
        <span className="inline-block rounded-sm border border-[rgba(79,69,52,0.4)] bg-[rgba(255,253,246,0.5)] px-1.5 py-[1px] text-[10px] tracking-wider text-ink-soft">
          {node.tags.category}
        </span>
      )}
      {node.incubationUntil != null && (
        <span className="inline-block rounded-sm border border-dashed border-[rgba(111,98,73,0.7)] bg-[rgba(255,253,246,0.45)] px-1.5 py-[1px] text-[10px] tracking-wider text-ink-soft">
          孵化中
        </span>
      )}
    </div>
  );
}

export const TextNode = memo(TextNodeInner);
