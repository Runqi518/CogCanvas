/**
 * 手帐风格基础元件：回形针 / 胶带 / 图章 / 档案标题
 * 全部为纯 SVG + CSS，无图片依赖。
 */

/** 回形针。夹在纸卡上边缘，视觉上"压住"纸张。 */
export function Paperclip({
  className = '',
  size = 46,
  rotate = -8,
}: {
  className?: string;
  size?: number;
  rotate?: number;
}) {
  return (
    <svg
      width={size}
      height={size * 2.1}
      viewBox="0 0 40 84"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="clipMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5f5f59" />
          <stop offset="18%" stopColor="#cfcfc8" />
          <stop offset="38%" stopColor="#8a8a83" />
          <stop offset="62%" stopColor="#f2f2ec" />
          <stop offset="84%" stopColor="#9a9a92" />
          <stop offset="100%" stopColor="#63635d" />
        </linearGradient>
      </defs>
      {/* 外圈 */}
      <path
        d="M13 76 L13 20 A9 9 0 0 1 31 20 L31 62"
        fill="none"
        stroke="rgba(40,32,18,0.42)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M13 76 L13 20 A9 9 0 0 1 31 20 L31 62"
        fill="none"
        stroke="url(#clipMetal)"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      {/* 内圈 */}
      <path
        d="M22 70 L22 30 A4.5 4.5 0 0 0 13 30 L13 58"
        fill="none"
        stroke="rgba(40,32,18,0.34)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M22 70 L22 30 A4.5 4.5 0 0 0 13 30 L13 58"
        fill="none"
        stroke="url(#clipMetal)"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 胶带条 */
export function Tape({
  className = '',
  rotate = -3,
  width = 78,
}: {
  className?: string;
  rotate?: number;
  width?: number;
}) {
  return (
    <span
      className={`tape ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, width }}
      aria-hidden="true"
    />
  );
}

/** 圆形橡皮图章 */
export function Stamp({
  lines,
  size = 78,
  rotate = -8,
  className = '',
}: {
  lines: string[];
  size?: number;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`stamp inline-flex flex-col items-center justify-center text-center ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {lines.map((l) => (
        <span key={l} className="text-[9px] leading-[1.25]">
          {l}
        </span>
      ))}
    </span>
  );
}

/**
 * 档案式区块标题：主标题 + 斜杠分隔的元信息
 * 视觉参考实体档案袋上的标签条。
 */
export function ArchiveLabel({
  title,
  meta,
  className = '',
}: {
  title: string;
  meta?: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="label-title inline-block text-[13px] font-semibold tracking-[0.14em] text-ink">
        {title}
      </div>
      {meta && meta.length > 0 && (
        <div className="meta-line mt-1 text-[10px] uppercase">
          {meta.join(' / ')}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   档案柜扩展元件：贴纸 / 票根 / 老照片 / 档案卡壳 / 图钉 / 咖啡渍
   ========================================================= */

/** 封箱贴纸：如 "HANDLE WITH CURIOSITY" */
export function PackingSticker({
  text,
  className = '',
  rotate = -1.5,
  style,
}: {
  text: string;
  className?: string;
  rotate?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`packing-sticker typewriter px-3.5 py-1 text-[9.5px] uppercase ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
    >
      {text}
    </div>
  );
}

/** 图钉 */
export function Pin({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span className={`pin ${className}`} style={style} aria-hidden="true" />;
}

/** 咖啡渍水痕 */
export function CoffeeRing({
  size = 92,
  className = '',
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`coffee-ring ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    />
  );
}

/** 折痕线 */
export function Crease({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span className={`crease ${className}`} style={style} aria-hidden="true" />;
}

/** 打字机式档案编号行 */
export function ArchiveMeta({
  items,
  className = '',
}: {
  items: [string, string][];
  className?: string;
}) {
  return (
    <dl className={`typewriter grid gap-x-5 gap-y-1 text-[9.5px] ${className}`}>
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-2">
          <dt className="shrink-0 uppercase text-ink-pale">{k}</dt>
          <dd className="flex-1 border-b border-dotted border-[rgba(79,69,52,0.35)] pb-[1px] uppercase text-ink-soft">
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 档案卡片外壳：统一提供做旧边缘、纸张厚度、轻微倾斜、抬起交互
 * variant 决定纸张纹理（地图 / 草图 / 漫画 / 扫描 / 票据 / 牛皮）
 */
export type ArchiveCardVariant =
  | 'cream'
  | 'kraft'
  | 'map'
  | 'grid'
  | 'comic'
  | 'scan'
  | 'ticket';

const VARIANT_CLASS: Record<ArchiveCardVariant, string> = {
  cream: 'paper-cream',
  kraft: 'paper-kraft',
  map: 'map-paper',
  grid: 'grid-paper',
  comic: 'comic-paper',
  scan: 'scan-paper',
  ticket: 'ticket',
};

export function ArchiveCard({
  variant = 'cream',
  rotate = 0,
  className = '',
  style,
  children,
  as: Tag = 'div',
  onClick,
}: {
  variant?: ArchiveCardVariant;
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article';
  onClick?: () => void;
}) {
  return (
    <Tag
      onClick={onClick}
      className={`${VARIANT_CLASS[variant]} aged-edge lift relative ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
    >
      {children}
    </Tag>
  );
}

/** 票根：左侧存根 + 右侧主体，中间虚线撕口 */
export function TicketStub({
  serial,
  title,
  note,
  rotate = -1,
  className = '',
  onClick,
}: {
  serial: string;
  title: string;
  note?: string;
  rotate?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`ticket aged-edge lift relative flex items-stretch ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="flex w-[54px] shrink-0 flex-col items-center justify-center gap-1 px-1 py-3">
        <span className="typewriter text-[8px] uppercase text-ink-pale">no.</span>
        <span className="typewriter text-[11px] text-clay">{serial}</span>
      </div>
      <div className="ticket-perf flex-1 px-3.5 py-3">
        <div className="text-[13px] tracking-[0.08em] text-ink">{title}</div>
        {note && (
          <div className="meta-line mt-1 text-[9.5px] uppercase">{note}</div>
        )}
      </div>
    </div>
  );
}

/** 老照片：白边相纸 + 手写图注 */
export function PhotoCard({
  caption,
  date,
  rotate = 2,
  className = '',
  height = 96,
  children,
}: {
  caption: string;
  date?: string;
  rotate?: number;
  className?: string;
  height?: number;
  children?: React.ReactNode;
}) {
  return (
    <figure
      className={`photo-frame lift relative ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div
        className="photo-image flex items-center justify-center overflow-hidden"
        style={{ height }}
      >
        {children}
      </div>
      <figcaption className="absolute bottom-1.5 left-0 right-0 px-2 text-center">
        <span className="handwriting text-[12px]">{caption}</span>
        {date && (
          <span className="typewriter ml-1.5 text-[8px] uppercase text-ink-pale">
            {date}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** 手绘风格分隔线 */
export function HandDrawnRule({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      height="6"
      width="100%"
      preserveAspectRatio="none"
      viewBox="0 0 300 6"
      aria-hidden="true"
    >
      <path
        d="M1 3.2 C 40 1.4, 78 4.6, 118 2.8 S 196 1.2, 236 3.6 S 286 2.2, 299 3"
        fill="none"
        stroke="rgba(79,69,52,0.42)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
