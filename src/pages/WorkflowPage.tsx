import { useNavigate } from 'react-router-dom';
import { WORKFLOW_STEPS, WORKFLOW_OVERVIEW } from '../data/workflowSteps';
import { triggerMeta } from '../data/triggerBank';
import { Paperclip, Stamp, HandDrawnRule } from '../components/Journal';
import { TriggerIcon, WorkflowIcon } from '../components/CognitiveIcon';

export default function WorkflowPage() {
  const navigate = useNavigate();

  function goCreate() {
    navigate('/');
    setTimeout(() => {
      const btn = document.querySelector('[data-create-canvas]') as
        | HTMLElement
        | null;
      btn?.click();
    }, 50);
  }

  return (
    <div className="desk-surface sepia-wash min-h-full">
      <div className="mx-auto max-w-4xl px-6 pb-20 pt-7">
        {/* ===== 顶部条 ===== */}
        <header className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="on-kraft border-b border-[rgba(250,244,230,0.5)] text-[11.5px] tracking-[0.14em] transition hover:border-[rgba(250,244,230,0.9)]"
          >
            ← 返回索引
          </button>
          <div className="paper-kraft px-4 py-2">
            <div className="text-[13px] tracking-[0.14em] text-ink">
              创意工作流
            </div>
            <div className="meta-line mt-0.5 text-[9px] uppercase">
              cogcanvas / method
            </div>
          </div>
          <button
            onClick={goCreate}
            className="border border-[rgba(79,69,52,0.6)] bg-[rgba(255,253,246,0.66)] px-3.5 py-1.5 text-[11.5px] tracking-[0.14em] text-ink transition hover:bg-[rgba(255,253,246,0.95)]"
          >
            ＋ 新建画布
          </button>
        </header>

        {/* ===== 首屏纸卡 ===== */}
        <section className="paper paper-edge relative mb-11 px-8 py-9">
          <span className="tape" style={{ top: -11, left: 46, width: 74 }} />
          <span
            className="tape"
            style={{ top: -11, right: 60, width: 66, transform: 'rotate(4deg)' }}
          />
          <Stamp
            lines={['DIVERGE', 'THEN', 'CONVERGE']}
            className="absolute bottom-8 right-9"
            size={86}
            rotate={-10}
          />

          <div className="meta-line mb-3 text-[10px] uppercase">
            method / double diamond
          </div>
          <h1 className="max-w-xl text-[29px] font-semibold leading-[1.45] tracking-[0.04em] text-ink">
            从「灵光一闪」
            <br />
            到「可执行的想法」
          </h1>
          <HandDrawnRule className="my-4 max-w-[220px]" />
          <p className="max-w-lg text-[13px] leading-loose text-ink-soft">
            {WORKFLOW_OVERVIEW.corePromise}。与传统白板只提供记录空间不同，CogCanvas
            用五步认知工作流主动介入你的思考过程。先在 Diverge 模式打开可能性，再进入
            Converge 模式聚拢、评估并输出；语义聚类是收敛工具，而不是第三种模式。
          </p>

          <div className="mt-6 flex max-w-md items-center gap-3 text-[11px] font-semibold tracking-[.12em]">
            <span className="rounded-md bg-[#52e085] px-3 py-1.5">DIVERGE · 发散</span>
            <span className="text-ink-faint">↔</span>
            <span className="rounded-md bg-[#ff6bba] px-3 py-1.5">CONVERGE · 收敛</span>
          </div>

        </section>

        {/* ===== 五个阶段 ===== */}
        <section className="relative space-y-9">
          {WORKFLOW_STEPS.map((s, i) => (
            <article
              key={s.id}
              className="paper paper-edge relative flex gap-5 px-6 py-6"
              style={{ transform: `rotate(${i % 2 ? 0.25 : -0.3}deg)` }}
            >
              <Paperclip
                className="absolute -top-2 left-8 z-20 drop-shadow-[0_2px_3px_rgba(51,45,34,0.35)]"
                size={29}
                rotate={i % 2 ? 9 : -10}
              />

              {/* 阶段编号 */}
              <div className="shrink-0 pt-1.5 text-center">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-sm text-[19px] leading-none text-paper-light"
                  style={{ background: s.color }}
                >
                  <WorkflowIcon step={s.id} size={23} />
                </div>
                <div className="meta-line mt-2 text-[9.5px]">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h2 className="label-title inline-block text-[17px] font-semibold tracking-[0.1em] text-ink">
                    {s.title}
                  </h2>
                  <span className="meta-line text-[10px] uppercase">
                    {s.subtitle}
                  </span>
                </div>

                <p className="mt-3 text-[12.5px] leading-loose text-ink-soft">
                  {s.description}
                </p>

                {/* 认知原理 */}
                <div className="mt-3.5 border-l-2 border-[rgba(168,68,58,0.5)] pl-2.5">
                  <span className="meta-line text-[9px] uppercase">
                    cognitive principle
                  </span>
                  <div className="pencil-note mt-0.5 text-[12px]">
                    {s.principle}
                  </div>
                </div>

                {/* 动作清单 */}
                <ul className="mt-3.5 space-y-1">
                  {s.actions.map((a) => (
                    <li
                      key={a}
                      className="flex items-start gap-2 text-[11.5px] text-ink-soft"
                    >
                      <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[rgba(79,69,52,0.7)]" />
                      {a}
                    </li>
                  ))}
                </ul>

                {/* 示意图 */}
                <div className="mt-4">
                  <MiniMock step={s.id} />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* ===== 五类触发卡 ===== */}
        <section className="paper paper-edge relative mt-11 px-6 py-6">
          <span className="tape" style={{ top: -11, left: '46%', width: 70 }} />
          <div className="label-title inline-block text-[15px] font-semibold tracking-[0.14em] text-ink">
            五类认知触发卡
          </div>
          <div className="meta-line mt-1.5 text-[10px] uppercase">
            trigger / card / deck
          </div>
          <p className="mt-3 text-[12.5px] leading-loose text-ink-soft">
            选中便签后从下列卡组中抽取，抽出的卡片会作为新纸条贴在画布上并自动连线。
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(triggerMeta).map(([key, m]) => (
              <div
                key={key}
                className="border border-[rgba(120,104,76,0.32)] bg-[rgba(255,253,246,0.5)] px-3 py-2.5"
                style={{ borderLeft: `3px solid ${m.color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-[21px] w-[21px] items-center justify-center rounded-sm text-[12px] leading-none text-paper-light"
                      style={{ background: m.color }}
                    >
                      <TriggerIcon type={key as keyof typeof triggerMeta} size={15} />
                    </span>
                    <span
                      className="text-[13px] tracking-[0.08em]"
                      style={{ color: m.color }}
                    >
                      {m.name}
                    </span>
                  </span>
                  <span className="meta-line text-[9px]">{m.code}</span>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 结尾 ===== */}
        <section className="paper-kraft relative mt-11 px-8 py-10 text-center">
          <div className="meta-line text-[10px] uppercase">start here</div>
          <h3 className="mt-3 text-[21px] tracking-[0.06em] text-ink">
            开始你的第一次创意工作流
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-loose text-ink-soft">
            新建画布，贴下第一张便签，然后选中它、抽一张卡。
          </p>
          <button
            onClick={goCreate}
            className="mt-6 border border-[rgba(79,69,52,0.7)] bg-[rgba(255,253,246,0.78)] px-6 py-2.5 text-[13px] tracking-[0.16em] text-ink transition hover:bg-[rgba(255,253,246,1)]"
          >
            ＋ 新建画布
          </button>
        </section>
      </div>
    </div>
  );
}

function MiniMock({ step }: { step: string }) {
  const frame =
    'relative overflow-hidden border border-[rgba(120,104,76,0.3)] bg-[rgba(233,224,205,0.5)] p-3';

  if (step === 'record') {
    return (
      <div className={`${frame} flex h-[86px] items-center gap-2.5`}>
        {['第一个想法', '灵感碎片', '突然冒出的点子'].map((t, i) => (
          <span
            key={t}
            className="sticky-note px-2 py-1.5 text-[10.5px] text-ink"
            style={{
              transform: `rotate(${(i % 2 ? 1 : -1) * 1.4}deg)`,
              marginTop: i % 2 ? 10 : 0,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  if (step === 'trigger') {
    return (
      <div className={`${frame} flex h-[86px] items-center gap-2.5`}>
        <span className="sticky-note px-2 py-1.5 text-[10.5px] text-ink">
          核心想法
        </span>
        <span className="text-[12px] text-ink-faint">→</span>
          {[
            { t: '和蜂巢有什么关系', c: '#8f6a33', type: 'bisociation' as const },
            { t: '换成5岁小孩视角', c: '#8a4a3c', type: 'perspective' as const },
          ].map(({ t, c, type }) => (
          <span
            key={t}
            className="flex items-center gap-1.5 border bg-[rgba(250,246,236,0.85)] px-2 py-1.5 text-[10.5px] text-ink"
            style={{ borderColor: c, borderLeftWidth: 3 }}
          >
            <span
              className="flex h-[15px] w-[15px] items-center justify-center rounded-sm text-[9px] leading-none text-paper-light"
              style={{ background: c }}
            >
              <TriggerIcon type={type} size={11} />
            </span>
            {t}
          </span>
        ))}
      </div>
    );
  }

  if (step === 'cluster') {
    return (
      <div className={`${frame} flex h-[86px] items-start gap-3`}>
        {[
          { t: '增长', c: '#8f6a33' },
          { t: '社区', c: '#5f6b40' },
          { t: '变现', c: '#8a4a3c' },
        ].map(({ t, c }, gi) => (
          <div key={t} className="flex flex-1 flex-col gap-1.5">
            <span className="text-[10px] tracking-[0.1em]" style={{ color: c }}>
              {t}组
            </span>
            {[0, 1].map((r) => (
              <span
                key={r}
                className="border border-[rgba(120,104,76,0.35)] bg-[rgba(250,246,236,0.8)] px-1.5 py-1 text-[9.5px] text-ink-soft"
                style={{ outline: `1.5px dashed ${c}66`, outlineOffset: 2 }}
              >
                {gi % 2 ? '想法 B' : '想法 A'}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (step === 'converge') {
    return (
      <div className={`${frame} flex h-[86px] items-start gap-2.5`}>
        {['高', '中', '低'].map((f) => (
          <div
            key={f}
            className="flex flex-1 flex-col items-center gap-1.5 border border-[rgba(120,104,76,0.35)] bg-[rgba(250,246,236,0.8)] py-2"
          >
            <span className="border-b border-[rgba(168,68,58,0.5)] pb-[1px] text-[10px] tracking-[0.1em] text-pencil">
              可行性{f}
            </span>
            <span className="text-[9.5px] text-ink-faint">想法卡片</span>
            <span className="text-[9.5px] text-ink-faint">想法卡片</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-[rgba(120,104,76,0.35)] bg-[#efe7d7] p-3 font-song text-[10.5px] leading-relaxed text-ink-soft">
      <div className="text-ink"># 精选想法</div>
      <div className="mt-1">## 可行性 高</div>
      <div>- 思路一（可行性 高 · 增长）</div>
      <div>- 思路二（可行性 高 · 社区）</div>
      <div className="mt-1.5 border-t border-dashed border-[rgba(79,69,52,0.35)] pt-1.5 text-pencil">
        已导出 Markdown
      </div>
    </div>
  );
}
