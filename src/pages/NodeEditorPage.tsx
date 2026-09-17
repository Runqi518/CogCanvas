import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCanvasStore } from '../store/canvasStore';

export default function NodeEditorPage() {
  const { projectId, nodeId } = useParams();
  const navigate = useNavigate();
  const { project, loading, load, updateNode } = useCanvasStore();
  const node = project?.nodes.find((item) => item.id === nodeId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'writing' | 'markdown'>('writing');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (projectId && project?.id !== projectId) load(projectId);
  }, [projectId, project?.id, load]);

  useEffect(() => {
    if (node) { setTitle(node.content); setBody(node.longForm ?? ''); }
  }, [node?.id]);

  useEffect(() => {
    if (!nodeId || !node || (title === node.content && body === (node.longForm ?? ''))) return;
    const timer = window.setTimeout(() => {
      updateNode(nodeId, { content: title.trim() || 'Untitled note', longForm: body });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [body, node, nodeId, title, updateNode]);

  function commit() {
    if (nodeId) updateNode(nodeId, { content: title.trim() || 'Untitled note', longForm: body });
  }

  function finish() {
    commit();
    navigate(`/canvas/${projectId}`);
  }

  function wrap(before: string, after = before) {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    setBody(`${body.slice(0, start)}${before}${body.slice(start, end)}${after}${body.slice(end)}`);
    requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start + before.length, end + before.length); });
  }

  if (loading || !project) return <div className="editor-surface flex h-full items-center justify-center">Loading...</div>;
  if (!node) return <div className="editor-surface flex h-full items-center justify-center"><button className="k-button" onClick={() => navigate(`/canvas/${projectId}`)}>Back to canvas</button></div>;

  return (
    <div className="editor-surface flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-black/10 px-7 py-4">
        <div className="flex items-center gap-5">
          <button onClick={finish} className="text-[20px]" aria-label="Back to canvas">←</button>
          <div><div className="text-[9px] font-semibold tracking-[.24em] text-gray-400">EDIT NOTE</div><div className="mt-0.5 text-[14px] font-semibold">长文编辑</div></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-black/10 bg-white/60 p-1 text-[12px]">
            <button onClick={() => setMode('writing')} className={`rounded-md px-3 py-1.5 ${mode === 'writing' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>正文</button>
            <button onClick={() => setMode('markdown')} className={`rounded-md px-3 py-1.5 ${mode === 'markdown' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Markdown</button>
          </div>
          <button onClick={finish} className="rounded-xl bg-[#222228] px-5 py-2.5 text-[12px] font-semibold tracking-[.12em] text-white">完成</button>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-8 pb-10 pt-12">
        <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={commit} placeholder="想法标题" className="w-full border-0 bg-transparent text-[42px] font-bold leading-tight outline-none placeholder:text-gray-300" />
        <div className="mt-9 flex items-center gap-1 rounded-xl border border-black/10 bg-white/70 px-2 py-2 shadow-sm">
          <Tool label="B" onClick={() => wrap('**')} strong />
          <Tool label="I" onClick={() => wrap('_')} italic />
          <Tool label="H2" onClick={() => wrap('\n## ', '')} />
          <Tool label="• List" onClick={() => wrap('\n- ', '')} />
          <Tool label="1. List" onClick={() => wrap('\n1. ', '')} />
          <span className="ml-auto pr-2 text-[10px] tracking-widest text-gray-400">AUTO SAVE</span>
        </div>
        <textarea ref={editorRef} value={body} onChange={(event) => setBody(event.target.value)} onBlur={commit} placeholder={mode === 'markdown' ? '# 从这里开始写作…' : '从这里开始写作…'} className={`mt-7 min-h-0 flex-1 resize-none border-0 bg-transparent text-[18px] leading-[2] outline-none placeholder:text-gray-300 ${mode === 'markdown' ? 'font-mono text-[15px]' : ''}`} />
      </main>
    </div>
  );
}

function Tool({ label, onClick, strong, italic }: { label: string; onClick: () => void; strong?: boolean; italic?: boolean }) {
  return <button onMouseDown={(event) => event.preventDefault()} onClick={onClick} className={`min-w-9 rounded px-2 py-1 text-[12px] hover:bg-[#eeeae2] ${strong ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}>{label}</button>;
}
