import type { CanvasNode, Feasibility } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { Paperclip } from './Journal';

export default function TagEditor({ node }: { node: CanvasNode }) {
  const setNodeTag = useCanvasStore((s) => s.setNodeTag);

  return (
    <div className="pointer-events-auto relative w-[286px] pt-5">
      <Paperclip
        className="absolute -top-1 right-7 z-20 drop-shadow-[0_2px_3px_rgba(51,45,34,0.35)]"
        size={28}
        rotate={9}
      />

      <div className="paper paper-edge px-3.5 pb-3.5 pt-4">
        <div className="label-title mb-1 inline-block text-[12.5px] font-semibold tracking-[0.16em] text-ink">
          收敛标签
        </div>
        <div className="meta-line mb-3 text-[9.5px] uppercase">
          feasibility / category
        </div>

        <label className="mb-1.5 block text-[11px] tracking-[0.1em] text-ink-soft">
          可行性
        </label>
        <div className="mb-3.5 flex gap-1.5">
          {(['high', 'medium', 'low'] as Feasibility[]).map((f) => {
            const active = node.tags?.feasibility === f;
            const label = f === 'high' ? '高' : f === 'medium' ? '中' : '低';
            return (
              <button
                key={f}
                onClick={() =>
                  setNodeTag(node.id, { feasibility: active ? undefined : f })
                }
                className={`flex-1 border py-1.5 text-[12px] tracking-[0.08em] transition ${
                  active
                    ? 'border-[rgba(168,68,58,0.75)] bg-[rgba(168,68,58,0.14)] text-pencil'
                    : 'border-[rgba(120,104,76,0.4)] bg-[rgba(255,253,246,0.45)] text-ink-soft hover:bg-[rgba(233,224,205,0.7)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <label className="mb-1.5 block text-[11px] tracking-[0.1em] text-ink-soft">
          主题分类
        </label>
        <input
          type="text"
          defaultValue={node.tags?.category ?? ''}
          placeholder="如：营销 / 技术 / 长期"
          onBlur={(e) =>
            setNodeTag(node.id, {
              category: e.target.value.trim() || undefined,
            })
          }
          className="w-full border-0 border-b border-[rgba(120,104,76,0.55)] bg-transparent px-1 py-1 font-song text-[12.5px] text-ink outline-none placeholder:text-ink-pale focus:border-pencil"
        />
      </div>
    </div>
  );
}
