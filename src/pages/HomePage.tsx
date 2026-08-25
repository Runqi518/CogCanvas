import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CanvasProject } from '../types';
import { deleteProject, listProjects, saveProject } from '../lib/db';
import { createEmptyProject } from '../store/canvasStore';
import { formatTime, uid, now } from '../lib/utils';
import { triggerMeta } from '../data/triggerBank';
import { WORKFLOW_STEPS } from '../data/workflowSteps';
import { Paperclip, Stamp } from '../components/Journal';

export default function HomePage() {
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const navigate = useNavigate();

  async function refresh() {
    setProjects(await listProjects());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    const p = createEmptyProject('未命名画布');
    await saveProject(p);
    navigate(`/canvas/${p.id}`);
  }

  async function handleRename(p: CanvasProject) {
    const name = window.prompt('重命名画布', p.name);
    if (name && name.trim()) {
      await saveProject({ ...p, name: name.trim(), updatedAt: now() });
      refresh();
    }
  }

  async function handleDelete(p: CanvasProject) {
    if (window.confirm(`确定删除「${p.name}」？此操作不可恢复。`)) {
      await deleteProject(p.id);
      refresh();
    }
  }

  async function handleDuplicate(p: CanvasProject) {
    const copy: CanvasProject = {
      ...p,
      id: uid('proj'),
      name: `${p.name} 副本`,
      createdAt: now(),
      updatedAt: now(),
    };
    await saveProject(copy);
    refresh();
  }

  return (
    <div className="kraft-surface min-h-full">
      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-7">
        {/* ===== 顶部：档案标题条 ===== */}
        <header className="relative mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="paper-kraft relative px-5 py-3.5">
            <span
              className="tape"
              style={{ top: -10, left: 22, width: 62 }}
            />
            <h1 className="text-[26px] font-semibold leading-none tracking-[0.08em] text-ink">
              CogCanvas
            </h1>
            <div className="meta-line mt-2 text-[10px] uppercase">
              cognition / canvas / narrative
            </div>
            <p className="mt-1.5 text-[12px] tracking-[0.04em] text-ink-soft">
              认知科学驱动的创造力画布
            </p>
          </div>

          {/* 模式标签页（呼应档案袋） */}
          <div className="paper-kraft flex flex-col gap-2 px-4 py-3">
            <span className="meta-line text-[9px] uppercase">mode</span>
            <div className="flex items-end gap-1">
              <span
                className="folder-tab folder-tab-active px-3.5 pb-1.5 pt-1 text-[11px] tracking-[0.14em] text-ink"
                style={{ borderRadius: '3px 3px 0 0' }}
              >
                索引
              </span>
              <button
                onClick={() => navigate('/workflow')}
                className="folder-tab px-3.5 pb-1.5 pt-1 text-[11px] tracking-[0.14em] text-ink-faint transition hover:text-ink-soft"
                style={{ borderRadius: '3px 3px 0 0' }}
              >
                工作流
              </button>
              <button
                onClick={handleCreate}
                data-create-canvas
                className="folder-tab px-3.5 pb-1.5 pt-1 text-[11px] tracking-[0.14em] text-pencil transition hover:bg-[rgba(246,241,229,0.9)]"
                style={{ borderRadius: '3px 3px 0 0' }}
              >
                ＋ 新建画布
              </button>
            </div>
          </div>
        </header>

        {/* ===== 工作流索引条 ===== */}
        <WorkflowStrip onView={() => navigate('/workflow')} />

        {/* ===== 画布列表 ===== */}
        <section className="mt-7">
          <div className="mb-3.5 flex items-end justify-between">
            <div>
              <div className="on-kraft label-title inline-block text-[13px] font-semibold tracking-[0.16em]">
                我的画布
              </div>
              <div className="meta-on-kraft mt-1 text-[10px] uppercase">
                projects / {projects.length} archived
              </div>
            </div>
            <span className="note-on-kraft text-[11.5px]">
              双击画布空白处即可贴便签
            </span>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              onCreate={handleCreate}
              onViewWorkflow={() => navigate('/workflow')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  onOpen={() => navigate(`/canvas/${p.id}`)}
                  onRename={() => handleRename(p)}
                  onDelete={() => handleDelete(p)}
                  onDuplicate={() => handleDuplicate(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 页脚 */}
        <footer className="mt-14 flex items-center justify-between border-t border-[rgba(250,244,230,0.28)] pt-4">
          <span className="meta-on-kraft text-[10px] uppercase">
            cogcanvas · cognitive canvas
          </span>
          <span className="meta-on-kraft text-[10px]">
            这是一个会主动介入的创意空间
          </span>
          <span className="meta-on-kraft text-[10px] uppercase">
            updated {formatTime(projects[0]?.updatedAt ?? now()).slice(0, 10)}
          </span>
        </footer>
      </div>
    </div>
  );
}

/** 工作流索引条：五个阶段小卡 */
function WorkflowStrip({ onView }: { onView: () => void }) {
  return (
    <section className="paper paper-edge relative px-5 pb-4 pt-4">
      <Paperclip
        className="absolute -top-2 right-10 z-20 drop-shadow-[0_2px_3px_rgba(51,45,34,0.35)]"
        size={31}
        rotate={12}
      />

      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="label-title inline-block text-[13px] font-semibold tracking-[0.16em] text-ink">
            创意工作流
          </div>
          <div className="meta-line mt-1 text-[10px] uppercase">
            diverge / trigger / cluster / converge / export
          </div>
        </div>
        <button
          onClick={onView}
          className="border-b border-[rgba(168,68,58,0.6)] pb-[1px] text-[11.5px] tracking-[0.12em] text-pencil"
        >
          查看完整工作流 →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {WORKFLOW_STEPS.map((s, i) => (
          <div
            key={s.id}
            className="relative border border-[rgba(120,104,76,0.32)] bg-[rgba(255,253,246,0.5)] px-2.5 py-2.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="flex h-[19px] w-[19px] items-center justify-center rounded-sm text-[11px] leading-none text-paper-light"
                style={{ background: s.color }}
              >
                {s.mark}
              </span>
              <span className="meta-line text-[9.5px]">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-2 text-[13px] tracking-[0.06em] text-ink">
              {s.title}
            </div>
            <div className="mt-1 text-[10px] leading-snug text-ink-faint">
              {s.principle}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}: {
  project: CanvasProject;
  index: number;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const nodeCount = project.nodes.length;
  const preview = project.nodes
    .filter((n) => n.content.trim())
    .slice(0, 3)
    .map((n) => n.content.replace(/\n/g, ' ').slice(0, 20));
  const tilt = [(index % 3) - 1, 1 - (index % 3), (index % 2) - 0.5][index % 3];

  return (
    <div
      className="paper paper-edge group relative flex flex-col"
      style={{ transform: `rotate(${tilt * 0.5}deg)` }}
    >
      <span
        className="tape"
        style={{
          top: -10,
          left: index % 2 ? 'auto' : 18,
          right: index % 2 ? 22 : 'auto',
          width: 58,
        }}
      />

      {/* 预览区：贴着的小便签 */}
      <button
        onClick={onOpen}
        className="flex h-[132px] flex-col items-start gap-1.5 overflow-hidden px-4 pb-2 pt-5 text-left"
      >
        {preview.length ? (
          preview.map((t, i) => (
            <span
              key={i}
              className="sticky-note max-w-full truncate px-2 py-1 text-[11px] text-ink"
              style={{
                transform: `rotate(${(i % 2 ? 1 : -1) * 0.9}deg)`,
                marginLeft: i * 9,
              }}
            >
              {t}
            </span>
          ))
        ) : (
          <span className="m-auto text-[11.5px] tracking-[0.14em] text-ink-pale">
            空白画布
          </span>
        )}
      </button>

      {/* 底部档案信息 */}
      <div className="flex items-end justify-between border-t border-[rgba(79,69,52,0.28)] px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[14px] tracking-[0.04em] text-ink">
            {project.name}
          </div>
          <div className="meta-line mt-1 text-[9.5px]">
            {nodeCount} NOTES / {formatTime(project.updatedAt)}
            {project.mode === 'converge' && (
              <span className="ml-1.5 text-pencil">收敛中</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2 opacity-0 transition group-hover:opacity-100">
          <TextBtn onClick={onRename}>改名</TextBtn>
          <TextBtn onClick={onDuplicate}>复制</TextBtn>
          <TextBtn onClick={onDelete} danger>
            删除
          </TextBtn>
        </div>
      </div>
    </div>
  );
}

function TextBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b border-dashed pb-[1px] text-[10.5px] tracking-[0.1em] transition ${
        danger
          ? 'border-[rgba(168,68,58,0.5)] text-pencil hover:border-solid'
          : 'border-[rgba(79,69,52,0.45)] text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  onCreate,
  onViewWorkflow,
}: {
  onCreate: () => void;
  onViewWorkflow: () => void;
}) {
  return (
    <div className="paper paper-edge relative flex flex-col items-center px-6 py-14 text-center">
      <Stamp
        lines={['WORK IN', 'ALWAYS CURIOUS', 'PROGRESS']}
        className="absolute right-8 top-8"
        size={82}
        rotate={-11}
      />

      {/* 五类触发卡代号 */}
      <div className="mb-5 flex gap-2">
        {Object.values(triggerMeta).map((m) => (
          <span
            key={m.name}
            title={m.desc}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-sm text-[13px] leading-none text-paper-light"
            style={{ background: m.color }}
          >
            {m.mark}
          </span>
        ))}
      </div>

      <h2 className="text-[17px] tracking-[0.08em] text-ink">
        还没有画布，新建一个开始记录
      </h2>
      <p className="mt-2.5 max-w-md text-[12.5px] leading-loose text-ink-soft">
        双击画布贴上想法便签，选中便签即可抽取认知触发卡——强制关联、抽象阶梯、视角切换、SCAMPER
        与孵化，帮你打破思维定式。
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onCreate}
          className="border border-[rgba(79,69,52,0.65)] bg-[rgba(255,253,246,0.7)] px-5 py-2 text-[12.5px] tracking-[0.14em] text-ink transition hover:bg-[rgba(255,253,246,0.98)]"
        >
          ＋ 新建画布
        </button>
        <button
          onClick={onViewWorkflow}
          className="border-b border-dashed border-[rgba(168,68,58,0.55)] px-1 py-2 text-[12.5px] tracking-[0.12em] text-pencil hover:border-solid"
        >
          先看看工作流
        </button>
      </div>
    </div>
  );
}
