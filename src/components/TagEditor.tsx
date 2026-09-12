import type { CanvasNode, Feasibility } from '../types';
import { useCanvasStore } from '../store/canvasStore';

export default function TagEditor({ node }: { node: CanvasNode }) {
  const setNodeTag = useCanvasStore((s) => s.setNodeTag);

  return (
    <div className="k-card px-3.5 pb-3.5 pt-3 pointer-events-auto bg-[#ffffff]">
      <div className="mb-2 border-b-1.5 border-[var(--ink)] pb-1.5 text-[14px] font-bold tracking-wide">
        Tags
      </div>
      <label className="mb-1.5 block text-[12px] font-bold">Feasibility</label>
      <div className="mb-3 flex gap-1.5">
        {(['high', 'medium', 'low'] as Feasibility[]).map((f) => {
          const active = node.tags?.feasibility === f;
          const label = f === 'high' ? 'High' : f === 'medium' ? 'Med' : 'Low';
          const bg = active ? 'var(--neon-pink)' : 'var(--m-grey)';
          return (
            <button
              key={f}
              onClick={() => setNodeTag(node.id, { feasibility: active ? undefined : f })}
              className="flex-1 rounded-md border-[1.5px] border-[var(--ink)] py-1 text-[11px] font-bold shadow-[1px_1px_0_var(--ink)] transition-transform hover:-translate-y-[1px] active:translate-y-0"
              style={{ background: bg }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <label className="mb-1.5 block text-[12px] font-bold">Category</label>
      <input
        type="text"
        defaultValue={node.tags?.category ?? ''}
        placeholder="e.g. Marketing"
        onBlur={(e) => setNodeTag(node.id, { category: e.target.value.trim() || undefined })}
        className="w-full rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--m-cream)] px-2 py-1 text-[13px] font-bold shadow-[1px_1px_0_var(--ink)] outline-none focus:bg-[var(--neon-green)]"
      />
    </div>
  );
}
