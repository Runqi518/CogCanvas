import { useMemo, useState } from 'react';
import type { CanvasNode, Feasibility } from '../types';
import { useCanvasStore } from '../store/canvasStore';

const FEASIBILITY_LABEL: Record<Feasibility, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

type GroupBy = 'feasibility' | 'category';

export default function ConvergeBoard() {
  const project = useCanvasStore((s) => s.project)!;
  const setSelected = useCanvasStore((s) => s.setSelected);
  const [groupBy, setGroupBy] = useState<GroupBy>('feasibility');
  const [selected, setSelectedIds] = useState<Set<string>>(new Set());

  const contentNodes = useMemo(
    () => project.nodes.filter((n) => n.content.trim()),
    [project.nodes]
  );

  const groups = useMemo(() => {
    const map = new Map<string, CanvasNode[]>();
    for (const n of contentNodes) {
      let key: string;
      if (groupBy === 'feasibility') {
        key = n.tags?.feasibility
          ? `可行性 ${FEASIBILITY_LABEL[n.tags.feasibility]}`
          : '未评估';
      } else {
        key = n.tags?.category?.trim() || '未分类';
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return [...map.entries()];
  }, [contentNodes, groupBy]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportMarkdown() {
    const chosen = contentNodes.filter((n) => selected.has(n.id));
    const list = chosen.length ? chosen : contentNodes;
    const lines = [`# ${project.name} — 精选想法`, ''];
    for (const [key, items] of groupItems(list, groupBy)) {
      lines.push(`## ${key}`);
      for (const n of items) {
        const tagBits: string[] = [];
        if (n.tags?.feasibility)
          tagBits.push(`可行性 ${FEASIBILITY_LABEL[n.tags.feasibility]}`);
        if (n.tags?.category) tagBits.push(n.tags.category);
        const suffix = tagBits.length ? ` _(${tagBits.join(' · ')})_` : '';
        lines.push(`- ${n.content.replace(/\n/g, ' ')}${suffix}`);
      }
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-精选想法.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="paper-kraft flex w-[318px] shrink-0 flex-col border-l-2 border-[rgba(79,69,52,0.45)]">
      {/* 档案袋顶部标签 */}
      <div className="border-b border-[rgba(79,69,52,0.35)] px-4 py-3.5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="label-title inline-block text-[12.5px] font-semibold tracking-[0.16em] text-ink">
              收敛看板
            </div>
            <div className="meta-line mt-1 text-[9.5px] uppercase">
              converge / kanban / archive
            </div>
          </div>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="border border-[rgba(79,69,52,0.45)] bg-[rgba(255,253,246,0.6)] px-1.5 py-1 font-song text-[11px] text-ink-soft outline-none"
          >
            <option value="feasibility">按可行性</option>
            <option value="category">按主题分类</option>
          </select>
        </div>

        <button
          onClick={exportMarkdown}
          className="w-full border border-[rgba(79,69,52,0.6)] bg-[rgba(255,253,246,0.72)] py-2 text-[12.5px] tracking-[0.14em] text-ink transition hover:bg-[rgba(255,253,246,0.95)]"
        >
          导出精选想法{selected.size > 0 ? `（${selected.size}）` : ''}
        </button>
        <p className="meta-line mt-1.5 text-[9.5px] leading-relaxed">
          勾选则导出选中项，未勾选导出全部
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        {groups.map(([key, items]) => (
          <div key={key} className="mb-4">
            <div className="mb-1.5 flex items-center gap-2 border-b border-dashed border-[rgba(79,69,52,0.4)] pb-1">
              <span className="text-[11.5px] tracking-[0.12em] text-ink">
                {key}
              </span>
              <span className="text-[10px] text-ink-faint">{items.length}</span>
            </div>
            <div className="space-y-1.5">
              {items.map((n) => (
                <label
                  key={n.id}
                  className="flex cursor-pointer items-start gap-2 border border-[rgba(120,104,76,0.3)] bg-[rgba(250,246,236,0.75)] p-2 text-[11.5px] leading-relaxed transition hover:border-[rgba(168,68,58,0.5)] hover:bg-[rgba(250,246,236,0.95)]"
                  onClick={() => setSelected(n.id)}
                >
                  <input
                    type="checkbox"
                    className="mt-[3px] accent-[#a8443a]"
                    checked={selected.has(n.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggle(n.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="whitespace-pre-wrap break-words text-ink">
                    {n.content}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {contentNodes.length === 0 && (
          <p className="mt-6 text-center text-[11.5px] text-ink-faint">
            画布还没有内容节点
          </p>
        )}
      </div>
    </aside>
  );
}

function groupItems(nodes: CanvasNode[], groupBy: GroupBy) {
  const map = new Map<string, CanvasNode[]>();
  for (const n of nodes) {
    const key =
      groupBy === 'feasibility'
        ? n.tags?.feasibility
          ? `可行性 ${FEASIBILITY_LABEL[n.tags.feasibility]}`
          : '未评估'
        : n.tags?.category?.trim() || '未分类';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return [...map.entries()];
}
