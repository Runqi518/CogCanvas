import { useMemo, useState } from 'react';
import type { CanvasNode, Feasibility } from '../types';
import { useCanvasStore } from '../store/canvasStore';

const FEASIBILITY_LABEL: Record<Feasibility, string> = { high: 'High', medium: 'Med', low: 'Low' };
type GroupBy = 'feasibility' | 'category';

export default function ConvergeBoard() {
  const project = useCanvasStore((s) => s.project)!;
  const setSelected = useCanvasStore((s) => s.setSelected);
  const [groupBy, setGroupBy] = useState<GroupBy>('feasibility');
  const [selected, setSelectedIds] = useState<Set<string>>(new Set());

  const contentNodes = useMemo(() => project.nodes.filter((n) => n.content.trim()), [project.nodes]);
  const groups = useMemo(() => {
    const map = new Map<string, CanvasNode[]>();
    for (const n of contentNodes) {
      let key = groupBy === 'feasibility' ? (n.tags?.feasibility ? `Feasibility ${FEASIBILITY_LABEL[n.tags.feasibility]}` : 'Unassessed') : (n.tags?.category?.trim() || 'Uncategorized');
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
    const lines = [`# ${project.name} — Converged Ideas`, ''];
    for (const [key, items] of groups) {
      lines.push(`## ${key}`);
      for (const n of items) {
        if (chosen.length > 0 && !selected.has(n.id)) continue;
        const tagBits: string[] = [];
        if (n.tags?.feasibility) tagBits.push(`Feasibility ${FEASIBILITY_LABEL[n.tags.feasibility]}`);
        if (n.tags?.category) tagBits.push(n.tags.category);
        const suffix = tagBits.length ? ` _(${tagBits.join(' · ')})_` : '';
        lines.push(`- ${n.content.replace(/\n/g, ' ')}${suffix}`);
      }
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-Export.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="border-l-[1.5px] border-[var(--ink)] bg-[var(--m-latte)] flex w-[300px] shrink-0 flex-col z-50 shadow-[-2px_0_0_rgba(0,0,0,0.1)]">
      <div className="border-b-[1.5px] border-[var(--ink)] bg-[var(--m-sand)] px-4 py-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="text-[15px] font-bold">Converge Board</div>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="rounded border-[1.5px] border-[var(--ink)] bg-[var(--bg-white)] px-1.5 py-1 text-[11px] font-bold outline-none shadow-[1px_1px_0_var(--ink)]">
            <option value="feasibility">By Feasibility</option>
            <option value="category">By Category</option>
          </select>
        </div>
        <button onClick={exportMarkdown} className="k-button w-full k-button-pink">
          Export MD {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {groups.map(([key, items]) => (
          <div key={key}>
            <div className="mb-2 border-b-[1.5px] border-[var(--ink)] pb-1 flex justify-between">
              <span className="text-[12px] font-bold">{key}</span>
              <span className="text-[11px] font-bold">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((n) => (
                <label key={n.id} className="flex cursor-pointer items-start gap-2 rounded-lg border-[1.5px] border-[var(--ink)] bg-[var(--m-cream)] p-2 text-[12px] font-bold shadow-[1px_1px_0_var(--ink)] transition hover:-translate-y-[1px] hover:shadow-[2px_2px_0_var(--ink)] hover:bg-[var(--neon-green)]" onClick={() => setSelected(n.id)}>
                  <input type="checkbox" className="mt-1 accent-black" checked={selected.has(n.id)} onChange={(e) => { e.stopPropagation(); toggle(n.id); }} onClick={(e) => e.stopPropagation()} />
                  <span className="whitespace-pre-wrap break-words">{n.content}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {contentNodes.length === 0 && <p className="text-center text-[12px] font-bold">No content yet.</p>}
      </div>
    </aside>
  );
}
