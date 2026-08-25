import { useState } from 'react';
import type { CanvasNode, TriggerType } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { incubationDelayOptions, triggerMeta } from '../data/triggerBank';
import { Paperclip } from './Journal';

const ORDER: TriggerType[] = [
  'bisociation',
  'abstraction',
  'perspective',
  'scamper',
  'incubation',
];

export default function TriggerPanel({ node }: { node: CanvasNode }) {
  const drawTrigger = useCanvasStore((s) => s.drawTrigger);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const [expanded, setExpanded] = useState<TriggerType | null>(null);

  return (
    <div className="pointer-events-auto relative w-[286px] pt-5">
      {/* 回形针夹在纸卡上沿 */}
      <Paperclip
        className="absolute -top-1 left-6 z-20 drop-shadow-[0_2px_3px_rgba(51,45,34,0.35)]"
        size={31}
        rotate={-11}
      />

      <div className="paper paper-edge relative px-3.5 pb-3.5 pt-4">
        {/* 标题区 */}
        <div className="mb-2.5 flex items-start justify-between">
          <div>
            <div className="label-title inline-block text-[12.5px] font-semibold tracking-[0.16em] text-ink">
              认知触发器
            </div>
            <div className="meta-line mt-1 text-[9.5px] uppercase">
              cognitive / trigger / cards
            </div>
          </div>
          <button
            className="mt-0.5 border-b border-dashed border-[rgba(168,68,58,0.5)] text-[10.5px] tracking-wider text-pencil hover:border-solid"
            onClick={() => removeNode(node.id)}
            title="删除选中节点"
          >
            删除此节点
          </button>
        </div>

        {/* 当前节点摘要：小纸条 */}
        <p className="mb-3 line-clamp-2 border-l-2 border-[rgba(111,98,73,0.55)] bg-[rgba(233,224,205,0.55)] px-2 py-1.5 text-[11.5px] leading-relaxed text-ink-soft">
          {node.content || '（空节点）'}
        </p>

        <div className="space-y-1.5">
          {ORDER.map((t) => {
            const meta = triggerMeta[t];
            const isOpen = expanded === t;
            const foldable = t === 'abstraction' || t === 'incubation';
            return (
              <div
                key={t}
                className="overflow-hidden border border-[rgba(120,104,76,0.32)] bg-[rgba(255,253,246,0.42)]"
              >
                <button
                  onClick={() => {
                    if (foldable) setExpanded(isOpen ? null : t);
                    else drawTrigger(node.id, t);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition hover:bg-[rgba(233,224,205,0.6)]"
                >
                  {/* 印章式代号 */}
                  <span
                    className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-sm text-[12px] leading-none text-paper-light"
                    style={{ background: meta.color }}
                  >
                    {meta.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] tracking-[0.06em] text-ink">
                      {meta.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] leading-tight text-ink-faint">
                      {meta.desc}
                    </span>
                  </span>
                  {foldable ? (
                    <span className="shrink-0 text-[11px] text-ink-faint">
                      {isOpen ? '收起' : '展开'}
                    </span>
                  ) : (
                    <span
                      className="shrink-0 border-b border-current pb-[1px] text-[11px] tracking-[0.1em]"
                      style={{ color: meta.color }}
                    >
                      抽卡
                    </span>
                  )}
                </button>

                {isOpen && t === 'abstraction' && (
                  <div className="flex gap-1.5 border-t border-[rgba(120,104,76,0.28)] bg-[rgba(233,224,205,0.5)] p-1.5">
                    <button
                      className="flex-1 border border-[rgba(95,107,64,0.5)] bg-[rgba(255,253,246,0.6)] py-1 text-[11.5px] text-[#4d5834] transition hover:bg-[rgba(95,107,64,0.14)]"
                      onClick={() =>
                        drawTrigger(node.id, 'abstraction', { direction: 'up' })
                      }
                    >
                      ↑ 更抽象
                    </button>
                    <button
                      className="flex-1 border border-[rgba(95,107,64,0.5)] bg-[rgba(255,253,246,0.6)] py-1 text-[11.5px] text-[#4d5834] transition hover:bg-[rgba(95,107,64,0.14)]"
                      onClick={() =>
                        drawTrigger(node.id, 'abstraction', {
                          direction: 'down',
                        })
                      }
                    >
                      ↓ 更具体
                    </button>
                  </div>
                )}

                {isOpen && t === 'incubation' && (
                  <div className="space-y-1 border-t border-[rgba(120,104,76,0.28)] bg-[rgba(233,224,205,0.5)] p-1.5">
                    {incubationDelayOptions.map((opt) => (
                      <button
                        key={opt.label}
                        className="block w-full border border-dashed border-[rgba(111,98,73,0.6)] bg-[rgba(255,253,246,0.6)] px-2 py-1 text-left text-[11.5px] text-ink-soft transition hover:bg-[rgba(111,98,73,0.12)]"
                        onClick={() =>
                          drawTrigger(node.id, 'incubation', { delayMs: opt.ms })
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="meta-line mt-3 text-[9.5px] leading-relaxed">
          抽出的卡片会作为新纸条贴在画布上，并与当前便签连线
        </p>
      </div>
    </div>
  );
}
