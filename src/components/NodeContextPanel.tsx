import { useEffect, useState } from 'react';
import type { CanvasNode } from '../types';

interface MemoryItem {
  id: string;
  kind: string;
  content: string;
  metadata?: { title?: string; example?: boolean };
}

interface ReferenceItem {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  source: string;
}

interface Props {
  mode: 'memory' | 'reference';
  node: CanvasNode;
  onClose: () => void;
  onCreateNode: (title: string, body: string, edgeLabel: string) => void;
}

export default function NodeContextPanel({ mode, node, onClose, onCreateNode }: Props) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const controller = new AbortController();
    setStatus(mode === 'memory' ? 'Loading memory...' : 'Searching the web...');

    const request = mode === 'memory'
      ? fetch('/api/memories', { signal: controller.signal })
          .then((response) => response.json())
          .then((items) => {
            setMemories(items);
            setStatus(items.length ? '' : 'No personal memories yet');
          })
      : fetch('/api/references/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: (node.content || node.longForm || 'creative thinking').slice(0, 180) }),
          signal: controller.signal,
        })
          .then((response) => response.json())
          .then((items) => {
            setReferences(items);
            setStatus(items.length ? '' : 'No web references found');
          });

    request.catch((error) => {
      if (error.name !== 'AbortError') setStatus('Backend or network unavailable');
    });
    return () => controller.abort();
  }, [mode, node.content, node.longForm]);

  return (
    <div className="k-card pointer-events-auto bg-white p-3.5">
      <div className="mb-3 flex items-center justify-between border-b-[1.5px] border-[var(--ink)] pb-2">
        <div className="text-[14px] font-bold">
          {mode === 'memory' ? 'Personal Memory' : 'Web References'}
        </div>
        <button type="button" className="text-[11px] font-bold underline" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {mode === 'memory' && memories.map((memory) => (
          <div key={memory.id} className="rounded-lg border-[1.5px] border-[var(--ink)] bg-[var(--m-cream)] p-2.5 shadow-[1px_1px_0_var(--ink)]">
            <div className="text-[12px] font-bold">
              {memory.metadata?.title || memory.kind}
              {memory.metadata?.example && <span className="ml-1 text-[9px] text-gray-500">EXAMPLE</span>}
            </div>
            <p className="my-1.5 text-[11px] leading-relaxed text-gray-600">{memory.content}</p>
            <button
              type="button"
              className="text-[10px] font-bold underline"
              onClick={() => onCreateNode(memory.metadata?.title || 'Personal Memory', memory.content, 'memory')}
            >
              Add to canvas
            </button>
          </div>
        ))}

        {mode === 'reference' && references.map((reference) => (
          <div key={reference.id} className="rounded-lg border-[1.5px] border-[var(--ink)] bg-[var(--m-sand)] p-2.5 shadow-[1px_1px_0_var(--ink)]">
            <div className="text-[9px] font-bold uppercase text-gray-500">{reference.source}</div>
            <a href={reference.url} target="_blank" rel="noreferrer" className="mt-1 block text-[12px] font-bold underline">
              {reference.title}
            </a>
            {reference.excerpt && <p className="my-1.5 line-clamp-3 text-[11px] leading-relaxed text-gray-600">{reference.excerpt}</p>}
            <button
              type="button"
              className="text-[10px] font-bold underline"
              onClick={() => onCreateNode(reference.title, `${reference.excerpt}\n${reference.url}`, 'reference')}
            >
              Add to canvas
            </button>
          </div>
        ))}

        {status && <p className="m-0 text-[11px] font-bold text-gray-500">{status}</p>}
      </div>
    </div>
  );
}
