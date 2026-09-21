import { useState } from 'react';
import type { CanvasNode, TriggerType } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { incubationDelayOptions, triggerMeta } from '../data/triggerBank';
import { TriggerIcon } from './CognitiveIcon';

const ORDER: TriggerType[] = ['bisociation', 'abstraction', 'perspective', 'scamper', 'incubation'];

export default function TriggerPanel({ node }: { node: CanvasNode }) {
  const drawTrigger = useCanvasStore((s) => s.drawTrigger);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const project = useCanvasStore((s) => s.project);
  const setSelected = useCanvasStore((s) => s.setSelected);
  const [expanded, setExpanded] = useState<TriggerType | null>(null);
  const parentId = node.type === 'trigger'
    ? project?.edges.find((edge) => edge.target === node.id)?.source
    : undefined;

  return (
    <div className="k-card px-3.5 pb-3.5 pt-3 pointer-events-auto bg-[#ffffff]">
      <div className="mb-2 flex items-center justify-between border-b-1.5 border-[var(--ink)] pb-1.5">
        <div className="text-[14px] font-bold tracking-wide">Triggers</div>
        <div className="flex items-center gap-2">
          {parentId && <button className="text-[11px] font-bold underline" onClick={() => setSelected(parentId)}>← Back</button>}
          <button className="text-[11px] underline font-bold" onClick={() => removeNode(node.id)}>Delete</button>
        </div>
      </div>
      {node.content.trim() && <p className="mb-3 line-clamp-2 rounded border border-black/20 bg-[var(--m-grey)] px-2 py-1.5 text-[12px] font-semibold">{node.content}</p>}
      <div className="space-y-2">
        {ORDER.map((t) => {
          const meta = triggerMeta[t];
          const isOpen = expanded === t;
          const foldable = t === 'abstraction' || t === 'incubation';
          return (
            <div key={t} className="rounded-lg border-[1.5px] border-[var(--ink)] bg-[var(--m-cream)] overflow-hidden shadow-[1px_1px_0_var(--ink)]">
              <button
                onClick={() => {
                  if (foldable) setExpanded(isOpen ? null : t);
                  else drawTrigger(node.id, t);
                }}
                className="flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-[var(--m-sand)] transition"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white" style={{ color: meta.color, borderColor: `${meta.color}66` }}>
                  <TriggerIcon type={t} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-bold">{meta.name}</span>
                </span>
                {foldable ? (
                  <span className="shrink-0 text-[11px] font-bold">{isOpen ? '−' : '＋'}</span>
                ) : (
                  <span className="shrink-0 underline text-[11px] font-bold">Draw</span>
                )}
              </button>
              {isOpen && t === 'abstraction' && (
                <div className="flex gap-1 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg-white)] p-1.5">
                  <button className="flex-1 rounded border-[1.5px] border-[var(--ink)] py-1 text-[11px] font-bold hover:bg-[var(--neon-green)]" onClick={() => drawTrigger(node.id, 'abstraction', { direction: 'up' })}>↑ Abstract</button>
                  <button className="flex-1 rounded border-[1.5px] border-[var(--ink)] py-1 text-[11px] font-bold hover:bg-[var(--neon-pink)]" onClick={() => drawTrigger(node.id, 'abstraction', { direction: 'down' })}>↓ Concrete</button>
                </div>
              )}
              {isOpen && t === 'incubation' && (
                <div className="space-y-1 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg-white)] p-1.5">
                  {incubationDelayOptions.map((opt) => (
                    <button key={opt.label} className="block w-full rounded border-[1.5px] border-[var(--ink)] px-2 py-1 text-left text-[11px] font-bold hover:bg-[var(--neon-cyan)]" onClick={() => drawTrigger(node.id, 'incubation', { delayMs: opt.ms })}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
