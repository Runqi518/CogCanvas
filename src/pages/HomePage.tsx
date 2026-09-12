import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CanvasProject } from '../types';
import { deleteProject, listProjects, saveProject } from '../lib/db';
import { createEmptyProject } from '../store/canvasStore';
import { now, uid } from '../lib/utils';

export default function HomePage() {
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const navigate = useNavigate();

  async function refresh() { setProjects(await listProjects()); }
  useEffect(() => { refresh(); }, []);

  async function createProject() {
    const project = createEmptyProject('Untitled Space');
    await saveProject(project);
    navigate(`/canvas/${project.id}`);
  }

  async function renameProject(project: CanvasProject) {
    const name = window.prompt('Rename space', project.name)?.trim();
    if (!name) return;
    await saveProject({ ...project, name, updatedAt: now() });
    refresh();
  }

  async function duplicateProject(project: CanvasProject) {
    await saveProject({
      ...project, id: uid('proj'), name: `${project.name} Copy`, createdAt: now(), updatedAt: now(),
    });
    refresh();
  }

  async function removeProject(project: CanvasProject) {
    if (!window.confirm(`Delete ${project.name}?`)) return;
    await deleteProject(project.id);
    refresh();
  }

  return (
    <main className="min-h-full kinopio-bg">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b-[1.5px] border-[var(--ink)] bg-[var(--bg-white)] px-5 py-2.5 shadow-[0_2px_0_var(--ink)]">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5"><i className="h-3 w-3 rounded-full border-[1.5px] border-black bg-[var(--neon-pink)]"/><i className="h-3 w-3 rounded-full border-[1.5px] border-black bg-[var(--neon-cyan)]"/><i className="h-3 w-3 rounded-full border-[1.5px] border-black bg-[var(--neon-green)]"/></div>
          <strong className="text-[15px] tracking-wide">CogCanvas</strong>
        </div>
        <div className="flex gap-2">
          <button className="k-button" onClick={() => navigate('/workflow')}>Method</button>
          <button className="k-button k-button-green" onClick={createProject}>+ New Space</button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="k-card relative p-8 md:p-12 transform rotate-0 mb-16 bg-[#ffffff]">
          <span className="absolute -top-3 -right-3 rotate-12 rounded-lg border-[1.5px] border-black bg-[var(--neon-pink)] px-3 py-1 text-[12px] font-bold shadow-[2px_2px_0_black]">
            Creativity OS
          </span>
          <h1 className="mb-4 font-serif text-[42px] font-bold leading-tight md:text-[64px]">
            Spatial thinking.<br/>Messy, playful, yours.
          </h1>
          <p className="max-w-xl text-[16px] font-bold text-gray-700 leading-relaxed">
            一张允许混乱、试错和突然转弯的思考桌面。
          </p>
          <button className="k-button k-button-cyan mt-6 px-6 py-3 text-[14px]" onClick={createProject}>Open an empty space →</button>
        </div>

        <div className="mb-6 flex items-center gap-3 border-b-[1.5px] border-[var(--ink)] pb-2 text-[14px] font-bold">
          <span>SPACES</span>
          <span className="rounded bg-black px-2 py-0.5 text-white">{projects.length}</span>
        </div>

        {projects.length === 0 ? (
          <button className="k-card flex min-h-[200px] w-full flex-col items-center justify-center bg-[var(--m-grey)]" onClick={createProject}>
            <span className="text-[12px] font-bold text-gray-500 uppercase">Empty Desk</span>
            <strong className="mt-4 text-[24px] font-bold">+ Drop a card</strong>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {projects.map((project, index) => {
              const bg = [ 'var(--m-sand)', 'var(--m-latte)', 'var(--m-cream)' ][index % 3];
              return (
                <article className="k-card flex flex-col justify-between p-0 overflow-hidden" style={{ background: bg }} key={project.id}>
                  <button className="flex-1 p-5 text-left" onClick={() => navigate(`/canvas/${project.id}`)}>
                    <div className="mb-3 inline-block rounded border-[1.5px] border-black bg-[var(--neon-pink)] px-2 py-0.5 text-[10px] font-bold">
                      CC-{String(index + 1).padStart(3, '0')}
                    </div>
                    <h2 className="mb-2 font-serif text-[22px] font-bold leading-tight">{project.name}</h2>
                    <p className="text-[13px] font-bold text-gray-600 line-clamp-2">
                      {project.nodes.find((node) => node.content.trim())?.content || 'Empty canvas...'}
                    </p>
                  </button>
                  <div className="flex items-center justify-between border-t-[1.5px] border-black bg-white px-4 py-3">
                    <span className="text-[10px] font-bold uppercase">{project.nodes.length} cards</span>
                    <div className="flex gap-2">
                      <button className="text-[11px] font-bold underline" onClick={() => duplicateProject(project)}>Copy</button>
                      <button className="text-[11px] font-bold underline" onClick={() => renameProject(project)}>Rename</button>
                      <button className="text-[11px] font-bold underline" onClick={() => removeProject(project)}>Del</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
