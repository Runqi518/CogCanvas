import { useState } from 'react';
import { backend, type RagResult } from '../lib/api';

export default function RagSearch({ projectId, onSelect }: { projectId: string; onSelect: (nodeId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RagResult[]>([]);
  const [status, setStatus] = useState('');

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setStatus('Searching...');
    try {
      const next = await backend.search(query.trim(), projectId);
      setResults(next);
      const mode = next[0]?.retrievalMode === 'embedding' ? 'AI embedding' : 'local fallback';
      setStatus(next.length ? `${next.length} found · ${mode}` : 'No matches');
    } catch {
      setStatus('Backend disconnected');
    }
  }

  if (!open) {
    return <button className="k-button pointer-events-auto k-button-cyan" onClick={() => setOpen(true)}>🔍 Search Memory</button>;
  }

  return (
    <div className="k-card pointer-events-auto w-[280px] bg-[#ffffff] p-3 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b-1.5 border-[var(--ink)] pb-1.5">
        <span className="font-bold text-[14px]">RAG Search</span>
        <button className="font-bold underline text-[12px]" onClick={() => setOpen(false)}>Close</button>
      </div>
      <form className="flex gap-1.5" onSubmit={search}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." className="min-w-0 flex-1 rounded border-[1.5px] border-[var(--ink)] bg-[var(--m-cream)] px-2 text-[13px] font-bold outline-none shadow-[1px_1px_0_var(--ink)] focus:bg-[var(--neon-yellow)]" />
        <button className="k-button" type="submit">Go</button>
      </form>
      <div className="max-h-48 overflow-y-auto space-y-1.5">
        {results.map((result) => (
          <button key={result.id} onClick={() => result.projectId && onSelect(result.nodeId)} className="block w-full rounded border-[1.5px] border-[var(--ink)] bg-[var(--m-sand)] px-2.5 py-1.5 text-left text-[12px] shadow-[1px_1px_0_var(--ink)] hover:bg-[var(--neon-green)] transition">
            <span className="line-clamp-2 font-bold">{result.text}</span>
            <small className="mt-1 block text-[10px] font-bold">{result.kind ? result.kind.toUpperCase() : `MATCH ${Math.round(result.score * 100)}%`}</small>
          </button>
        ))}
        {status && <p className="m-0 text-[11px] font-bold">{status}</p>}
      </div>
    </div>
  );
}
